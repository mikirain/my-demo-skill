import { Permission, PermissionMatrix, Role, User } from '../types';

export const USERS: User[] = [
  { id: 'u-01', name: '李维', role: 'engineer', initials: '李', lastLogin: '2026-10-24T08:41:00' },
  { id: 'u-02', name: '王琛', role: 'bidManager', initials: '王', lastLogin: '2026-10-24T08:05:00' },
  { id: 'u-03', name: '周敏', role: 'commercial', initials: '周', lastLogin: '2026-10-23T17:22:00' },
  { id: 'u-04', name: '陈立', role: 'legal', initials: '陈', lastLogin: '2026-10-23T15:10:00' },
  { id: 'u-05', name: '赵晗', role: 'exec', initials: '赵', lastLogin: '2026-10-22T09:30:00' },
  { id: 'u-06', name: '孙黎', role: 'admin', initials: '孙', lastLogin: '2026-10-24T07:58:00' },
  { id: 'u-07', name: '吴桐', role: 'engineer', initials: '吴', lastLogin: '2026-10-23T19:02:00' },
  { id: 'u-08', name: '郑一', role: 'commercial', initials: '郑', lastLogin: '2026-10-20T11:47:00' },
];

export const CURRENT_USER_ID = 'u-01';

export const PERMISSION_ACTIONS: { key: string; label: string }[] = [
  { key: 'viewDoc', label: '查看文档与原文' },
  { key: 'uploadDoc', label: '上传/删除文档' },
  { key: 'editParam', label: '确认/修改参数' },
  { key: 'generate', label: '发起分析与研判' },
  { key: 'reviewHigh', label: '审核高风险结论' },
  { key: 'publish', label: '发布结论/导出报告' },
  { key: 'viewPrice', label: '查看报价敏感字段' },
  { key: 'configDict', label: '配置字典/权重/阈值' },
  { key: 'viewAudit', label: '查看审计日志' },
  { key: 'manageMember', label: '管理项目成员' },
];

const allow = (keys: string[]): Record<string, Permission> =>
  Object.fromEntries(keys.map((k) => [k, 'allow' as Permission]));

const readOnly = (keys: string[]): Record<string, Permission> =>
  Object.fromEntries(keys.map((k) => [k, 'read' as Permission]));

export const DEFAULT_PERMISSIONS: PermissionMatrix = {
  engineer: {
    ...allow(['viewDoc', 'uploadDoc', 'editParam', 'generate', 'reviewHigh']),
    ...Object.fromEntries(
      ['publish', 'viewPrice', 'configDict', 'viewAudit', 'manageMember'].map((k) => [k, 'deny' as Permission]),
    ),
  },
  bidManager: allow(PERMISSION_ACTIONS.map((a) => a.key)),
  commercial: {
    ...readOnly(['viewDoc', 'generate']),
    ...Object.fromEntries(
      ['uploadDoc', 'editParam', 'reviewHigh', 'publish', 'viewPrice', 'configDict', 'viewAudit', 'manageMember'].map(
        (k) => [k, k === 'viewPrice' ? ('allow' as Permission) : ('deny' as Permission)],
      ),
    ),
  },
  legal: {
    ...readOnly(['viewDoc', 'generate', 'reviewHigh']),
    ...Object.fromEntries(
      ['uploadDoc', 'editParam', 'publish', 'viewPrice', 'configDict', 'viewAudit', 'manageMember'].map((k) => [
        k,
        'deny' as Permission,
      ]),
    ),
  },
  exec: {
    ...readOnly(['viewDoc', 'generate', 'reviewHigh']),
    ...Object.fromEntries(
      ['uploadDoc', 'editParam', 'configDict', 'manageMember'].map((k) => [k, 'deny' as Permission]),
    ),
    publish: 'allow',
    viewPrice: 'allow',
    viewAudit: 'read',
  },
  admin: {
    ...readOnly(['viewDoc', 'editParam', 'generate', 'reviewHigh', 'publish']),
    ...allow(['configDict', 'viewAudit', 'manageMember']),
    uploadDoc: 'allow',
    viewPrice: 'read',
  },
};

export const ROLE_ORDER: Role[] = ['engineer', 'bidManager', 'commercial', 'legal', 'exec', 'admin'];
