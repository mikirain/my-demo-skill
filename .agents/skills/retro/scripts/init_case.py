#!/usr/bin/env python3
"""生成复盘工作区骨架：intake.json + retro.json + 材料收集清单。

用法:
    python scripts/init_case.py --name "捷克 100MWh 储能 EPC" [--id p-01] [--country CZ]
                               [--has-score-sheet true|false|unknown] [--out <目录>] [--force]

默认输出目录: docs/output/retro/<id>/

退出码:
    0  生成成功
    1  用法错误
    2  目标文件已存在且未加 --force（不覆盖已有产出）
"""
from __future__ import annotations

import argparse
import json
import re
import shutil
import sys
from pathlib import Path

EXIT_OK, EXIT_USAGE, EXIT_INPUT = 0, 1, 2

SKILL_DIR = Path(__file__).resolve().parent.parent
CHECKLIST = SKILL_DIR / "assets" / "materials-checklist.md"

MATERIALS = [
    ("tender", "招标文件/技术规格书", "required", "决定强制项、评分办法、并网规范"),
    ("ourBid", "我方投标文件终版", "required", "技术卷/商务卷/偏差表终版，用于核对承诺"),
    ("awardNotice", "中标通知书或中标公示", "required", "确认结果与中标范围"),
    ("scoreSheet", "正式评标打分表/评标反馈", "strong", "决定能否评 A 级（BR-13）"),
    ("clarification", "澄清/答疑往返记录", "optional", "偏差处理与客户书面认可的来源"),
    ("negotiation", "商务谈判纪要", "optional", "让什么、换什么的证据"),
    ("competitorBid", "竞对标书/公开参数", "optional", "竞对差距结论的支撑"),
    ("fulfilment", "履约数据（交付/验收/服务记录）", "optional", "履约验证与 BR-14 降级依据"),
]

PREDICT = {
    "required": "缺此项 → 必须中止并追问用户，禁止编造",
    "strong": "缺此项 → hasScoreSheet=false，全部经验最高 B 级（BR-13）",
    "optional": "缺此项 → 对应复盘维度标 pending，写入 openItems",
}


def slug(text: str) -> str:
    cleaned = re.sub(r"[^\w\u4e00-\u9fff.-]+", "-", text).strip("-")
    return cleaned or "retro-case"


def intake_payload(case_id: str, name: str) -> dict:
    return {
        "caseId": case_id,
        "projectName": name,
        "checkedAt": "",
        "materials": [
            {"key": key, "label": label, "level": level, "why": why,
             "present": False, "path": "", "note": ""}
            for key, label, level, why in MATERIALS
        ],
    }


def retro_payload(case_id: str, retro_id: str, name: str, country: str, has_score_sheet) -> dict:
    return {
        "schemaVersion": "1.1",
        "case": {
            "retroId": retro_id,
            "id": case_id,
            "name": name,
            "country": country,
            "mw": None,
            "mwh": None,
            "route": "",
            "customerType": "",
            "bidMode": "",
            "contractMode": "",
            "productModel": "",
            "awardedYear": None,
            "awardDate": "",
            "competitorIds": [],
            "hasScoreSheet": has_score_sheet,
            "snapshotAt": "",
        },
        "evidence": [],
        "winFactors": [],
        "solution": {
            "route": "",
            "hardGateParams": [],
            "differentiators": [],
            "configJudgement": {"overSpec": [], "underSpec": [], "note": ""},
            "certifications": [],
            "deviations": [],
        },
        "commercial": {
            "noQuoteStatement": True,
            "priceStructure": [],
            "tcoFactors": [],
            "delivery": {"leadTimeDays": None, "localization": "", "thirdPartyRisks": []},
            "contractRisks": [],
        },
        "process": {"involvementTimeline": [], "blockers": [], "effectiveReviews": []},
        "fulfilment": [],
        "experiences": [],
        "openItems": [],
        "retroMeta": {"owner": "", "retroDate": "", "generatedBy": "retro skill", "humanConfirmed": False},
    }


def main() -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    parser = argparse.ArgumentParser(description="生成中标复盘工作区骨架")
    parser.add_argument("--name", required=True, help="项目名")
    parser.add_argument("--id", dest="case_id", default="", help="项目 ID，缺省按项目名生成")
    parser.add_argument("--retro-id", dest="retro_id", default="", help="复盘编号 rp-xx，缺省 rp-00")
    parser.add_argument("--country", default="", help="国别代码，如 CZ/DE/UK")
    parser.add_argument("--has-score-sheet", default="unknown",
                        choices=["true", "false", "unknown"], help="是否有正式评分表（决定 BR-13）")
    parser.add_argument("--out", default="", help="输出目录，缺省 docs/output/retro/<id>/")
    parser.add_argument("--force", action="store_true", help="覆盖已存在的骨架（谨慎：会丢弃已有内容）")
    args = parser.parse_args()

    case_id = args.case_id or "p-" + slug(args.name)[:24]
    retro_id = args.retro_id or "rp-00"
    if not re.fullmatch(r"rp-\d{2}", retro_id):
        print(f"[E] --retro-id 格式应为 rp-两位序号，当前 {retro_id!r}")
        return EXIT_USAGE
    out_dir = Path(args.out) if args.out else Path("docs/output/retro") / slug(retro_id)
    retro_path = out_dir / "retro.json"
    intake_path = out_dir / "intake.json"
    checklist_path = out_dir / "materials-checklist.md"

    if not args.force:
        existing = [p for p in (retro_path, intake_path) if p.exists()]
        if existing:
            print("[E] 目标已存在，未覆盖（如需重建请加 --force）:")
            for path in existing:
                print(f"  - {path}")
            return EXIT_INPUT

    has_score_sheet = None if args.has_score_sheet == "unknown" else args.has_score_sheet == "true"
    out_dir.mkdir(parents=True, exist_ok=True)

    retro = retro_payload(case_id, retro_id, args.name, args.country, has_score_sheet)
    retro_path.write_text(json.dumps(retro, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    intake_path.write_text(json.dumps(intake_payload(case_id, args.name), ensure_ascii=False, indent=2) + "\n",
                           encoding="utf-8")
    if CHECKLIST.exists():
        shutil.copyfile(CHECKLIST, checklist_path)

    print(f"已生成工作区: {out_dir}")
    print(f"  - {retro_path.name}   结构化产出（Step 3 写入目标）")
    print(f"  - {intake_path.name}  材料清单（Step 1 核对入口）")
    if CHECKLIST.exists():
        print(f"  - {checklist_path.name}  人工收集用清单")
    print("\n下一步（按顺序）:")
    print(f"  1. 填 intake.json 的 materials[].present/path → python scripts/check_inputs.py {intake_path.as_posix()}")
    print(f"  2. 按 references/retro-dimensions.md 复盘，把结果写进 {retro_path.as_posix()}")
    print(f"  3. 校验: python scripts/validate_retro.py {retro_path.as_posix()}")
    print(f"  4. 出报告: python scripts/render_report.py {retro_path.as_posix()}")
    if has_score_sheet is None:
        print("\n提示: hasScoreSheet 未定 → 先向用户确认；未确认前全部经验按 B 级上限处理（BR-13）。")
    elif has_score_sheet is False:
        print("\n提示: hasScoreSheet=false → 本项目全部经验最高 B 级（BR-13），校验脚本会拦截 A 级。")
    return EXIT_OK


if __name__ == "__main__":
    sys.exit(main())
