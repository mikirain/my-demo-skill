#!/usr/bin/env python3
"""校验 retro.json：schema v1.1、取值字典、经验 12 必填字段、BR-01~20、LR-01~05、日期与引用可解析。

用法:
    python scripts/validate_retro.py retro.json [--strict]

退出码:
    0  全部通过（warnings 不影响）
    1  用法错误
    2  文件不存在 / JSON 解析失败
    3  存在 ERROR（含 --strict 下的 WARNING）
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from datetime import date

EXIT_OK, EXIT_USAGE, EXIT_INPUT, EXIT_FAIL = 0, 1, 2, 3

CATEGORIES = {"competitor", "deviation", "commercial", "awarded"}
FACTOR_CATEGORIES = {"price", "tco", "safety", "efficiency", "delivery", "local", "reference", "compliance"}
LEVEL_RANK = {"A": 3, "B": 2, "C": 1}
STATES = {"draft", "verified", "deprecated"}
CHANGE_STATES = {"pending", "approved", "rejected"}
FULFILMENT_STATES = {"met", "partial", "missed", "pending"}
RELIABILITY = {"official", "public", "thirdParty", "unknown"}
EV_TYPES = {"tender", "scoreSheet", "awardNotice", "ourBid", "competitorBid",
            "clarification", "negotiation", "fulfilment", "other"}
REVIEW_STATES = {"draft", "pending", "verified"}
GATE_STATUS = {"meet", "deviation", "noResponse", "pending"}
DEVIATION_TYPES = {"主动偏差", "被动偏差"}
# 取值字典（references/parameter-dictionary.md）：白名单外的值直接报 ERROR
CUSTOMER_TYPES = {"电网公司", "市政公用事业", "独立发电商", "公用事业", "工商业", "EPC 总包"}
BID_MODES = {"公开招标", "公开招标（两阶段）", "有限邀请招标", "框架协议 + 竞标"}
CONTRACT_MODES = {"EPC 总承包", "设备供货 + 调试", "设备 + 5 年运维", "供货 + 运维"}
VARIANCE_RE = re.compile(r"^(\+\d+(\.\d+)?\s?\S*|-\d+(\.\d+)?\s?\S*|0|符合曲线|触发赔付|优于承诺|履约中|无)$")
RECENT_AT_RE = re.compile(r"^\d{2}-\d{2} \d{2}:\d{2}$")
AUDIT_ID_RE = re.compile(r"^aud-\d{3}$")
RETRO_ID_RE = re.compile(r"^rp-\d{2}$")
SCALE_BAND_RE = re.compile(r"^\d+\s?-\s?\d+\s?MWh$|^\d+\s?MWh$")
BANNED_DISPLAY = {"0": "禁止用 0 填充缺失（BR-02）", "未披露": "缺失统一写「—」，未披露写「未知」/「—」"}

TOP_KEYS = ["schemaVersion", "case", "evidence", "winFactors", "solution",
            "commercial", "process", "fulfilment", "experiences", "openItems", "retroMeta"]

CASE_REQUIRED = {
    "retroId": "复盘编号 rp-xx", "id": "项目 ID", "name": "项目名", "country": "国别",
    "mw": "规模 MW", "mwh": "规模 MWh", "route": "技术路线",
    "customerType": "客户类型", "bidMode": "投标模式", "contractMode": "合同模式",
    "productModel": "产品型号", "awardedYear": "中标年份", "awardDate": "中标日期",
    "hasScoreSheet": "是否有正式评分表", "snapshotAt": "快照日期",
}

TWELVE = {
    "country": "① 国家/地区", "scaleBand": "② 项目规模", "customerType": "③ 客户类型",
    "bidMode": "④ 投标模式", "productModel": "⑤ 产品型号", "requirement": "⑥ 招标要求",
    "strategy": "⑦ 采取的策略", "result": "⑧ 最终结果", "evidenceSources": "⑨ 证据来源",
    "reviewer": "⑩ 复盘人", "reviewedAt": "⑪ 复核日期", "scope": "⑫ 适用范围",
}

DATE_RE = re.compile(r"^\d{4}-\d{2}-\d{2}$")


class Report:
    def __init__(self) -> None:
        self.errors: list[tuple[str, str, str]] = []
        self.warnings: list[tuple[str, str, str]] = []
        self.unknown_gap = 0

    def err(self, code: str, path: str, msg: str) -> None:
        self.errors.append((code, path, msg))

    def warn(self, code: str, path: str, msg: str) -> None:
        self.warnings.append((code, path, msg))

    @staticmethod
    def _fmt(items: list[tuple[str, str, str]]) -> list[str]:
        return [f"  [{c}] {p}: {m}" for c, p, m in items]


def is_blank(value) -> bool:
    if value is None:
        return True
    if isinstance(value, str):
        return not value.strip()
    if isinstance(value, (list, dict)):
        return len(value) == 0
    return False


def check_date(rep: Report, path: str, value, required: bool = True) -> None:
    if is_blank(value):
        if required:
            rep.err("DATE", path, "日期缺失，需 YYYY-MM-DD")
        return
    if not isinstance(value, str) or not DATE_RE.match(value):
        rep.err("DATE", path, f"日期格式应为 YYYY-MM-DD，当前 {value!r}")
        return
    try:
        date.fromisoformat(value)
    except ValueError:
        rep.err("DATE", path, f"非法日期 {value}")


def require_text(rep: Report, path: str, value, code: str = "FIELD", label: str = "") -> bool:
    if is_blank(value) or not isinstance(value, str):
        rep.err(code, path, f"{label or '字段'}缺失或为空")
        return False
    return True


def check_display_text(rep: Report, path: str, value) -> None:
    """BR-02：缺失值不得用 0/未披露 混写。"""
    if isinstance(value, str) and value.strip() in BANNED_DISPLAY:
        rep.err("BR-02", path, BANNED_DISPLAY[value.strip()])


def check_enum(rep: Report, path: str, value, whitelist: set[str], label: str) -> None:
    if value not in whitelist:
        rep.err("ENUM", path, f"{label}取值应属于 {sorted(whitelist)}，当前 {value!r}（见 references/parameter-dictionary.md）")


def collect_ids(rep: Report, items, prefix: str, key: str = "id") -> set[str]:
    ids: set[str] = set()
    if not isinstance(items, list):
        rep.err("SCHEMA", prefix, "应为数组")
        return ids
    for i, item in enumerate(items):
        if not isinstance(item, dict):
            rep.err("SCHEMA", f"{prefix}[{i}]", "应为对象")
            continue
        item_id = item.get(key)
        if is_blank(item_id):
            rep.err("SCHEMA", f"{prefix}[{i}].{key}", "缺失 id")
        elif item_id in ids:
            rep.err("SCHEMA", f"{prefix}[{i}].{key}", f"id 重复：{item_id}")
        else:
            ids.add(item_id)
    return ids


def validate_case(rep: Report, case) -> bool:
    if not isinstance(case, dict):
        rep.err("SCHEMA", "case", "缺失或不是对象")
        return False
    for field, label in CASE_REQUIRED.items():
        if field not in case:
            rep.err("FIELD", f"case.{field}（{label}）", "缺失")
        elif is_blank(case[field]):
            rep.err("FIELD", f"case.{field}（{label}）", "为空")
    if not is_blank(case.get("retroId")) and not RETRO_ID_RE.match(str(case.get("retroId"))):
        rep.err("ENUM", "case.retroId", f"格式应为 rp-两位序号，当前 {case.get('retroId')!r}")
    for num_field in ("mw", "mwh", "awardedYear"):
        val = case.get(num_field)
        if val is not None and not isinstance(val, (int, float)):
            rep.err("ENUM", f"case.{num_field}", f"应为数字，当前 {val!r}")
        elif isinstance(val, (int, float)) and num_field != "awardedYear" and val <= 0:
            rep.err("BR-02", f"case.{num_field}", "规模必须为正数；未知时用 null，不得填 0")
    check_enum(rep, "case.customerType", case.get("customerType"), CUSTOMER_TYPES, "客户类型")
    check_enum(rep, "case.bidMode", case.get("bidMode"), BID_MODES, "招标方式")
    check_enum(rep, "case.contractMode", case.get("contractMode"), CONTRACT_MODES, "合同模式")
    if not isinstance(case.get("hasScoreSheet"), bool):
        rep.err("FIELD", "case.hasScoreSheet", "必须显式为 true / false（决定 BR-13）")
    if not is_blank(case.get("snapshotAt")):
        check_date(rep, "case.snapshotAt", case.get("snapshotAt"))
    check_date(rep, "case.awardDate", case.get("awardDate"))
    if not isinstance(case.get("competitorIds", []), list):
        rep.err("SCHEMA", "case.competitorIds", "应为数组")
    name = case.get("name") if isinstance(case.get("name"), str) else ""
    if name and not re.search(r"\d+\s?MWh", name):
        rep.warn("NAMING", "case.name", "项目名建议按「国别-站名 规模 类型（年份 中标）」书写，便于检索")
    return True


def validate_evidence(rep: Report, evidence) -> set[str]:
    ids = collect_ids(rep, evidence, "evidence")
    for i, ev in enumerate(evidence if isinstance(evidence, list) else []):
        base = f"evidence[{i}]"
        if not isinstance(ev, dict):
            continue
        require_text(rep, f"{base}.title", ev.get("title"), label="证据标题")
        require_text(rep, f"{base}.snippet", ev.get("snippet"), label="原文摘录")
        check_enum(rep, f"{base}.type", ev.get("type"), EV_TYPES, "证据类型")
        check_enum(rep, f"{base}.reliability", ev.get("reliability"), RELIABILITY, "来源可靠性")
        check_date(rep, f"{base}.collectedAt", ev.get("collectedAt"))
        if "documentId" not in ev:
            rep.err("FIELD", f"{base}.documentId", "缺失：原件未入库填 null（不得省略）")
        if not isinstance(ev.get("originalFiled"), bool):
            rep.err("FIELD", f"{base}.originalFiled", "必须显式为 true / false（原件是否已入库）")
        page = ev.get("page")
        if "page" not in ev:
            rep.err("FIELD", f"{base}.page", "缺失：无页码填 null（BR-02 禁止填 0）")
        elif page == 0:
            rep.err("BR-02", f"{base}.page", "页码不得填 0；无页码请用 null")
        elif page is not None and not isinstance(page, int):
            rep.warn("EVID", f"{base}.page", "页码建议为整数")
        snippet = ev.get("snippet") if isinstance(ev.get("snippet"), str) else ""
        if snippet and len(snippet.strip()) < 6:
            rep.warn("EVID", f"{base}.snippet", "摘录过短（<6 字），报告引用价值低")
        elif snippet and len(snippet.strip()) < 15:
            rep.warn("EVID", f"{base}.snippet", "摘录建议 ≥15 字并含数值与单位（取值字典要求）")
        if ev.get("reliability") == "official" and ev.get("originalFiled") is False:
            rep.warn("EVID", f"{base}.originalFiled", "官方来源但原件未入库，A 级证据宜补扫描件")
    return ids


def validate_recent_change(rep: Report, base: str, change) -> None:
    if not isinstance(change, dict):
        rep.err("BR-09", base, "缺失或不是对象：需 {at, by, action, auditId}（BR-09 修正可审计）")
        return
    at = change.get("at") if isinstance(change.get("at"), str) else ""
    if not RECENT_AT_RE.match(at):
        rep.err("BR-09", f"{base}.at", f"格式应为 MM-DD HH:mm，当前 {at!r}")
    for field in ("by", "action"):
        require_text(rep, f"{base}.{field}", change.get(field), code="BR-09", label=field)
    audit = change.get("auditId") if isinstance(change.get("auditId"), str) else ""
    if not AUDIT_ID_RE.match(audit):
        rep.err("BR-09", f"{base}.auditId", f"格式应为 aud-三位序号，当前 {audit!r}")


def validate_win_factors(rep: Report, factors, evidence_ids: set[str], has_score_sheet: bool) -> None:
    collect_ids(rep, factors, "winFactors")
    for i, wf in enumerate(factors if isinstance(factors, list) else []):
        base = f"winFactors[{i}]"
        if not isinstance(wf, dict):
            continue
        title_ok = require_text(rep, f"{base}.title", wf.get("title"), label="因素标题")
        if title_ok and len(wf["title"]) > 40:
            rep.warn("FIELD", f"{base}.title", f"标题 {len(wf['title'])} 字，超过 40 字建议（卡片两行截断）")
        for field in ("customerNeed", "ourResponse", "competitorGap"):
            if field not in wf:
                rep.err("FIELD", f"{base}.{field}", "缺失（客户需求/我方应答/竞对差距三件套必填）")
        check_enum(rep, f"{base}.category", wf.get("category"), FACTOR_CATEGORIES, "因素类别")
        check_enum(rep, f"{base}.level", wf.get("level"), set(LEVEL_RANK), "证据等级")
        check_enum(rep, f"{base}.reviewState", wf.get("reviewState"), REVIEW_STATES, "复核状态")
        if not isinstance(wf.get("mandatory"), bool):
            rep.err("FIELD", f"{base}.mandatory", "必须显式为 true / false（强制项 or 评分项）")
        if not isinstance(wf.get("conclusionCarrier"), bool):
            rep.err("FIELD", f"{base}.conclusionCarrier", "必须显式为 true / false（是否写入结论）")
        weight = wf.get("weightPct")
        if not isinstance(weight, (int, float)) or not (0 <= weight <= 100):
            rep.err("ENUM", f"{base}.weightPct", "权重应为 0–100 的数字")
        gap = wf.get("competitorGap")
        check_display_text(rep, f"{base}.competitorGap", gap)
        if gap == "未知":
            rep.unknown_gap += 1
            if wf.get("level") == "A":
                rep.warn("BR-03", f"{base}.competitorGap",
                         "竞对差距未知却评为 A 级：不计入我方优势统计，建议在结论中注明竞对不可比")
        confirmed = wf.get("confirmedBy")
        check_display_text(rep, f"{base}.confirmedBy", confirmed)
        if not isinstance(confirmed, str) or confirmed == "":
            rep.warn("CONFIRM", f"{base}.confirmedBy", "等级未经人工确认（建议留空交由人工填写，报告会标注待确认）")

        evs = wf.get("evidence")
        if not isinstance(evs, list) or not evs:
            rep.err("BR-11", f"{base}.evidence", "无证据不得进入三栏（BR-11）")
        else:
            for j, ref in enumerate(evs):
                if ref not in evidence_ids:
                    rep.err("REF", f"{base}.evidence[{j}]", f"引用的证据 {ref!r} 不在 evidence 池中")
        level = wf.get("level")
        if level == "A":
            if not has_score_sheet:
                rep.err("BR-13", f"{base}.level", "无正式评分表项目最高 B 级，不得标 A（BR-13）")
            if wf.get("reviewState") != "verified":
                rep.warn("BR-01", f"{base}.reviewState", "A 级因素未标为已核验，评审会追问时无法交代（S-02）")
        if level == "C" and wf.get("conclusionCarrier"):
            rep.err("BR-12", f"{base}.conclusionCarrier", "C 级不得写入结论载体，必须为 false（BR-12）")

        score, max_score = wf.get("score"), wf.get("maxScore")
        if "score" not in wf or "maxScore" not in wf:
            rep.err("FIELD", f"{base}.score/maxScore", "缺失：无评分表时双填 null（不得省略）")
        else:
            for name, val in (("score", score), ("maxScore", max_score)):
                if val is not None and (not isinstance(val, (int, float)) or val < 0):
                    rep.err("ENUM", f"{base}.{name}", f"应为非负数字或 null，当前 {val!r}")
            if (score is None) != (max_score is None):
                rep.err("FIELD", f"{base}.score/maxScore", "必须同时有值或同时为 null")
            if isinstance(score, (int, float)) and isinstance(max_score, (int, float)):
                if max_score <= 0:
                    rep.err("ENUM", f"{base}.maxScore", "满分必须为正数")
                elif score > max_score:
                    rep.err("SCORE", f"{base}.score", f"分项得分 {score} 大于满分 {max_score}")
                if not has_score_sheet:
                    rep.err("BR-13", f"{base}.score", "无正式评分表却填了分项得分，属反推断（BR-13）")
            elif has_score_sheet and score is None:
                rep.warn("SCORE", f"{base}.score", "有评分表但未填分项得分，评分因素表无法追问「这条 8 分是哪一页」")

        if "recentChange" not in wf:
            rep.err("BR-09", f"{base}.recentChange", "缺失：需记录最近一次变更（时间/人/动作/审计号）")
        else:
            validate_recent_change(rep, f"{base}.recentChange", wf.get("recentChange"))


def validate_nested(rep: Report, data: dict, key: str) -> dict:
    value = data.get(key)
    if not isinstance(value, dict):
        rep.err("SCHEMA", key, "缺失或不是对象")
        return {}
    return value


def validate_solution(rep: Report, solution: dict, evidence_ids: set[str]) -> None:
    for i, gate in enumerate(solution.get("hardGateParams", []) or []):
        base = f"solution.hardGateParams[{i}]"
        if not isinstance(gate, dict):
            rep.err("SCHEMA", base, "应为对象")
            continue
        require_text(rep, f"{base}.label", gate.get("label"), label="参数名")
        check_enum(rep, f"{base}.status", gate.get("status"), GATE_STATUS, "门槛判定")
    for i, cert in enumerate(solution.get("certifications", []) or []):
        base = f"solution.certifications[{i}]"
        require_text(rep, f"{base}.name", cert.get("name"), label="认证名称")
        if is_blank(cert.get("scope")):
            rep.err("FIELD", f"{base}.scope", "必须写覆盖型号（海外项目最常见失分点）")
        check_date(rep, f"{base}.validUntil", cert.get("validUntil"), required=False)
        if not isinstance(cert.get("mandatory"), bool):
            rep.err("FIELD", f"{base}.mandatory", "必须显式为 true / false（强制 or 加分）")
    for i, dv in enumerate(solution.get("deviations", []) or []):
        base = f"solution.deviations[{i}]"
        require_text(rep, f"{base}.requirement", dv.get("requirement"), label="偏离条款")
        require_text(rep, f"{base}.reason", dv.get("reason"), label="偏差原因")
        check_enum(rep, f"{base}.deviationType", dv.get("deviationType"), DEVIATION_TYPES, "偏差类型")
        if not isinstance(dv.get("reusable"), bool):
            rep.warn("FIELD", f"{base}.reusable", "建议显式标注该偏差是否可复用（经验库入口）")
        if dv.get("customerAccepted") is True:
            if is_blank(dv.get("acceptedEvidence")):
                rep.err("BR-11", f"{base}.acceptedEvidence", "客户接受必须有书面来源（口头接受不算，改为 false）")
            elif dv["acceptedEvidence"] not in evidence_ids:
                rep.err("REF", f"{base}.acceptedEvidence", f"引用的证据 {dv['acceptedEvidence']!r} 不在 evidence 池中")


def validate_commercial(rep: Report, commercial: dict) -> None:
    if commercial.get("noQuoteStatement") is not True:
        rep.err("RED", "commercial.noQuoteStatement", "必须为 true：复盘不产出报价（BR-16）")
    share_total = 0
    for i, item in enumerate(commercial.get("priceStructure", []) or []):
        base = f"commercial.priceStructure[{i}]"
        require_text(rep, f"{base}.item", item.get("item"), label="分项名")
        share = item.get("sharePct")
        if not isinstance(share, (int, float)) or not (0 <= share <= 100):
            rep.err("ENUM", f"{base}.sharePct", "占比应为 0–100 的数字")
        else:
            share_total += share
    if share_total and abs(share_total - 100) > 1:
        rep.warn("FIELD", "commercial.priceStructure", f"分项占比合计 {share_total:.0f}% ≠ 100%，请核对口径")
    for i, risk in enumerate(commercial.get("contractRisks", []) or []):
        base = f"commercial.contractRisks[{i}]"
        require_text(rep, f"{base}.clause", risk.get("clause"), label="条款")
        if not isinstance(risk.get("redFlag"), bool):
            rep.err("FIELD", f"{base}.redFlag", "必须显式为 true / false")
        if risk.get("redFlag") is True and is_blank(risk.get("impactOnFulfilment")):
            rep.warn("FIELD", f"{base}.impactOnFulfilment", "红旗条款应关联履约验证编号（FU-xx）")


def validate_fulfilment(rep: Report, fulfilment, exp_by_id: dict) -> list[str]:
    collect_ids(rep, fulfilment, "fulfilment")
    missed_ids: list[str] = []
    for i, fu in enumerate(fulfilment if isinstance(fulfilment, list) else []):
        base = f"fulfilment[{i}]"
        if not isinstance(fu, dict):
            continue
        require_text(rep, f"{base}.commitment", fu.get("commitment"), label="承诺")
        for field in ("target", "actual", "variance", "note"):
            require_text(rep, f"{base}.{field}", fu.get(field), label=field)
        status = fu.get("status")
        check_enum(rep, f"{base}.status", status, FULFILMENT_STATES, "履约状态")
        check_date(rep, f"{base}.verifiedAt", fu.get("verifiedAt"))
        variance = fu.get("variance") if isinstance(fu.get("variance"), str) else ""
        if variance and not VARIANCE_RE.match(variance.strip()):
            rep.err("ENUM", f"{base}.variance",
                    f"偏差取值应为 +n/-n 单位、0、符合曲线、触发赔付、优于承诺、履约中、无；当前 {variance!r}")
        actual = fu.get("actual") if isinstance(fu.get("actual"), str) else ""
        note = fu.get("note") if isinstance(fu.get("note"), str) else ""
        if actual.strip() == "履约中" and status != "pending":
            rep.err("STATE", f"{base}.status", "实际填「履约中」时状态必须是 pending")
        if status == "pending" and actual.strip() and actual.strip() != "履约中":
            rep.err("STATE", f"{base}.actual", "状态为 pending 时实际值应写「履约中」，不得填具体结果")
        if len(note.strip()) > 120:
            rep.warn("FIELD", f"{base}.note", f"说明 {len(note)} 字，超过 120 字（页面两行截断）")
        if status == "missed":
            missed_ids.append(fu.get("id", base))
            if len(note.strip()) < 6:
                rep.err("BR-14", f"{base}.note", "missed 必须填 ≥6 字复核说明（LR-03/BR-14）")
            linked = fu.get("experienceIds") or []
            if not linked:
                rep.err("BR-14", f"{base}.experienceIds", "missed 必须关联受影响经验，才能触发降级（BR-14）")
            for j, exp_id in enumerate(linked):
                exp = exp_by_id.get(exp_id)
                if exp is None:
                    rep.err("REF", f"{base}.experienceIds[{j}]", f"经验 {exp_id!r} 不存在")
                    continue
                if exp.get("evidenceLevel") == "A":
                    rep.err("BR-14", f"experiences[{exp_id}].evidenceLevel",
                            f"履约 {fu.get('id')} 为 missed，该经验仍为 A 级；必须降级并留痕（BR-14）")
                elif not exp.get("pendingChange") and not exp.get("changeHistory"):
                    rep.warn("BR-14", f"experiences[{exp_id}]",
                             "履约 missed 但未留降级记录；若该经验非本条承诺受益经验请修正 experienceIds")
    return missed_ids


def validate_change(rep: Report, base: str, change: dict, has_score_sheet: bool,
                    evidence_ids: set[str], type_by_id: dict[str, str], official: set[str]) -> None:
    for field in ("id", "from", "to", "status", "requester", "approver", "requestedAt", "reason"):
        require_text(rep, f"{base}.{field}", change.get(field), label=field)
    c_from, c_to = change.get("from"), change.get("to")
    if c_from not in LEVEL_RANK or c_to not in LEVEL_RANK:
        rep.err("ENUM", f"{base}.to", f"from/to 应为 A/B/C，当前 {c_from!r}->{c_to!r}")
        return
    if c_from == c_to:
        rep.err("LR-01", f"{base}.to", "目标等级与当前等级相同，无需变更")
    reason = change.get("reason") if isinstance(change.get("reason"), str) else ""
    if len(reason.strip()) < 6:
        rep.err("LR-03", f"{base}.reason", "变更理由必须 ≥6 字（LR-03）")
    check_enum(rep, f"{base}.status", change.get("status"), CHANGE_STATES, "变更状态")
    if change.get("approver") and change.get("requester") and change["approver"] == change["requester"]:
        rep.err("LR-04", f"{base}.approver", "不可审批本人发起的变更（LR-04 双人规则）")
    check_date(rep, f"{base}.requestedAt", change.get("requestedAt"))
    new_ev = change.get("newEvidenceIds") or []
    if LEVEL_RANK[c_to] > LEVEL_RANK[c_from]:
        if not new_ev:
            rep.err("LR-01", f"{base}.newEvidenceIds", "升级必须新增 ≥1 条证据（LR-01）")
        for j, ref in enumerate(new_ev):
            if ref not in evidence_ids:
                rep.err("REF", f"{base}.newEvidenceIds[{j}]", f"证据 {ref!r} 不在 evidence 池中")
        if c_to == "A":
            if not has_score_sheet:
                rep.err("LR-02", f"{base}.to", "无正式评分表项目不得升 A（LR-02 + BR-13）")
            elif not any(ref in evidence_ids and (type_by_id.get(ref) == "scoreSheet" or ref in official)
                         for ref in new_ev):
                rep.err("LR-02", f"{base}.newEvidenceIds", "升 A 必须附直接证据（评分表或官方来源，LR-02）")
    elif LEVEL_RANK[c_to] < LEVEL_RANK[c_from]:
        if is_blank(change.get("reason")):
            rep.err("LR-07", f"{base}.reason", "降级可不附证据，但必须写明原因（LR-07）")


def validate_experiences(rep: Report, experiences, evidence_ids: set[str], has_score_sheet: bool,
                         type_by_id: dict[str, str], official: set[str]) -> dict[str, dict]:
    collect_ids(rep, experiences, "experiences")
    by_id: dict[str, dict] = {}
    for i, exp in enumerate(experiences if isinstance(experiences, list) else []):
        base = f"experiences[{i}]"
        if not isinstance(exp, dict):
            continue
        exp_id = exp.get("id", base)
        if exp_id not in by_id:
            by_id[exp_id] = exp
        title_ok = require_text(rep, f"{base}.title", exp.get("title"), label="标题")
        if title_ok and len(exp["title"]) > 40:
            rep.warn("FIELD", f"{base}.title", f"标题 {len(exp['title'])} 字，超过 40 字建议")
        summary = exp.get("summary")
        if require_text(rep, f"{base}.summary", summary, label="摘要") and len(summary) > 120:
            rep.warn("FIELD", f"{base}.summary", f"摘要 {len(summary)} 字，超过 120 字建议")
        check_enum(rep, f"{base}.category", exp.get("category"), CATEGORIES, "经验库类别")
        for field, label in TWELVE.items():
            value = exp.get(field)
            if field == "evidenceSources":
                if not isinstance(value, list) or not value:
                    rep.err("BR-11", f"{base}.{field}（{label}）", "无来源不得入库（BR-11）")
                else:
                    for j, ref in enumerate(value):
                        if ref not in evidence_ids:
                            rep.err("REF", f"{base}.{field}[{j}]", f"证据 {ref!r} 不在 evidence 池中")
            elif field == "reviewedAt":
                check_date(rep, f"{base}.{field}（{label}）", value)
            elif field == "customerType":
                require_text(rep, f"{base}.{field}（{label}）", value, label=label)
                if isinstance(value, str) and value:
                    check_enum(rep, f"{base}.{field}", value, CUSTOMER_TYPES, "客户类型")
            elif field == "bidMode":
                require_text(rep, f"{base}.{field}（{label}）", value, label=label)
                if isinstance(value, str) and value:
                    check_enum(rep, f"{base}.{field}", value, BID_MODES, "招标方式")
            elif field == "scaleBand":
                require_text(rep, f"{base}.{field}（{label}）", value, label=label)
                if isinstance(value, str) and value and not SCALE_BAND_RE.match(value.strip()):
                    rep.warn("FIELD", f"{base}.scaleBand", f"建议写作「100-200MWh」或「60MWh」，当前 {value!r}")
            else:
                require_text(rep, f"{base}.{field}（{label}）", value, label=label)
        level = exp.get("evidenceLevel")
        check_enum(rep, f"{base}.evidenceLevel", level, set(LEVEL_RANK), "证据等级")
        if level == "A" and not has_score_sheet:
            rep.err("BR-13", f"{base}.evidenceLevel", "无正式评分表项目最高 B 级（BR-13）")
        if level == "C":
            if exp.get("state") != "draft":
                rep.err("BR-12", f"{base}.state", "C 级经验只能停在 draft（BR-12）")
            if is_blank(exp.get("verificationPlan")):
                rep.err("BR-12", f"{base}.verificationPlan",
                        "C 级必须填验证计划（在哪个项目/何时验证），否则不得入库（BR-12）")
            if is_blank(exp.get("verificationDue")):
                rep.err("BR-12", f"{base}.verificationDue", "C 级必须填验证到期日，供 check_due.py 提醒")
            else:
                check_date(rep, f"{base}.verificationDue", exp.get("verificationDue"))
            if exp.get("conclusionCarrier"):
                rep.err("BR-12", f"{base}.conclusionCarrier", "C 级不得进入结论载体（BR-12）")
        state = exp.get("state")
        check_enum(rep, f"{base}.state", state, STATES, "经验状态")
        if state == "verified":
            rep.warn("HUMAN", f"{base}.state", "AI 产出阶段不得直接置 verified，入库审核由人做")
        for j, ref in enumerate(exp.get("references") or []):
            refbase = f"{base}.references[{j}]"
            for field in ("projectId", "citedBy", "citedAt", "usedIn"):
                require_text(rep, f"{refbase}.{field}", ref.get(field), code="BR-15", label=f"引用留痕 {field}")
            check_date(rep, f"{refbase}.citedAt", ref.get("citedAt"))
        change = exp.get("pendingChange")
        if isinstance(change, dict) and change:
            level_now = exp.get("evidenceLevel")
            if change.get("from") and level_now and change.get("from") != level_now:
                rep.err("STATE", f"{base}.pendingChange.from",
                        f"待审变更起点为 {change.get('from')}，但当前等级是 {level_now}；"
                        "pending 表示尚未生效，from 必须等于当前等级（已生效的变更写 changeHistory）")
            validate_change(rep, f"{base}.pendingChange", change, has_score_sheet,
                            evidence_ids, type_by_id, official)
        pending_in_history = [c for c in (exp.get("changeHistory") or [])
                              if isinstance(c, dict) and c.get("status") == "pending"]
        for j, ch in enumerate(exp.get("changeHistory") or []):
            if isinstance(ch, dict):
                validate_change(rep, f"{base}.changeHistory[{j}]", ch, has_score_sheet,
                                evidence_ids, type_by_id, official)
        pending_count = (1 if isinstance(change, dict) and change.get("status") == "pending" else 0) \
            + len(pending_in_history)
        if pending_count > 1:
            rep.err("LR-05", f"{base}", f"检测到 {pending_count} 个待审变更，单条经验同时只允许一个（LR-05）")
    return by_id


def validate_meta(rep: Report, meta) -> None:
    if not isinstance(meta, dict):
        rep.err("SCHEMA", "retroMeta", "缺失或不是对象")
        return
    require_text(rep, "retroMeta.owner", meta.get("owner"), label="复盘负责人")
    check_date(rep, "retroMeta.retroDate", meta.get("retroDate"))
    if meta.get("humanConfirmed") is True:
        rep.warn("HUMAN", "retroMeta.humanConfirmed",
                 "AI 产出阶段应为 false；如已人工确认请说明确认人（报告会按已确认渲染）")
    elif meta.get("humanConfirmed") is not False:
        rep.err("FIELD", "retroMeta.humanConfirmed", "必须显式为 true / false")
    note = meta.get("dataNote")
    if note is not None and (not isinstance(note, str) or "模拟" not in note):
        rep.warn("DATA", "retroMeta.dataNote", "模拟数据集应在 dataNote 写明「模拟数据，非真实企业信息」")


def stats(data: dict) -> dict:
    exps = [e for e in data.get("experiences", []) or [] if isinstance(e, dict)]
    levels = {k: sum(1 for e in exps if e.get("evidenceLevel") == k) for k in "ABC"}
    cats = {k: sum(1 for e in exps if e.get("category") == k) for k in sorted(CATEGORIES)}
    c_with_plan = sum(1 for e in exps if e.get("evidenceLevel") == "C"
                      and not is_blank(e.get("verificationPlan")) and not is_blank(e.get("verificationDue")))
    refs = sum(len(e.get("references") or []) for e in exps)
    pending = sum(1 for e in exps if isinstance(e.get("pendingChange"), dict)
                  and e["pendingChange"].get("status") == "pending")
    missed = sum(1 for f in data.get("fulfilment", []) or []
                 if isinstance(f, dict) and f.get("status") == "missed")
    factors = [w for w in data.get("winFactors", []) or [] if isinstance(w, dict)]
    review = {k: sum(1 for w in factors if w.get("reviewState") == k) for k in sorted(REVIEW_STATES)}
    return {"total": len(exps), "levels": levels, "cats": cats, "c_with_plan": c_with_plan,
            "refs": refs, "pending": pending, "missed": missed, "review": review}


def main() -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    parser = argparse.ArgumentParser(description="校验 retro.json（schema v1.1 / 取值字典 / BR-LR 规则）")
    parser.add_argument("path", help="retro.json 路径")
    parser.add_argument("--strict", action="store_true", help="把 WARNING 也视为失败")
    args = parser.parse_args()

    try:
        with open(args.path, encoding="utf-8") as fh:
            data = json.load(fh)
    except FileNotFoundError:
        print(f"[E] 文件不存在: {args.path}")
        return EXIT_INPUT
    except json.JSONDecodeError as exc:
        print(f"[E] JSON 解析失败 ({exc.lineno}:{exc.colno}): {exc.msg}")
        return EXIT_INPUT
    except OSError as exc:
        print(f"[E] 读取失败: {exc}")
        return EXIT_INPUT

    rep = Report()
    if not isinstance(data, dict):
        print("[E] 顶层必须是对象")
        return EXIT_INPUT
    for key in TOP_KEYS:
        if key not in data:
            rep.err("SCHEMA", key, "顶层必需节点缺失")
    version = data.get("schemaVersion")
    if version not in ("1.0", "1.1"):
        rep.err("SCHEMA", "schemaVersion", f"应为 1.1（或兼容的 1.0），当前 {version!r}")
    elif version == "1.0":
        rep.warn("SCHEMA", "schemaVersion", "v1.0 数据建议升级到 1.1（新增 retroId/评分分项/复核状态/审计留痕）")

    case_ok = validate_case(rep, data.get("case", {}))
    has_score_sheet = bool(data.get("case", {}).get("hasScoreSheet")) if case_ok else False

    evidence = data.get("evidence", [])
    evidence_ids = validate_evidence(rep, evidence)
    type_by_id: dict[str, str] = {}
    official: set[str] = set()
    for ev in evidence if isinstance(evidence, list) else []:
        if isinstance(ev, dict) and ev.get("id"):
            type_by_id[ev["id"]] = ev.get("type")
            if ev.get("reliability") == "official":
                official.add(ev["id"])

    validate_win_factors(rep, data.get("winFactors", []), evidence_ids, has_score_sheet)
    validate_solution(rep, validate_nested(rep, data, "solution"), evidence_ids)
    validate_commercial(rep, validate_nested(rep, data, "commercial"))
    validate_nested(rep, data, "process")

    validate_experiences(rep, data.get("experiences", []), evidence_ids, has_score_sheet,
                         type_by_id, official)
    exp_by_id = {}
    for exp in data.get("experiences", []) or []:
        if isinstance(exp, dict) and exp.get("id"):
            exp_by_id[exp["id"]] = exp
    validate_fulfilment(rep, data.get("fulfilment", []), exp_by_id)
    collect_ids(rep, data.get("openItems", []), "openItems")
    validate_meta(rep, data.get("retroMeta", {}))

    st = stats(data)
    print(f"校验对象: {data.get('case', {}).get('name', '(未命名)')}  "
          f"[{data.get('case', {}).get('retroId', '-')}]  ({args.path})")
    print(f"评分表基线: hasScoreSheet={has_score_sheet}"
          + ("  → 全部经验/因素最高 B 级（BR-13）" if not has_score_sheet else ""))
    print(f"统计: 经验 {st['total']} 条 | A/B/C = {st['levels']['A']}/{st['levels']['B']}/{st['levels']['C']}"
          f" | 库分布 {st['cats']} | 引用 {st['refs']} 次 | 待审变更 {st['pending']} | 履约 missed {st['missed']}")
    print(f"因素复核状态: {st['review']} | 竞对差距未知 {rep.unknown_gap} 条（BR-03 不计入优势统计）")

    if st["total"]:
        c_ratio = st["levels"]["C"] / st["total"]
        a_ratio = st["levels"]["A"] / st["total"]
        if c_ratio > 0.4:
            rep.warn("HEALTH", "experiences", f"C 级占比 {c_ratio:.0%} 偏高（>40%），需排验证计划")
        if a_ratio > 0.5:
            rep.warn("HEALTH", "experiences", f"A 级占比 {a_ratio:.0%} 偏高（>50%），请复核是否都有评分表/书面认可")
        if st["levels"]["C"]:
            print(f"C 级验证计划覆盖: {st['c_with_plan']}/{st['levels']['C']}")

    if rep.errors:
        print(f"\n校验失败: {len(rep.errors)} 个 ERROR，{len(rep.warnings)} 个 WARNING")
        for line in rep._fmt(rep.errors):
            print(line)
    if rep.warnings:
        print(("\n" if rep.errors else "\n告警: ") + f"{len(rep.warnings)} 个 WARNING（不拦截交付，请人工判断）")
        for line in rep._fmt(rep.warnings):
            print(line)

    if rep.errors or (args.strict and rep.warnings):
        if not rep.errors:
            print(f"\n[--strict] 存在 {len(rep.warnings)} 个 WARNING，按失败处理")
        print("结果: VALIDATION FAILED")
        return EXIT_FAIL
    print("\n结果: ALL CHECKS PASSED" + (f"（{len(rep.warnings)} 个 WARNING 仅供参考）" if rep.warnings else ""))
    return EXIT_OK


if __name__ == "__main__":
    sys.exit(main())
