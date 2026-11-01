---
name: retro
description: "中标复盘：把一次中标从口头结论变成可核对的证据复盘，产出三栏证据（A/B/C）+ 评分因素分项得分 + 12 字段经验草稿 + 履约验证 + 可回查的报告，并检查复盘/复核/验证到期。当用户说「中标复盘」「投标复盘」「为什么赢」「赢因分析」「复盘报告」「经验入库」「把这次中标沉淀成经验」「这条经验能不能用到下一个项目」「评标反馈归档」「复盘到期了吗」时使用。仅用于已经产生结果（中标/失标）的项目；未投标、未开标、或只想聊投标方法论时不使用。"
---

# 中标复盘（retro）

**解决什么**：把一次中标从"一句口头结论"变成可核对的证据复盘 —— 每条赢因都带出处与分项得分，每条经验都能追溯到 12 个字段，每条承诺都有履约状态，且到期项能被机械提醒。

**核心立场**：中标 ≠ 标书里每一项设计都导致了中标。复盘产出不是一次性报告，而是四类可检索、可复用的经验资产；报告只是经验库的视图（`retro.json` 才是资产）。

## 1. 触发与不触发

**该触发（用户会这么说）**：
- "帮我做中标复盘" / "这次投标复盘一下"
- "为什么赢的？把赢因理一下"
- "按 A/B/C 给这些结论定级" / "这条 8 分是哪一页"
- "把这次中标沉淀成经验条目" / "经验入库"
- "出个复盘报告，评审会上要用" / "给管理层一份脱敏版"
- "评标反馈和澄清记录归档一下"
- "这条经验能不能用到德国那个项目上"（Step 6 匹配分支）
- "履约没做到，之前那条经验是不是该降级"
- "哪些复盘/复核/C 级验证到期了"（Step 4.5 到期检查）

**不该触发（改用别的路径）**：
- 项目还没投标 / 还没开标 / 结果未出 → 投标前分析，不是复盘
- 只想聊投标方法论、行业趋势、报价技巧 → 直接对话
- 要解析竞对标书、抽参数、出对比矩阵 → 投标前功能
- 要测算报价、写标书、做技术方案 → 本 skill 不产出报价与承诺（BR-16/BR-17）
- 只想要"漂亮总结"却不给材料 → 先按 Step 1 追问；缺必需材料就中止，不编造（BR-19）

## 2. Resources（与目录内文件一一对应）

### scripts/（确定性逻辑全部落在这里）

| 脚本 | 职责 | 用法 | 退出码 |
| --- | --- | --- | --- |
| `scripts/init_case.py` | 生成工作区骨架：`intake.json` + `retro.json` + 材料清单副本 | `python scripts/init_case.py --name "CZ-Morava 320MWh 独立储能" --id p-01 --retro-id rp-03 --country CZ --has-score-sheet true --out <目录>` | 0 成功 / 1 用法 / 2 目标已存在且未加 `--force` |
| `scripts/check_inputs.py` | Step 1 材料核对 + 等级上限预判 | `python scripts/check_inputs.py <case>/intake.json [--json gap.json]` | 0 必需齐备 / 1 用法或文件异常 / 2 缺必需材料须中止追问 |
| `scripts/validate_retro.py` | 机械校验：schema v1.1、取值字典、12 字段、评分分项一致性、BR-01~15、LR-01~05、日期、引用 | `python scripts/validate_retro.py <case>/retro.json [--strict]` | 0 通过 / 1 用法 / 2 文件或 JSON 异常 / 3 存在 ERROR |
| `scripts/check_due.py` | 到期检查：复盘窗口（S-01 14 天）、经验复核、C 级验证、待审 SLA、履约核验、待办 | `python scripts/check_due.py <case 或目录> [--as-of 2026-10-25] [--review-cycle 90] [--json due.json]` | 0 无到期 / 1 用法或读取失败 / 2 有到期项 |
| `scripts/score_match.py` | 相似项目匹配打分（30/25/15/15/15），输出可借鉴/差异条件/待验证假设分区 | `python scripts/score_match.py --target target.json --library experiences.json [--top 10] [--json out.json]` | 0 有候选 / 1 用法 / 2 无候选或输入错 / 3 缺打分必需字段 |
| `scripts/render_report.py` | 模板渲染 + 8 角色视图与脱敏，占位符必须全部解析 | `python scripts/render_report.py <case>/retro.json [--role exec] [--out <目录>] [--force]` | 0 成功 / 1 用法 / 2 读取失败、覆盖保护、`admin` 无权限 / 3 占位符残留或证据池为空 |

全部脚本零第三方依赖（Python 3.10+ 标准库）。

### references/（何时加载）

