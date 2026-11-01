# 研判与风险简报 · CZ-Morava 100MWh 独立储能

| 项目 | 内容 |
| --- | --- |
| 研判编号 | ir-p01 |
| 基准日 | 2026-10-24 |
| 投标截止 | 2026-11-08（T-15 天） |
| 视图 | commercial · 商务视角（只读）：仅显示商务类风险与商务相关澄清；无任何写入控件。 |
| 生成信息 | 2026-10-24（由 danger skill 机械渲染） |

> 演示数据，非真实企业信息
> 本简报只做研判与风险登记：**不生成报价、不让利、不承诺可用率、不推断对手成本结构**（BR-06）。
> 结论的三段式为「结论 / 依据 / 类型」；推断一律以「待核实：」开头（IR-02）。
> 采纳、指派、关闭、填写决策留白都是人工动作，脚本只做门禁与机械校验（IR-10）。

## 0. 角色与只读提示

商务视角（只读）：仅显示商务类风险与商务相关澄清；无任何写入控件。

## 1. 门禁状态（研判阶段的硬门槛）

- 已确认字段：20/40（阈值 ≥15）✓
- 冲突待决（不参与生成）：2 条 — pv-019, pv-031
- 强制条款判定：7/7
- 草稿门禁：可生成
- 提交审核子门禁：通过

## 2. 条目统计

| 对象 | 计数 |
| --- | --- |
| 结论 | 10（事实 5 / 推断 3 / 建议 2） |
| 已拦截（无依据） | 2 |
| 已采纳 / 已修改 | 8 |
| 风险 | 6（高 3 / 中 2 / 低 1） |
| 待处理高风险 | 0 |
| 澄清 | 5 |

## 3. 结论（三段式）

（当前视角下无可展示结论）

## 4. 已拦截（无依据，不可采纳）

（商务视角不展示结论拦截明细）

## 5. 风险（高 → 中 → 低，强制条款置顶）

### 中风险 1（待处理 1）

- **risk-05｜中｜商务风险** — 周敏 / 待处理 / 期限 2026-11-05
  - 说明：竞对 A 预付比例 30% 高于我方 20%，业主可能据此要求我方提高预付或降低总价。
  - 处置：商务侧准备两种付款结构备选，避免在单一结构上被压价。
  - 来源：cmp-018 · 关联参数 payment_terms

## 6. 澄清清单（可直接粘进答疑函）

（当前视角下无澄清条目）

## 7. 决策留白（系统零写入）

| 字段 | 值 | 依据 | 填写人 / 时间 |
| --- | --- | --- | --- |
| 报价让利空间 | 3.5 % | 竞对 A 预付 30% 高于我方 20%，以账期让利替代降价 | 王琛 · 11-06 16:20 |
| 承诺可用率 | 98.5 %（年度时间加权） | 我方 Aster5000 年可用率 98.5%，按时间加权统计 | 王琛 · 11-06 16:20 |

授权提示：让利 3.5% 在投标经理授权内（≤5%）。
系统未生成报价与承诺值（systemGenerated=false）；两项均由投标经理人工填写并留审计（BR-06）。

## 8. 审计留痕

- 11-06 16:20 · u-02 · correct · decisionBlank 决策留白保存
- 11-06 14:02 · u-02 · close · risk-06 关闭理由已存档，报告归档在 doc-13
- 11-06 13:20 · u-02 · assign · risk-05 risk-05 指派给周敏
- 11-06 13:12 · u-01 · correct · risk-04 状态 待处理 → 处置中
- 11-06 13:05 · u-02 · assign · risk-04 risk-04 指派给李维
- 11-06 11:47 · u-04 · correct · risk-03 状态 待处理 → 处置中：补充合同附件限定测试方法
- 11-06 11:33 · u-02 · assign · risk-03 risk-03 指派给陈立
- 11-06 11:26 · u-01 · correct · risk-02 状态 待处理 → 处置中：偏离表已加覆盖范围行
- 11-06 11:18 · u-02 · assign · risk-02 risk-02 指派给李维
- 11-06 11:10 · u-02 · correct · risk-01 状态 待处理 → 处置中
- 11-06 11:02 · u-02 · assign · risk-01 risk-01 指派给王琛
- 11-06 10:28 · u-02 · adopt · ins-009 与偏离表口径一致，采纳
- 11-06 10:20 · u-01 · adopt · ins-008 采纳为技术标差异化建议
- 11-06 10:12 · u-01 · adopt · ins-007 折算前不得对外使用，先发澄清确认口径
- 11-06 10:05 · u-02 · adopt · ins-006 投标经理采纳，作为答疑策略依据
- 11-06 09:52 · u-01 · edit · ins-005 把「可能」改为原文口径（excluding sea freight）
- 11-06 09:40 · u-01 · adopt · ins-005 采纳草稿
- 11-06 09:31 · u-01 · adopt · ins-004 同口径唯一可正面对比的效率值
- 11-06 09:20 · u-01 · adopt · ins-002 该字段存在冲突（12000 次 vs 10000 次），仅作内部研判，不作对外结论
- 11-06 09:12 · u-01 · adopt · ins-001 核对 P.37 原文 measured at DC terminals 后采纳

