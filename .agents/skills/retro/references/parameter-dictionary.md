# 参数取值字典（每字段：类型 / 必填 / 取值 / 格式 / 示例）

> 加载时机：Step 3 写入前（与 `experience-schema.md` 一起看）；Step 4 报错时按本文件核对取值。
> 来源：`docs/prd/BidScope-PRD-v1.1` §7 类型契约、`docs/prd/globaluser-knowledge-中标复盘.md` §5.2/5.3/5.4。
> 规则：**本文件里的枚举是白名单**，`validate_retro.py` 按此拦截；不在白名单的值要显式说明理由，不要自行造词。

## 0. 三条贯穿全表的取值规则

| 编号 | 规则 | 写法 | 脚本行为 |
| --- | --- | --- | --- |
| BR-02 | 缺失 ≠ 零：原文未披露写 `"—"`，待补数据写 `null` + `openItems`；**禁止填 `0`/`无`/`未披露` 混用** | 文本 `"—"`；数值 `null` | 可选展示字段为 `"0"` → ERROR；写 `"未披露"` → WARNING（应改 `"—"`） |
| BR-03 | 未披露 ≠ 不具备：竞对信息没拿到时 `competitorGap` 写 `"未知"` | `"未知"` | 该因素不计入"我方优势"统计；不得据此推导优势 |
| BR-01 | 证据优先：等级 A/B 必须有可定位证据 | `evidence[]` ≥1 | 空 → ERROR（BR-11） |

## 1. case（已中标项目 / AwardedProject）

| 参数 | 类型 | 必填 | 取值 / 格式 | 示例 |
| --- | --- | --- | --- | --- |
| `retroId` | string | ✅ | `rp-` + 两位序号 | `rp-03` |
| `id` | string | ✅ | 项目编号 `p-` + 两位 | `p-01` |
| `name` | string | ✅ | `国别-站名 规模 类型（年份 中标）` | `CZ-Morava 320MWh 独立储能（2025 中标）` |
| `country` | enum | ✅ | ISO 3166-1 alpha-2 大写：`DE` `UK` `IT` `CZ` `PL` `AU` `SA` `NL` `ES` `FR`… | `CZ` |
| `mw` / `mwh` | number | ✅ | 功率与能量分开，>0 | `80` / `320` |
| `route` | string | ✅ | 电芯体系 + 温控 | `LFP 液冷` |
| `customerType` | enum | ✅ | `电网公司` / `市政公用事业` / `独立发电商` / `公用事业` / `工商业` / `EPC 总包` | `电网公司` |
| `bidMode` | enum | ✅ | `公开招标` / `公开招标（两阶段）` / `有限邀请招标` / `框架协议 + 竞标` | `公开招标` |
| `contractMode` | enum | ✅ | `EPC 总承包` / `设备供货 + 调试` / `设备 + 5 年运维` / `供货 + 运维` | `EPC 总承包` |
| `productModel` | string | ✅ | 型号不翻译 | `Aster 5000` |
| `awardedYear` | number | ✅ | 四位年 | `2025` |
| `awardDate` | date | ✅ | `YYYY-MM-DD`；用于 S-01 复盘窗口（中标后 14 天） | `2026-08-12` |
| `competitorIds` | string[] | ✅ | 只用「竞对 A」…「竞对 F」代号 | `["竞对 A", "竞对 C"]` |
| `hasScoreSheet` | boolean | ✅ | 决定 BR-13 上限 | `true` |
| `snapshotAt` | date | ✅ | `YYYY-MM-DD` | `2026-09-20` |

## 2. evidence（证据条目）

| 参数 | 类型 | 必填 | 取值 / 格式 | 示例 |
| --- | --- | --- | --- | --- |
| `id` | string | ✅ | `EV-` + 前缀 + 两位 | `EV-03` / `EV-SA-01` |
| `type` | enum | ✅ | `tender` 招标 / `scoreSheet` 评分表 / `awardNotice` 中标公示 / `ourBid` 我方投标 / `competitorBid` 竞对标书 / `clarification` 澄清 / `negotiation` 谈判 / `fulfilment` 履约 / `other` 其他 | `scoreSheet` |
| `title` | string | ✅ | 文件名式描述 | `客户评标打分表（技术分项）` |
| `documentId` | string\|null | ✅ | 关联资料库文档；未入库填 `null` | `doc-014` |
| `originalFiled` | boolean | ✅ | 原件是否已入库；`false` 时报告显示「原件未入库」 | `true` |
| `page` | number\|null | ✅ | 页码；无页码填 `null`（不得填 0） | `3` |
| `section` | string | ✅ | 章节/条目号 | `2.3 技术评分` |
| `snippet` | string | ✅ | **原文摘录**，≥15 字，含数值与单位 | `系统效率 95.6%（要求 ≥95.0%），技术分项 8/10` |
| `reliability` | enum | ✅ | `official` 官方 / `public` 公开 / `thirdParty` 第三方转述 / `unknown` 来源未知 | `official` |
| `collectedBy` | string | ✅ | 采集人 | `李维` |
| `collectedAt` | date | ✅ | `YYYY-MM-DD` | `2026-08-11` |

