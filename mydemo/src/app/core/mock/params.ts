import { Condition, Dimension, ParamDef, ParamLevel, ParamStatus, ParamValue, SourceReliability } from '../types';

/* ---------------- 参数字典 v1.0（48 项） ---------------- */

type DefRow = [string, string, string, Dimension, ParamLevel, (keyof Condition)[], string[]];

const DEF_ROWS: DefRow[] = [
  // technical
  ['rated_power', '额定功率', 'MW', 'technical', 'system', [], ['Rated Power', 'Pnom']],
  ['rated_energy', '额定能量', 'MWh', 'technical', 'system', [], ['Nominal Energy', 'Rated Capacity']],
  ['usable_energy', '可用能量', 'MWh', 'technical', 'system', ['dod', 'sohEnd'], ['Usable Energy', 'Usable Capacity']],
  ['duration', '持续放电时长', 'h', 'technical', 'system', [], ['Duration', 'Discharge Duration']],
  ['dc_ac_ratio', 'DC/AC 比', '—', 'technical', 'system', [], ['DC/AC Ratio']],
  ['footprint', '占地面积', 'm²', 'technical', 'plant', [], ['Footprint', 'Area']],
  ['weight', '系统重量', 't', 'technical', 'system', [], ['Weight']],
  ['cell_type', '电芯类型', '—', 'technical', 'cell', [], ['Cell Chemistry', 'Cell Type']],
  ['cell_config', '成组方式', '—', 'technical', 'module', [], ['Configuration']],
  ['thermal_type', '温控方式', '—', 'technical', 'system', [], ['Thermal Management', 'Cooling']],
  ['ip_rating', '防护等级', 'IP', 'technical', 'rack', [], ['IP Rating', 'Ingress Protection']],
  ['noise', '噪声', 'dB(A)', 'technical', 'plant', [], ['Noise Level', 'Acoustic']],
  // performance
  ['system_rte', '系统往返效率', '%', 'performance', 'system', ['boundary', 'temperature', 'loadRate'], ['Round Trip Efficiency', 'RTE', 'System Efficiency']],
  ['pcs_efficiency', 'PCS 效率', '%', 'performance', 'rack', ['loadRate'], ['PCS Efficiency', 'Inverter Efficiency']],
  ['aux_consumption', '辅助功耗', '%', 'performance', 'system', ['loadRate'], ['Auxiliary Consumption', 'Parasitic Load']],
  ['standby_loss', '待机损耗', 'kW', 'performance', 'system', [], ['Standby Loss', 'No-load Loss']],
  ['cycle_life', '循环寿命', '次', 'performance', 'cell', ['dod', 'temperature', 'sohEnd'], ['Cycle Life', 'Cycles']],
  ['degradation', '容量衰减保证', '%/年', 'performance', 'system', ['temperature'], ['Degradation', 'Capacity Retention']],
  ['calendar_life', '日历寿命', '年', 'performance', 'cell', ['temperature'], ['Calendar Life']],
  ['temp_range', '工作温度区间', '℃', 'performance', 'system', [], ['Operating Temperature']],
  ['derating', '高低温降额', '—', 'performance', 'system', ['temperature'], ['Derating Strategy']],
  ['response_time', '响应时间', 'ms', 'performance', 'system', [], ['Response Time']],
  // safety
  ['fire_suppression', '消防方案', '—', 'safety', 'system', [], ['Fire Suppression', 'Fire Fighting']],
  ['certifications', '认证清单', '—', 'safety', 'system', [], ['Certifications', 'Certificates']],
  ['grid_code', '并网标准', '—', 'safety', 'plant', [], ['Grid Code', 'Grid Compliance']],
  ['lvrt', '低电压穿越', '—', 'safety', 'plant', [], ['LVRT', 'Fault Ride Through']],
  ['thd', '电流谐波畸变', '%', 'safety', 'plant', ['loadRate'], ['THD', 'Harmonics']],
  ['pf_range', '功率因数范围', '—', 'safety', 'plant', [], ['Power Factor Range']],
  ['anti_island', '防孤岛保护', '—', 'safety', 'plant', [], ['Anti-islanding']],
  // warranty
  ['availability', '可用率保证', '%', 'warranty', 'plant', ['period'], ['Availability', 'Availability Guarantee']],
  ['warranty_years', '质保年限', '年', 'warranty', 'system', [], ['Warranty Period', 'Warranty']],
  ['extended_warranty', '延保方案', '年', 'warranty', 'system', [], ['Extended Warranty']],
  ['capacity_warranty', '容量保证', '%', 'warranty', 'system', ['sohEnd'], ['Capacity Warranty', 'Energy Retention']],
  // delivery
  ['lead_time', '交付周期', '周', 'delivery', 'system', [], ['Lead Time', 'Delivery Time']],
  ['local_service', '本地服务能力', '—', 'delivery', 'plant', [], ['Local Service', 'Service Network']],
  ['om_model', '运维模式', '—', 'delivery', 'plant', [], ['O&M Model', 'Service Model']],
  ['spare_parts', '备件保障', '—', 'delivery', 'plant', [], ['Spare Parts']],
  ['commissioning', '并网调试周期', '周', 'delivery', 'plant', [], ['Commissioning']],
  ['training', '培训投入', '人日', 'delivery', 'plant', [], ['Training']],
  // commercial
  ['price_structure', '报价结构', '—', 'commercial', 'plant', [], ['Price Structure']],
  ['payment_terms', '付款条件', '—', 'commercial', 'plant', [], ['Payment Terms']],
  ['performance_bond', '履约保函', '%', 'commercial', 'plant', [], ['Performance Bond']],
  ['liquidated_damages', '违约赔偿', '%/周', 'commercial', 'plant', [], ['Liquidated Damages', 'LD']],
  ['insurance', '保险要求', '—', 'commercial', 'plant', [], ['Insurance']],
  ['currency', '结算币种', '—', 'commercial', 'plant', [], ['Currency']],
  ['price_index', '价格调整机制', '—', 'commercial', 'plant', [], ['Price Indexation']],
  ['tax_note', '税务口径', '—', 'commercial', 'plant', [], ['Tax Treatment']],
  ['escalator', '维保涨价条款', '—', 'commercial', 'plant', [], ['Escalation Clause']],
];