| 文件 | 加载时机 | 内容 |
| --- | --- | --- |
| `references/retro-dimensions.md` | **Step 2 一开始** | 十方面复盘框架（目的/关键问题/产出字段/陷阱）+ 三栏收口规则 |
| `references/evidence-grading.md` | **Step 2 定级时**；Step 4 报错时 | A/B/C 决策树、无评分表替代证据、BR-11~20、LR-01~08、履约降级流程 |
| `references/parameter-dictionary.md` | **Step 3 写入前** | 每个字段的类型/必填/取值白名单/格式/示例；缺失值三条规则（BR-01/02/03） |
| `references/experience-schema.md` | **Step 3 写入前** | `retro.json` 结构契约（v1.1）、12 必填字段、变更语义（pendingChange vs changeHistory） |
| `references/roles-permissions.md` | **Step 5 出报告前** | 8 角色权限矩阵、控件级规则、脱敏规则、`--role` 视图差异 |
| `references/matching-rules.md` | **Step 6 匹配时** | 打分公式细则、可借鉴/差异条件撰写规范、引用留痕 |

### assets/（用在哪个环节）

| 文件 | 用途 |
| --- | --- |
| `assets/retro-report-template.md` | Step 5 默认报告模板（含视图说明、告警区、证据索引） |
| `assets/materials-checklist.md` | Step 1 人工收集清单；`init_case.py` 复制到工作区 |
| `assets/examples/retro-example.json` | 完整正例（新 schema，每字段有内容），写文件时对照结构 |
| `assets/examples/retro-example-violations.json` | 负例（覆盖取值字典/BR-02/分项分值/BR-14/LR 等违规），改规则后的回归样本 |
| `assets/examples/experience-library.json` | Step 6 经验库输入示例（含 C 级与已停用条目） |
| `assets/examples/match-target.json` | Step 6 目标项目输入示例 |

## 3. 工作流（每步都是可执行动作）

### Step 1 · 输入核对（材料不齐就停）

必需输入（缺任一 → **中止并逐项追问，禁止编造**）：
1. 项目基本信息：名称、国别、规模、客户类型、招标方式、合同模式、技术路线、产品型号、中标年份**与中标日期**、参与方；
2. 招标文件 / 技术规格书（含评分办法与强制条款）；
3. 我方投标文件**终版**；
4. 中标通知书或中标公示；
5. `hasScoreSheet` 明确取值（有/无正式评分表）。

可选（缺 → 标 `pending` 或 `—` 并写 `openItems`）：评分表/评标反馈、澄清答疑、商务谈判纪要、竞对公开资料、履约数据。

```bash
python scripts/init_case.py --name "<项目名>" --id <p-xx> --retro-id <rp-xx> --country <CC> --has-score-sheet true|false
python scripts/check_inputs.py <case>/intake.json --json <case>/gap.json
```
- 退出码 2 → 停下追问，把缺口清单原文列出。
- 无评分表 → 全项目等级上限 B（BR-13），`score/maxScore` 必须双 `null`。

### Step 2 · 十方面复盘 + 三栏归档（核心分析）

加载 `references/retro-dimensions.md`，按 1→10 维度过；每条结论先过 `references/evidence-grading.md` 决策树再定级。

- 每维度只产出：**带出处的结论** + **落到的字段**（见 `retro-dimensions.md` 映射表）；
- 三栏 A/B/C；C 级 `conclusionCarrier=false`（BR-12）；
- 每条结论挂 ≥1 个 `EV-xx`；找不到文件的判断进 `openItems`；
- 竞对间距只能引用公开/合法渠道；拿不到就写 `"未知"`，不计入优势统计（BR-03）；
- 缺失值统一 `—`/`null`，**禁止填 0 或"大概/应该是"**（BR-02/BR-19）。

### Step 3 · 结构化产出（写 retro.json v1.1）

加载 `references/parameter-dictionary.md` + `references/experience-schema.md`：
- 先写证据池（`snippet` 原文摘录 ≥15 字、带数值；`documentId`/`originalFiled`/`page` 必填，无页码用 `null`）；
- `winFactors` 每条要有 `mandatory` / `score` / `maxScore` / `reviewState` / `recentChange` / `conclusionCarrier`；
- `commercial.noQuoteStatement=true`；`fulfilment.variance` 用白名单词；
- `experiences` 齐 12 字段，`state=draft`；C 级必须 `verificationPlan` + `verificationDue`；
- 引用写 `references[]` 四项（BR-15）；`retroMeta.humanConfirmed=false`，模拟数据填 `dataNote`。

### Step 4 · 确定性校验（跑到通过为止）

```bash
python scripts/validate_retro.py <case>/retro.json
```
- 退出码 3：按 `[编号] 字段路径: 说明` 逐条修，改完重跑；
- **禁止作弊式通过**：不得删证据、改 `hasScoreSheet`、或降等级来"过校验"（等价伪造，BR-11/BR-13）；
- WARNING 不拦交付，但要在报告告警区解释（C 级占比、等级待确认、竞对差距未知）；
- 交付门禁加 `--strict`。

### Step 4.5 · 到期检查（S-01 时效 + 验证出口）

```bash
python scripts/check_due.py <case 或目录> --as-of <YYYY-MM-DD> --json <case>/due.json
```
- 退出码 2 = 有到期项（不是错误，是待办）：复盘超 14 天窗口、经验复核到期、C 级验证逾期、待审变更超 SLA、履约核验到期、待办逾期；
- 把这些项写进报告"待补清单"或在对话里列给用户，不要静默忽略。

