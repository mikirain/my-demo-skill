#!/usr/bin/env python3
"""Step 1 输入核对：检查必需材料是否齐备，给出等级上限预判。

用法:
    python scripts/check_inputs.py intake.json [--json gap-report.json]

退出码:
    0  必需材料齐备（可选材料缺失只告警）
    1  用法错误 / 文件或 JSON 异常 / 清单结构不合法
    2  缺必需材料 → 必须中止并追问用户（禁止编造）
"""
from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

EXIT_OK, EXIT_USAGE, EXIT_FAIL = 0, 1, 2

# 脚本内置的必需要求，不能由用户清单自行声明降低
MANDATORY = {
    "tender": "招标文件/技术规格书",
    "ourBid": "我方投标文件终版",
    "awardNotice": "中标通知书或中标公示",
}
STRONG = {"scoreSheet": "正式评标打分表/评标反馈"}
OPTIONAL = {
    "clarification": "澄清/答疑往返记录",
    "negotiation": "商务谈判纪要",
    "competitorBid": "竞对标书/公开参数",
    "fulfilment": "履约数据（交付/验收/服务记录）",
}
KNOWN = {**MANDATORY, **STRONG, **OPTIONAL}


def main() -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    parser = argparse.ArgumentParser(description="中标复盘 Step 1 输入核对")
    parser.add_argument("path", help="intake.json 路径")
    parser.add_argument("--json", dest="json_out", default="", help="把缺口清单另存为 JSON")
    args = parser.parse_args()

    try:
        data = json.loads(Path(args.path).read_text(encoding="utf-8"))
    except FileNotFoundError:
        print(f"[E] 文件不存在: {args.path}（先用 scripts/init_case.py 生成骨架）")
        return EXIT_USAGE
    except json.JSONDecodeError as exc:
        print(f"[E] JSON 解析失败 ({exc.lineno}:{exc.colno}): {exc.msg}")
        return EXIT_USAGE
    except OSError as exc:
        print(f"[E] 读取失败: {exc}")
        return EXIT_USAGE

    if not isinstance(data, dict) or not isinstance(data.get("materials"), list):
        print("[E] 清单结构不合法：需要 materials 数组（每项含 key/label/present/path）")
        return EXIT_USAGE

    entries = {}
    for idx, item in enumerate(data["materials"]):
        if not isinstance(item, dict) or not item.get("key"):
            print(f"[E] materials[{idx}] 缺少 key")
            return EXIT_USAGE
        entries[item["key"]] = item

    missing_required, missing_strong, missing_optional = [], [], []
    unknown_keys = [k for k in entries if k not in KNOWN]
    for key, label in MANDATORY.items():
        item = entries.get(key, {})
        if not item.get("present"):
            missing_required.append((key, label, "必需"))
    for key, label in STRONG.items():
        item = entries.get(key, {})
        if not item.get("present"):
            missing_strong.append((key, label, "强影响"))
    for key, label in OPTIONAL.items():
        item = entries.get(key, {})
        if not item.get("present"):
            missing_optional.append((key, label, "可选"))

    name = data.get("projectName") or "(未命名项目)"
    print(f"输入核对: {name}  ({data.get('caseId', '(无 id)')})")
    for key, label in KNOWN.items():
        item = entries.get(key, {})
        mark = "[齐]" if item.get("present") else "[缺]"
        path = item.get("path") or "-"
        print(f"  {mark} {label:<22} {path}")
    if unknown_keys:
        print(f"  提示: 清单含未知材料键 {unknown_keys}，已忽略（不影响判定）")

    has_score_sheet = entries.get("scoreSheet", {}).get("present") is True
    print("\n等级上限预判:")
    if has_score_sheet:
        print("  hasScoreSheet=true → A 级可用（仍需人工确认每条 A 的证据）")
    else:
        print("  hasScoreSheet=false → 本项目全部经验/赢因最高 B 级（BR-13），复盘时禁止标 A")
    if not entries.get("fulfilment", {}).get("present"):
        print("  无履约数据 → fulfilment 全部标 pending，禁止填 met（不得把计划当结果）")

    if missing_optional:
        print("\n可选材料缺口（对应维度标 pending 并写入 openItems）:")
        for key, label, _ in missing_optional:
            print(f"  - {label}（{key}）")
    if missing_strong:
        print("\n强影响材料缺口:")
        for key, label, _ in missing_strong:
            print(f"  - {label}（{key}）→ 降级处理，最高 B 级")
    if missing_required:
        print("\n必需材料缺口 → 中止复盘，先向用户追问（禁止编造）:")
        for key, label, _ in missing_required:
            print(f"  - {label}（{key}）")

    gap = {
        "caseId": data.get("caseId"),
        "projectName": name,
        "hasScoreSheet": has_score_sheet,
        "maxLevel": "A" if has_score_sheet else "B",
        "missingRequired": [k for k, _, _ in missing_required],
        "missingStrong": [k for k, _, _ in missing_strong],
        "missingOptional": [k for k, _, _ in missing_optional],
        "verdict": "abort-ask-user" if missing_required else "proceed",
    }
    if args.json_out:
        Path(args.json_out).write_text(json.dumps(gap, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print(f"\n缺口清单已写入 {args.json_out}")

    if missing_required:
        print("\n结论: 缺必需材料 → 中止；向用户逐项追问（BR-11 无来源不入库）")
        return EXIT_FAIL
    print("\n结论: 必需材料齐备，进入 Step 2 核心分析")
    return EXIT_OK


if __name__ == "__main__":
    sys.exit(main())
