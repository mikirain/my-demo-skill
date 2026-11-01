#!/usr/bin/env python3
"""用 assets/retro-report-template.md 渲染复盘报告（确定性填充 + 角色视图/脱敏）。

用法:
    python scripts/render_report.py retro.json [--out <目录>] [--template <模板>]
                                     [--role engineer|bidManager|commercial|legal|exec|knowledge|viewer]
                                     [--force]

默认输出目录: docs/output/retro/<case.retroId 或 case.id>/
默认文件名:   中标复盘-<项目名>-<复盘日期>.md

退出码:
    0  报告已生成（所有占位符均解析）
    1  用法错误
    2  输入文件/JSON/模板读取失败、同名报告未加 --force、或角色无访问权限（admin）
    3  占位符残留、必填数据缺失或证据池为空
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

EXIT_OK, EXIT_USAGE, EXIT_INPUT, EXIT_FAIL = 0, 1, 2, 3

SKILL_DIR = Path(__file__).resolve().parent.parent
DEFAULT_TEMPLATE = SKILL_DIR / "assets" / "retro-report-template.md"
PLACEHOLDER_RE = re.compile(r"\{\{([A-Z_]+)\}\}")

ROLES = {"engineer", "bidManager", "commercial", "legal", "exec", "knowledge", "viewer"}
READONLY = {"commercial", "legal", "exec", "viewer"}

STATUS_LABEL = {"met": "已达成", "partial": "部分达成", "missed": "未达成", "pending": "履约中"}
LEVEL_LABEL = {"A": "A 已证实", "B": "B 多可能", "C": "C 待验证"}
REVIEW_LABEL = {"draft": "草稿", "pending": "待复核", "verified": "已核验"}
CATEGORY_LABEL = {"price": "价格", "tco": "全生命周期成本", "safety": "安全", "efficiency": "效率",
                  "delivery": "交付", "local": "本地服务", "reference": "业绩", "compliance": "合规"}

ROLE_NOTE = {
    "engineer": "全量视图（技术投标工程师）：可编辑 B/C 等级、发起变更，不可审批。",
    "bidManager": "全量视图（投标经理）：可编辑、提交入库、审批他人发起的变更。",
    "knowledge": "全量视图（知识库管理员）：可编辑与审批；不可删除复盘。",
    "commercial": "商务视图：技术细项（电芯型号、温控方式、并网标准细项）已隐藏，仅保留规模、路线与合同相关。",
    "legal": "法务视图：重点在「履约验证」与「合同风险」；本报告只为事实摘录与风险提示，不含法律意见。",
    "exec": "管理层视图：已脱敏（人名/站名打码），因素表不显示确认人列；匹配度与等级均为建议值。",
    "viewer": "只读视图：本报告不含任何写入入口；如需修改等级或补证据，请联系投标经理或知识库管理员。",
}

ROLE = "bidManager"


def cell(value) -> str:
    if value is None or value == "":
        return "—"
    if isinstance(value, list):
        return "、".join(str(v) for v in value) if value else "—"
    return str(value).replace("|", "\\|").replace("\n", " ")


def mask_person(value) -> str:
    if ROLE != "exec" or not isinstance(value, str) or not value.strip():
        return cell(value)
    name = value.strip()
    if re.fullmatch(r"[\u4e00-\u9fa5]{2,4}", name):
        return name[0] + "*" * (len(name) - 1)
    return cell(value)


def mask_project(name) -> str:
    if ROLE != "exec" or not isinstance(name, str):
        return cell(name)
    return re.sub(r"^([A-Z]{2})-[^\s]+", r"\1", name)


def table(headers: list[str], rows: list[list]) -> str:
    if not rows:
        return "_（本区无记录）_"
    out = ["| " + " | ".join(headers) + " |", "| " + " | ".join("---" for _ in headers) + " |"]
    for row in rows:
        out.append("| " + " | ".join(cell(c) for c in row) + " |")
    return "\n".join(out)


def build_meta(case: dict) -> str:
    rows = [
        ["复盘编号 / 项目编号", f"{case.get('retroId', '—')} / {case.get('id', '—')}"],
        ["国别/地区", case.get("country")], ["规模", f"{cell(case.get('mw'))} MW / {cell(case.get('mwh'))} MWh"],
        ["技术路线", case.get("route")], ["客户类型", case.get("customerType")],
        ["招标方式", case.get("bidMode")], ["合同模式", case.get("contractMode")],
        ["产品型号", case.get("productModel")], ["中标年份/日期", f"{cell(case.get('awardedYear'))} / {cell(case.get('awardDate'))}"],
        ["参与方", case.get("competitorIds")],
        ["正式评分表", "有" if case.get("hasScoreSheet") else "无（全项目最高 B 级）"],
        ["快照日期", case.get("snapshotAt")],
    ]
    return table(["项目要素", "内容"], rows)


def evidence_index(data: dict) -> dict[str, dict]:
    return {ev.get("id"): ev for ev in data.get("evidence", []) or [] if isinstance(ev, dict)}


def build_factor_block(wf: dict, evs: dict[str, dict]) -> list[str]:
    score = "—"
    if wf.get("score") is not None and wf.get("maxScore") is not None:
        score = f"{wf.get('score')}/{wf.get('maxScore')}"
    lines = [f"#### {wf.get('id')} {wf.get('title', '')}  `{LEVEL_LABEL.get(wf.get('level'), wf.get('level'))}`",
             "",
             f"- 客户需求：{cell(wf.get('customerNeed'))}",
             f"- 我方应答：{cell(wf.get('ourResponse'))}",
             f"- 竞对差距：{cell(wf.get('competitorGap'))}"
             + ("（未披露，不计入优势统计，BR-03）" if wf.get("competitorGap") == "未知" else ""),
             f"- 类别/权重：{CATEGORY_LABEL.get(wf.get('category'), wf.get('category'))} / {cell(wf.get('weightPct'))}%"
             f" ｜ 分项得分：{score} ｜ 强制项：{'是' if wf.get('mandatory') else '否'}",
             f"- 复核状态：{REVIEW_LABEL.get(wf.get('reviewState'), cell(wf.get('reviewState')))}"
             f" ｜ 写入结论：{'是' if wf.get('conclusionCarrier') else '否'}"
             + ("" if ROLE == "exec" else f" ｜ 确认人：{cell(wf.get('confirmedBy')) or '待人工确认'}")]
    recent = wf.get("recentChange") or {}
    if recent:
        lines.append(f"- 最近变更：{cell(recent.get('at'))} {mask_person(recent.get('by'))} {cell(recent.get('action'))}"
                     f"（{cell(recent.get('auditId'))}）")
    refs = wf.get("evidence") or []
    if refs:
        lines.append("- 证据：")
        for ref in refs:
            ev = evs.get(ref, {})
            locator = " ".join(x for x in [
                f"P.{ev.get('page')}" if ev.get("page") else "",
                ev.get("section") or "",
            ] if x)
            filed = "" if ev.get("originalFiled", True) else "，原件未入库"
            lines.append(f"  - `{ref}` {ev.get('title', '(证据缺失)')}"
                         f"（{ev.get('type', '-')}/{ev.get('reliability', '-')}{' ' + locator if locator else ''}{filed}）"
                         f"：「{ev.get('snippet', '')}」")
    lines.append("")
    return lines


def build_evidence_sections(data: dict, level: str) -> str:
    evs = evidence_index(data)
    factors = [wf for wf in data.get("winFactors", []) or [] if isinstance(wf, dict) and wf.get("level") == level]
    if not factors:
        return "_（本栏无条目）_"
    lines: list[str] = []
    for wf in factors:
        lines.extend(build_factor_block(wf, evs))
    return "\n".join(lines).rstrip()


def build_alerts(data: dict) -> str:
    case = data.get("case", {}) or {}
    exps = [e for e in data.get("experiences", []) or [] if isinstance(e, dict)]
    alerts: list[str] = []
    data_note = (data.get("retroMeta", {}) or {}).get("dataNote")
    if data_note:
        alerts.append(f"**模拟数据**：{data_note}。本报告不得作为真实投标结论或对外材料使用。")
    if not case.get("hasScoreSheet"):
        alerts.append("**BR-13**：本项目无正式评分表，全部因素/经验最高 B 级；任何 A 级标注都不成立。")
    factors = [w for w in data.get("winFactors", []) or [] if isinstance(w, dict)]
    unknown = [w.get("id") for w in factors if w.get("competitorGap") == "未知"]
    if unknown:
        alerts.append(f"**BR-03**：{len(unknown)} 条因素竞对差距未披露（{'、'.join(unknown)}），不计入我方优势统计。")
    c_level = [e for e in exps if e.get("evidenceLevel") == "C"]
    if c_level:
        missing = [e.get("id") for e in c_level
                   if not e.get("verificationPlan") or not e.get("verificationDue")]
        alerts.append(f"**BR-12**：C 级经验 {len(c_level)} 条，只能进「待验证假设」区；"
                      f"缺验证计划或到期日 {len(missing)} 条"
                      f"{'（' + '、'.join(missing) + '）' if missing else ''}。")
    unconfirmed = [w.get("id") for w in factors if not w.get("confirmedBy")]
    if unconfirmed:
        alerts.append(f"**人机边界**：{len(unconfirmed)} 条因素尚未人工确认（{'、'.join(unconfirmed)}），全部为建议值。")
    missed = [f for f in data.get("fulfilment", []) or [] if isinstance(f, dict) and f.get("status") == "missed"]
    if missed:
        alerts.append(f"**BR-14**：{len(missed)} 条履约未达成（{'、'.join(str(m.get('id')) for m in missed)}），"
                      "已触发经验降级，见「引用影响面」与「经验草稿」区。")
    pending = [e.get("id") for e in exps
               if isinstance(e.get("pendingChange"), dict) and e["pendingChange"].get("status") == "pending"]
    if pending:
        alerts.append(f"**LR-05**：{len(pending)} 条经验存在待审等级变更（{'、'.join(pending)}），审批前等级不生效。")
    if not alerts:
        alerts.append("无阻断项。")
    return "\n".join(f"- {a}" for a in alerts)


def build_summary(data: dict) -> str:
    factors = [w for w in data.get("winFactors", []) or [] if isinstance(w, dict)]
    exps = [e for e in data.get("experiences", []) or [] if isinstance(e, dict)]
    fus = [f for f in data.get("fulfilment", []) or [] if isinstance(f, dict)]
    level_counts = {lv: sum(1 for w in factors if w.get("level") == lv) for lv in "ABC"}
    exp_counts = {lv: sum(1 for e in exps if e.get("evidenceLevel") == lv) for lv in "ABC"}
    status_counts = {s: sum(1 for f in fus if f.get("status") == s) for s in STATUS_LABEL}
    unknown = sum(1 for w in factors if w.get("competitorGap") == "未知")
    review = {k: sum(1 for w in factors if w.get("reviewState") == k) for k in REVIEW_LABEL}
    rows = [
        ["胜因因素", f"A {level_counts['A']} / B {level_counts['B']} / C {level_counts['C']}", f"合计 {len(factors)} 条因素"],
        ["复核状态", " / ".join(f"{REVIEW_LABEL[k]} {review[k]}" for k in REVIEW_LABEL), "草稿 / 待复核 / 已核验"],
        ["竞对差距未知", f"{unknown} 条", "BR-03：不计入我方优势统计"],
        ["经验草稿", f"A {exp_counts['A']} / B {exp_counts['B']} / C {exp_counts['C']}", f"合计 {len(exps)} 条，全部 draft"],
        ["履约验证", " / ".join(f"{STATUS_LABEL[s]} {status_counts[s]}" for s in STATUS_LABEL), f"合计 {len(fus)} 条承诺"],
        ["待补清单", f"{len(data.get('openItems', []) or [])} 项", "见「待补清单」"],
    ]
    return table(["区块", "分布", "说明"], rows)


def build_solution(data: dict) -> str:
    sol = data.get("solution", {}) or {}
    parts = [f"技术路线：{cell(sol.get('route'))}", ""]
    parts.append("### 硬门槛参数")
    parts.append("")
    parts.append(table(["参数", "招标要求", "我方值", "判定"],
                       [[g.get("label"), g.get("requirement"), g.get("ourValue"),
                         {"meet": "满足", "deviation": "偏离", "noResponse": "未应答", "pending": "待核"}.get(
                             g.get("status"), g.get("status"))]
                        for g in sol.get("hardGateParams", []) or []]))
    if ROLE == "commercial":
        parts.append("")
        parts.append("_（商务视图：差异化技术细项与认证明细已隐藏，仅保留规模、路线与合同相关项。）_")
    else:
        parts.append("")
        parts.append("### 差异化参数")
        parts.append("")
        parts.append(table(["参数", "我方值", "竞对最好", "说明"],
                           [[d.get("label"), d.get("ourValue"), d.get("competitorBest"), d.get("note")]
                            for d in sol.get("differentiators", []) or []]))
        parts.append("")
        parts.append("### 认证与合规")
        parts.append("")
        parts.append(table(["认证", "覆盖型号", "有效期", "强制", "缺口风险"],
                           [[c.get("name"), c.get("scope"), c.get("validUntil"),
                             "是" if c.get("mandatory") else "否", c.get("gapRisk")]
                            for c in sol.get("certifications", []) or []]))
    judgement = sol.get("configJudgement", {}) or {}
    parts.append("")
    parts.append(f"配置判定：过度配置 {cell(judgement.get('overSpec'))}；不足配置 {cell(judgement.get('underSpec'))}；"
                 f"说明 {cell(judgement.get('note'))}")
    parts.append("")
    parts.append("### 偏差与澄清")
    parts.append("")
    parts.append(table(["编号", "偏离条款", "类型", "原因", "澄清处理", "客户书面接受", "可复用"],
                       [[d.get("id"), d.get("requirement"), d.get("deviationType"), d.get("reason"),
                         d.get("clarification"), "是" if d.get("customerAccepted") else "否",
                         "是" if d.get("reusable") else "否"]
                        for d in sol.get("deviations", []) or []]))
    return "\n".join(parts)


def build_commercial(data: dict) -> str:
    com = data.get("commercial", {}) or {}
    parts = ["> 本区不产出报价建议、不推断对手利润率（红线 BR-16）。"
             + ("已声明未产出报价。" if com.get("noQuoteStatement") else "**缺少 noQuoteStatement 声明**"), ""]
    parts.append("### 报价结构（仅结构占比）")
    parts.append("")
    parts.append(table(["分项", "占比 %", "口径说明"],
                       [[i.get("item"), i.get("sharePct"), i.get("note")]
                        for i in com.get("priceStructure", []) or []]))
    parts.append("")
    parts.append("### TCO 影响因素")
    parts.append("")
    parts.append(table(["因素", "影响", "说明"],
                       [[t.get("factor"), t.get("impact"), t.get("note")]
                        for t in com.get("tcoFactors", []) or []]))
    delivery = com.get("delivery", {}) or {}
    parts.append("")
    parts.append(f"交付：周期 {cell(delivery.get('leadTimeDays'))} 天；本地化 {cell(delivery.get('localization'))}；"
                 f"第三方依赖 {cell(delivery.get('thirdPartyRisks'))}")
    parts.append("")
    parts.append("### 合同风险")
    parts.append("")
    parts.append(table(["条款", "红旗", "让步", "对履约的影响"],
                       [[r.get("clause"), "是" if r.get("redFlag") else "否", r.get("concession"),
                         r.get("impactOnFulfilment")] for r in com.get("contractRisks", []) or []]))
    return "\n".join(parts)


def build_process(data: dict) -> str:
    proc = data.get("process", {}) or {}
    parts = ["### 介入时点", ""]
    parts.append(table(["阶段", "角色", "说明"],
                       [[t.get("phase"), t.get("actor"), t.get("note")]
                        for t in proc.get("involvementTimeline", []) or []]))
    parts.append("")
    parts.append("### 卡点")
    parts.append("")
    parts.append(table(["编号", "阶段", "问题", "后果", "改进"],
                       [[b.get("id"), b.get("stage"), b.get("issue"), b.get("effect"), b.get("fix")]
                        for b in proc.get("blockers", []) or []]))
    parts.append("")
    parts.append("### 有效审核")
    parts.append("")
    parts.append(table(["审核节点", "负责人", "拦住了什么"],
                       [[r.get("node"), mask_person(r.get("owner")), r.get("caught")]
                        for r in proc.get("effectiveReviews", []) or []]))
    return "\n".join(parts)


def build_fulfilment(data: dict) -> str:
    fus = data.get("fulfilment", []) or []
    rows = [[f.get("id"), f.get("commitment"), f.get("target"), f.get("actual"), f.get("variance"),
             STATUS_LABEL.get(f.get("status"), f.get("status")), f.get("note"),
             f.get("experienceIds"), f.get("verifiedAt")] for f in fus if isinstance(f, dict)]
    return table(["编号", "承诺", "目标", "实际", "偏差", "状态", "说明", "关联经验", "核验日期"], rows)


def build_win_factors_table(data: dict) -> str:
    headers = ["编号", "因素", "类别", "强制项", "权重 %", "分项得分", "等级", "证据数", "复核状态", "写入结论"]
    if ROLE != "exec":
        headers.append("确认人")
    rows = []
    for w in data.get("winFactors", []) or []:
        if not isinstance(w, dict):
            continue
        score = "—"
        if w.get("score") is not None and w.get("maxScore") is not None:
            score = f"{w.get('score')}/{w.get('maxScore')}"
        row = [w.get("id"), w.get("title"), CATEGORY_LABEL.get(w.get("category"), w.get("category")),
               "是" if w.get("mandatory") else "否", w.get("weightPct"), score,
               LEVEL_LABEL.get(w.get("level"), w.get("level")), len(w.get("evidence") or []),
               REVIEW_LABEL.get(w.get("reviewState"), w.get("reviewState")),
               "是" if w.get("conclusionCarrier") else "否"]
        if ROLE != "exec":
            row.append(w.get("confirmedBy") or "待人工确认")
        rows.append(row)
    return table(headers, rows)


def build_experiences(data: dict) -> str:
    exps = [e for e in data.get("experiences", []) or [] if isinstance(e, dict)]
    if not exps:
        return "_（尚无经验草稿）_"
    lines: list[str] = []
    for exp in exps:
        lines.append(f"#### {exp.get('id')} {exp.get('title', '')}  "
                     f"`{exp.get('category')}`  `{LEVEL_LABEL.get(exp.get('evidenceLevel'), '-')}`  "
                     f"`{exp.get('state')}`")
        lines.append("")
        rows = [
            ["① 国家/地区", exp.get("country")], ["② 项目规模", exp.get("scaleBand")],
            ["③ 客户类型", exp.get("customerType")], ["④ 投标模式", exp.get("bidMode")],
            ["⑤ 产品型号", exp.get("productModel")], ["⑥ 招标要求", exp.get("requirement")],
            ["⑦ 采取的策略", exp.get("strategy")], ["⑧ 最终结果", exp.get("result")],
            ["⑨ 证据来源", exp.get("evidenceSources")], ["⑩ 复盘人", mask_person(exp.get("reviewer"))],
            ["⑪ 复核日期", exp.get("reviewedAt")], ["⑫ 适用范围", exp.get("scope")],
        ]
        lines.append(table(["12 必填字段", "内容"], rows))
        lines.append("")
        lines.append(f"- 摘要：{cell(exp.get('summary'))}")
        if exp.get("verificationPlan"):
            lines.append(f"- 验证计划：{exp.get('verificationPlan')}（到期 {cell(exp.get('verificationDue'))}）")
        for ch in exp.get("references") or []:
            lines.append(f"- 引用留痕：{ch.get('projectId')} 由 {mask_person(ch.get('citedBy'))} 于 {ch.get('citedAt')} "
                         f"用于 {ch.get('usedIn')}")
        change = exp.get("pendingChange")
        if isinstance(change, dict) and change:
            lines.append(f"- 待审变更：{change.get('from')} → {change.get('to')}（{change.get('status')}），"
                         f"发起人 {mask_person(change.get('requester'))} / 审批人 {mask_person(change.get('approver'))}，"
                         f"理由：{cell(change.get('reason'))}")
        for ch in exp.get("changeHistory") or []:
            lines.append(f"- 变更历史：{ch.get('from')} → {ch.get('to')}（{ch.get('status')}，{ch.get('requestedAt')}，"
                         f"发起 {mask_person(ch.get('requester'))} / 审批 {mask_person(ch.get('approver'))}）"
                         f" {cell(ch.get('reason'))}")
        lines.append("")
    return "\n".join(lines).rstrip()


def build_impact(data: dict) -> str:
    exps = [e for e in data.get("experiences", []) or [] if isinstance(e, dict)]
    ev_index = evidence_index(data)
    missed_links: set[str] = set()
    for fu in data.get("fulfilment", []) or []:
        if isinstance(fu, dict) and fu.get("status") == "missed":
            missed_links.update(fu.get("experienceIds") or [])
    rows = []
    for exp in exps:
        affected = exp.get("id") in missed_links
        for ref in exp.get("references") or []:
            rows.append([exp.get("id"), "是" if affected else "否", ref.get("projectId"),
                         mask_person(ref.get("citedBy")), ref.get("citedAt"), ref.get("usedIn"),
                         "需复核并通知引用方" if affected else "无需动作"])
    if not rows:
        return "_无引用记录（BR-15：引用经验到新项目必须留痕）。_"
    body = table(["经验", "受 missed 影响", "被引项目", "引用人", "引用日期", "用于何处", "动作"], rows)
    return body + "\n\n" + f"证据池共 {len(ev_index)} 条，报告引用均可在「证据索引」区回查。"


def build_open_items(data: dict) -> str:
    rows = [[i.get("id"), i.get("item"), mask_person(i.get("owner")), i.get("due"), i.get("blocks")]
            for i in data.get("openItems", []) or [] if isinstance(i, dict)]
    return table(["编号", "待补事项", "责任人", "截止", "影响"], rows)


def build_health(data: dict) -> str:
    exps = [e for e in data.get("experiences", []) or [] if isinstance(e, dict)]
    total = len(exps) or 1
    dist = {lv: sum(1 for e in exps if e.get("evidenceLevel") == lv) for lv in "ABC"}
    reuse = sum(len(e.get("references") or []) for e in exps)
    c_plan = sum(1 for e in exps if e.get("evidenceLevel") == "C"
                 and e.get("verificationPlan") and e.get("verificationDue"))
    missed = sum(1 for f in data.get("fulfilment", []) or []
                 if isinstance(f, dict) and f.get("status") == "missed")
    rows = [
        ["经验总量", str(len(exps)), "中标复盘的健康度基线"],
        ["A/B/C 分布", f"{dist['A']}/{dist['B']}/{dist['C']}",
         f"C 占比 {dist['C'] / total:.0%}（>40% 视为 C 级堆积）"],
        ["C 级验证计划覆盖", f"{c_plan}/{dist['C']}" if dist["C"] else "—", "C 级必须有验证出口与到期日（BR-12）"],
        ["被引用次数", str(reuse), "引用留痕次数（BR-15）"],
        ["履约 missed", str(missed), "触发降级数（BR-14）"],
    ]
    return table(["指标", "值", "口径"], rows)


def build_evidence_index(data: dict) -> str:
    evs = [e for e in data.get("evidence", []) or [] if isinstance(e, dict)]
    usage: dict[str, int] = {}
    for wf in data.get("winFactors", []) or []:
        if isinstance(wf, dict):
            for ref in wf.get("evidence") or []:
                usage[ref] = usage.get(ref, 0) + 1
    for exp in data.get("experiences", []) or []:
        if isinstance(exp, dict):
            for ref in exp.get("evidenceSources") or []:
                usage[ref] = usage.get(ref, 0) + 1
    rows = [[ev.get("id"), ev.get("type"), ev.get("title"),
             " ".join(x for x in [f"P.{ev.get('page')}" if ev.get("page") else "", ev.get("section") or ""] if x),
             ev.get("reliability"), ev.get("snippet"),
             f"{mask_person(ev.get('collectedBy'))} / {cell(ev.get('collectedAt'))}",
             "已入库" if ev.get("originalFiled") else "原件未入库", usage.get(ev.get("id"), 0)]
            for ev in evs]
    return table(["编号", "类型", "标题", "定位", "可靠性", "原文摘录", "采集人/日期", "原件", "被引次数"], rows)


def main() -> int:
    global ROLE
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    parser = argparse.ArgumentParser(description="渲染中标复盘报告（支持角色视图与脱敏）")
    parser.add_argument("path", help="retro.json 路径")
    parser.add_argument("--out", default="", help="输出目录，缺省 docs/output/retro/<retroId>/")
    parser.add_argument("--template", default=str(DEFAULT_TEMPLATE), help="报告模板路径")
    parser.add_argument("--role", default="bidManager", choices=sorted(ROLES) + ["admin"],
                        help="按角色渲染视图（admin 无访问权限）")
    parser.add_argument("--force", action="store_true", help="覆盖同名报告")
    args = parser.parse_args()

    if args.role == "admin":
        print("[E] 当前角色（系统管理员）无中标复盘访问权限：该页涉及投标承诺与履约信息，"
              "仅对投标与知识管理角色开放（PRD 17.3 硬约束 3）。报告未生成。")
        return EXIT_INPUT
    ROLE = args.role

    try:
        data = json.loads(Path(args.path).read_text(encoding="utf-8"))
        template = Path(args.template).read_text(encoding="utf-8")
    except FileNotFoundError as exc:
        print(f"[E] 文件不存在: {exc.filename}")
        return EXIT_INPUT
    except json.JSONDecodeError as exc:
        print(f"[E] JSON 解析失败 ({exc.lineno}:{exc.colno}): {exc.msg}")
        return EXIT_INPUT
    except OSError as exc:
        print(f"[E] 读取失败: {exc}")
        return EXIT_INPUT

    case = data.get("case", {}) or {}
    meta = data.get("retroMeta", {}) or {}
    if not case.get("name"):
        print("[E] case.name 缺失，无法命名报告")
        return EXIT_FAIL
    retro_date = meta.get("retroDate") or ""
    if not re.match(r"^\d{4}-\d{2}-\d{2}$", retro_date):
        print("[E] retroMeta.retroDate 必须是 YYYY-MM-DD（报告文件名依赖它）")
        return EXIT_FAIL
    if not data.get("evidence"):
        print("[E] evidence 池为空：报告所有引用都无法回查，拒绝生成（BR-11）")
        return EXIT_FAIL

    mapping = {
        "PROJECT_NAME": mask_project(case.get("name", "")),
        "RETRO_ID": cell(case.get("retroId")),
        "PROJECT_META": build_meta(case),
        "RETRO_DATE": retro_date,
        "OWNER": mask_person(meta.get("owner")),
        "GENERATED_AT": f"{retro_date}（retro skill 生成，等级为建议值）",
        "VIEW_NOTE": ROLE_NOTE.get(ROLE, ""),
        "GRADE_BASELINE": ("有正式评分表：A 级需有评分表分项或客户书面认可" if case.get("hasScoreSheet")
                           else "无正式评分表：全项目最高 B 级（BR-13）"),
        "ALERTS": build_alerts(data),
        "SUMMARY_TABLE": build_summary(data),
        "EVIDENCE_A": build_evidence_sections(data, "A"),
        "EVIDENCE_B": build_evidence_sections(data, "B"),
        "EVIDENCE_C": build_evidence_sections(data, "C"),
        "WIN_FACTORS_TABLE": build_win_factors_table(data),
        "SOLUTION_SECTION": build_solution(data),
        "COMMERCIAL_SECTION": build_commercial(data),
        "PROCESS_SECTION": build_process(data),
        "FULFILMENT_TABLE": build_fulfilment(data),
        "EXPERIENCE_TABLE": build_experiences(data),
        "IMPACT_SECTION": build_impact(data),
        "OPEN_ITEMS_TABLE": build_open_items(data),
        "HEALTH_STATS": build_health(data),
        "EVIDENCE_INDEX": build_evidence_index(data),
    }

    rendered = template
    for key, value in mapping.items():
        rendered = rendered.replace("{{" + key + "}}", str(value))
    leftover = sorted(set(PLACEHOLDER_RE.findall(rendered)))
    if leftover:
        print(f"[E] 模板占位符未解析: {leftover}（模板与脚本版本不一致）")
        return EXIT_FAIL

    out_dir = Path(args.out) if args.out else Path("docs/output/retro") / (case.get("retroId") or case.get("id") or "case")
    out_dir.mkdir(parents=True, exist_ok=True)
    safe_name = re.sub(r"[\\/:*?\"<>|]+", "-", case["name"]).strip() or "retro"
    suffix = "" if ROLE in ("bidManager", "engineer", "knowledge") else f"-{ROLE}"
    out_path = out_dir / f"中标复盘-{safe_name}-{retro_date}{suffix}.md"
    if out_path.exists() and not args.force:
        print(f"[E] 报告已存在，未覆盖（如需覆盖加 --force）: {out_path}")
        return EXIT_INPUT
    out_path.write_text(rendered, encoding="utf-8")

    print(f"报告已生成: {out_path}")
    print(f"  视图: {ROLE}（{ROLE_NOTE[ROLE]}）")
    print(f"  胜因因素 A/B/C = "
          f"{sum(1 for w in data.get('winFactors', []) or [] if w.get('level') == 'A')}/"
          f"{sum(1 for w in data.get('winFactors', []) or [] if w.get('level') == 'B')}/"
          f"{sum(1 for w in data.get('winFactors', []) or [] if w.get('level') == 'C')}"
          f" ｜ 经验 {len(data.get('experiences', []) or [])} 条 ｜ 证据池 {len(data.get('evidence', []) or [])} 条")
    print("提醒: 报告中的等级均为建议值，需投标经理/知识库管理员确认后方可入库；"
          "对外使用前需脱敏（管理层视图默认脱敏）。")
    return EXIT_OK


if __name__ == "__main__":
    sys.exit(main())
