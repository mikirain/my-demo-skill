# BidScope 前端 Demo 实现说明与自测记录

> 上游：总 PRD v1.0、拆解 01/02/03｜本文说明 Demo 的工程结构、设计系统落地方式、数据层接口、自测结果与已知限制。

| 项目 | 内容 |
| --- | --- |
| 目录 | `mydemo/`（Angular 22，standalone + signals） |
| 启动 | `cd mydemo && npm install && npm start` → http://localhost:4200 |
| 构建 | `npm run build` → `mydemo/dist/mydemo` |
| 数据 | 纯前端 Mock，无后端、无网络请求；页脚常驻「演示数据 · 非真实企业信息」 |
| 自测 | Chrome DevTools MCP 逐页实测（见第 6 节） |

## 1. 技术栈

| 项 | 选择 | 说明 |
| --- | --- | --- |
| 框架 | Angular 22.2 | standalone component，无 NgModule |
| 状态 | Angular signals + computed | `WorkspaceStore` 单例，派生状态全部为 computed |
| 路由 | `provideRouter` + `withHashLocation` | hash 路由保证任意页面可直接深链接、刷新不 404 |
| 表单 | FormsModule（ngModel） | 仅用于表单与筛选器，页面级校验手写 |
| 样式 | 原生 CSS + 设计 token | 无 Tailwind/UI 库，避免额外依赖 |
| 图标 | 内联 SVG（`ui-icon`，28 个 path） | **全站零 emoji** |
| 图表 | 自绘 SVG / CSS（`ui-bars`、`ui-heat`、`ui-ring`） | 不引入图表库 |

## 2. 目录结构

```
mydemo/src/app/
├── app.ts / app.config.ts / app.routes.ts   根组件、路由配置（12 条路由 + 404）
├── core/
│   ├── types.ts          领域模型（Project/Document/ParamValue/ComparisonRow/…）
│   ├── format.ts         标签映射、状态元数据、日期与倒计时、条件文本
│   ├── store.ts          WorkspaceStore：信号 + 派生 + 命令
│   ├── download.ts       CSV / 文本导出
│   └── mock/             projects/documents/competitors/params/comparison/insights/reviews/audit/users
├── shared/ui/            13 个通用组件（见第 4 节）
├── layout/shell.ts       侧栏 + 顶栏 + 面包屑 + Toast 宿主
└── features/             11 个页面，全部路由级懒加载
    ├── dashboard/  projects/  overview/  documents/  document-view/
    ├── parameters/ comparison/ insights/ reviews/   reports/
    └── library/    admin/     not-found/
```

## 3. 路由与页面

| 路由 | 页面 | 关键交互 | 状态 |
| --- | --- | --- | --- |
| `/dashboard` | 工作台 | KPI、待办、项目卡、风险分级、新建项目校验弹窗 | 完成 |
| `/projects` | 项目列表 | 卡片/表格切换、排序、筛选、新建校验 | 完成 |
| `/projects/:id/overview` | 项目概览 | 五阶段门禁、完整性环、判定分布、风险摘要、发布阻断条 | 完成 |
| `/projects/:id/documents` | 资料管理 | 状态筛选、上传抽屉、重试模拟、解析异常处理 | 完成 |
| `/projects/:id/documents/:docId` | 原文查看 | 页码定位、锚点↔正文双向高亮、上一处/下一处、修正建议 | 完成 |
| `/projects/:id/parameters` | 参数矩阵 | 置信度路由 chip、行内修正（理由必填）、冲突裁决、批量确认、CSV | 完成 |
| `/projects/:id/comparison` | 对比分析 | 三向矩阵、行展开规则命中、四要素可比性、权重校验、热力图、CSV | 完成 |
| `/projects/:id/insights` | 研判与风险 | 三段式结论采纳/驳回、风险分组、待澄清复制、决策留白 | 完成 |
| `/projects/:id/reviews` | 审核待办 | 任务列表 + diff 审核、理由必填、双人规则拦截、指派 | 完成 |
| `/projects/:id/reports` | 报告中心 | 5 模板预览、发布门禁、CSV/文本导出、快照 | 完成 |
| `/library` | 竞品情报库 | 竞对档案、参数时间线（过时标记）、检索高亮 | 完成（只读演示） |
| `/admin` | 系统管理 | 权限矩阵循环切换、字典增改、阈值校验、审计筛选与导出 | 完成 |
| `/**` | 404 | 返回入口 | 完成 |

