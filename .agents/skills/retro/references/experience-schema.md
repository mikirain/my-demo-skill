# retro.json 数据结构契约（v1.1，唯一写入目标）

> 加载时机：Step 3 写入前**必须**加载；Step 4 报错按本文件定位。
> 取值白名单（枚举、格式、示例）见 `parameter-dictionary.md`；本文件只定义**结构**与**语义**。
> 字段名与 `docs/prd/BidScope-PRD-v1.1` §7 类型契约一致（camelCase），扩展字段在 §6 标出。

## 1. 顶层结构

```jsonc
{
  "schemaVersion": "1.1",
  "case":        { /* AwardedProject + 复盘编号 */ },
  "evidence":    [ /* 证据池，全部引用用 EV-id 指向这里 */ ],
  "winFactors":  [ /* 胜因因素：三栏 + 评分因素表共用 */ ],
  "solution":    { /* 方案配置复盘 */ },
  "commercial":  { /* 商务复盘（不含报价建议） */ },
  "process":     { /* 投标组织复盘 */ },
  "fulfilment":  [ /* 履约验证 */ ],
  "experiences": [ /* 经验草稿：12 必填字段 */ ],
  "openItems":   [ /* 待补证据 / 待办 */ ],
  "retroMeta":   { /* 复盘元信息 */ }
}
```

## 2. case

| 字段 | 说明 | v1.1 变化 |
| --- | --- | --- |
| `retroId` | 复盘编号 `rp-01`（与项目编号区分） | **新增必填** |
| `id` | 项目编号 `p-01` | — |
| `name` | `国别-站名 规模 类型（年份 中标）` | 命名不规范只告警 |
| `country` `mw` `mwh` `route` | 国别 / 功率 / 能量 / 技术路线 | `route` **新增必填** |
| `customerType` `bidMode` `contractMode` | 三处枚举（白名单见字典） | **改为枚举校验** |
| `productModel` `awardedYear` | 型号 / 中标年 | — |
| `awardDate` | 中标日期 | **新增必填**（S-01 复盘窗口：+14 天） |
| `competitorIds` | 「竞对 A」…「竞对 F」代号 | — |
| `hasScoreSheet` | 决定 BR-13 上限 | — |
| `snapshotAt` | 快照日期 | — |

## 3. evidence

```jsonc
{
  "id": "EV-06",
  "type": "scoreSheet",              // tender|scoreSheet|awardNotice|ourBid|competitorBid|clarification|negotiation|fulfilment|other
  "title": "客户评标打分表（技术分项）",
  "documentId": "doc-014",           // 原件未入库填 null（不得省略）
  "originalFiled": true,             // 原件是否已入库；false 时报告标「原件未入库」
  "page": 3,                         // 无页码填 null，禁止填 0（BR-02）
  "section": "2.3 技术评分",
  "snippet": "系统效率 95.6%（要求 ≥95.0%），技术分项 8/10；寿命与质保 8/10",
  "reliability": "official",
  "collectedBy": "李维",
  "collectedAt": "2026-08-11"
}
```

要点：`snippet` 必须是**原文摘录**（≥15 字、含数值与单位），不是概述；报告会原样引用并列出定位。

## 4. winFactors（三栏 + 评分因素表）

```jsonc
{
  "id": "wf-06",
  "title": "循环寿命条件与招标完全对齐",
  "category": "efficiency",          // 8 类白名单
  "level": "A",                      // A/B/C（建议值）
  "mandatory": false,                // 强制项 or 评分项
  "score": 8,                        // 分项得分；无评分表必须 null
  "maxScore": 10,                    // 满分
  "weightPct": 15,
  "customerNeed": "≥8000 次 @ DoD90 / 25℃ / SoH70",
  "ourResponse": "同条件承诺 8500 次，附第三方测试报告（P.41）",
  "competitorGap": "竞对 B 使用 DoD80 / SoH60，被要求归一后再比",  // 未获取写"未知"
  "evidence": ["EV-06", "EV-07"],
  "confirmedBy": "李维",              // 待确认写 ""；原文未披露写 "—"
  "reviewState": "verified",         // draft|pending|verified（草稿/待复核/已核验）
  "recentChange": { "at": "10-22 14:20", "by": "吴桐", "action": "升至 A", "auditId": "aud-017" },
  "conclusionCarrier": true          // C 级必须 false
}
```

## 5. solution / commercial / process

