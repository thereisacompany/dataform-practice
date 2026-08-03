# dataform-practice

GCP Dataform 練習專案，目錄刻意對齊 **dbt 常見分層**，方便之後搬遷。

## 專案結構

```text
.
├── workflow_settings.yaml          # Dataform 專案設定（≈ dbt_project.yml 一部分）
├── package.json                    # @dataform/core（有 package.json 就不要在 yaml 寫 dataformCoreVersion）
├── includes/
│   └── helpers.js                  # 共用函式（≈ dbt macros）
├── definitions/
│   ├── sources/                    # seed / 外部來源模擬
│   ├── staging/                    # stg_* 輕量清理
│   ├── marts/                      # fct_* / rpt_* 消費層
│   ├── assertions/                 # 資料品質（≈ dbt tests）
│   ├── sandbox/                    # 實驗、helpers demo
│   └── ops/                        # operations / logging / 平台味較重的範例
└── .github/workflows/
    └── dataform-compile-check.yml  # PR/push compile 檢查
```

## 分層與命名

| Layer | 命名 | 用途 | Materialization |
|-------|------|------|-----------------|
| sources | `src_*` / seed | 原始或模擬 raw | `table` |
| staging | `stg_<source>__<entity>` | rename、filter、型別 | 建議 `view` |
| marts | `fct_*` / `dim_*` / `rpt_*` | 對外指標與報表 | `table` / `incremental` |
| assertions | `assert_*` | 回傳列 = 失敗 | `assertion` |
| ops | 依功能 | procedure、log、特殊 incremental | 視情況 |
| sandbox | 任意 | 練習用，正式排程可排除 | 視情況 |

### NBA pipeline DAG

```text
src_nba_players_seed
        ↓
stg_nba__players
        ↓
fct_nba_players (incremental, uniqueKey: player+season)
        ↓
   ┌────┴────┬─────────────────────┐
   ↓         ↓                     ↓
assert_*  rpt_this_year      rpt_summary
```

## 設定檔說明

### `workflow_settings.yaml`

```yaml
defaultProject: <GCP_PROJECT_ID>
defaultDataset: dataform
defaultLocation: asia-east1
defaultAssertionDataset: dataform_assertions
```

| 欄位 | 意義 | 遷 dbt |
|------|------|--------|
| `defaultProject` | GCP project | `profiles.yml` database/project |
| `defaultDataset` | 預設 dataset | `dbt_project.yml` + custom schema |
| `defaultLocation` | BQ location | profile / dataset location |
| `defaultAssertionDataset` | assertion 結果 dataset | dbt test 結果 schema |

**規則：SQL 內禁止硬編 project id，一律用 `ref()` / `source()`。**

### Tags（排程用這個，不要用資料夾名）

| Tag | 用途 |
|-----|------|
| `nba` | NBA 相關模型 |
| `daily` | 日排程 |
| `staging` / `marts` / `source` | 分層 |
| `billing` / `ops` | 計費與維運範例 |
| `sandbox` | 實驗，正式 workflow 可排除 |

Dataform Workflow configuration 建議選 tags：`nba` + `daily`，不要再綁舊目錄名。

## 本地指令

```bash
npm ci
npx @dataform/cli compile
```

## GCP Dataform 使用摘要

1. GitHub 連線（Secret Manager + Dataform SA 可讀 secret）
2. Workspace：手動 **Pull** 才看得到最新 code
3. **版本設定（Release）**：從 Git branch compile
4. **工作流程設定（Workflow）**：cron 執行編譯結果
5. Execution 必須指定 Service Account（strict act-as）

GitHub Actions 的 compile-check **不會**自動同步到 Dataform，只驗證能不能 compile。

## 舊表名對照（這次重構）

| 舊 name | 新 name |
|---------|---------|
| `nba_players_base` | `src_nba_players_seed` |
| `nba_players` | `fct_nba_players` |
| `nba_players_this_year_sorted` | `rpt_nba_players_this_year` |
| `nba_players_summary` | `rpt_nba_players_summary` |
| `check_nba_players_valid` | `assert_fct_nba_players_valid` |
| `my_temporary_result` | `rpt_nba_helpers_demo` |
| `billing_sample` | `fct_billing_sample` |

BQ 會變成新表；舊表可手動刪。

## 遷到 dbt 的對照

| Dataform | dbt |
|----------|-----|
| `definitions/staging` | `models/staging` |
| `definitions/marts` | `models/marts` |
| `definitions/sources` | `seeds/` 或 `models/staging/_sources.yml` |
| `definitions/assertions` | `tests/` / `schema.yml` |
| `includes/helpers.js` | `macros/*.sql` |
| `workflow_settings.yaml` | `dbt_project.yml` + `profiles.yml` |
| `${ref("x")}` | `{{ ref('x') }}` |
| `config { type: "incremental", uniqueKey: [...] }` | `{{ config(materialized='incremental', unique_key=[...]) }}` |
| `tags: ["daily"]` | `tags=['daily']` |

### 遷移優先順序

1. 目錄與命名（已完成）
2. 只用 `ref`，環境設定外置
3. 測試契約跟著 mart 走
4. 用 tags 排程
5. 少用 `operations` / `pre_operations`（平台耦合高，最後搬）

### 建議抽出的「跨平台資產」

1. Layering & naming standard（本 README）
2. Env matrix（dev/prod project + datasets）
3. Materialization policy
4. Testing contract
5. Tag ↔ schedule map
6. Dataform ↔ dbt cheat sheet（上表）

## 參考

- [Dataform docs](https://cloud.google.com/dataform/docs)
- [dbt best practices — how we structure projects](https://docs.getdbt.com/best-practices/how-we-structure/1-guide-overview)