## 4. 设计系统落地

| 维度 | 实现 |
| --- | --- |
| 风格 | Minimalism / Swiss：单色骨架 + 单一强调色 `#1f4ed8`，1px 边框分层，圆角 0，无阴影（仅弹层） |
| 色彩 | `--bg/--ink/--line` 灰阶 + `--ok/--warn/--danger` 语义色 + `--accent`；状态一律「色 + 图标 + 文字」三重编码 |
| 排版 | 系统无衬线字体；数字与 key 使用等宽 + `tabular-nums`；字号 12/13/14/16/20/24/28 |
| 间距 | 4/8/12/16/24/32/48 八档 |
| 组件 | `ui-icon / ui-btn / ui-badge / ui-stat / ui-progress / ui-ring / ui-bars / ui-heat / ui-modal / ui-drawer / ui-tabs / ui-empty / ui-confirm / ui-toast-host` |
| 无障碍 | 可见 focus ring、`aria-current`/`aria-selected`/`role=dialog`、表格 `aria-sort`、`aria-live` Toast、`prefers-reduced-motion` 全局降级 |
| 响应式 | 1440 / 1024 / 768 / 375 四档；<1024 侧栏转抽屉；表格在容器内横向滚动，页面本身不溢出 |

## 5. 数据层

- `WorkspaceStore` 暴露只读信号：`projects / activeProject / documents / paramValues / comparisonRows / visibleInsights / risks / clarifications / reviewTasks / auditEvents / thresholds / weights`；
- 派生：`paramStats`、`judgeStats`、`mandatoryRiskCount`、`dimensionScores`、`publicationBlocked(+reasons)`、`insightReady`、`globalKpis`；
- 命令：`correctParam / confirmParam / bulkConfirm / resolveConflict / adoptInsight / rejectInsight / approveTask / rejectTask / assignTask / setWeights / updateThresholds / setDocStatus / addDocument / pushAudit`；
- 所有命令均写审计（`pushAudit`），界面上的「待审/冲突/已确认」计数随之联动；
- Mock 规模：3 项目 / 14 文档 / 6 竞对 / 48 参数定义 / 60 参数实例 / 42 对比行 / 12 结论（2 条无证据用于演示拦截）/ 8 风险 / 6 澄清 / 9 审核任务 / 5 报告模板 / 30 审计事件 / 8 用户。

## 6. 自测记录（Chrome DevTools MCP）

### 6.1 逐页渲染（1440×900）

| 页面 | 标题 | 卡片 | 表格行 | 徽标 | 页面横向溢出 |
| --- | --- | --- | --- | --- | --- |
| 工作台 | 投标工作台 | 7 | 0 | 32 | 0 |
| 项目列表 | 项目列表 | 3 | 0 | 20 | 0 |
| 项目概览 | CZ-Morava 100MWh 独立储能 | 6 | 0 | 16 | 0 |
| 资料管理 | 资料管理 | 0 | 5 | 28 | 0 |
| 原文查看 | CZ-Morava_RFP_技术规范书.pdf | 1 | 0 | 6 | 0 |
| 参数矩阵 | 参数矩阵 | 0 | 20 | 42 | 0 |
| 对比分析 | 对比分析 | 1 | 20 | 56 | 0 |
| 研判与风险 | 研判与风险 | 10 | 0 | 36 | 0 |
| 审核待办 | 审核待办 | 2 | 0 | 26 | 0 |
| 报告中心 | 报告中心 | 1 | 7 | 14 | 0 |
| 竞品情报库 | 竞品情报库 | 5 | 5 | 26 | 0 |
| 系统管理 | 系统管理 | 0 | 18 | 36 | 0 |
| 404 | 页面不存在 | 0 | 0 | 2 | 0 |

