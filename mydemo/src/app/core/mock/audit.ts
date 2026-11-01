import { AuditAction, AuditEvent } from '../types';

type Row = [minutesAgo: number, actor: string, action: AuditAction, target: string, detail?: string, denied?: boolean];

const ROWS: Row[] = [
  [42, '李维', 'login', '登录系统', 'IP 10.20.31.17'],
  [38, '李维', 'correct', 'pv-017 系统往返效率', '原文为 DC 侧效率，按 AC-AC 口径重算'],
  [35, '李维', 'confirm', 'pv-002 循环寿命', '确认条件 DoD90/25℃/SoH70'],
  [30, '王琛', 'login', '登录系统', 'IP 10.20.31.9'],
  [28, '王琛', 'approve', 'task-08 结论审核', '通过'],
  [25, '周敏', 'export', 'DE-Lahn 一页简报 v2.0', '脱敏模式'],
  [22, '李维', 'conflict', 'pv-019 循环寿命', '发现两个来源值不一致'],
  [20, '陈立', 'login', '登录系统', 'IP 10.20.31.44'],
  [18, '陈立', 'confirm', 'risk-03 承诺条件', '要求写入合同附件'],
  [15, '孙黎', 'config', '阈值配置', '抽检比例 10% → 15%'],
  [13, '孙黎', 'config', '参数字典 system_rte v3', '新增别名 System Efficiency'],
  [11, '李维', 'upload', 'doc-13 竞对E_技术应答_扫描件.pdf', '来源未知'],
  [9, '李维', 'parse', 'doc-13', '解析失败：OCR 置信度不足'],
  [8, '吴桐', 'login', '登录系统', 'IP 10.20.32.5'],
  [7, '吴桐', 'confirm', 'pv-044 交付周期', '待复核'],
  [6, '王琛', 'export', 'CZ-Morava 技术对比报告 v1.1', '含证据索引'],
  [5, '赵晗', 'login', '登录系统', 'IP 10.20.33.2'],
  [4, '赵晗', 'export', '管理层一页简报', '只读查看'],
  [3, '李维', 'extract', 'doc-03', '抽取 14 个字段'],
  [2, '王琛', 'approve', 'task-02 强制条款', '待处理'],
  [1, '孙黎', 'config', '角色权限矩阵', '法务：导出报告 → 禁止'],
  [60, '郑一', 'login', '登录系统', 'IP 10.20.34.11'],
  [95, '郑一', 'export', '商业条款对比', '仅商务维度'],
  [130, '李维', 'upload', 'doc-12 竞对E_UrbanStore_产品手册.pdf', '公开渠道'],
  [180, '王琛', 'confirm', 'cmp-004 质保年限', '要求竞对澄清 PCS 覆盖'],
  [240, '孙黎', 'config', '项目成员：p-03', '新增管理员'],
  [300, '吴桐', 'correct', 'pv-047 循环寿命', '补充 SoH 条件'],
  [360, '陈立', 'approve', 'risk-02 质保偏离', '处置方案已确认'],
  [420, '李维', 'export', '参数矩阵 CSV', '导出 60 行'],
  [480, '郑一', 'export', '报价敏感字段', '权限不足，已拒绝', true],
];

function pad(n: number): string {
  return String(n).padStart(3, '0');
}

function iso(minutesAgo: number): string {
  const base = new Date('2026-10-24T09:00:00').getTime();
  return new Date(base - minutesAgo * 60000).toISOString().slice(0, 16);
}

export const AUDIT_EVENTS: AuditEvent[] = ROWS.map(([minutesAgo, actor, action, target, detail, denied], i) => ({
  id: 'aud-' + pad(i + 1),
  at: iso(minutesAgo),
  actor,
  action,
  target,
  result: denied ? 'denied' : 'ok',
  ip: '10.20.3' + ((i % 5) + 1) + '.' + (10 + (i % 40)),
  detail,
}));