export const PARAM_DEFS: ParamDef[] = DEF_ROWS.map(([key, label, unit, domain, level, requiredConditions, aliases], i) => ({
  key,
  label,
  unit,
  domain,
  level,
  requiredConditions,
  aliases,
  version: key === 'system_rte' || key === 'cycle_life' ? 3 : 1 + (i % 2),
}));

export const PARAM_DEF_MAP = new Map(PARAM_DEFS.map((d) => [d.key, d]));

/* ---------------- 参数实例（五元组） ---------------- */

const SOURCE_NAMES: Record<string, string> = {
  our: '我方 Aster 5000',
  'c-a': '竞对 A',
  'c-b': '竞对 B',
  'c-c': '竞对 C',
  'c-d': '竞对 D',
  'c-e': '竞对 E',
};

const DOC_RELIABILITY: Record<string, SourceReliability> = {
  'doc-01': 'official',
  'doc-02': 'public',
  'doc-03': 'official',
  'doc-04': 'thirdParty',
  'doc-05': 'official',
  'doc-07': 'official',
  'doc-08': 'public',
  'doc-09': 'official',
  'doc-12': 'public',
};

type EvTuple = [docId: string, page: number, section: string, snippet: string];

function mk(
  projectId: string,
  id: string,
  sourceId: string,
  defKey: string,
  rawValue: string,
  value: string | number | null,
  confidence: number,
  status: ParamStatus,
  conditions: Condition = {},
  ev?: EvTuple,
  conflictValues?: { value: string; source: string }[],
): ParamValue {
  const def = PARAM_DEF_MAP.get(defKey);
  if (!def) throw new Error('unknown param def: ' + defKey);
  return {
    id,
    projectId,
    defKey,
    defLabel: def.label,
    sourceId,
    sourceName: SOURCE_NAMES[sourceId] ?? sourceId,
    rawName: def.aliases[0] ?? def.label,
    rawValue,
    value,
    unit: def.unit,
    conditions,
    level: def.level,
    evidence: ev
      ? {
          documentId: ev[0],
          page: ev[1],
          section: ev[2],
          snippet: ev[3],
          reliability: DOC_RELIABILITY[ev[0]] ?? 'unknown',
        }
      : undefined,
    confidence,
    status,
    dimension: def.domain,
    correctedBy: status === 'corrected' ? 'u-01' : undefined,
    correctedAt: status === 'corrected' ? '2026-10-23T16:20:00' : undefined,
    reason: status === 'corrected' ? '口径不同：原文为 DC 侧效率，按 AC-AC 口径重算' : undefined,
    conflictValues,
  };
}

