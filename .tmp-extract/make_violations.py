import copy
import json
import pathlib

base = pathlib.Path(__file__).resolve().parent
pos = json.loads((base.parent / ".agents/skills/danger/assets/examples/insights-p01.json").read_text(encoding="utf-8"))
neg = copy.deepcopy(pos)

neg["schemaVersion"] = "danger-1.0-draft"
neg["gate"] = {
    "confirmedParams": 38,
    "totalParams": 40,
    "conflictParams": 0,
    "conflictIds": [],
    "pendingParams": 0,
    "noEvidenceParams": 0,
    "noEvidenceIds": [],
    "mandatoryJudged": 7,
    "mandatoryTotal": 7,
    "mandatoryCompliant": 0,
    "draftAllowed": False,
    "draftBlockers": [],
    "submitAllowed": True,
    "submitBlockers": [],
    "computedAt": "2026-10-24",
}
neg["meta"]["blockedCount"] = 0
neg["submission"] = {"submittedBy": "u-01", "submittedAt": "11-06 17:02", "insightIds": ["ins-002"]}

ins = {i["id"]: i for i in neg["insights"]}
ins["ins-002"]["needsReverify"] = False
ins["ins-003"].update({"state": "adopted", "text": "竞对 A 未披露可用率，属明显劣势。", "blockReason": None, "audit": []})
ins["ins-005"].pop("diff", None)
ins["ins-006"]["text"] = "若业主接受竞对 A 的 DC 侧口径，我方效率项将显劣势。"
ins["ins-006"]["evidenceIds"] = ["anc-99"]
ins["ins-007"]["lowConfidence"] = True
ins["ins-008"]["text"] = "建议把交付确定性写入技术标，我方交付能力排名第一。"
ins["ins-009"].update({"state": "rejected", "rejectReason": ""})
ins["ins-010"]["id"] = "insight-010"

risks = neg["risks"]
risks[0]["level"] = "critical"
risks[1]["owner"] = "u-99"
risks[2].update({"state": "closed", "closeReason": None, "audit": []})
risks[3].update({"source": "risk-999", "relatedKeys": ["ghost_key"]})
risks.insert(0, risks.pop(4))

clrs = {c["id"]: c for c in neg["clarifications"]}
clrs["clr-01"]["question"] = (
    "系统往返效率的测量边界与辅助功耗是否计入，请业主明确测量位置、辅助功耗是否计入、测试温度与负载率等全部前置条件"
)
clrs["clr-02"]["evidenceIds"] = []

blank = neg["decisionBlank"]
blank.update(
    {
        "discountPct": 3.3,
        "discountBasis": "让利",
        "availabilityPct": 99.2,
        "systemGenerated": True,
        "filledBy": "u-01",
    }
)

out = base.parent / ".agents/skills/danger/assets/examples/insights-p01-violations.json"
out.write_text(json.dumps(neg, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
print("wrote", out)
