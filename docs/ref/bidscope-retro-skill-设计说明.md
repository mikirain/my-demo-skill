# bidscope-retro（中标复盘 F8）skill 设计说明

> 创建日期：2026-10-25 ｜ 依据：`docs/prd/BidScope-PRD-v1.1-中标经验复盘与知识复用.md`、`docs/prd/globaluser-knowledge-中标复盘.md`、`修改优化建议.md`

## 位置

- Skill 本体：`G:\Git文件\20261024-wt\my-demo\.workbuddy\skills\bidscope-retro\`（项目级 skill，WorkBuddy 只从 `.workbuddy/skills/` 或 `~/.workbuddy/skills/` 加载，故不放 memory；本说明文档按用户要求放 memory）
- 分发包：`.workbuddy\skills\dist\bidscope-retro.zip`（官方校验通过）

## 结构

```
bidscope-retro/
├── SKILL.md                          # 入口：输入清单 + 5 步工作流 + 人机边界 + 硬规则速查
├── references/
│   ├── retro-dimensions.md           # 十方面复盘框架（目的/关键问题/输入/沉淀成果/常见陷阱）
│   ├── evidence-grading.md           # A/B/C 分级决策树 + BR-11~15 + LR-01~08 审批 + 履约降级流程
│   └── experience-schema.md          # Experience/WinFactor/FulfilmentRecord 模型 + 12 必填字段 + JSON 示例
├── scripts/
│   └── validate_experience.py        # 确定性校验：字段级报错，BR-11/13/14、LR-01/02、日期格式（已实测）
└── assets/
    └── retro-report-template.md      # 复盘报告模板（告警区/三栏/评分因素/方案/商务/履约/入库清单/待办）
```

## 关键设计决策

1. **人机边界写死在 SKILL.md**：AI 只输出"建议等级"，不生成报价/承诺，C 级不进结论载体，不推断对手利润率——对应 PRD F11 验收项。
2. **确定性归脚本、推理归 LLM**：12 字段完整性、BR-13（无评分表最高 B）、BR-11（无来源不入库）、日期格式等硬规则由 `validate_experience.py` 机械保证；分级判定、复盘叙述由 LLM 按 `evidence-grading.md` 决策树执行。
3. **报告默认输出到 `.workbuddy/memory/`**（用户约定），文件名 `中标复盘-<项目名>-<日期>.md`。
4. **条目一律 `state=draft`**：校验通过 ≠ 入库，入库审核是人工环节（投标经理/知识库管理员）。

## 脚本用法

```bash
python scripts/validate_experience.py entries.json --has-score-sheet true [--fulfilment-status missed] [--target-level A]
```

实测：违规组 9 处字段级报错全部命中（含 BR-13/14/11、空字段、日期格式）；修正组 `ALL CHECKS PASSED`。

## 后续待办

- 用真实复盘材料（评分表/澄清记录/履约数据）跑一次端到端，迭代 SKILL.md；
- 后续可做姊妹 skill：param-extract（F3/F4）、risk-insight（F6）、report-draft（F7）、retro-experience 的匹配部分（F10）。
