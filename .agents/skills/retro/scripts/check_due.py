#!/usr/bin/env python3
"""到期检查：复盘窗口（S-01）、经验复核、C 级验证计划、待审变更 SLA、履约核验、待办。

用法:
    python scripts/check_due.py <retro.json 或目录> [更多路径...]
                              [--as-of YYYY-MM-DD] [--retro-window 14]
                              [--review-cycle 90] [--change-sla 7] [--json out.json]

退出码:
    0  无到期项
    1  用法错误 / 文件读取失败
    2  存在到期或超期项（不是错误，是待办）
"""
from __future__ import annotations

import argparse
import json
import sys
from datetime import date, timedelta
from pathlib import Path

EXIT_OK, EXIT_USAGE, EXIT_DUE = 0, 1, 2


def load_dates(value) -> date | None:
    try:
        return date.fromisoformat(value)
    except (TypeError, ValueError):
        return None


def collect_files(paths: list[str]) -> list[Path]:
    files: list[Path] = []
    for raw in paths:
        p = Path(raw)
        if p.is_dir():
            files.extend(sorted(p.rglob("retro.json")))
        elif p.is_file():
            files.append(p)
    return files


def check_case(data: dict, as_of: date, args) -> list[dict]:
    items: list[dict] = []
    case = data.get("case", {}) or {}
    meta = data.get("retroMeta", {}) or {}
    label = f"{case.get('retroId', '-')} {case.get('name', '(未命名)')}"

    award = load_dates(case.get("awardDate"))
    retro = load_dates(meta.get("retroDate"))
    if award:
        window = award + timedelta(days=args.retro_window)
        if retro is None:
            items.append({"case": label, "kind": "复盘窗口", "target": "复盘未完成",
                          "due": window.isoformat(), "overdue": (as_of - window).days,
                          "action": f"中标后 {args.retro_window} 天内完成复盘（S-01）"})
        elif retro > window:
            items.append({"case": label, "kind": "复盘窗口", "target": "复盘晚于窗口",
                          "due": window.isoformat(), "overdue": (retro - window).days,
                          "action": f"已超窗口 {(retro - window).days} 天完成，复盘完成率纳入考核"})

    for exp in data.get("experiences", []) or []:
        if not isinstance(exp, dict) or exp.get("state") == "deprecated":
            continue
        exp_label = f"{exp.get('id')} {exp.get('title', '')}"
        reviewed = load_dates(exp.get("reviewedAt"))
        if reviewed:
            due = reviewed + timedelta(days=args.review_cycle)
            if due < as_of:
                items.append({"case": label, "kind": "经验复核", "target": exp_label,
                              "due": due.isoformat(), "overdue": (as_of - due).days,
                              "action": f"复核周期 {args.review_cycle} 天已过，需确认等级仍成立"})
        if exp.get("evidenceLevel") == "C":
            vdue = load_dates(exp.get("verificationDue"))
            if vdue is None:
                items.append({"case": label, "kind": "C 级验证", "target": exp_label,
                              "due": "—", "overdue": 0, "action": "缺验证到期日，补 verificationDue（BR-12）"})
            elif vdue < as_of:
                items.append({"case": label, "kind": "C 级验证", "target": exp_label,
                              "due": vdue.isoformat(), "overdue": (as_of - vdue).days,
                              "action": "验证逾期：要么补证升级，要么降级/停用（BR-12/BR-14）"})
        change = exp.get("pendingChange")
        if isinstance(change, dict) and change.get("status") == "pending":
            requested = load_dates(change.get("requestedAt"))
            if requested:
                due = requested + timedelta(days=args.change_sla)
                if due < as_of:
                    items.append({"case": label, "kind": "待审变更", "target":
                                  f"{exp.get('id')} {change.get('from')}→{change.get('to')}（{change.get('id')}）",
                                  "due": due.isoformat(), "overdue": (as_of - due).days,
                                  "action": f"待审超过 {args.change_sla} 天，催审批人 {change.get('approver')}（LR-05）"})

    for fu in data.get("fulfilment", []) or []:
        if not isinstance(fu, dict) or fu.get("status") != "pending":
            continue
        verified = load_dates(fu.get("verifiedAt"))
        if verified:
            due = verified + timedelta(days=args.review_cycle)
            if due < as_of:
                items.append({"case": label, "kind": "履约核验", "target": f"{fu.get('id')} {fu.get('commitment', '')}",
                              "due": due.isoformat(), "overdue": (as_of - due).days,
                              "action": "履约数据未更新，补季度核验或标 missed 走 BR-14"})

    for todo in data.get("openItems", []) or []:
        if not isinstance(todo, dict):
            continue
        due = load_dates(todo.get("due"))
        if due and due < as_of:
            items.append({"case": label, "kind": "待办", "target": f"{todo.get('id')} {todo.get('item', '')}",
                          "due": due.isoformat(), "overdue": (as_of - due).days,
                          "action": f"责任人 {todo.get('owner')}，影响：{todo.get('blocks') or '—'}"})
    return items


