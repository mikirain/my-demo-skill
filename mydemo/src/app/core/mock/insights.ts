import { Clarification, Insight, RiskItem } from '../types';

export const INSIGHTS: Insight[] = [
  { id: 'ins-001', projectId: 'p-01', type: 'fact', text: '竞对 A 标称系统效率 92%，但其原文明确为 DC 端测量，且不含辅助功耗，与招标要求的 AC-AC 口径不一致。', evidenceIds: ['anc-07'], state: 'draft' },
  { id: 'ins-002', projectId: 'p-01', type: 'fact', text: '竞对 A 循环寿命标称 12000 次，但未给出 DoD、温度与 SoH 终点，条件不可核验。', evidenceIds: ['anc-08'], state: 'draft' },
  { id: 'ins-003', projectId: 'p-01', type: 'fact', text: '竞对 A 全篇未披露可用率与欧洲本地服务能力，两项目前无证据支撑，不可视为其劣势。', evidenceIds: [], state: 'draft' },
  { id: 'ins-004', projectId: 'p-01', type: 'fact', text: '我方系统效率 88.5% 为 AC-AC 口径且已含辅助功耗，与招标要求同口径，可满足 88% 门槛。', evidenceIds: ['anc-01', 'anc-16'], state: 'draft' },
  { id: 'ins-005', projectId: 'p-01', type: 'fact', text: '竞对 B 交付周期未在手册中披露，其「24 周」口径来自历史投标摘要，不含海运，起算点不同。', evidenceIds: ['anc-10'], state: 'draft' },
  { id: 'ins-006', projectId: 'p-01', type: 'inference', text: '待核实：若业主接受竞对 A 的 DC 侧效率口径，我方在效率项将显劣势，建议在答疑阶段主动提出统一口径。', evidenceIds: ['anc-07', 'anc-01'], state: 'draft' },
  { id: 'ins-007', projectId: 'p-01', type: 'inference', text: '待核实：竞对 B 的 99% 可用率为月度口径，若折算为年度时间加权，其承诺可能低于我方 98.5%。', evidenceIds: ['anc-14', 'anc-18'], state: 'draft' },
  { id: 'ins-008', projectId: 'p-01', type: 'suggestion', text: '建议将「交付确定性（5 周海运 + 2 周并网）」写入技术标差异化章节，而非在效率参数上做正面比拼。', evidenceIds: ['anc-06'], state: 'draft' },
  { id: 'ins-009', projectId: 'p-01', type: 'suggestion', text: '建议报价策略围绕本地服务响应（4 小时）与备件覆盖构建，商务让利空间由商务负责人填写。', evidenceIds: ['anc-04'], state: 'draft' },
  { id: 'ins-010', projectId: 'p-01', type: 'inference', text: '无引用测试条目：竞对 A 的消防方案可能不满足业主最新要求。', evidenceIds: [], state: 'draft' },
  { id: 'ins-011', projectId: 'p-02', type: 'fact', text: '竞对 D 的 12 年质保需另行签订延保合同，属条件性承诺，评标时应按 10 年标准计入。', evidenceIds: ['anc-09'], state: 'draft' },
  { id: 'ins-012', projectId: 'p-02', type: 'fact', text: '竞对 C 单箱额定能量 4.2 MWh，低于 5.0 MWh 要求，将增加箱数与 BOP 成本。', evidenceIds: ['anc-12'], state: 'draft' },
];

