import { Project } from '../types';

const GATE_TEMPLATE = [
  { key: 'intake', label: '摄取' },
  { key: 'extraction', label: '抽取' },
  { key: 'standardization', label: '校验' },
  { key: 'comparison', label: '对比' },
  { key: 'insight', label: '研判' },
] as const;

function gates(
  doneCount: number,
  blocked?: { index: number; note: string },
): Project['gates'] {
  return GATE_TEMPLATE.map((g, i) => {
    if (blocked && blocked.index === i) {
      return { key: g.key, label: g.label, state: 'blocked' as const, note: blocked.note };
    }
    if (i < doneCount) return { key: g.key, label: g.label, state: 'done' as const };
    if (i === doneCount) return { key: g.key, label: g.label, state: 'active' as const };
    return { key: g.key, label: g.label, state: 'todo' as const };
  });
}

export const PROJECTS: Project[] = [
  {
    id: 'p-01',
    name: 'CZ-Morava 100MWh 独立储能',
    customer: 'Morava Grid a.s.（虚构）',
    country: 'CZ',
    mw: 25,
    mwh: 100,
    route: 'LFP 液冷',
    deadline: '2026-11-08',
    stage: 'comparison',
    customerType: '电网公司',
    contractMode: 'EPC 总承包',
    completeness: 87,
    gates: gates(3),
    members: [
      { userId: 'u-01', role: 'engineer', lastActive: '2026-10-24T08:41:00' },
      { userId: 'u-02', role: 'bidManager', lastActive: '2026-10-24T08:05:00' },
      { userId: 'u-03', role: 'commercial', lastActive: '2026-10-23T17:22:00' },
      { userId: 'u-04', role: 'legal', lastActive: '2026-10-23T15:10:00' },
    ],
  },
  {
    id: 'p-02',
    name: 'DE-Lahn 200MWh 电网侧储能',
    customer: 'Stadtwerk Lahn（虚构）',
    country: 'DE',
    mw: 50,
    mwh: 200,
    route: 'LFP 液冷',
    deadline: '2026-11-25',
    stage: 'insight',
    customerType: '市政公用事业',
    contractMode: 'EPC 总承包',
    completeness: 96,
    gates: gates(4),
    members: [
      { userId: 'u-02', role: 'bidManager', lastActive: '2026-10-24T09:12:00' },
      { userId: 'u-07', role: 'engineer', lastActive: '2026-10-23T19:02:00' },
      { userId: 'u-08', role: 'commercial', lastActive: '2026-10-20T11:47:00' },
    ],
  },
  {
    id: 'p-03',
    name: 'UK-Northgate 60MWh 配储项目',
    customer: 'Northgate Energy Ltd.（虚构）',
    country: 'UK',
    mw: 15,
    mwh: 60,
    route: 'LFP 风冷',
    deadline: '2026-10-30',
    stage: 'extraction',
    customerType: '独立发电商',
    contractMode: '设备供货 + 调试',
    completeness: 42,
    gates: gates(1, { index: 2, note: '3 份竞对资料晚于计划到达，标准化未启动' }),
    members: [
      { userId: 'u-01', role: 'engineer', lastActive: '2026-10-24T08:20:00' },
      { userId: 'u-02', role: 'bidManager', lastActive: '2026-10-23T21:04:00' },
      { userId: 'u-06', role: 'admin', lastActive: '2026-10-24T07:58:00' },
    ],
  },
];

export const ACTIVE_PROJECT_ID = 'p-01';