## 3. winFactors（胜因因素，三栏 + 评分因素表共用）

| 参数 | 类型 | 必填 | 取值 / 格式 | 示例 |
| --- | --- | --- | --- | --- |
| `id` | string | ✅ | `wf-` + 两位 | `wf-06` |
| `title` | string | ✅ | ≤40 字（超长告警） | `循环寿命条件与招标完全对齐` |
| `category` | enum | ✅ | `price` 价格 / `tco` 全生命周期成本 / `safety` 安全 / `efficiency` 效率 / `delivery` 交付 / `local` 本地服务 / `reference` 业绩 / `compliance` 合规 | `efficiency` |
| `level` | enum | ✅ | `A` 已证实 / `B` 可能 / `C` 待验证 | `A` |
| `mandatory` | boolean | ✅ | 强制项（废标项）还是评分项 | `false` |
| `score` / `maxScore` | number\|null | ✅ | 评分表分项得分与满分；**无评分表必须双 `null`**（否则 BR-13） | `8` / `10` |
| `weightPct` | number | ✅ | 评分权重 %，全项目合计建议 100 | `15` |
| `customerNeed` | string | ✅ | 带原始条件，不翻译条件口径 | `≥8000 次 @ DoD90 / 25℃ / SoH70` |
| `ourResponse` | string | ✅ | 承诺值须能与履约记录对照 | `同条件承诺 8500 次，附第三方测试报告（P.41）` |
| `competitorGap` | string | ✅ | 未获取写 `"未知"`；禁止推断劣势 | `竞对 B 使用 DoD80 / SoH60，被要求归一后再比` |
| `evidence` | string[] | ✅ | `EV-id` 列表，≥1 | `["EV-06", "EV-07"]` |
| `confirmedBy` | string | ✅ | 确认人；待人工确认写 `""`；原文未披露写 `"—"` | `李维` |
| `reviewState` | enum | ✅ | `draft` 草稿 / `pending` 待复核 / `verified` 已核验 | `verified` |
| `recentChange` | object | ✅ | `{at: "MM-DD HH:mm", by, action, auditId}`；`auditId` 形如 `aud-0xx`（BR-09） | `{"at":"10-22 14:20","by":"吴桐","action":"升至 A","auditId":"aud-017"}` |
| `conclusionCarrier` | boolean | ✅ | 是否写入结论；C 级必须 `false`（BR-12） | `true` |

## 4. solution（方案配置）

| 参数 | 类型 | 必填 | 取值 / 格式 | 示例 |
| --- | --- | --- | --- | --- |
| `route` | string | ✅ | 同 case.route | `LFP 液冷` |
| `hardGateParams[].status` | enum | ✅ | `meet` 满足 / `deviation` 偏离 / `noResponse` 未应答 / `pending` 待核 | `meet` |
| `certifications[].mandatory` | boolean | ✅ | 强制认证还是加分认证 | `true` |
| `certifications[].validUntil` | date | ✅ | `YYYY-MM-DD` | `2027-06-30` |
| `certifications[].scope` | string | ✅ | 覆盖型号（必填，海外最常见失分点） | `Aster 5000 / 5000H` |
| `deviations[].deviationType` | enum | ✅ | `主动偏差` / `被动偏差` | `主动偏差` |
| `deviations[].customerAccepted` | boolean | ✅ | 只有书面接受才能 `true`，且必须挂 `acceptedEvidence` | `true` |
| `deviations[].reusable` | boolean | ✅ | 是否可复用为经验 | `true` |

## 5. commercial（商务，不含报价建议）

| 参数 | 类型 | 必填 | 取值 / 格式 | 示例 |
| --- | --- | --- | --- | --- |
| `noQuoteStatement` | boolean | ✅ | 必须 `true`（BR-16） | `true` |
| `priceStructure[].sharePct` | number | ✅ | 0–100，合计 100 | `62` |
| `delivery.leadTimeDays` | number | ✅ | 天 | `120` |
| `contractRisks[].redFlag` | boolean | ✅ | 是否红旗条款 | `true` |
| `contractRisks[].impactOnFulfilment` | string | ✅ | 指向 `FU-` 编号 | `关联 FU-02（效率实测达标，罚则未触发）` |

## 6. fulfilment（履约记录）

