#!/usr/bin/env python3
"""相似项目匹配打分：国家 30 + 规模 25 + 技术路线 15 + 客户类型 15 + 合同模式 15。

输出强制包含「可借鉴（A/B）/ 待验证假设（C）」分区（BR-12）与逐维度差异条件。

用法:
    python scripts/score_match.py --target target.json --library experiences.json
                                  [--top 10] [--json match-result.json]

target.json 形如：
    {"caseId":"p-02","projectName":"德国 230MWh","country":"DE","mwh":230,
     "productModel":"MegaBlock 5.0","route":"LFP 液冷","customerType":"公用事业","contractMode":"EPC"}

退出码:
    0  匹配成功（至少 1 条候选）
    1  用法错误
    2  无候选 / 输入文件或 JSON 异常
    3  条目缺少打分必需字段（country / scaleBand 或 mwh / customerType / contractMode）
"""
from __future__ import annotations

import argparse
import json
import re
import sys
from pathlib import Path

EXIT_OK, EXIT_USAGE, EXIT_FAIL, EXIT_DATA = 0, 1, 2, 3

REGIONS = {"DE": "西欧", "UK": "西欧", "IT": "西欧", "CZ": "中东欧", "PL": "中东欧", "AU": "大洋洲"}
CUSTOMER_GROUPS = {
    "ipp 开发商": "开发商/IPP", "ipp": "开发商/IPP", "开发商": "开发商/IPP",
    "公用事业": "公用事业", "utility": "公用事业",
    "epc 总包": "EPC 总包", "epc": "EPC 总包",
    "工商业": "工商业", "ci": "工商业",
}
CONTRACT_NEAR = [{"EPC", "供货+运维"}, {"供货", "供货+运维"}, {"EPC", "BOT"}]
LEVELS = {"A", "B", "C"}


def parse_band(text: str) -> float | None:
    nums = [float(n) for n in re.findall(r"\d+(?:\.\d+)?", text or "")]
    if not nums:
        return None
    return sum(nums[:2]) / len(nums[:2])


def score_country(target: str, exp: str) -> tuple[int, str]:
    if not target or not exp:
        return 0, "国别数据缺失"
    if target.upper() == exp.upper():
        return 30, "同国"
    if REGIONS.get(target.upper()) and REGIONS.get(target.upper()) == REGIONS.get(exp.upper()):
        return 15, f"同区域（{REGIONS[target.upper()]}）"
    return 0, f"跨区域（{target.upper()} → {exp.upper()}）"


def score_scale(target_mwh: float, exp_mwh: float) -> tuple[int, str]:
    if not target_mwh or not exp_mwh:
        return 0, "规模数据缺失"
    ratio = max(target_mwh, exp_mwh) / min(target_mwh, exp_mwh)
    if ratio <= 1.2:
        return 25, f"规模相近（{ratio:.2f} 倍）"
    if ratio <= 2:
        return 15, f"规模差 {ratio:.2f} 倍"
    if ratio <= 4:
        return 5, f"规模差 {ratio:.2f} 倍（超 2 倍）"
    return 0, f"规模差 {ratio:.2f} 倍（超 4 倍，结构不可直接套用）"


def score_route(target: dict, exp: dict) -> tuple[int, str]:
    t_model, e_model = target.get("productModel", ""), exp.get("productModel", "")
    if t_model and t_model == e_model:
        return 15, "同型号"
    t_route, e_route = target.get("route", ""), exp.get("route", "")
    if t_route and t_route == e_route:
        return 10, f"同技术路线（{t_route}）"
    if t_route and e_route and t_route.split()[0] == e_route.split()[0]:
        return 6, f"同技术家族（{t_route.split()[0]}）"
    return 0, f"技术路线不同（{t_route or '未填'} → {e_route or '未填'}）"


def score_customer(target: str, exp: str) -> tuple[int, str]:
    if not target or not exp:
        return 0, "客户类型缺失"
    if target == exp:
        return 15, "同客户类型"
    tg, eg = CUSTOMER_GROUPS.get(target.strip().lower()), CUSTOMER_GROUPS.get(exp.strip().lower())
    if tg and tg == eg:
        return 8, f"同大类客户（{tg}）"
    return 0, f"客户类型不同（{target} → {exp}）"


def score_contract(target: str, exp: str) -> tuple[int, str]:
    if not target or not exp:
        return 0, "合同模式缺失"
    if target == exp:
        return 15, "同合同模式"
    if any(target in pair and exp in pair for pair in CONTRACT_NEAR):
        return 8, f"合同模式相近（{target} → {exp}）"
    return 0, f"合同模式不同（{target} → {exp}）"