**控制台**：全部路由遍历 + 交互操作后，error/warn 均为 0。

### 6.2 交互用例

| 用例 | 预期 | 实测结果 |
| --- | --- | --- |
| 参数冲突裁决 | 弹窗并列取值、说明必填、裁决后计数下降 | 通过：2 个取值可选；空说明报「请填写裁决说明（至少 4 个字）」；裁决后 `冲突 2 → 1` 且 Toast「冲突已裁决」 |
| 参数修正 | 理由必填、保存后状态转「已修正」并写审计 | 通过：弹窗、理由下拉、保存回调正常 |
| 弹窗可达性 | Esc 关闭、焦点回填 | 通过：Esc 关闭弹窗 |
| 对比行展开 | 展示规则命中与四要素可比性 | 通过：展开出现详情区，含「边界」判定说明 |
| 对比禁止排名 | 顶部提示不提供总排名 | 通过：BR-04 提示常驻 |
| 权重默认提示 | 默认权重时显著告警 | 通过：黄色提示条「当前为默认权重，需按评标规则确认」 |
| 审核双人规则 | 高风险自审禁用采纳/驳回 | 通过：banner + 采纳/驳回 `disabled`，提供「指派第二审核人」 |
| Diff 审核 | 变更行高亮、理由快捷项 | 通过：5 行差异，变更行背景与建议值高亮 |
| 研判 Tab | 三 Tab 切换、拦截条数可见 | 通过：结论 8 / 风险 6 / 澄清 5，显示「被拦截」说明 |
| 决策留白 | 报价与承诺由人填写 | 通过：两个输入框 + 说明，系统不生成数值 |
| 全局导航 | 仅项目路由显示项目二级导航与项目面包屑 | **修复后通过**（见 7.1） |
| CSV 导出 | 遵循当前筛选、写审计 | 通过：生成文件并 Toast 行数 |

### 6.3 响应式（375×812，移动端模拟）

12 条路由逐页测量：`document.scrollWidth - clientWidth = 0`，无页面级横向滚动；数据表在 `.table-wrap` 内部滚动（预期行为）；侧栏折叠为抽屉，汉堡按钮出现。

### 6.4 构建

```
ng build → 首屏 369 kB（估算传输 98 kB），13 个路由级懒加载 chunk
```
无编译错误、无 budget 警告。

## 7. 测试中发现并修复的缺陷

| # | 缺陷 | 影响 | 修复 |
| --- | --- | --- | --- |
| 7.1 | 非项目页（`/admin`、`/library`）仍显示项目二级导航与项目面包屑 | 面包屑出现「工作台 › 项目 › 系统管理」的错误层级 | shell 增加 `inProject` 判定，仅在 `/projects/:id/*` 渲染项目导航与项目面包屑 |
| 7.2 | `ui-modal` 的 footer 需显式 `[hasFooter]`，多数调用未传导致确认按钮不渲染 | 弹窗无操作按钮，流程断死 | footer 改为默认渲染 + `:empty` 时隐藏，`hasFooter` 默认 true |
| 7.3 | `core/mock/comparison.ts` 的 `cmp()` 参数未给默认值 | `ng build` 类型报错（36 处 TS2554） | 参数改为 `p: Partial<ComparableCheck> = {}` |

## 8. 已知限制（Demo 边界）

