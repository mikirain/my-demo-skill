# 中标复盘报告 · {{PROJECT_NAME}}

| 项目 | 内容 |
| --- | --- |
| 复盘编号 | {{RETRO_ID}} |
| 复盘日期 | {{RETRO_DATE}} |
| 复盘负责人 | {{OWNER}} |
| 生成信息 | {{GENERATED_AT}} |
| 等级基线 | {{GRADE_BASELINE}} |
| 视图 | {{VIEW_NOTE}} |

> 本报告所有 A/B/C 证据等级均为**建议值**，须由投标经理/知识库管理员确认后方可入库（`draft → verified`）。
> 报告不含报价建议、不推断对手利润率、不产出对外承诺。
> 演示/对外使用前需脱敏；只读角色默认脱敏，法务默认落履约区。

## 0. 告警区（先看这里）

{{ALERTS}}

## 1. 复盘摘要

{{SUMMARY_TABLE}}

## 2. 项目要素

{{PROJECT_META}}

## 3. 三栏证据

> 分级口径：A 有直接证据（评分表分项/评标反馈点名/客户书面认可）；B 多份材料共同支持；C 只有结果或只有内部判断。
> C 栏内容不得进入任何结论段（BR-12）。

### 3.1 已证实优势（A 已证实）

{{EVIDENCE_A}}

### 3.2 可能原因（B 多材料，参照需注明限制）

{{EVIDENCE_B}}

### 3.3 待验证假设（C 待验证，禁止作为结论）

{{EVIDENCE_C}}

### 3.4 评分因素一览

{{WIN_FACTORS_TABLE}}

## 4. 方案配置复盘

{{SOLUTION_SECTION}}

## 5. 商务复盘（不含报价建议）

{{COMMERCIAL_SECTION}}

## 6. 投标组织复盘

{{PROCESS_SECTION}}

## 7. 履约验证（承诺 vs 实际）

{{FULFILMENT_TABLE}}

## 8. 经验草稿（全部 draft，待人工入库审核）

{{EXPERIENCE_TABLE}}

## 9. 引用影响面（BR-15 留痕回查）

{{IMPACT_SECTION}}

## 10. 待补清单

{{OPEN_ITEMS_TABLE}}

## 11. 经验库健康度

{{HEALTH_STATS}}

## 12. 证据索引（全部引用可回查）

{{EVIDENCE_INDEX}}

---

### 交付说明

- 报告只是经验库的视图；可检索、可复用、可追溯的资产是 `retro.json` 里的 `experiences[]`。
- 入库动作由人执行：`state=draft → verified` 需投标经理/知识库管理员审批；`deprecated` 同理。
- 履约 `missed` 已触发降级复核的条目，需在审批通过后再对外引用（LR-04 双人规则）。
- 本报告任何字段缺证据时标 `pending`，不用推断填充（BR-11）。