### Step 5 · 产出报告（按角色视图）

```bash
python scripts/render_report.py <case>/retro.json --role <角色> [--out <目录>]
```
- 角色：`engineer`/`bidManager`/`knowledge` 全量；`commercial` 隐藏技术细项；`legal` 突出履约与合同风险；`exec` 脱敏并隐藏确认人列；`viewer` 只读提示条；`admin` 直接拒绝（不泄露项目名）。
- 输出目录：**用户指定优先**；否则 `docs/output/retro/<retroId>/`；文件名 `中标复盘-<项目名>-<复盘日期>[-角色].md`。
- 交付自检：等级全标建议值、C 级不在结论段、`missed` 出现在告警区与引用影响面、模拟数据横幅在顶部。

### Step 6 · 经验复用匹配（可选分支）

```bash
python scripts/score_match.py --target <target>.json --library <library>.json --json <case>/match.json
```
- 必须同时给「可借鉴（A/B）」「待验证假设（C）」「差异条件」；匹配度只作排序（BR-12）；
- 差异写成"维度 + 数值 + 结论影响"；引用确定后回写 `references[]`（BR-15）。

## 4. 红线（人机边界，违反即返工）

| 编号 | 红线 | 谁能保证 |
| --- | --- | --- |
| BR-01 | 证据优先：A/B 必须有可定位证据；A 级应已核验 | `validate_retro.py`（ERROR/WARNING） |
| BR-02 | 缺失 ≠ 零：缺失写 `—`/`null`，禁止填 `0`/`未披露` 混用 | `validate_retro.py`（ERROR） |
| BR-03 | 未披露 ≠ 不具备：`competitorGap="未知"` 不计入优势统计 | 报告统计 + 校验告警 |
| BR-09 | 修正可审计：每条因素带 `recentChange`（时间/人/动作/`aud-xxx`） | `validate_retro.py`（ERROR） |
| BR-11 | 无来源不入库 | `validate_retro.py`（ERROR） |
| BR-12 | C 级不进结论载体：`conclusionCarrier=false`、`state=draft`、必填 `verificationPlan`/`verificationDue` | `validate_retro.py` + `score_match.py` 分区 |
| BR-13 | 无评分表项目全部因素/经验最高 B，且 `score/maxScore` 必须为 `null` | `validate_retro.py`（ERROR） |
| BR-14 | 履约 `missed` 立即降级生效 + ≥6 字复核说明 + `changeHistory` 留痕 | `validate_retro.py`（ERROR） |
| BR-15 | 引用留痕四项：projectId / citedBy / citedAt / usedIn | `validate_retro.py`（ERROR）+ 报告引用影响面 |
| BR-16 | 不产出报价、不推断对手利润率与成本结构 | `noQuoteStatement` 必须 true + 人工复核 |
| BR-17 | 不产出对外承诺：承诺只摘录原文 | 人工复核 |
| BR-18 | 不自动定级、不自动入库：一律 `draft`，等级为建议值 | `validate_retro.py` 告警 + 人工审核 |
| BR-19 | 缺数据标 `pending`，禁止编造 | 校验空字段 + 人工复核 |
| BR-20 | 只读角色不渲染写入控件；`admin` 不可见；`exec` 默认脱敏 | `render_report.py --role` |
| BR-21 | 复盘时效：中标后 14 天内完成（S-01），超期可查 | `check_due.py`（退出码 2） |
| BR-22 | 角色可见性：只读角色不进编辑流程，报告视图与脱敏按角色矩阵 | `render_report.py` + `roles-permissions.md` |
| LR-01~05 | 等级变更：升级加证据、升 A 需评分表、理由 ≥6 字、双人规则、单条经验只一个待审 | `validate_retro.py`（ERROR） |

**边界分工**：本 skill 负责推理与草稿（十方面复盘、等级建议、经验草稿、报告骨架、机械校验、到期提醒、角色视图）；登录态、ACL 状态机、审计存储、原文定位 UI、经验库 CRUD 属应用侧。

## 5. 快速自检清单（交付前）

- [ ] `check_inputs.py` 通过，或缺口已列出并征得用户同意带缺口复盘
- [ ] `validate_retro.py` 退出码 0（交付门禁加 `--strict`）
- [ ] 每条 A 级都能指到评分表分项/评标反馈/客户书面认可的具体位置，且 `reviewState=verified`
- [ ] 有评分表的项目每条因素都有 `score/maxScore`（能回答"这条 8 分是哪一页"）
- [ ] 缺失值都是 `—`/`null`，没有 `0` 填充，竞对未知项未计入优势
- [ ] 每条经验齐 12 字段，`scope` 写清"适用于/不适用于"
- [ ] C 级都有验证计划与到期日，且没出现在任何结论段
- [ ] `missed` 已降级并留痕，引用影响面列出被影响项目
- [ ] `check_due.py` 的到期项已处理或列入待补清单
- [ ] 报告按用户角色渲染（管理层脱敏版单出），文件名与目录符合规则
- [ ] 没有报价建议、没有对外承诺、没有对手利润率推断