1. **无真实解析与模型调用**：文档解析、抽取、研判生成为界面演示；上传与重试用定时器模拟，新文档停留「解析中」。
2. **无后端持久化**：刷新页面即恢复初始 Mock；页面内已做的裁决/确认/审核在本次会话内生效并联动计数。
3. **导出为前端生成**：CSV/文本由浏览器 Blob 生成，非服务端报告服务。
4. **热力图不展示「不可比」空白格**：`dimensionScores` 仅对可计分单元求均值，当前数据下每个维度都有得分；若需演示空白格，应改为「该维度存在不可比项即置空并标注」。
5. **原文查看仅覆盖 3 份文档的摘录页**（`DOC_PAGES`），其余文档给出「扫描件/未解析」的说明性空态。
6. **不实现多用户实时协同**、不做真实权限校验（权限矩阵为可交互演示）。

## 9. 后续开发建议

| 优先级 | 事项 |
| --- | --- |
| P0 | 接入文档解析与抽取服务，`ParamValue` 直接映射后端返回；把 store 的命令层替换为 HTTP 调用（接口签名已按 store 设计，替换成本低） |
| P0 | 报告导出改由服务端渲染，前端只传快照 ID |
| P1 | 热力图支持「不可比」空格与维度权重联动排序 |
| P1 | 原文查看器接入 PDF.js 渲染真实页面，锚点用 bbox 定位 |
| P2 | 权限矩阵接入真实 RBAC，前端按权限禁用而非仅提示 |
| P2 | 增加虚拟滚动以支撑 1000+ 行参数矩阵 |

## 10. v1.1 增量（中标经验复盘与知识复用）

对应 `修改优化建议.md` 的第 2/3/4/5 优先级，新增 3 个页面 + 1 套知识资产数据层。

### 10.1 新增内容

| 类型 | 内容 |
| --- | --- |
| 页面 | `/retro` 中标复盘（4 Tab：经验三栏 / 评分因素 / 方案与商务 / 履约验证） |
| 页面 | `/experience` 经验库（四类资产、12 必填字段、A/B/C 分级、入库审核、引用记录） |
| 页面 | `/match` 相似项目匹配（命中条件 vs 差异条件、可借鉴 A/B 与待验证 C 分区、引用留痕） |
| 数据 | `AwardedProject`(4) / `WinFactor`(15) / `Experience`(12) / `FulfilmentRecord`(10) / `ExperienceCitation`（运行时） |
| store | `awardedProjects`、`experienceStats`、`experiencesFor`、`fulfilmentsFor`、`matchResults`（五维加权）、`verifyExperience`、`deprecateExperience`、`citeExperience`、`verifyFulfilment` |
| 导航 | 侧栏新增「知识复用」分组（中标复盘 / 经验库 / 相似项目匹配 / 竞品情报库），系统管理下沉到底部 |

### 10.2 关键规则落地

| 规则 | 实现 |
| --- | --- |
| BR-11 无来源不入库 | 经验缺任一必填字段时「入库」禁用，抽屉内列出缺失字段 |
| BR-12 C 级不得作结论 | 匹配页把 C 级单列「待验证假设」区（虚线边框）；引用时二次确认 |
| BR-13 无评分表最高 B 级 | 复盘页对 `hasScoreSheet=false` 的项目显示告警，并将 A 级因素降级展示为 B（只读，不改数据） |
| BR-14 履约未达成 → 经验降级 | 履约 Tab 的「按 BR-14 触发经验降级」→ `verifyFulfilment()` 将同项目 A→B / B→C 并退回待复核 |
| BR-15 引用留痕 | `citeExperience()` 写入审计 + 引用记录面板（谁、何时、哪条） |

### 10.3 回归自测（Chrome DevTools MCP）