## 9. 证据索引（全部可回查）

| 锚点 | 文档 | 页码 | 章节 | 片段 | 置信度 |
| --- | --- | --- | --- | --- | --- |
| anc-01 | CZ-Morava_RFP_技术规范书.pdf | P.12 | §3.2 系统性能要求 | AC-AC round trip efficiency shall be not less than 88% | 0.97 |
| anc-02 | CZ-Morava_RFP_技术规范书.pdf | P.13 | §3.2 系统性能要求 | not less than 8000 cycles at 90% DoD, 25°C, end of life 70% SoH | 0.95 |
| anc-03 | CZ-Morava_RFP_技术规范书.pdf | P.14 | §3.3 质保与可用率 | annual availability of at least 98% calculated on a time-weighted basis | 0.93 |
| anc-04 | CZ-Morava_RFP_技术规范书.pdf | P.15 | §3.3 质保与可用率 | warranty period of 10 years from commercial operation date | 0.96 |
| anc-06 | CZ-Morava_RFP_技术规范书.pdf | P.31 | §6 交付计划 | delivery within 30 weeks from contract signature | 0.94 |
| anc-07 | 竞对A_技术应答文件_v2.pdf | P.37 | §5.1 Efficiency | up to 92% round trip efficiency measured at DC terminals | 0.88 |
| anc-08 | 竞对A_技术应答文件_v2.pdf | P.38 | §5.2 Cycle life | up to 12000 cycles, conditions to be confirmed per project | 0.61 |
| anc-09 | 竞对A_技术应答文件_v2.pdf | P.41 | §5.4 Warranty | 10 years for battery cells, 5 years for PCS | 0.9 |
| anc-10 | 竞对A_技术应答文件_v2.pdf | P.44 | §5.6 Delivery | typical delivery 24 weeks excluding sea freight | 0.72 |
| anc-11 | 竞对A_技术应答文件_v2.pdf | P.47 | §5.7 Safety | aerosol based suppression plus NFPA 68 deflagration venting | 0.86 |
| anc-14 | 竞对B_PowerStack_产品手册_EN.pdf | P.21 | §Product specification | 99% availability on a monthly reporting basis | 0.79 |
| anc-16 | Aster5000_规格书_内部v4.pdf | P.9 | §2.1 系统参数 | 系统往返效率 88.5%（AC-AC，含辅助功耗，25℃，0.5C） | 0.99 |
| anc-18 | Aster5000_规格书_内部v4.pdf | P.12 | §2.3 质保 | 年可用率保证 98.5%，按时间加权统计 | 0.97 |

## 10. 待补清单

- ins-003 / ins-010 已拦截：补引用或转为澄清
- risk-05 商务风险待周敏开始处置
- 提交审核前需由他人复核高风险结论（BR-08 双人规则）
- ins-003 已拦截（no-evidence）：补引用或转为澄清
- ins-010 已拦截（no-evidence）：补引用或转为澄清

---

### 交付说明

- 简报只是 `insights.json` 的视图；可回查、可校验的资产是 `insights.json` + `sources.json`。
- 拦截条目只允许「补引用 / 转为澄清 / 删除」；未披露不得写成劣势（BR-03）。
- 风险关闭须填理由并二次确认；高风险未处置不得提交审核（IR-12）。
- 数值必须带边界或周期：`88.5%（AC-AC）`、`98.5%（年度时间加权）`；缺失写 `—`，不填 0（BR-02）。