export const PARAM_VALUES: ParamValue[] = [
  /* ---- p-01 我方（doc-05） ---- */
  mk('p-01', 'pv-001', 'our', 'system_rte', '系统往返效率 88.5%（AC-AC，含辅助功耗）', 88.5, 0.99, 'confirmed', { boundary: 'ac-ac', temperature: 25, loadRate: 50 }, ['doc-05', 9, '2.1 系统参数', '系统往返效率 88.5%（AC-AC，含辅助功耗，25℃，0.5C）']),
  mk('p-01', 'pv-002', 'our', 'cycle_life', '循环寿命 8500 次（DoD 90%，25℃，SoH 70%）', 8500, 0.98, 'confirmed', { dod: 90, temperature: 25, sohEnd: 70 }, ['doc-05', 10, '2.1 系统参数', '循环寿命 8500 次（DoD 90%，25℃，SoH 70%）']),
  mk('p-01', 'pv-003', 'our', 'availability', '年可用率保证 98.5%', 98.5, 0.97, 'confirmed', { period: 'year' }, ['doc-05', 12, '2.3 质保', '年可用率保证 98.5%，按时间加权统计']),
  mk('p-01', 'pv-004', 'our', 'warranty_years', '整系统质保 10 年', 10, 0.96, 'confirmed', {}, ['doc-05', 13, '2.3 质保', '整系统质保 10 年，自商业运行日起算']),
  mk('p-01', 'pv-005', 'our', 'lead_time', '交付周期 28 周（含海运）', 28, 0.95, 'confirmed', {}, ['doc-05', 15, '2.4 交付', '标准交付周期 28 周，含 5 周海运与 2 周并网']),
  mk('p-01', 'pv-006', 'our', 'rated_energy', '额定能量 5.0 MWh / 20ft', 5, 0.99, 'confirmed', {}, ['doc-05', 8, '2.1 系统参数', '额定能量 5.0 MWh，20 尺集装箱，液冷']),
  mk('p-01', 'pv-007', 'our', 'usable_energy', '可用能量 4.75 MWh（DoD 95%）', 4.75, 0.94, 'confirmed', { dod: 95, sohEnd: 70 }, ['doc-05', 8, '2.1 系统参数', '可用能量 4.75 MWh，对应 DoD 95%、SoH 70%']),
  mk('p-01', 'pv-008', 'our', 'thermal_type', '液冷（智能温控）', '液冷', 0.97, 'confirmed', {}, ['doc-05', 8, '2.1 系统参数', '液冷温控，电芯温差 ≤3℃']),
  mk('p-01', 'pv-009', 'our', 'aux_consumption', '辅助功耗 1.6%（额定工况）', 1.6, 0.88, 'pending', { loadRate: 100 }, ['doc-05', 9, '2.1 系统参数', '辅助功耗约为额定功率的 1.6%']),
  mk('p-01', 'pv-010', 'our', 'temp_range', '工作温度 -30℃ ~ +50℃', '-30 ~ +50', 0.93, 'confirmed', {}, ['doc-05', 9, '2.1 系统参数', '工作温度区间 -30℃ 至 +50℃']),
  mk('p-01', 'pv-011', 'our', 'fire_suppression', '气溶胶 + 气凝胶隔热 + NFPA 68 泄压', '气溶胶 + NFPA 68', 0.95, 'confirmed', {}, ['doc-05', 11, '2.2 安全设计', '多层安全架构：气溶胶灭火、气凝胶隔热、NFPA 68 泄压']),
  mk('p-01', 'pv-012', 'our', 'certifications', 'UL9540 / IEC62619 / EN50549 / CE', 'UL9540, IEC62619, EN50549, CE', 0.96, 'confirmed', {}, ['doc-05', 11, '2.2 安全设计', '已取得 UL9540、IEC62619、EN50549 与 CE 认证']),
  mk('p-01', 'pv-013', 'our', 'grid_code', 'EN50549-1/-2，支持 VDE-AR-N 4110', 'EN50549, VDE-AR-N 4110', 0.9, 'confirmed', {}, ['doc-05', 11, '2.2 安全设计', '并网满足 EN50549 与德国 VDE-AR-N 4110']),
  mk('p-01', 'pv-014', 'our', 'noise', '噪声 ≤65 dB(A) @1m', 65, 0.85, 'pending', {}, ['doc-05', 14, '2.1 系统参数', '噪声 ≤65 dB(A)，距设备 1 米处测量']),
  mk('p-01', 'pv-015', 'our', 'local_service', '欧洲 300+ 服务网点，4h 响应', '4 小时响应', 0.9, 'confirmed', {}, ['doc-05', 16, '2.5 服务', '欧洲区域 300+ 服务网点，故障 4 小时响应']),
  mk('p-01', 'pv-016', 'our', 'payment_terms', '预付 20% / 发货前 70% / 验收后 10%', '20/70/10', 0.8, 'pending', {}, ['doc-05', 18, '3 商务', '付款条件：预付 20%，发货前 70%，验收后 10%']),

  /* ---- p-01 竞对 A（doc-02） ---- */
  mk('p-01', 'pv-017', 'c-a', 'system_rte', 'up to 92% efficiency measured at DC terminals', 92, 0.88, 'pending', { boundary: 'dc-dc', temperature: 25, loadRate: 50 }, ['doc-02', 37, '5.1 Efficiency', 'up to 92% round trip efficiency measured at DC terminals']),
  mk('p-01', 'pv-018', 'c-a', 'rated_energy', '5.0 MWh per container', 5, 0.94, 'confirmed', {}, ['doc-02', 36, '5.0 Product', '5.0 MWh nominal energy per 20ft container']),
  mk('p-01', 'pv-019', 'c-a', 'cycle_life', 'up to 12000 cycles, conditions to be confirmed', 12000, 0.61, 'conflict', {}, ['doc-02', 38, '5.2 Cycle life', 'up to 12000 cycles, conditions to be confirmed per project'], [{ value: '12000 次（条件未给）', source: '投标文件 P.38' }, { value: '10000 次（DoD 80%）', source: '产品手册 2026-03 P.22' }]),
  mk('p-01', 'pv-020', 'c-a', 'availability', '未在应答文件中披露', null, 0.4, 'pending', {}, undefined),
  mk('p-01', 'pv-021', 'c-a', 'warranty_years', '10 years battery cells / 5 years PCS', '10/5', 0.9, 'confirmed', {}, ['doc-02', 41, '5.4 Warranty', '10 years for battery cells, 5 years for PCS']),
  mk('p-01', 'pv-022', 'c-a', 'lead_time', 'typical delivery 24 weeks excluding sea freight', 24, 0.72, 'pending', {}, ['doc-02', 44, '5.6 Delivery', 'typical delivery 24 weeks excluding sea freight']),
  mk('p-01', 'pv-023', 'c-a', 'fire_suppression', 'aerosol + NFPA 68 deflagration venting', '气溶胶 + NFPA 68', 0.86, 'confirmed', {}, ['doc-02', 47, '5.7 Safety', 'aerosol based suppression plus NFPA 68 deflagration venting']),
  mk('p-01', 'pv-024', 'c-a', 'noise', '68 dB(A) at 1 m', 68, 0.79, 'pending', {}, ['doc-02', 48, '5.7 Safety', 'noise level 68 dB(A) at 1 m distance']),
  mk('p-01', 'pv-025', 'c-a', 'pcs_efficiency', '98.2% at rated load', 98.2, 0.83, 'pending', { loadRate: 100 }, ['doc-02', 37, '5.1 Efficiency', 'PCS efficiency 98.2% at rated load']),
  mk('p-01', 'pv-026', 'c-a', 'temp_range', '-25 ~ +55 ℃', '-25 ~ +55', 0.8, 'pending', {}, ['doc-02', 42, '5.5 Environment', 'operating temperature -25 to +55 ℃']),
  mk('p-01', 'pv-027', 'c-a', 'certifications', 'UL9540, IEC62619, CE', 'UL9540, IEC62619, CE', 0.87, 'confirmed', {}, ['doc-02', 49, '5.8 Certification', 'UL9540, IEC62619 and CE certificates available']),
  mk('p-01', 'pv-028', 'c-a', 'payment_terms', '30% advance, 60% before shipment, 10% on acceptance', '30/60/10', 0.75, 'pending', {}, ['doc-02', 55, '6 Commercial', '30% advance payment, 60% before shipment']),
  mk('p-01', 'pv-029', 'c-a', 'performance_bond', '10% of contract value', 10, 0.82, 'pending', {}, ['doc-02', 56, '6 Commercial', 'performance bond of 10% of contract value']),
  mk('p-01', 'pv-030', 'c-a', 'degradation', '≤0.5%/year after first year', 0.5, 0.7, 'pending', { temperature: 25 }, ['doc-02', 39, '5.2 Cycle life', 'capacity degradation not exceeding 0.5% per year']),

  /* ---- p-01 竞对 B（doc-03） ---- */
  mk('p-01', 'pv-031', 'c-b', 'warranty_years', '12 years subject to extended warranty contract', 12, 0.68, 'conflict', {}, ['doc-03', 26, 'Warranty', '12 years subject to extended warranty contract'], [{ value: '12 年（需延保合同）', source: '产品手册 P.26' }, { value: '10 年（标准质保）', source: '产品手册 P.25' }]),
  mk('p-01', 'pv-032', 'c-b', 'system_rte', '89% AC-AC excluding auxiliary', 89, 0.83, 'pending', { boundary: 'ac-ac', temperature: 25, loadRate: 50 }, ['doc-03', 19, 'Product specification', '89% AC-AC efficiency excluding auxiliary consumption']),
  mk('p-01', 'pv-033', 'c-b', 'availability', '99% on monthly reporting basis', 99, 0.79, 'pending', { period: 'month' }, ['doc-03', 21, 'Product specification', '99% availability on a monthly reporting basis']),
  mk('p-01', 'pv-034', 'c-b', 'rated_energy', '5.0 MWh nominal', 5, 0.95, 'confirmed', {}, ['doc-03', 18, 'Product specification', '5.0 MWh nominal energy per 20ft container']),
  mk('p-01', 'pv-035', 'c-b', 'cycle_life', '8000 cycles at DoD 80%, SoH 60%', 8000, 0.66, 'pending', { dod: 80, temperature: 25, sohEnd: 60 }, ['doc-03', 20, 'Product specification', '8000 cycles at DoD 80% and SoH 60%']),
  mk('p-01', 'pv-036', 'c-b', 'aux_consumption', '1.8% of rated power', 1.8, 0.81, 'pending', { loadRate: 100 }, ['doc-03', 19, 'Product specification', 'Auxiliary consumption at nominal operation: 1.8% of rated power']),
  mk('p-01', 'pv-037', 'c-b', 'certifications', 'UL9540, IEC62619, EN50549, CE pending', 'UL9540, IEC62619, EN50549（CE 待发证）', 0.87, 'pending', {}, ['doc-03', 24, 'Certification', 'UL 9540, IEC 62619, EN 50549, CE pending for new model']),
  mk('p-01', 'pv-038', 'c-b', 'local_service', '24/7 remote monitoring, 3 years annual visits', '远程监控 + 3 年巡检', 0.84, 'confirmed', {}, ['doc-03', 21, 'Product specification', 'Annual service visit included for the first three years']),
  mk('p-01', 'pv-039', 'c-b', 'lead_time', '未披露', null, 0.35, 'pending', {}, undefined),
  mk('p-01', 'pv-040', 'c-b', 'thermal_type', 'liquid cooled', '液冷', 0.92, 'confirmed', {}, ['doc-03', 18, 'Product specification', 'liquid cooled, 4h duration configuration']),

  /* ---- p-02（10 条，精简） ---- */
  mk('p-02', 'pv-041', 'our', 'system_rte', '系统往返效率 88.5%（AC-AC）', 88.5, 0.98, 'confirmed', { boundary: 'ac-ac', temperature: 25 }, ['doc-09', 11, '2.1 系统参数', '系统往返效率 88.5%（AC-AC，含辅助功耗）']),
  mk('p-02', 'pv-042', 'c-c', 'system_rte', '88.2% AC-AC', 88.2, 0.86, 'confirmed', { boundary: 'ac-ac', temperature: 25 }, ['doc-07', 21, 'Technische Daten', 'Wirkungsgrad 88,2 % AC-AC']),
  mk('p-02', 'pv-043', 'c-d', 'availability', '98% jährlich', 98, 0.8, 'pending', { period: 'year' }, ['doc-08', 33, 'Verfügbarkeit', 'jährliche Verfügbarkeit mindestens 98 %']),
  mk('p-02', 'pv-044', 'c-c', 'lead_time', '20 Wochen', 20, 0.64, 'conflict', {}, ['doc-07', 30, 'Lieferzeit', 'Lieferzeit 20 Wochen ab Vertrag'], [{ value: '20 周', source: '手册 P.30' }, { value: '24 周（含海运）', source: '投标摘要 P.18' }]),
  mk('p-02', 'pv-045', 'c-d', 'warranty_years', '12 Jahre mit Garantievertrag', 12, 0.7, 'pending', {}, ['doc-08', 36, 'Garantie', '12 Jahre Garantie mit separatem Garantievertrag']),
  mk('p-02', 'pv-046', 'our', 'cycle_life', '8500 次（DoD 90%/25℃/SoH 70%）', 8500, 0.97, 'confirmed', { dod: 90, temperature: 25, sohEnd: 70 }, ['doc-09', 12, '2.1 系统参数', '循环寿命 8500 次（DoD 90%，25℃，SoH 70%）']),
  mk('p-02', 'pv-047', 'c-c', 'cycle_life', '9000 Zyklen', 9000, 0.65, 'pending', { dod: 90, temperature: 25 }, ['doc-07', 23, 'Technische Daten', '9000 Zyklen bei 90 % DoD']),
  mk('p-02', 'pv-048', 'c-d', 'fire_suppression', 'Novec 1230 + NFPA 69', '全氟己酮 + NFPA 69', 0.88, 'confirmed', {}, ['doc-08', 29, 'Sicherheit', 'Loeschanlage mit Novec 1230 und NFPA 69']),
  mk('p-02', 'pv-049', 'our', 'lead_time', '28 周', 28, 0.9, 'confirmed', {}, ['doc-09', 15, '2.4 交付', '交付周期 28 周']),
  mk('p-02', 'pv-050', 'c-d', 'certifications', 'IEC62619, UL9540, VDE-AR-N 4110', 'IEC62619, UL9540, VDE-AR-N 4110', 0.85, 'pending', {}, ['doc-08', 31, 'Zertifikate', 'Zertifikate IEC62619, UL9540, VDE-AR-N 4110']),

  /* ---- p-03（10 条，精简） ---- */
  mk('p-03', 'pv-051', 'our', 'rated_energy', '3.6 MWh（风冷）', 3.6, 0.92, 'pending', {}, ['doc-11', 22, 'Annex A', '3.6 MWh containerised system, air cooled']),
  mk('p-03', 'pv-052', 'c-e', 'rated_energy', '3.6 MWh', 3.6, 0.78, 'pending', {}, ['doc-12', 12, 'Specification', '3.6 MWh nominal energy per container']),
  mk('p-03', 'pv-053', 'c-e', 'system_rte', '87.5%', 87.5, 0.72, 'pending', {}, ['doc-12', 14, 'Specification', 'round trip efficiency 87.5%']),
  mk('p-03', 'pv-054', 'our', 'system_rte', '88.0%（AC-AC）', 88, 0.9, 'pending', { boundary: 'ac-ac' }, ['doc-11', 23, 'Annex A', 'AC-AC round trip efficiency 88%']),
  mk('p-03', 'pv-055', 'c-e', 'lead_time', '18 weeks', 18, 0.6, 'pending', {}, ['doc-12', 20, 'Delivery', 'delivery 18 weeks from PO']),
  mk('p-03', 'pv-056', 'our', 'lead_time', '26 周', 26, 0.88, 'pending', {}, ['doc-11', 30, 'Delivery', 'delivery within 26 weeks']),
  mk('p-03', 'pv-057', 'c-e', 'warranty_years', '8 years', 8, 0.75, 'pending', {}, ['doc-12', 24, 'Warranty', 'warranty 8 years']),
  mk('p-03', 'pv-058', 'our', 'warranty_years', '10 年', 10, 0.9, 'confirmed', {}, ['doc-11', 31, 'Warranty', 'warranty 10 years']),
  mk('p-03', 'pv-059', 'c-e', 'availability', '未披露', null, 0.3, 'pending', {}, undefined),
  mk('p-03', 'pv-060', 'our', 'availability', '98.5% 年度口径', 98.5, 0.91, 'pending', { period: 'year' }, ['doc-11', 32, 'Availability', 'annual availability 98.5%']),
];