export const RISK_ITEMS: RiskItem[] = [
  { id: 'risk-01', projectId: 'p-01', level: 'high', kind: '废标风险', text: '系统效率测量边界与招标要求不一致，若按 DC 侧数值应答，存在被认定为「未按口径响应」的风险。', relatedKeys: ['system_rte'], suggestion: '在澄清阶段确认边界定义，技术标中同时给出 AC-AC 与 DC-DC 两套数据并注明口径。', owner: '王琛', state: 'mitigating' },
  { id: 'risk-02', projectId: 'p-01', level: 'high', kind: '技术偏离', text: '竞对 A 的 PCS 质保仅 5 年，低于 10 年要求；我方若未在偏离表中明确整系统覆盖，可能被要求对标其低价配置。', relatedKeys: ['warranty_years'], suggestion: '在偏离表中单独列出 PCS 质保覆盖范围，避免整体质保被拉低。', owner: '李维', state: 'open' },
  { id: 'risk-03', projectId: 'p-01', level: 'high', kind: '承诺风险', text: '循环寿命测试条件未统一，若我方按更宽条件承诺，将承担额外衰减赔付风险。', relatedKeys: ['cycle_life'], suggestion: '承诺值严格采用 DoD 90%/25℃/SoH 70% 口径，并在合同中限定测试方法。', owner: '陈立', state: 'open' },
  { id: 'risk-04', projectId: 'p-01', level: 'mid', kind: '证据缺口', text: '竞对 B 的消防与噪声数据缺失，我方在安全维度的优势目前缺乏对手侧证据支撑，评审时说服力弱。', relatedKeys: ['fire_suppression', 'noise'], suggestion: '通过公开渠道补充竞对 B 的认证与测试报告，或转为我方主动披露的对比点。', owner: '李维', state: 'mitigating' },
  { id: 'risk-05', projectId: 'p-01', level: 'mid', kind: '商务风险', text: '竞对 A 预付比例 30% 高于我方 20%，业主可能据此要求我方提高预付或降低总价。', relatedKeys: ['payment_terms'], suggestion: '商务侧准备两种付款结构备选，避免在单一结构上被压价。', owner: '周敏', state: 'open' },
  { id: 'risk-06', projectId: 'p-01', level: 'low', kind: '证据缺口', text: '我方噪声数据来自内部测试，缺少第三方报告。', relatedKeys: ['noise'], suggestion: '补充第三方噪声测试报告，或改为范围值披露。', owner: '李维', state: 'closed' },
  { id: 'risk-07', projectId: 'p-02', level: 'high', kind: '商务风险', text: '竞对 D 以延保形式提供 12 年质保，若业主按 12 年评标，我方 10 年将失分。', relatedKeys: ['warranty_years'], suggestion: '测算延保至 12 年的成本并纳入报价方案，同时明确延保条件。', owner: '郑一', state: 'open' },
  { id: 'risk-08', projectId: 'p-03', level: 'mid', kind: '证据缺口', text: '竞对 E 的扫描件解析失败，关键参数暂无数据，抽取阶段无法完成对比。', relatedKeys: ['system_rte', 'warranty_years'], suggestion: '索取可检索版本或人工录入关键字段；必要时在对比中标注「证据不足」。', owner: '李维', state: 'open' },
];

export const CLARIFICATIONS: Clarification[] = [
  { id: 'clr-01', projectId: 'p-01', question: '请明确系统往返效率的测量边界与辅助功耗是否计入？', background: '招标文件 3.2 要求 AC-AC ≥88%，但未说明辅助功耗处理方式；竞对 A 报价基于 DC 侧口径。', impact: '影响效率项横向可比性与评分', evidenceIds: ['anc-01', 'anc-07'] },
  { id: 'clr-02', projectId: 'p-01', question: '循环寿命的测试条件（DoD、温度、SoH 终点、倍率）是否统一按 3.2.4 执行？', background: '竞对 A 未给出条件，竞对 B 使用 DoD 80%/SoH 60%，与要求不一致。', impact: '影响寿命承诺与质保成本', evidenceIds: ['anc-02', 'anc-08'] },
  { id: 'clr-03', projectId: 'p-01', question: '可用率的统计周期与计算方式是否限定为「年度、时间加权」？', background: '竞对 B 采用月度口径，数值偏高，易造成评标误判。', impact: '影响可用率承诺与违约赔偿', evidenceIds: ['anc-03', 'anc-14'] },
  { id: 'clr-04', projectId: 'p-01', question: 'PCS 是否纳入 10 年整系统质保范围？', background: '竞对 A 的 PCS 仅保 5 年，若业主接受该配置，将压低整体质保基准。', impact: '影响质保成本与偏离表口径', evidenceIds: ['anc-04', 'anc-09'] },
  { id: 'clr-05', projectId: 'p-01', question: '交付周期的起算点与是否包含海运、并网调试？', background: '竞对 A 的 24 周不含海运，竞对 B 未披露，口径不统一。', impact: '影响交付承诺与违约金风险', evidenceIds: ['anc-06', 'anc-10'] },
  { id: 'clr-06', projectId: 'p-02', question: '延保至 12 年的价格与条件是否接受单独报价？', background: '竞对 D 以延保合同形式提供 12 年质保。', impact: '影响商务方案与报价结构', evidenceIds: ['anc-09'] },
];