def evaluate(target: dict, exp: dict) -> dict:
    exp_mwh = exp.get("mwh") or parse_band(exp.get("scaleBand", ""))
    dims = [
        ("国家匹配", *score_country(target.get("country", ""), exp.get("country", "")), 30),
        ("规模相近", *score_scale(target.get("mwh") or 0, exp_mwh or 0), 25),
        ("技术路线", *score_route(target, exp), 15),
        ("客户类型", *score_customer(target.get("customerType", ""), exp.get("customerType", "")), 15),
        ("合同模式", *score_contract(target.get("contractMode", ""), exp.get("contractMode", "")), 15),
    ]
    total = sum(d[1] for d in dims)
    hits = [f"{d[0]}（{d[2]}）" for d in dims if d[3] and d[1] == d[3]]
    diffs = [f"{d[0]}：{d[2]}" for d in dims if d[3] and d[1] < d[3]]
    return {"experience": exp, "score": total, "dims": dims, "hits": hits, "differences": diffs}


def is_deprecated(exp: dict) -> bool:
    return exp.get("state") == "deprecated" or exp.get("evidenceLevel") not in LEVELS


def render(target: dict, results: list[dict], top: int, note: str = "") -> str:
    lines = [f"# 相似项目匹配：{target.get('projectName', '(未命名)')}（{target.get('caseId', '-')}）", "",
             "> 匹配度仅作排序依据，**不代表经验可直接套用**。必须同时看「可借鉴点」与「差异条件」。"]
    if note:
        lines.append(f"> 数据说明：{note}")
    lines.append("")
    usable = [r for r in results if not is_deprecated(r["experience"])
              and r["experience"].get("evidenceLevel") in ("A", "B")]
    hypo = [r for r in results if not is_deprecated(r["experience"])
            and r["experience"].get("evidenceLevel") == "C"]
    deprecated = [r for r in results if is_deprecated(r["experience"])]

    lines.append(f"候选 {len(results)} 条：可借鉴（A/B）{len(usable)} 条、待验证假设（C）{len(hypo)} 条、"
                 f"停用/缺级 {len(deprecated)} 条。")
    lines.append("")

    lines.append("## 可借鉴（A/B 级）")
    lines.append("")
    if not usable:
        lines.append("_无 A/B 级命中经验。_")
    for rank, r in enumerate(usable[:top], 1):
        exp = r["experience"]
        lines.append(f"### {rank}. [{exp.get('id')}] {exp.get('title', '(无标题)')} — 匹配度 {r['score']}/100")
        lines.append("")
        lines.append(f"- 等级：{exp.get('evidenceLevel')}（{'可直接参照' if exp.get('evidenceLevel') == 'A' else '参照需附限制说明'}）")
        lines.append(f"- 经验库：{exp.get('category')}")
        lines.append(f"- 可借鉴点：{'；'.join(r['hits']) or '无'}；策略原文「{exp.get('strategy', '')}」")
        lines.append(f"- 差异条件：{'；'.join(r['differences']) or '无（五维全中）'}")
        lines.append(f"- 适用边界（scope 原文）：{exp.get('scope', '(未填)')}")
        source = exp.get("evidenceSources") or []
        lines.append(f"- 证据：{', '.join(source) if source else '(无来源，禁止入库)'}")
        lines.append("")

    lines.append("## 待验证假设（C 级，禁止作为结论）")
    lines.append("")
    if not hypo:
        lines.append("_无 C 级候选。_")
    for rank, r in enumerate(hypo[:top], 1):
        exp = r["experience"]
        lines.append(f"### {rank}. [{exp.get('id')}] {exp.get('title', '(无标题)')} — 匹配度 {r['score']}/100")
        lines.append("")
        lines.append(f"- 待验证点：{exp.get('verificationPlan') or '(缺验证计划，不得入库)'}")
        lines.append(f"- 可借鉴点（仅作假设）：{'；'.join(r['hits']) or '无'}")
        lines.append(f"- 差异条件：{'；'.join(r['differences']) or '无'}")
        lines.append("")

    if deprecated:
        lines.append("## 历史参考（等级异常/已停用，仅供追溯）")
        lines.append("")
        for r in deprecated[:top]:
            exp = r["experience"]
            lines.append(f"- [{exp.get('id')}] {exp.get('title')} — 等级 {exp.get('evidenceLevel')!r}，状态 {exp.get('state')!r}")
        lines.append("")

    lines.append("## 逐条差异条件汇总")
    lines.append("")
    lines.append("| 经验 | 匹配度 | 未命中维度 | 差异说明 |")
    lines.append("| --- | --- | --- | --- |")
    for r in results[:top]:
        exp = r["experience"]
        missed = [d[0] for d in r["dims"] if d[3] and d[1] < d[3]]
        lines.append(f"| {exp.get('id')} | {r['score']} | {'、'.join(missed) or '—'} | {'；'.join(r['differences']) or '—'} |")
    lines.append("")
    lines.append("> 引用任何经验前，按 BR-15 记录 references[]（projectId / citedBy / citedAt / usedIn）。")
    return "\n".join(lines) + "\n"