| 用例 | 结果 |
| --- | --- |
| 16 条路由逐页渲染 | 全部正常，标题/表格/卡片就位，页面横向溢出 0 |
| 控制台 | 新旧页面交互后 error/warn 均为 0 |
| 引用经验 | 匹配页点「引用」→ Toast「已引用到当前项目」，标题栏计数 0→1 |
| 经验详情抽屉 | 13 个字段全部渲染，Esc 可关闭 |
| 入库审核 | 行内「入库」→ Toast「经验已入库」，已核验 10→11、待复核 2→1 |
| BR-14 履约降级 | UK 项目「未达成」履约触发降级：A 6→5、B 4→5、已核验 11→10、经验总数保持 12（验证降级不会丢失其他项目数据） |
| 构建 | `ng build` 通过，首屏 394 kB，新增 3 个懒加载 chunk，无预算告警 |

### 10.4 本轮修复的缺陷

| 缺陷 | 影响 | 修复 |
| --- | --- | --- |
| `store.verifyFulfilment` 降级用 `filter().map()` 重建列表 | 触发一次降级会**删除其他项目的全部经验** | 改为 `map()` + 条件判断，仅降级目标项目条目 |
| 履约核验一律置为 `met` | `partial` 记录被错误标成已达成 | 仅 `pending → met`，其余保留原状态并记录核验备注 |
| 非项目页面包屑缺少新页面标签 | `/retro`、`/experience`、`/match` 只显示「工作台」 | 抽出 `globalLabel()` 统一映射路由→标签 |
| 经验库「来源项目」列逐字换行 | 行高被撑到 5 行 | 单元格加 `truncate` + `title` 悬停查看全名 |

### 10.5 v1.1 仍属演示的边界

1. 相似度算法为五维加权规则，非语义向量匹配；接入真实数据后可替换为「规则 + 向量召回」；
2. 履约数据为人工录入演示，未对接项目交付系统；
3. 等级变更审批在单机内完成（无真实账号体系），审批人＝当前登录人。

### 10.6 增补：证据等级变更审批（v1.1.1）

原 10.5 第 1 条「等级不可编辑」已按确认补做，边界变为「可申请+可审批」，实现如下。

| 项 | 内容 |
| --- | --- |
| 数据 | `LevelChange`（from/to/reason/evidenceSources/requestedBy/state/reviewedBy/reviewNote），种子 3 条（2 待审 + 1 已通过） |
| store | `levelChanges`、`pendingLevelChangeCount`、`levelChangesFor`、`pendingLevelChangeFor`、`requestLevelChange`、`approveLevelChange`、`rejectLevelChange` |
| 页面 | 经验库详情抽屉「证据等级变更」区块（申请 / 待审批卡片 / 变更历史）+ 申请弹窗 + 驳回弹窗 + 列表「等级待审」徽标 |
| 规则 | LR-01 升级须新增证据；LR-02 A 级须有评分表（BR-13）；LR-03 理由 ≥6 字；LR-04 双人规则；LR-05 单条经验只允许一个待审变更；LR-06 通过后证据合并并置已核验 |

**自测记录（Chrome DevTools MCP）**

| 用例 | 结果 |
| --- | --- |
| 待审徽标 | 列表出现 2 个「等级待审」，与种子数据一致 |
| 他人发起的变更审批 | exp-03（C→B，吴桐发起）→ 点「通过」→ 等级变 B、出现「已通过」历史、Toast「等级变更已通过」 |
| 本人发起自审 | exp-07（李维发起）→「通过」禁用 + 提示「需由他人审批（BR-08）」 |
| 驳回流程 | 填理由驳回 → Toast「等级变更已驳回」，历史出现「已驳回」，等级不变 |
| BR-13 拦截 | 无评分表项目申请升 A → 弹窗内报错「该项目无正式评分表，按 BR-13 最高只能评 B 级」，提交被阻止 |
| 正常升级申请 | exp-08（B→A，有评分表）→ 提交成功，出现「待审批：B → A」、证据清单、理由，列表徽标 +1 |
| 控制台 | 全流程操作后 error/warn 为 0；`ng build` 通过无告警 |
