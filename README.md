# my-demo-skill
<img width="1915" height="877" alt="局部截取_20261101_190624" src="https://github.com/user-attachments/assets/a0b615ad-8cdc-4896-baf2-64fbdfb4db77" />

用 AI 编程助手（Kimi Code）从零做一套可运行的 Agent Skill，并把它接进一个能点、能看的全栈 Demo。

业务背景取自「海外投标竞品标书分析」：围绕储能 EPC 投标，把「一次中标为什么赢」沉淀成可核对的证据、经验条目和报告。仓库里同时包含自研 skill、引用的社区 skill、业务 PRD、Pi 官方文档知识库，以及一个基于 [pi](https://pi.dev) SDK 的聊天式 skill 运行器。

## 仓库结构

```
my-demo-skill/
├── .agents/skills/          # 技能本体（retro 自研 + 3 个引入的社区技能）
├── mydemo/                  # 全栈 Demo：Angular 22 前端 + Express + pi SDK 后端
├── docs/
│   ├── prd/                 # BidScope 总 PRD、拆解、每页一份页面级 PRD
│   ├── ref/                 # 复盘功能分析、skill 设计说明、测试方案
│   ├── meeting/             # 需求调研原文（WorkBuddy / GPT 对话）
│   ├── pi-docs/             # pi 官方文档的中文重组版
│   └── output/              # retro skill 的样例产出、wiki 测试问题
├── raw/                     # pi 官方文档英文原文（不可变素材）
├── wiki/                    # 由 raw/ 编译出的知识库（index + log + 分主题文章）
├── skills-lock.json         # 技能来源与哈希锁定
└── *.md                     # 驱动这个仓库长出来的原始提示词
```

## 快速开始（Demo）

前置：Node ≥ 22、Python 3.10+（retro skill 的脚本）、本机 `pi` 已登录可用模型。

```bash
cd mydemo
npm install
npm start          # 构建 Angular → 后端同源托管，打开 http://localhost:8787
```

进入 `#/assistant`，输入一句「帮我做中标复盘」，即可看到后端新建 pi 会话、加载 `retro` 技能、逐条回传执行过程，技能产出的文件在页面上变成可点开的卡片。

| 命令 | 作用 |
| --- | --- |
| `npm start` | 构建前端并启动后端，`http://localhost:8787` |
| `npm run server` | 只起后端（复用已有 dist） |
| `npm run dev` | 后端 8787 + `ng serve` 4200，前端热更新 |
| `npm run build` | `ng build` → `dist/mydemo/browser` |
| `npm run typecheck` | 前端 + 后端类型检查 |
| `npm run smoke` | 验证本机能建 pi 会话、能发现工作区技能 |
| `npm test` | `ng test`（vitest + jsdom） |

完整的架构、API 路由、环境变量与 VS Code 调试配置见 [mydemo/README.md](mydemo/README.md)。

## 技能

| 技能 | 来源 | 作用 |
| --- | --- | --- |
| `retro` 中标复盘 | 本项目自研 | 把一次中标从口头结论变成可核对的证据复盘，产出三栏证据、评分因素分项得分、12 字段经验草稿、履约验证与可回查报告 |
| `archify` | 社区（MIT，v3.2） | 生成可交互的独立 HTML 架构图/流程图/时序图/时间线等，支持导出图片 |
| `ui-ux-pro-max` | 社区 | UI/UX 设计知识库：风格、配色、字体搭配、UX 准则、图表选型 |
| `karpathy-llm-wiki` | 社区（MIT） | 用 LLM 维护个人知识库：`raw/` 不可变素材 → `wiki/` 编译文章 |

### retro（自研）

`.agents/skills/retro/` 是一套「确定性归脚本、推理归模型」的 skill：

- **6 个脚本**（零第三方依赖）：`init_case.py` 建工作区、`check_inputs.py` 材料核对、`validate_retro.py` 机械校验、`check_due.py` 到期检查、`score_match.py` 相似项目打分、`render_report.py` 模板渲染与角色脱敏；每个脚本都定义了退出码，校验失败按字段定位。
- **6 份参考**：十方面复盘框架、A/B/C 证据分级决策树、参数取值字典、`retro.json` 结构契约、8 角色权限矩阵、匹配打分细则。
- **硬性红线**：只给证据等级建议值、缺数据标 `pending` 不虚构、结论必须带出处、无评分表最高只到 B 级、不产出报价与承诺、C 级证据不进结论载体。
- **样例产出**：`docs/output/retro/rp-01` 至 `rp-10`，覆盖德/英/捷/意/沙特/波兰/澳洲等 10 个真实感项目，包含 `retro.json`、报告、到期检查与匹配结果。

## 业务 Demo（BidScope）

`mydemo/` 是一个海外投标竞品标书分析工作台，Angular 22 + 信号 + OnPush + hash 路由，除 AI 助手外均为演示数据：

- 工作台、项目列表、项目概览、资料管理、原文查看、参数矩阵、对比分析、研判与风险、审核待办、报告中心、经验库、竞品情报、相似项目匹配、中标复盘、系统管理
- AI 助手：每轮新建 pi 会话（会话落 `.data/sessions/`），技能以 `/skill:<name> <prompt>` 注入；消息支持 Markdown、代码块、可折叠思考、工具调用卡片、产物卡片；同一份事件流也实时打印在启动后端的终端里
- 后端：Express 5 + SSE，`createAgentSession()` 建会话，运行记录落 `.data/runs/`，产物读取限定在工作区内

## 文档与知识库

- `docs/pi-docs/`：按 <https://pi.dev/docs/latest/> 原导航层级重组的中文文档
- `raw/` + `wiki/`：同一批文档的英文原文与编译后的知识库（`wiki/index.md` 索引入口，`wiki/log.md` 记录每次 ingest）；`docs/output/wiki测试问题列表.md` 是 20 道覆盖 5 个维度的检索测试题
- `docs/prd/`：BidScope 总 PRD、v1.1 复盘与知识复用 PRD、三份拆解文档，以及 15 份页面级 PRD（`globaluser-<模块>-<页面>.md`）
- `docs/ref/`：复盘功能分析、skill 设计说明与测试方案

## 这个仓库是怎么长出来的

根目录的 Markdown 就是实际使用的提示词，按顺序记录了三件事：

| 文件 | 内容 |
| --- | --- |
| `提示词.md` | 从需求记录到 PRD、PRD 拆解、前端 Demo、UI 风格选型、第二个前端实现 |
| `抓取pi文档.md` | 抓取 pi 官方文档 → 中文重组 → 转成 wiki 知识库 + 测试题 |
| `创建skill.md` | 设计 retro skill 体系、优化、接微信式前后端、再扩展研判与风险 skill |
| `提示词1.md` | 基于 pi SDK 构建 skill 运行聊天页面，前后端打通 |
| `修改优化建议.md` | 对海外中标标书可沉淀经验的业务梳理，是 retro skill 的需求来源 |

`.archify/` 存放 archify 生成的流程图交付物（retro SOP 图），`.tmp-extract/` 是调试脚本与中间草稿，两者都是过程产物。

## 已知边界

- 只有本机演示，没有账号体系；运行记录、产物都落在本机 `.data/` 与工作区。
- 除 AI 助手外的页面数据全部是 `src/app/core/mock/` 下的模拟数据，侧栏已标注「演示数据 · 非真实企业信息」。
- 模型来自本机 `pi` 已配置的凭据，页面内不提供切换。
- 运行需要 `pi` 已登录，否则后端建会话会失败。

## 许可与致谢

本项目自研部分（`retro` skill、`mydemo`、文档）随仓库提供；引入的社区技能保留各自许可：`archify`（MIT，作者 tt-a1i）、`karpathy-llm-wiki`（MIT，作者 Yuhan Lei）。`ui-ux-pro-max` 未附许可文件，版本与来源信息见其 `SKILL.md`（`skills-lock.json` 目前只锁定了 `karpathy-llm-wiki`）。
