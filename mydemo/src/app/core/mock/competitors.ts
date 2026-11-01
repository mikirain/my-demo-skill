import { Competitor } from '../types';

export const COMPETITORS: Competitor[] = [
  {
    id: 'c-a',
    name: '竞对 A',
    tier: 1,
    regions: ['DE', 'UK', 'CZ', 'AU'],
    models: [
      { name: 'Megablock 5.0', mwh: 5, note: '液冷一体化，DC 侧效率标称高' },
      { name: 'Megablock 3.9', mwh: 3.9, note: '上一代，欧洲在运较多' },
    ],
    paramHistory: [
      { defKey: 'system_rte', label: '系统往返效率', value: '92%', unit: '%', source: '公开产品手册 2026-03', date: '2026-03-18', stale: false },
      { defKey: 'cycle_life', label: '循环寿命', value: '12000（条件待确认）', unit: '次', source: '投标文件 P.38', date: '2026-10-15', stale: false },
      { defKey: 'warranty_years', label: '质保年限', value: '10 年电芯 + 5 年 PCS', unit: '年', source: '投标文件 P.41', date: '2026-10-15', stale: false },
      { defKey: 'lead_time', label: '交付周期', value: '24 周（不含海运）', unit: '周', source: '投标文件 P.44', date: '2026-10-15', stale: false },
    ],
    projects: [
      { name: '保加利亚 BESS 一期', result: 'win', year: 2025 },
      { name: '捷克 Chvaletice 项目', result: 'unknown', year: 2025 },
      { name: '德国勃兰登堡储能', result: 'lose', year: 2024 },
    ],
  },
  {
    id: 'c-b',
    name: '竞对 B',
    tier: 1,
    regions: ['UK', 'DE', 'IT'],
    models: [{ name: 'PowerStack 5000', mwh: 5, note: 'AC-AC 效率标称稳健，服务网络强' }],
    paramHistory: [
      { defKey: 'system_rte', label: '系统往返效率', value: '89%（AC-AC，不含辅助）', unit: '%', source: '产品手册 P.19', date: '2026-06-02', stale: false },
      { defKey: 'availability', label: '可用率保证', value: '99%（月度口径）', unit: '%', source: '产品手册 P.21', date: '2026-06-02', stale: false },
      { defKey: 'certifications', label: '认证清单', value: 'UL9540 / IEC62619 / EN50549，部分待发证', unit: '—', source: '产品手册 P.24', date: '2026-06-02', stale: false },
      { defKey: 'system_rte', label: '系统往返效率', value: '87%（AC-AC，不含辅助）', unit: '%', source: '2024 年旧版手册', date: '2024-05-11', stale: true },
    ],
    projects: [
      { name: '英国 1.2GW 框架', result: 'win', year: 2025 },
      { name: '意大利撒丁岛独立储能', result: 'win', year: 2025 },
    ],
  },
  {
    id: 'c-c',
    name: '竞对 C',
    tier: 2,
    regions: ['DE', 'PL'],
    models: [{ name: 'GridVault 4.2', mwh: 4.2, note: '价格激进，交付周期短' }],
    paramHistory: [
      { defKey: 'system_rte', label: '系统往返效率', value: '88.2%（AC-AC）', unit: '%', source: '德文手册 2026-04', date: '2026-04-09', stale: false },
      { defKey: 'lead_time', label: '交付周期', value: '20 周', unit: '周', source: '德文手册 2026-04', date: '2026-04-09', stale: false },
      { defKey: 'cycle_life', label: '循环寿命', value: '9000 次（DoD 90%/25℃）', unit: '次', source: '德文手册 2026-04', date: '2026-04-09', stale: false },
    ],
    projects: [{ name: '波兰 50MWh 项目', result: 'lose', year: 2025 }],
  },
  {
    id: 'c-d',
    name: '竞对 D',
    tier: 2,
    regions: ['DE', 'CZ', 'IT'],
    models: [{ name: 'TerraStore 5.2', mwh: 5.2, note: '安全认证齐全，商务条款严格' }],
    paramHistory: [
      { defKey: 'fire_suppression', label: '消防方案', value: '全氟己酮 + NFPA 69 防爆', unit: '—', source: '投标摘要 P.29', date: '2026-10-10', stale: false },
      { defKey: 'availability', label: '可用率保证', value: '98%（年度口径）', unit: '%', source: '投标摘要 P.33', date: '2026-10-10', stale: false },
      { defKey: 'warranty_years', label: '质保年限', value: '12 年（需延保合同）', unit: '年', source: '投标摘要 P.36', date: '2026-10-10', stale: false },
    ],
    projects: [{ name: '德国下萨克森 80MWh', result: 'win', year: 2024 }],
  },
  {
    id: 'c-e',
    name: '竞对 E',
    tier: 2,
    regions: ['UK', 'AU'],
    models: [{ name: 'UrbanStore 3.6', mwh: 3.6, note: '中小型项目为主，价格优势明显' }],
    paramHistory: [
      { defKey: 'system_rte', label: '系统往返效率', value: '87.5%', unit: '%', source: '产品手册 2025-11', date: '2025-11-20', stale: true },
      { defKey: 'rated_energy', label: '额定能量', value: '3.6 MWh', unit: 'MWh', source: '产品手册 2025-11', date: '2025-11-20', stale: true },
    ],
    projects: [{ name: '英国 60MWh 配储（本次）', result: 'unknown', year: 2026 }],
  },
  {
    id: 'c-f',
    name: '竞对 F（中国同侪）',
    tier: 3,
    regions: ['CZ', 'PL', 'IT'],
    models: [{ name: '未获取型号', mwh: 0, note: '仅获取现场铭牌照片，信息不完整' }],
    paramHistory: [
      { defKey: 'rated_energy', label: '额定能量', value: '未识别', unit: '—', source: '铭牌照片（解析失败）', date: '2026-10-23', stale: false },
    ],
    projects: [{ name: '东南欧 3 个在建项目', result: 'unknown', year: 2025 }],
  },
];