```jsonc
"solution": {
  "route": "LFP 液冷",
  "hardGateParams": [
    { "key": "efficiency", "label": "系统效率（AC-AC）", "requirement": "≥ 88.0%", "ourValue": "88.5%", "status": "meet" }
  ],
  "differentiators": [
    { "key": "thermal", "label": "电芯温差", "ourValue": "±1.8℃", "competitorBest": "±3.0℃", "note": "对应技术分项 8/10" }
  ],
  "configJudgement": { "overSpec": ["10 年整机质保（评分表无此项）"], "underSpec": [], "note": "" },
  "certifications": [
    { "name": "VDE-AR-N 4110", "scope": "Aster 5000 / 5000H", "validUntil": "2028-03-31", "mandatory": true, "gapRisk": "6.1 型号以并网前 90 天补证覆盖" }
  ],
  "deviations": [
    { "id": "DV-01", "requirement": "噪声 ≤ 65 dB", "deviationType": "主动偏差", "reason": "实测 68 dB",
      "clarification": "隔声罩方案，并网前复测", "customerAccepted": true, "acceptedEvidence": "EV-05", "reusable": true }
  ]
},
"commercial": {
  "noQuoteStatement": true,
  "priceStructure": [ { "item": "储能系统（含消防，不含并网柜）", "sharePct": 62, "note": "与招标供货范围一致" } ],
  "tcoFactors": [ { "factor": "辅助功耗", "impact": "TCO -3.1%", "note": "液冷温控策略优化" } ],
  "delivery": { "leadTimeDays": 120, "localization": "本地伙伴 2 家，备件仓 2 年内建成", "thirdPartyRisks": ["并网柜依赖本地集成商"] },
  "contractRisks": [ { "clause": "性能罚则 20% 合同额", "redFlag": true, "concession": "谈至 15%", "impactOnFulfilment": "关联 FU-02" } ]
},
"process": {
  "involvementTimeline": [ { "phase": "澄清截止前 3 天", "actor": "法务", "note": "介入过晚，罚则未谈" } ],
  "blockers": [ { "id": "PB-01", "stage": "报价审批", "issue": "三级审批串行", "effect": "报价冻结晚 2 天", "fix": "改为并行会签" } ],
  "effectiveReviews": [ { "node": "技术卷终审", "owner": "王磊", "caught": "循环次数口径与实测不一致" } ]
}
```

## 6. fulfilment（履约验证）

```jsonc
{
  "id": "FU-04",
  "commitment": "延迟交付赔偿 ≤0.5%/周，上限 10%",
  "target": "上限 10%",
  "actual": "实际赔付 6%",            // 未到期写「履约中」
  "variance": "触发赔付",             // +n/-n 单位、0、符合曲线、触发赔付、优于承诺、履约中、无
  "status": "missed",                // met|partial|missed|pending
  "note": "海运延误 6 周，按 1%/周条款赔付 6%（上限 15%）",  // ≤120 字；missed 时 ≥6 字
  "verifiedAt": "2026-09-25",
  "experienceIds": ["EXP-03"]        // 扩展字段：missed 必填，BR-14 反查用
}
```

约束：`actual == "履约中"` ⇔ `status == "pending"`；`pending` 时 `actual` 不得是具体结果。

## 7. experiences（经验条目）