def main() -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    parser = argparse.ArgumentParser(description="中标复盘到期检查")
    parser.add_argument("paths", nargs="+", help="retro.json 文件或目录（可多个）")
    parser.add_argument("--as-of", default="", help="基准日 YYYY-MM-DD，缺省今天")
    parser.add_argument("--retro-window", type=int, default=14, help="复盘窗口天数（S-01），默认 14")
    parser.add_argument("--review-cycle", type=int, default=90, help="复核/核验周期天数，默认 90")
    parser.add_argument("--change-sla", type=int, default=7, help="待审变更 SLA 天数，默认 7")
    parser.add_argument("--json", dest="json_out", default="", help="结果另存为 JSON")
    args = parser.parse_args()

    as_of = load_dates(args.as_of) if args.as_of else date.today()
    if as_of is None:
        print(f"[E] --as-of 格式应为 YYYY-MM-DD，当前 {args.as_of!r}")
        return EXIT_USAGE

    files = collect_files(args.paths)
    if not files:
        print("[E] 没有找到 retro.json；路径应为文件或包含 retro.json 的目录")
        return EXIT_USAGE

    all_items: list[dict] = []
    failed: list[str] = []
    for path in files:
        try:
            data = json.loads(path.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError) as exc:
            failed.append(f"{path}: {exc}")
            continue
        all_items.extend(check_case(data, as_of, args))

    print(f"到期检查（基准日 {as_of.isoformat()}）：{len(files)} 份复盘，命中 {len(all_items)} 项")
    if all_items:
        all_items.sort(key=lambda x: -x["overdue"])
        print(f"\n{'逾期天数':<8}{'类型':<10}{'对象':<44}{'到期':<12}动作")
        for it in all_items:
            target = it["target"]
            target = target if len(target) <= 40 else target[:38] + ".."
            print(f"{it['overdue']:<8}{it['kind']:<10}{target:<44}{it['due']:<12}{it['action']}")
        kinds: dict[str, int] = {}
        for it in all_items:
            kinds[it["kind"]] = kinds.get(it["kind"], 0) + 1
        print(f"\n按类型: {kinds}")
    if failed:
        print("\n读取失败:")
        for line in failed:
            print(f"  - {line}")
    if args.json_out:
        Path(args.json_out).write_text(
            json.dumps({"asOf": as_of.isoformat(), "items": all_items, "failed": failed},
                       ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print(f"\n结果已写入 {args.json_out}")

    if failed:
        return EXIT_USAGE
    if all_items:
        print("\n结论: 有待办项（按上表逐条处理，逾期天数越大越优先）")
        return EXIT_DUE
    print("\n结论: 无到期项")
    return EXIT_OK


if __name__ == "__main__":
    sys.exit(main())