| 参数 | 类型 | 必填 | 取值 / 格式 | 示例 |
| --- | --- | --- | --- | --- |
| `id` | string | ✅ | `FU-` + 前缀 + 两位 | `FU-04` |
| `commitment` | string | ✅ | 合同/投标原文要点 | `延迟交付赔偿 ≤0.5%/周，上限 10%` |
| `target` | string | ✅ | 数值 + 单位 | `上限 10%` |
| `actual` | string | ✅ | 数值 + 单位；未到期写 `履约中` | `实际赔付 6%` |
| `variance` | string | ✅ | 允许：`+n 单位` / `-n 单位` / `0` / `符合曲线` / `触发赔付` / `优于承诺` / `履约中` / `无` | `触发赔付` |
| `status` | enum | ✅ | `met` 已达成 / `partial` 部分达成 / `missed` 未达成 / `pending` 履约中 | `missed` |
| `note` | string | ✅ | ≤120 字；`missed` 时 ≥6 字复核说明 | `海运延误 6 周，按 1%/周条款赔付 6%（上限 15%）` |
| `verifiedAt` | date | ✅ | `YYYY-MM-DD` | `2026-09-25` |
| `experienceIds` | string[] | `missed` 必填 | 受影响经验（BR-14 反查） | `["exp-10"]` |

校验补充：`actual == "履约中"` 时 `status` 必须是 `pending`；`status == "pending"` 时 `actual` 不得是具体数值。

## 7. experiences（经验条目）

12 必填字段 + 扩展：

| 参数 | 类型 | 必填 | 取值 / 格式 |
| --- | --- | --- | --- |
| `id` | string | ✅ | `EXP-` + 前缀 + 两位（与 PRD 的 `exp-01` 等小写形式等价，二选一保持一致） |
| `category` | enum | ✅ | `competitor` 竞品策略 / `deviation` 技术响应与偏差 / `commercial` 商务与交付 / `awarded` 中标项目知识 |
| `title` / `summary` | string | ✅ | 标题 ≤40 字；摘要 ≤120 字 |
| ①②③④⑤ | string | ✅ | `country` / `scaleBand`（如 `100-200MWh`）/ `customerType` / `bidMode` / `productModel`，取值同 case 枚举 |
| ⑥⑦⑧ | string | ✅ | `requirement` 招标要求（带条件）/ `strategy` 策略 / `result` 结果（带 EV 编号） |
| ⑨ `evidenceSources` | string[] | ✅ | `EV-id` 列表，≥1 且必须都在证据池 |
| ⑩⑪ | string | ✅ | `reviewer` 复盘人 / `reviewedAt` `YYYY-MM-DD` |
| ⑫ `scope` | string | ✅ | 必须含「适用于……；不适用于……」 |
| `evidenceLevel` | enum | ✅ | A/B/C（建议值） |
| `state` | enum | ✅ | `draft` / `verified` / `deprecated`（AI 只产 `draft`） |
| `conclusionCarrier` | boolean | ✅ | C 级必须 `false` |
| `verificationPlan` | string | C 级必填 | 在哪个项目、何时验证 |
| `verificationDue` | date | C 级必填 | 验证到期日 `YYYY-MM-DD`（`check_due.py` 据此提醒） |
| `references[]` | object[] | 引用时必填 | `projectId` / `citedBy` / `citedAt` / `usedIn` |
| `pendingChange` | object\|null | — | 尚未生效的变更；`from` 必须等于当前 `evidenceLevel` |
| `changeHistory[]` | object[] | — | 已生效变更（含 missed 触发的自动降级） |

## 8. openItems / retroMeta

| 参数 | 取值 / 格式 |
| --- | --- |
| `openItems[].id` | `TODO-` + 两位 |
| `openItems[].due` | `YYYY-MM-DD` |
| `retroMeta.owner` | 复盘负责人 |
| `retroMeta.retroDate` | `YYYY-MM-DD`，应 ≤ 中标日 + 14 天（S-01） |
| `retroMeta.humanConfirmed` | 布尔；AI 阶段 `false` |
| `retroMeta.dataNote` | 模拟数据必填：「模拟数据，非真实企业信息（演示用途）」 |
| `retroMeta.generatedBy` | `retro skill` 或 `retro skill（模拟数据）` |

## 9. 取值一致性速查

| 场景 | 必须成立 |
| --- | --- |
| `hasScoreSheet=false` | 所有 `level`/`evidenceLevel` ≠ A；所有 `score`/`maxScore` 为 `null`（BR-13） |
| `level=A` | `evidence` ≥1 且 `reviewState=verified`（S-02 可追问"这条 8 分是哪一页"） |
| `competitorGap="未知"` | 不计入"我方优势"统计（BR-03） |
| `status=missed` | `note` ≥6 字 + `experienceIds` 非空 + 关联经验已降级（BR-14） |
| `evidenceLevel=C` | `conclusionCarrier=false` + `state=draft` + `verificationPlan` + `verificationDue` |
| 证据 `originalFiled=false` | 报告标注「原件未入库」，不进 A 级证据（A 级必须可定位原件或扫描件） |