```jsonc
{
  "id": "EXP-03",
  "category": "commercial",          // competitor|deviation|commercial|awarded
  "title": "本地化服务承诺必须与备件仓成本同期落地",
  "summary": "以本地伙伴 + 承诺建仓换服务分，但报价未含建仓成本；履约阶段 4 小时承诺实际 36 小时。",

  "country": "CZ",                   // ① 国家/地区
  "scaleBand": "100-200MWh",         // ② 项目规模
  "customerType": "电网公司",         // ③ 客户类型（枚举同 case）
  "bidMode": "公开招标",              // ④ 投标模式
  "productModel": "Aster 5000",      // ⑤ 产品型号
  "requirement": "本地响应 ≤4 小时、2 年内建成备件仓",   // ⑥ 招标要求
  "strategy": "以本地伙伴 + 承诺建仓换服务分，建仓成本未进报价",  // ⑦ 策略
  "result": "服务分 8/10；履约 36 小时响应并收到客户投诉（EV-09）",  // ⑧ 结果
  "evidenceSources": ["EV-05", "EV-07", "EV-09"],   // ⑨ 证据来源（必须在池内）
  "reviewer": "王磊",                 // ⑩ 复盘人
  "reviewedAt": "2026-10-25",         // ⑪ 复核日期
  "scope": "适用于要求本地响应 ≤4h 的欧洲项目；不适用于无本地化门槛的纯供货项目",  // ⑫ 适用范围

  "evidenceLevel": "B",
  "state": "draft",                   // AI 只产 draft
  "conclusionCarrier": true,          // C 级必须 false
  "verificationPlan": "",             // C 级必填：在哪个项目/何时验证
  "verificationDue": "2027-02-28",    // C 级必填：验证到期日（check_due.py 用）
  "references": [
    { "projectId": "p-02", "citedBy": "张伟", "citedAt": "2026-10-21", "usedIn": "德国 230MWh 服务承诺表 §2" }
  ],
  "pendingChange": {                  // 尚未生效的变更；from 必须等于当前 evidenceLevel
    "id": "CHG-07", "from": "B", "to": "C", "status": "pending",
    "requester": "王磊", "approver": "李静", "requestedAt": "2026-10-22",
    "reason": "本地备件仓未建成，服务承诺未兑现", "newEvidenceIds": ["EV-09"]
  },
  "changeHistory": [
    { "id": "CHG-02", "from": "B", "to": "A", "status": "approved", "requester": "李静", "approver": "陈明",
      "requestedAt": "2026-09-01", "reason": "取得客户评分表原件", "newEvidenceIds": ["EV-01"] }
  ]
}
```

**变更语义（v1.1 明确）**：
- `pendingChange` = **尚未生效**的申请，`from` 必须等于当前 `evidenceLevel`（否则 `[STATE]` 报错）；
- 已生效的变更（审批通过、以及履约 `missed` 触发的自动降级）写 `changeHistory`，同时把 `evidenceLevel` 改成生效后的等级；
- `missed` 触发的是**自动降级 + 立即生效**，`requester` 写"系统自动触发（FU-xx missed，BR-14）"，`approver` 写人工复核人（二者必须不同，LR-04）。

## 8. openItems / retroMeta

```jsonc
"openItems": [ { "id": "TODO-01", "item": "向客户索取评标反馈原件", "owner": "张伟", "due": "2026-11-05", "blocks": "EXP-01 升 A" } ],
"retroMeta": {
  "owner": "张伟",
  "retroDate": "2026-10-25",
  "generatedBy": "retro skill（模拟数据）",
  "humanConfirmed": false,
  "dataNote": "模拟数据，非真实企业信息（演示用途）"
}
```

`humanConfirmed` 由人工确认后置 `true`；AI 阶段必须 `false`。模拟/演示数据必须填 `dataNote`，`render_report.py` 会在告警区置顶横幅。

## 9. 缺失值与统计口径（BR-02 / BR-03）

| 情形 | 写法 | 后果 |
| --- | --- | --- |
| 原文未披露 | `"—"` | 报告显示 `—`，不进统计 |
| 数据待补 | `null` + `openItems` 记录 | 校验按缺失处理 |
| 竞对信息未获取 | `competitorGap: "未知"` | **不计入"我方优势"统计**（BR-03） |
| 证据条数为 0 | 不写（`evidence: []` 会直接 BR-11 报错） | 唯一允许"0"的地方是计数展示 |

禁止：用 `0`、`无`、`未披露` 混写缺失值（`validate_retro.py` 报 `[BR-02]`）。

## 10. 校验口径速查

| 脚本 | 检查内容 | 退出码 |
| --- | --- | --- |
| `check_inputs.py` | Step 1 材料齐备度 + 等级上限预判 | 0 齐备 / 1 用法 / 2 缺必需 |
| `validate_retro.py` | schema v1.1、取值字典、12 字段、BR-01~15、LR-01~05、日期、引用、分项分值一致性 | 0 通过 / 1 用法 / 2 文件或 JSON / 3 有 ERROR |
| `check_due.py` | 复盘窗口、经验复核、C 级验证到期、待审 SLA、履约核验、待办逾期 | 0 无到期 / 1 用法或读取失败 / 2 有到期项 |
| `score_match.py` | 匹配打分 + 可借鉴/差异条件（BR-12 分区） | 0 有候选 / 1 用法 / 2 无候选或输入错 / 3 数据不合法 |
| `render_report.py` | 模板渲染 + 角色视图/脱敏，占位符必须全解析 | 0 成功 / 1 用法 / 2 读取失败、覆盖保护、admin 无权限 / 3 占位符残留 |
