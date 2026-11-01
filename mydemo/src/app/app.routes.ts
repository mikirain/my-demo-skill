import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', pathMatch: 'full', redirectTo: 'dashboard' },
  {
    path: 'dashboard',
    title: '工作台 · BidScope',
    loadComponent: () => import('./features/dashboard/dashboard').then((m) => m.Dashboard),
  },
  {
    path: 'projects',
    title: '项目列表 · BidScope',
    loadComponent: () => import('./features/projects/projects').then((m) => m.Projects),
  },
  {
    path: 'projects/:id/overview',
    title: '项目概览 · BidScope',
    loadComponent: () => import('./features/overview/overview').then((m) => m.Overview),
  },
  {
    path: 'projects/:id/documents',
    title: '资料管理 · BidScope',
    loadComponent: () => import('./features/documents/documents').then((m) => m.Documents),
  },
  {
    path: 'projects/:id/documents/:docId',
    title: '原文查看 · BidScope',
    loadComponent: () => import('./features/document-view/document-view').then((m) => m.DocumentView),
  },
  {
    path: 'projects/:id/parameters',
    title: '参数矩阵 · BidScope',
    loadComponent: () => import('./features/parameters/parameters').then((m) => m.Parameters),
  },
  {
    path: 'projects/:id/comparison',
    title: '对比分析 · BidScope',
    loadComponent: () => import('./features/comparison/comparison').then((m) => m.Comparison),
  },
  {
    path: 'projects/:id/insights',
    title: '研判与风险 · BidScope',
    loadComponent: () => import('./features/insights/insights').then((m) => m.Insights),
  },
  {
    path: 'projects/:id/reviews',
    title: '审核待办 · BidScope',
    loadComponent: () => import('./features/reviews/reviews').then((m) => m.Reviews),
  },
  {
    path: 'projects/:id/reports',
    title: '报告中心 · BidScope',
    loadComponent: () => import('./features/reports/reports').then((m) => m.Reports),
  },
  {
    path: 'library',
    title: '竞品情报库 · BidScope',
    loadComponent: () => import('./features/library/library').then((m) => m.Library),
  },
  {
    path: 'retro',
    title: '中标复盘 · BidScope',
    loadComponent: () => import('./features/retro/retro').then((m) => m.Retro),
  },
  {
    path: 'retro/:retroId',
    title: '中标复盘 · BidScope',
    loadComponent: () => import('./features/retro/retro').then((m) => m.Retro),
  },
  {
    path: 'experience',
    title: '经验库 · BidScope',
    loadComponent: () => import('./features/experience/experience').then((m) => m.ExperienceLibrary),
  },
  {
    path: 'match',
    title: '相似项目匹配 · BidScope',
    loadComponent: () => import('./features/match/match').then((m) => m.Match),
  },
  {
    path: 'admin',
    title: '系统管理 · BidScope',
    loadComponent: () => import('./features/admin/admin').then((m) => m.Admin),
  },
  {
    path: 'assistant',
    title: 'AI 助手 · BidScope',
    loadComponent: () => import('./features/assistant/assistant').then((m) => m.Assistant),
  },
  {
    path: '**',
    title: '页面未找到 · BidScope',
    loadComponent: () => import('./features/not-found/not-found').then((m) => m.NotFound),
  },
];