def main() -> int:
    if hasattr(sys.stdout, "reconfigure"):
        sys.stdout.reconfigure(encoding="utf-8", errors="replace")
    parser = argparse.ArgumentParser(description="相似项目匹配打分（可借鉴 / 差异条件 / 待验证假设）")
    parser.add_argument("--target", required=True, help="目标项目 JSON")
    parser.add_argument("--library", required=True, help="经验库 JSON（数组或 {experiences:[...]}）")
    parser.add_argument("--top", type=int, default=10, help="每个分区最多展示条数，默认 10")
    parser.add_argument("--json", dest="json_out", default="", help="把结果另存为 JSON")
    args = parser.parse_args()

    try:
        target = json.loads(Path(args.target).read_text(encoding="utf-8"))
        library = json.loads(Path(args.library).read_text(encoding="utf-8"))
    except FileNotFoundError as exc:
        print(f"[E] 文件不存在: {exc.filename}")
        return EXIT_FAIL
    except json.JSONDecodeError as exc:
        print(f"[E] JSON 解析失败 ({exc.lineno}:{exc.colno}): {exc.msg}")
        return EXIT_FAIL
    except OSError as exc:
        print(f"[E] 读取失败: {exc}")
        return EXIT_FAIL

    if not isinstance(target, dict):
        print("[E] target 必须是对象")
        return EXIT_FAIL
    entries = library.get("experiences") if isinstance(library, dict) else library
    if not isinstance(entries, list):
        print("[E] library 必须是数组或 {experiences: [...]}")
        return EXIT_FAIL

    for field in ("country", "customerType", "contractMode"):
        if not target.get(field):
            print(f"[E] target 缺少 {field}，五维打分无法完成")
            return EXIT_FAIL
    if not (target.get("mwh") or target.get("scaleBand")):
        print("[E] target 缺少 mwh（或 scaleBand），规模维度无法打分")
        return EXIT_FAIL

    invalid = []
    for idx, exp in enumerate(entries):
        if not isinstance(exp, dict):
            invalid.append(f"experiences[{idx}] 不是对象")
            continue
        missing = [f for f in ("country", "customerType", "contractMode") if not exp.get(f)]
        if not (exp.get("mwh") or parse_band(exp.get("scaleBand", ""))):
            missing.append("scaleBand/mwh")
        if missing:
            invalid.append(f"{exp.get('id', f'experiences[{idx}]')} 缺 {', '.join(missing)}")
    if invalid:
        print("[E] 以下条目缺少打分必需字段（不得猜补）:")
        for line in invalid:
            print(f"  - {line}")
        return EXIT_DATA

    results = [evaluate(target, exp) for exp in entries]
    if not results:
        print("[E] 经验库为空，无候选可匹配")
        return EXIT_FAIL
    results.sort(key=lambda r: (-r["score"], str(r["experience"].get("id"))))

    note = library.get("note", "") if isinstance(library, dict) else ""
    print(render(target, results, args.top, note))
    if args.json_out:
        payload = {
            "target": target,
            "results": [
                {"experienceId": r["experience"].get("id"), "title": r["experience"].get("title"),
                 "evidenceLevel": r["experience"].get("evidenceLevel"), "score": r["score"],
                 "dims": [{"name": d[0], "score": d[1], "max": d[3], "note": d[2]} for d in r["dims"]],
                 "usable": r["experience"].get("evidenceLevel") in ("A", "B"),
                 "hypothesis": r["experience"].get("evidenceLevel") == "C",
                 "differences": r["differences"]}
                for r in results
            ],
        }
        Path(args.json_out).write_text(json.dumps(payload, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
        print(f"匹配结果已写入 {args.json_out}", file=sys.stderr)
    return EXIT_OK


if __name__ == "__main__":
    sys.exit(main())
