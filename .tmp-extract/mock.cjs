var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

// src/app/core/mock/index.ts
var index_exports = {};
__export(index_exports, {
  ACTIVE_PROJECT_ID: () => ACTIVE_PROJECT_ID,
  AUDIT_EVENTS: () => AUDIT_EVENTS,
  AWARDED_PROJECTS: () => AWARDED_PROJECTS,
  CLARIFICATIONS: () => CLARIFICATIONS,
  COMPARISON_ROWS: () => COMPARISON_ROWS,
  COMPETITORS: () => COMPETITORS,
  CURRENT_USER_ID: () => CURRENT_USER_ID,
  DEFAULT_PERMISSIONS: () => DEFAULT_PERMISSIONS,
  DOCUMENTS: () => DOCUMENTS,
  DOC_PAGES: () => DOC_PAGES,
  EXPERIENCES: () => EXPERIENCES,
  FULFILMENTS: () => FULFILMENTS,
  INSIGHTS: () => INSIGHTS,
  LEVEL_CHANGES: () => LEVEL_CHANGES,
  PAGE_ANCHORS: () => PAGE_ANCHORS,
  PARAM_DEFS: () => PARAM_DEFS,
  PARAM_DEF_MAP: () => PARAM_DEF_MAP,
  PARAM_VALUES: () => PARAM_VALUES,
  PARSE_ISSUES: () => PARSE_ISSUES,
  PERMISSION_ACTIONS: () => PERMISSION_ACTIONS,
  PROJECTS: () => PROJECTS,
  REPORT_SNAPSHOTS: () => REPORT_SNAPSHOTS,
  REPORT_TEMPLATES: () => REPORT_TEMPLATES,
  REVIEW_TASKS: () => REVIEW_TASKS,
  RISK_ITEMS: () => RISK_ITEMS,
  ROLE_ORDER: () => ROLE_ORDER,
  USERS: () => USERS
});
module.exports = __toCommonJS(index_exports);

// src/app/core/mock/projects.ts
var GATE_TEMPLATE = [
  { key: "intake", label: "\u6444\u53D6" },
  { key: "extraction", label: "\u62BD\u53D6" },
  { key: "standardization", label: "\u6821\u9A8C" },
  { key: "comparison", label: "\u5BF9\u6BD4" },
  { key: "insight", label: "\u7814\u5224" }
];
function gates(doneCount, blocked) {
  return GATE_TEMPLATE.map((g, i) => {
    if (blocked && blocked.index === i) {
      return { key: g.key, label: g.label, state: "blocked", note: blocked.note };
    }
    if (i < doneCount) return { key: g.key, label: g.label, state: "done" };
    if (i === doneCount) return { key: g.key, label: g.label, state: "active" };
    return { key: g.key, label: g.label, state: "todo" };
  });
}
var PROJECTS = [
  {
    id: "p-01",
    name: "CZ-Morava 100MWh \u72EC\u7ACB\u50A8\u80FD",
    customer: "Morava Grid a.s.\uFF08\u865A\u6784\uFF09",
    country: "CZ",
    mw: 25,
    mwh: 100,
    route: "LFP \u6DB2\u51B7",
    deadline: "2026-11-08",
    stage: "comparison",
    customerType: "\u7535\u7F51\u516C\u53F8",
    contractMode: "EPC \u603B\u627F\u5305",
    completeness: 87,
    gates: gates(3),
    members: [
      { userId: "u-01", role: "engineer", lastActive: "2026-10-24T08:41:00" },
      { userId: "u-02", role: "bidManager", lastActive: "2026-10-24T08:05:00" },
      { userId: "u-03", role: "commercial", lastActive: "2026-10-23T17:22:00" },
      { userId: "u-04", role: "legal", lastActive: "2026-10-23T15:10:00" }
    ]
  },
  {
    id: "p-02",
    name: "DE-Lahn 200MWh \u7535\u7F51\u4FA7\u50A8\u80FD",
    customer: "Stadtwerk Lahn\uFF08\u865A\u6784\uFF09",
    country: "DE",
    mw: 50,
    mwh: 200,
    route: "LFP \u6DB2\u51B7",
    deadline: "2026-11-25",
    stage: "insight",
    customerType: "\u5E02\u653F\u516C\u7528\u4E8B\u4E1A",
    contractMode: "EPC \u603B\u627F\u5305",
    completeness: 96,
    gates: gates(4),
    members: [
      { userId: "u-02", role: "bidManager", lastActive: "2026-10-24T09:12:00" },
      { userId: "u-07", role: "engineer", lastActive: "2026-10-23T19:02:00" },
      { userId: "u-08", role: "commercial", lastActive: "2026-10-20T11:47:00" }
    ]
  },
  {
    id: "p-03",
    name: "UK-Northgate 60MWh \u914D\u50A8\u9879\u76EE",
    customer: "Northgate Energy Ltd.\uFF08\u865A\u6784\uFF09",
    country: "UK",
    mw: 15,
    mwh: 60,
    route: "LFP \u98CE\u51B7",
    deadline: "2026-10-30",
    stage: "extraction",
    customerType: "\u72EC\u7ACB\u53D1\u7535\u5546",
    contractMode: "\u8BBE\u5907\u4F9B\u8D27 + \u8C03\u8BD5",
    completeness: 42,
    gates: gates(1, { index: 2, note: "3 \u4EFD\u7ADE\u5BF9\u8D44\u6599\u665A\u4E8E\u8BA1\u5212\u5230\u8FBE\uFF0C\u6807\u51C6\u5316\u672A\u542F\u52A8" }),
    members: [
      { userId: "u-01", role: "engineer", lastActive: "2026-10-24T08:20:00" },
      { userId: "u-02", role: "bidManager", lastActive: "2026-10-23T21:04:00" },
      { userId: "u-06", role: "admin", lastActive: "2026-10-24T07:58:00" }
    ]
  }
];
var ACTIVE_PROJECT_ID = "p-01";

// src/app/core/mock/documents.ts
var DOCUMENTS = [
  {
    id: "doc-01",
    projectId: "p-01",
    name: "CZ-Morava_RFP_\u6280\u672F\u89C4\u8303\u4E66.pdf",
    type: "tender",
    reliability: "official",
    language: "\u82F1\u6587 / \u6377\u514B\u8BED",
    pages: 186,
    qualityScore: 96,
    parseStatus: "done",
    uploadedBy: "u-02",
    uploadedAt: "2026-10-14T10:12:00",
    hash: "a1f3\u20267c02"
  },
  {
    id: "doc-02",
    projectId: "p-01",
    name: "\u7ADE\u5BF9A_\u6280\u672F\u5E94\u7B54\u6587\u4EF6_v2.pdf",
    type: "competitorBid",
    reliability: "public",
    language: "\u82F1\u6587",
    pages: 212,
    qualityScore: 88,
    parseStatus: "done",
    uploadedBy: "u-01",
    uploadedAt: "2026-10-15T14:30:00",
    hash: "9b7e\u202641dd",
    competitorId: "c-a"
  },
  {
    id: "doc-03",
    projectId: "p-01",
    name: "\u7ADE\u5BF9B_PowerStack_\u4EA7\u54C1\u624B\u518C_EN.pdf",
    type: "competitorManual",
    reliability: "official",
    language: "\u82F1\u6587",
    pages: 96,
    qualityScore: 91,
    parseStatus: "done",
    uploadedBy: "u-01",
    uploadedAt: "2026-10-15T14:36:00",
    hash: "3c22\u20268ba9",
    competitorId: "c-b"
  },
  {
    id: "doc-04",
    projectId: "p-01",
    name: "2025_\u4FDD\u52A0\u5229\u4E9ABESS_\u4E2D\u6807\u516C\u793A\u6458\u8981.pdf",
    type: "awardNotice",
    reliability: "thirdParty",
    language: "\u82F1\u6587 / \u4FDD\u52A0\u5229\u4E9A\u8BED",
    pages: 24,
    qualityScore: 68,
    parseStatus: "review",
    uploadedBy: "u-03",
    uploadedAt: "2026-10-16T09:05:00",
    hash: "e5d1\u202690fe"
  },
  {
    id: "doc-05",
    projectId: "p-01",
    name: "Aster5000_\u89C4\u683C\u4E66_\u5185\u90E8v4.pdf",
    type: "ourProduct",
    reliability: "official",
    language: "\u4E2D\u6587",
    pages: 64,
    qualityScore: 98,
    parseStatus: "done",
    uploadedBy: "u-02",
    uploadedAt: "2026-10-13T16:44:00",
    hash: "77aa\u20262c31"
  },
  {
    id: "doc-06",
    projectId: "p-02",
    name: "DE-Lahn_RFQ_\u6280\u672F\u9644\u4EF6C.pdf",
    type: "tender",
    reliability: "official",
    language: "\u5FB7\u6587",
    pages: 148,
    qualityScore: 93,
    parseStatus: "done",
    uploadedBy: "u-02",
    uploadedAt: "2026-10-08T11:00:00",
    hash: "b8c0\u202611a4"
  },
  {
    id: "doc-07",
    projectId: "p-02",
    name: "\u7ADE\u5BF9C_GridVault_\u624B\u518C_DE.pdf",
    type: "competitorManual",
    reliability: "official",
    language: "\u5FB7\u6587",
    pages: 88,
    qualityScore: 89,
    parseStatus: "done",
    uploadedBy: "u-07",
    uploadedAt: "2026-10-09T09:22:00",
    hash: "cd31\u202655b7",
    competitorId: "c-c"
  },
  {
    id: "doc-08",
    projectId: "p-02",
    name: "\u7ADE\u5BF9D_\u6295\u6807\u6280\u672F\u6458\u8981_\u516C\u5F00\u7248.pdf",
    type: "competitorBid",
    reliability: "public",
    language: "\u5FB7\u6587 / \u82F1\u6587",
    pages: 132,
    qualityScore: 81,
    parseStatus: "done",
    uploadedBy: "u-07",
    uploadedAt: "2026-10-10T15:18:00",
    hash: "1ec9\u20267f60",
    competitorId: "c-d"
  },
  {
    id: "doc-09",
    projectId: "p-02",
    name: "Aster5000_\u7CFB\u7EDF\u96C6\u6210\u8BF4\u660E_\u5185\u90E8.pdf",
    type: "ourProduct",
    reliability: "official",
    language: "\u4E2D\u6587",
    pages: 52,
    qualityScore: 97,
    parseStatus: "done",
    uploadedBy: "u-02",
    uploadedAt: "2026-10-07T13:30:00",
    hash: "40ba\u2026c9d2"
  },
  {
    id: "doc-10",
    projectId: "p-02",
    name: "\u5FB7\u56FD_2024Q4_\u50A8\u80FD\u4E2D\u6807\u7ED3\u679C\u6C47\u603B.xlsx",
    type: "awardNotice",
    reliability: "thirdParty",
    language: "\u5FB7\u6587",
    pages: 12,
    qualityScore: 72,
    parseStatus: "review",
    uploadedBy: "u-08",
    uploadedAt: "2026-10-11T10:05:00",
    hash: "d5e7\u20263301"
  },
  {
    id: "doc-11",
    projectId: "p-03",
    name: "UK-Northgate_ITT_\u4E3B\u6587\u4EF6.pdf",
    type: "tender",
    reliability: "official",
    language: "\u82F1\u6587",
    pages: 164,
    qualityScore: 94,
    parseStatus: "done",
    uploadedBy: "u-02",
    uploadedAt: "2026-10-21T09:40:00",
    hash: "aa19\u2026e7c5"
  },
  {
    id: "doc-12",
    projectId: "p-03",
    name: "\u7ADE\u5BF9E_UrbanStore_\u4EA7\u54C1\u624B\u518C.pdf",
    type: "competitorManual",
    reliability: "public",
    language: "\u82F1\u6587",
    pages: 74,
    qualityScore: 66,
    parseStatus: "review",
    uploadedBy: "u-01",
    uploadedAt: "2026-10-22T16:12:00",
    hash: "2f88\u20260a3d",
    competitorId: "c-e"
  },
  {
    id: "doc-13",
    projectId: "p-03",
    name: "\u7ADE\u5BF9E_\u6280\u672F\u5E94\u7B54_\u626B\u63CF\u4EF6.pdf",
    type: "competitorBid",
    reliability: "unknown",
    language: "\u82F1\u6587",
    pages: 178,
    qualityScore: 41,
    parseStatus: "failed",
    uploadedBy: "u-01",
    uploadedAt: "2026-10-23T08:55:00",
    hash: "6b40\u202692ea",
    competitorId: "c-e"
  },
  {
    id: "doc-14",
    projectId: "p-03",
    name: "\u7ADE\u5BF9F_\u73B0\u573A\u94ED\u724C\u7167\u7247\u5408\u96C6.pdf",
    type: "other",
    reliability: "unknown",
    language: "\u82F1\u6587",
    pages: 18,
    qualityScore: 37,
    parseStatus: "failed",
    uploadedBy: "u-01",
    uploadedAt: "2026-10-23T09:03:00",
    hash: "c812\u20264d77",
    competitorId: "c-f"
  }
];
var PARSE_ISSUES = [
  {
    id: "iss-01",
    documentId: "doc-04",
    kind: "missingPage",
    severity: "high",
    page: 11,
    text: "\u68C0\u6D4B\u5230\u9875\u7801\u5E8F\u5217\u65AD\u70B9\uFF1A\u7B2C 11 \u9875\u540E\u76F4\u63A5\u8DF3\u81F3\u7B2C 13 \u9875\uFF0C\u7591\u4F3C\u7F3A\u9875\u3002",
    handled: false
  },
  {
    id: "iss-02",
    documentId: "doc-04",
    kind: "lowOcr",
    severity: "mid",
    page: 6,
    text: "\u8BE5\u9875\u4E3A\u53CC\u680F\u626B\u63CF\u4EF6\uFF0COCR \u5E73\u5747\u7F6E\u4FE1\u5EA6 0.72\uFF0C\u6570\u5B57\u8BC6\u522B\u5B58\u5728\u98CE\u9669\u3002",
    handled: false
  },
  {
    id: "iss-03",
    documentId: "doc-02",
    kind: "crossPageTable",
    severity: "mid",
    page: 37,
    text: "\u6280\u672F\u53C2\u6570\u8868\u8DE8 P.37\u2013P.38 \u65AD\u88C2\uFF0C\u5DF2\u62C6\u5206\u4E3A\u4E24\u5F20\u5E76\u4FDD\u7559\u5173\u8054\u5173\u7CFB\u3002",
    handled: true
  },
  {
    id: "iss-04",
    documentId: "doc-08",
    kind: "imageParam",
    severity: "mid",
    page: 54,
    text: "\u53C2\u6570\u4EE5\u66F2\u7EBF\u56FE\u5F62\u5F0F\u7ED9\u51FA\uFF08\u8870\u51CF\u66F2\u7EBF\uFF09\uFF0C\u5DF2\u62BD\u53D6\u56FE\u50CF\uFF0C\u672A\u5F3A\u884C\u8BFB\u6570\u3002",
    handled: false
  },
  {
    id: "iss-05",
    documentId: "doc-13",
    kind: "lowOcr",
    severity: "high",
    page: 1,
    text: "\u5168\u7BC7\u4E3A\u4F4E\u5206\u8FA8\u7387\u626B\u63CF\u4EF6\uFF0C\u6587\u672C\u5C42\u4E3A\u7A7A\uFF0COCR \u7F6E\u4FE1\u5EA6\u4E0D\u8DB3 0.5\uFF0C\u89E3\u6790\u4E2D\u6B62\u3002",
    handled: false
  },
  {
    id: "iss-06",
    documentId: "doc-14",
    kind: "imageParam",
    severity: "low",
    page: 3,
    text: "\u56FE\u7247\u5185\u94ED\u724C\u6587\u5B57\u6A21\u7CCA\uFF0C\u65E0\u6CD5\u8BC6\u522B\u578B\u53F7\u4E0E\u5E8F\u5217\u53F7\u3002",
    handled: false
  }
];
var PAGE_ANCHORS = [
  { id: "anc-01", documentId: "doc-01", page: 12, section: "3.2 \u7CFB\u7EDF\u6027\u80FD\u8981\u6C42", paramKey: "system_rte", paramLabel: "\u7CFB\u7EDF\u5F80\u8FD4\u6548\u7387", snippet: "AC-AC round trip efficiency shall be not less than 88%", confidence: 0.97 },
  { id: "anc-02", documentId: "doc-01", page: 13, section: "3.2 \u7CFB\u7EDF\u6027\u80FD\u8981\u6C42", paramKey: "cycle_life", paramLabel: "\u5FAA\u73AF\u5BFF\u547D", snippet: "not less than 8000 cycles at 90% DoD, 25\xB0C, end of life 70% SoH", confidence: 0.95 },
  { id: "anc-03", documentId: "doc-01", page: 14, section: "3.3 \u8D28\u4FDD\u4E0E\u53EF\u7528\u7387", paramKey: "availability", paramLabel: "\u53EF\u7528\u7387\u4FDD\u8BC1", snippet: "annual availability of at least 98% calculated on a time-weighted basis", confidence: 0.93 },
  { id: "anc-04", documentId: "doc-01", page: 15, section: "3.3 \u8D28\u4FDD\u4E0E\u53EF\u7528\u7387", paramKey: "warranty_years", paramLabel: "\u8D28\u4FDD\u5E74\u9650", snippet: "warranty period of 10 years from commercial operation date", confidence: 0.96 },
  { id: "anc-05", documentId: "doc-01", page: 22, section: "4.1 \u5E76\u7F51\u8981\u6C42", paramKey: "grid_code", paramLabel: "\u5E76\u7F51\u6807\u51C6", snippet: "compliance with EN 50549-1/-2 and local grid code of the Czech Republic", confidence: 0.9 },
  { id: "anc-06", documentId: "doc-01", page: 31, section: "6 \u4EA4\u4ED8\u8BA1\u5212", paramKey: "lead_time", paramLabel: "\u4EA4\u4ED8\u5468\u671F", snippet: "delivery within 30 weeks from contract signature", confidence: 0.94 },
  { id: "anc-07", documentId: "doc-02", page: 37, section: "5.1 Efficiency", paramKey: "system_rte", paramLabel: "\u7CFB\u7EDF\u5F80\u8FD4\u6548\u7387", snippet: "up to 92% round trip efficiency measured at DC terminals", confidence: 0.88 },
  { id: "anc-08", documentId: "doc-02", page: 38, section: "5.2 Cycle life", paramKey: "cycle_life", paramLabel: "\u5FAA\u73AF\u5BFF\u547D", snippet: "up to 12000 cycles, conditions to be confirmed per project", confidence: 0.61 },
  { id: "anc-09", documentId: "doc-02", page: 41, section: "5.4 Warranty", paramKey: "warranty_years", paramLabel: "\u8D28\u4FDD\u5E74\u9650", snippet: "10 years for battery cells, 5 years for PCS", confidence: 0.9 },
  { id: "anc-10", documentId: "doc-02", page: 44, section: "5.6 Delivery", paramKey: "lead_time", paramLabel: "\u4EA4\u4ED8\u5468\u671F", snippet: "typical delivery 24 weeks excluding sea freight", confidence: 0.72 },
  { id: "anc-11", documentId: "doc-02", page: 47, section: "5.7 Safety", paramKey: "fire_suppression", paramLabel: "\u6D88\u9632\u65B9\u6848", snippet: "aerosol based suppression plus NFPA 68 deflagration venting", confidence: 0.86 },
  { id: "anc-12", documentId: "doc-03", page: 18, section: "Product specification", paramKey: "rated_energy", paramLabel: "\u989D\u5B9A\u80FD\u91CF", snippet: "5.0 MWh nominal energy per 20ft container", confidence: 0.95 },
  { id: "anc-13", documentId: "doc-03", page: 19, section: "Product specification", paramKey: "system_rte", paramLabel: "\u7CFB\u7EDF\u5F80\u8FD4\u6548\u7387", snippet: "89% AC-AC efficiency excluding auxiliary consumption", confidence: 0.83 },
  { id: "anc-14", documentId: "doc-03", page: 21, section: "Product specification", paramKey: "availability", paramLabel: "\u53EF\u7528\u7387\u4FDD\u8BC1", snippet: "99% availability on a monthly reporting basis", confidence: 0.79 },
  { id: "anc-15", documentId: "doc-03", page: 24, section: "Certification", paramKey: "certifications", paramLabel: "\u8BA4\u8BC1\u6E05\u5355", snippet: "UL 9540, IEC 62619, EN 50549, CE pending for new model", confidence: 0.87 },
  { id: "anc-16", documentId: "doc-05", page: 9, section: "2.1 \u7CFB\u7EDF\u53C2\u6570", paramKey: "system_rte", paramLabel: "\u7CFB\u7EDF\u5F80\u8FD4\u6548\u7387", snippet: "\u7CFB\u7EDF\u5F80\u8FD4\u6548\u7387 88.5%\uFF08AC-AC\uFF0C\u542B\u8F85\u52A9\u529F\u8017\uFF0C25\u2103\uFF0C0.5C\uFF09", confidence: 0.99 },
  { id: "anc-17", documentId: "doc-05", page: 10, section: "2.1 \u7CFB\u7EDF\u53C2\u6570", paramKey: "cycle_life", paramLabel: "\u5FAA\u73AF\u5BFF\u547D", snippet: "\u5FAA\u73AF\u5BFF\u547D 8500 \u6B21\uFF08DoD 90%\uFF0C25\u2103\uFF0CSoH 70%\uFF09", confidence: 0.98 },
  { id: "anc-18", documentId: "doc-05", page: 12, section: "2.3 \u8D28\u4FDD", paramKey: "availability", paramLabel: "\u53EF\u7528\u7387\u4FDD\u8BC1", snippet: "\u5E74\u53EF\u7528\u7387\u4FDD\u8BC1 98.5%\uFF0C\u6309\u65F6\u95F4\u52A0\u6743\u7EDF\u8BA1", confidence: 0.97 }
];
var DOC_PAGES = {
  "doc-01": [
    {
      page: 12,
      section: "3.2 \u7CFB\u7EDF\u6027\u80FD\u8981\u6C42",
      lines: [
        "3.2 System performance requirements",
        "The BESS shall be designed for a continuous discharge duration of 4 hours at the point of connection.",
        "AC-AC round trip efficiency shall be not less than 88%, measured at the grid side terminals,",
        "including auxiliary consumption of thermal management and control systems at 25\xB0C ambient.",
        "All efficiency figures shall be supported by a type test report from an accredited laboratory."
      ]
    },
    {
      page: 13,
      section: "3.2 \u7CFB\u7EDF\u6027\u80FD\u8981\u6C42",
      lines: [
        "3.2.4 Battery degradation",
        "The battery system shall provide not less than 8000 cycles at 90% DoD, 25\xB0C, end of life 70% SoH,",
        "with a capacity retention curve submitted as part of the technical bid.",
        "Cycles claimed under different depth of discharge or temperature conditions will be normalised",
        "by the purchaser prior to evaluation and may lead to clarification requests."
      ]
    },
    {
      page: 14,
      section: "3.3 \u8D28\u4FDD\u4E0E\u53EF\u7528\u7387",
      lines: [
        "3.3 Warranty and availability",
        "The supplier shall guarantee an annual availability of at least 98% calculated on a time-weighted basis,",
        "excluding force majeure and grid operator instructions.",
        "Availability below the guaranteed value shall trigger liquidated damages as defined in Annex G.",
        "Monthly reporting shall follow the format in Annex H; deviations are subject to clarification."
      ]
    }
  ],
  "doc-02": [
    {
      page: 37,
      section: "5.1 Efficiency",
      lines: [
        "5.1 System efficiency",
        "Our containerised solution achieves up to 92% round trip efficiency measured at DC terminals",
        "under 25\xB0C ambient and 0.5C charge/discharge rate.",
        "Efficiency at AC terminals depends on the selected PCS and transformer configuration;",
        "auxiliary consumption is not included in the figure above."
      ]
    },
    {
      page: 38,
      section: "5.2 Cycle life",
      lines: [
        "5.2 Cycle life and degradation",
        "The LFP cells support up to 12000 cycles, conditions to be confirmed per project.",
        "A project specific degradation curve can be provided upon request after the technical kick-off.",
        "Capacity retention is warranted against the agreed test profile, subject to commercial negotiation."
      ]
    },
    {
      page: 44,
      section: "5.6 Delivery",
      lines: [
        "5.6 Delivery schedule",
        "Typical delivery 24 weeks excluding sea freight and local permitting.",
        "Factory acceptance test (FAT) is performed at our European assembly partner.",
        "Site commissioning requires an additional 2 weeks subject to grid connection approval."
      ]
    }
  ],
  "doc-03": [
    {
      page: 18,
      section: "Product specification",
      lines: [
        "PowerStack container specification",
        "5.0 MWh nominal energy per 20ft container, liquid cooled, 4h duration configuration.",
        "DC block efficiency 95.5%, system efficiency depends on PCS selection."
      ]
    },
    {
      page: 19,
      section: "Product specification",
      lines: [
        "Efficiency and auxiliary load",
        "89% AC-AC efficiency excluding auxiliary consumption, at 25\xB0C, 0.5C.",
        "Auxiliary consumption at nominal operation: 1.8% of rated power."
      ]
    },
    {
      page: 21,
      section: "Product specification",
      lines: [
        "Availability and service",
        "99% availability on a monthly reporting basis, backed by a 24/7 remote monitoring centre.",
        "Annual service visit included for the first three years of operation."
      ]
    }
  ]
};

// src/app/core/mock/competitors.ts
var COMPETITORS = [
  {
    id: "c-a",
    name: "\u7ADE\u5BF9 A",
    tier: 1,
    regions: ["DE", "UK", "CZ", "AU"],
    models: [
      { name: "Megablock 5.0", mwh: 5, note: "\u6DB2\u51B7\u4E00\u4F53\u5316\uFF0CDC \u4FA7\u6548\u7387\u6807\u79F0\u9AD8" },
      { name: "Megablock 3.9", mwh: 3.9, note: "\u4E0A\u4E00\u4EE3\uFF0C\u6B27\u6D32\u5728\u8FD0\u8F83\u591A" }
    ],
    paramHistory: [
      { defKey: "system_rte", label: "\u7CFB\u7EDF\u5F80\u8FD4\u6548\u7387", value: "92%", unit: "%", source: "\u516C\u5F00\u4EA7\u54C1\u624B\u518C 2026-03", date: "2026-03-18", stale: false },
      { defKey: "cycle_life", label: "\u5FAA\u73AF\u5BFF\u547D", value: "12000\uFF08\u6761\u4EF6\u5F85\u786E\u8BA4\uFF09", unit: "\u6B21", source: "\u6295\u6807\u6587\u4EF6 P.38", date: "2026-10-15", stale: false },
      { defKey: "warranty_years", label: "\u8D28\u4FDD\u5E74\u9650", value: "10 \u5E74\u7535\u82AF + 5 \u5E74 PCS", unit: "\u5E74", source: "\u6295\u6807\u6587\u4EF6 P.41", date: "2026-10-15", stale: false },
      { defKey: "lead_time", label: "\u4EA4\u4ED8\u5468\u671F", value: "24 \u5468\uFF08\u4E0D\u542B\u6D77\u8FD0\uFF09", unit: "\u5468", source: "\u6295\u6807\u6587\u4EF6 P.44", date: "2026-10-15", stale: false }
    ],
    projects: [
      { name: "\u4FDD\u52A0\u5229\u4E9A BESS \u4E00\u671F", result: "win", year: 2025 },
      { name: "\u6377\u514B Chvaletice \u9879\u76EE", result: "unknown", year: 2025 },
      { name: "\u5FB7\u56FD\u52C3\u5170\u767B\u5821\u50A8\u80FD", result: "lose", year: 2024 }
    ]
  },
  {
    id: "c-b",
    name: "\u7ADE\u5BF9 B",
    tier: 1,
    regions: ["UK", "DE", "IT"],
    models: [{ name: "PowerStack 5000", mwh: 5, note: "AC-AC \u6548\u7387\u6807\u79F0\u7A33\u5065\uFF0C\u670D\u52A1\u7F51\u7EDC\u5F3A" }],
    paramHistory: [
      { defKey: "system_rte", label: "\u7CFB\u7EDF\u5F80\u8FD4\u6548\u7387", value: "89%\uFF08AC-AC\uFF0C\u4E0D\u542B\u8F85\u52A9\uFF09", unit: "%", source: "\u4EA7\u54C1\u624B\u518C P.19", date: "2026-06-02", stale: false },
      { defKey: "availability", label: "\u53EF\u7528\u7387\u4FDD\u8BC1", value: "99%\uFF08\u6708\u5EA6\u53E3\u5F84\uFF09", unit: "%", source: "\u4EA7\u54C1\u624B\u518C P.21", date: "2026-06-02", stale: false },
      { defKey: "certifications", label: "\u8BA4\u8BC1\u6E05\u5355", value: "UL9540 / IEC62619 / EN50549\uFF0C\u90E8\u5206\u5F85\u53D1\u8BC1", unit: "\u2014", source: "\u4EA7\u54C1\u624B\u518C P.24", date: "2026-06-02", stale: false },
      { defKey: "system_rte", label: "\u7CFB\u7EDF\u5F80\u8FD4\u6548\u7387", value: "87%\uFF08AC-AC\uFF0C\u4E0D\u542B\u8F85\u52A9\uFF09", unit: "%", source: "2024 \u5E74\u65E7\u7248\u624B\u518C", date: "2024-05-11", stale: true }
    ],
    projects: [
      { name: "\u82F1\u56FD 1.2GW \u6846\u67B6", result: "win", year: 2025 },
      { name: "\u610F\u5927\u5229\u6492\u4E01\u5C9B\u72EC\u7ACB\u50A8\u80FD", result: "win", year: 2025 }
    ]
  },
  {
    id: "c-c",
    name: "\u7ADE\u5BF9 C",
    tier: 2,
    regions: ["DE", "PL"],
    models: [{ name: "GridVault 4.2", mwh: 4.2, note: "\u4EF7\u683C\u6FC0\u8FDB\uFF0C\u4EA4\u4ED8\u5468\u671F\u77ED" }],
    paramHistory: [
      { defKey: "system_rte", label: "\u7CFB\u7EDF\u5F80\u8FD4\u6548\u7387", value: "88.2%\uFF08AC-AC\uFF09", unit: "%", source: "\u5FB7\u6587\u624B\u518C 2026-04", date: "2026-04-09", stale: false },
      { defKey: "lead_time", label: "\u4EA4\u4ED8\u5468\u671F", value: "20 \u5468", unit: "\u5468", source: "\u5FB7\u6587\u624B\u518C 2026-04", date: "2026-04-09", stale: false },
      { defKey: "cycle_life", label: "\u5FAA\u73AF\u5BFF\u547D", value: "9000 \u6B21\uFF08DoD 90%/25\u2103\uFF09", unit: "\u6B21", source: "\u5FB7\u6587\u624B\u518C 2026-04", date: "2026-04-09", stale: false }
    ],
    projects: [{ name: "\u6CE2\u5170 50MWh \u9879\u76EE", result: "lose", year: 2025 }]
  },
  {
    id: "c-d",
    name: "\u7ADE\u5BF9 D",
    tier: 2,
    regions: ["DE", "CZ", "IT"],
    models: [{ name: "TerraStore 5.2", mwh: 5.2, note: "\u5B89\u5168\u8BA4\u8BC1\u9F50\u5168\uFF0C\u5546\u52A1\u6761\u6B3E\u4E25\u683C" }],
    paramHistory: [
      { defKey: "fire_suppression", label: "\u6D88\u9632\u65B9\u6848", value: "\u5168\u6C1F\u5DF1\u916E + NFPA 69 \u9632\u7206", unit: "\u2014", source: "\u6295\u6807\u6458\u8981 P.29", date: "2026-10-10", stale: false },
      { defKey: "availability", label: "\u53EF\u7528\u7387\u4FDD\u8BC1", value: "98%\uFF08\u5E74\u5EA6\u53E3\u5F84\uFF09", unit: "%", source: "\u6295\u6807\u6458\u8981 P.33", date: "2026-10-10", stale: false },
      { defKey: "warranty_years", label: "\u8D28\u4FDD\u5E74\u9650", value: "12 \u5E74\uFF08\u9700\u5EF6\u4FDD\u5408\u540C\uFF09", unit: "\u5E74", source: "\u6295\u6807\u6458\u8981 P.36", date: "2026-10-10", stale: false }
    ],
    projects: [{ name: "\u5FB7\u56FD\u4E0B\u8428\u514B\u68EE 80MWh", result: "win", year: 2024 }]
  },
  {
    id: "c-e",
    name: "\u7ADE\u5BF9 E",
    tier: 2,
    regions: ["UK", "AU"],
    models: [{ name: "UrbanStore 3.6", mwh: 3.6, note: "\u4E2D\u5C0F\u578B\u9879\u76EE\u4E3A\u4E3B\uFF0C\u4EF7\u683C\u4F18\u52BF\u660E\u663E" }],
    paramHistory: [
      { defKey: "system_rte", label: "\u7CFB\u7EDF\u5F80\u8FD4\u6548\u7387", value: "87.5%", unit: "%", source: "\u4EA7\u54C1\u624B\u518C 2025-11", date: "2025-11-20", stale: true },
      { defKey: "rated_energy", label: "\u989D\u5B9A\u80FD\u91CF", value: "3.6 MWh", unit: "MWh", source: "\u4EA7\u54C1\u624B\u518C 2025-11", date: "2025-11-20", stale: true }
    ],
    projects: [{ name: "\u82F1\u56FD 60MWh \u914D\u50A8\uFF08\u672C\u6B21\uFF09", result: "unknown", year: 2026 }]
  },
  {
    id: "c-f",
    name: "\u7ADE\u5BF9 F\uFF08\u4E2D\u56FD\u540C\u4FAA\uFF09",
    tier: 3,
    regions: ["CZ", "PL", "IT"],
    models: [{ name: "\u672A\u83B7\u53D6\u578B\u53F7", mwh: 0, note: "\u4EC5\u83B7\u53D6\u73B0\u573A\u94ED\u724C\u7167\u7247\uFF0C\u4FE1\u606F\u4E0D\u5B8C\u6574" }],
    paramHistory: [
      { defKey: "rated_energy", label: "\u989D\u5B9A\u80FD\u91CF", value: "\u672A\u8BC6\u522B", unit: "\u2014", source: "\u94ED\u724C\u7167\u7247\uFF08\u89E3\u6790\u5931\u8D25\uFF09", date: "2026-10-23", stale: false }
    ],
    projects: [{ name: "\u4E1C\u5357\u6B27 3 \u4E2A\u5728\u5EFA\u9879\u76EE", result: "unknown", year: 2025 }]
  }
];

// src/app/core/mock/params.ts
var DEF_ROWS = [
  // technical
  ["rated_power", "\u989D\u5B9A\u529F\u7387", "MW", "technical", "system", [], ["Rated Power", "Pnom"]],
  ["rated_energy", "\u989D\u5B9A\u80FD\u91CF", "MWh", "technical", "system", [], ["Nominal Energy", "Rated Capacity"]],
  ["usable_energy", "\u53EF\u7528\u80FD\u91CF", "MWh", "technical", "system", ["dod", "sohEnd"], ["Usable Energy", "Usable Capacity"]],
  ["duration", "\u6301\u7EED\u653E\u7535\u65F6\u957F", "h", "technical", "system", [], ["Duration", "Discharge Duration"]],
  ["dc_ac_ratio", "DC/AC \u6BD4", "\u2014", "technical", "system", [], ["DC/AC Ratio"]],
  ["footprint", "\u5360\u5730\u9762\u79EF", "m\xB2", "technical", "plant", [], ["Footprint", "Area"]],
  ["weight", "\u7CFB\u7EDF\u91CD\u91CF", "t", "technical", "system", [], ["Weight"]],
  ["cell_type", "\u7535\u82AF\u7C7B\u578B", "\u2014", "technical", "cell", [], ["Cell Chemistry", "Cell Type"]],
  ["cell_config", "\u6210\u7EC4\u65B9\u5F0F", "\u2014", "technical", "module", [], ["Configuration"]],
  ["thermal_type", "\u6E29\u63A7\u65B9\u5F0F", "\u2014", "technical", "system", [], ["Thermal Management", "Cooling"]],
  ["ip_rating", "\u9632\u62A4\u7B49\u7EA7", "IP", "technical", "rack", [], ["IP Rating", "Ingress Protection"]],
  ["noise", "\u566A\u58F0", "dB(A)", "technical", "plant", [], ["Noise Level", "Acoustic"]],
  // performance
  ["system_rte", "\u7CFB\u7EDF\u5F80\u8FD4\u6548\u7387", "%", "performance", "system", ["boundary", "temperature", "loadRate"], ["Round Trip Efficiency", "RTE", "System Efficiency"]],
  ["pcs_efficiency", "PCS \u6548\u7387", "%", "performance", "rack", ["loadRate"], ["PCS Efficiency", "Inverter Efficiency"]],
  ["aux_consumption", "\u8F85\u52A9\u529F\u8017", "%", "performance", "system", ["loadRate"], ["Auxiliary Consumption", "Parasitic Load"]],
  ["standby_loss", "\u5F85\u673A\u635F\u8017", "kW", "performance", "system", [], ["Standby Loss", "No-load Loss"]],
  ["cycle_life", "\u5FAA\u73AF\u5BFF\u547D", "\u6B21", "performance", "cell", ["dod", "temperature", "sohEnd"], ["Cycle Life", "Cycles"]],
  ["degradation", "\u5BB9\u91CF\u8870\u51CF\u4FDD\u8BC1", "%/\u5E74", "performance", "system", ["temperature"], ["Degradation", "Capacity Retention"]],
  ["calendar_life", "\u65E5\u5386\u5BFF\u547D", "\u5E74", "performance", "cell", ["temperature"], ["Calendar Life"]],
  ["temp_range", "\u5DE5\u4F5C\u6E29\u5EA6\u533A\u95F4", "\u2103", "performance", "system", [], ["Operating Temperature"]],
  ["derating", "\u9AD8\u4F4E\u6E29\u964D\u989D", "\u2014", "performance", "system", ["temperature"], ["Derating Strategy"]],
  ["response_time", "\u54CD\u5E94\u65F6\u95F4", "ms", "performance", "system", [], ["Response Time"]],
  // safety
  ["fire_suppression", "\u6D88\u9632\u65B9\u6848", "\u2014", "safety", "system", [], ["Fire Suppression", "Fire Fighting"]],
  ["certifications", "\u8BA4\u8BC1\u6E05\u5355", "\u2014", "safety", "system", [], ["Certifications", "Certificates"]],
  ["grid_code", "\u5E76\u7F51\u6807\u51C6", "\u2014", "safety", "plant", [], ["Grid Code", "Grid Compliance"]],
  ["lvrt", "\u4F4E\u7535\u538B\u7A7F\u8D8A", "\u2014", "safety", "plant", [], ["LVRT", "Fault Ride Through"]],
  ["thd", "\u7535\u6D41\u8C10\u6CE2\u7578\u53D8", "%", "safety", "plant", ["loadRate"], ["THD", "Harmonics"]],
  ["pf_range", "\u529F\u7387\u56E0\u6570\u8303\u56F4", "\u2014", "safety", "plant", [], ["Power Factor Range"]],
  ["anti_island", "\u9632\u5B64\u5C9B\u4FDD\u62A4", "\u2014", "safety", "plant", [], ["Anti-islanding"]],
  // warranty
  ["availability", "\u53EF\u7528\u7387\u4FDD\u8BC1", "%", "warranty", "plant", ["period"], ["Availability", "Availability Guarantee"]],
  ["warranty_years", "\u8D28\u4FDD\u5E74\u9650", "\u5E74", "warranty", "system", [], ["Warranty Period", "Warranty"]],
  ["extended_warranty", "\u5EF6\u4FDD\u65B9\u6848", "\u5E74", "warranty", "system", [], ["Extended Warranty"]],
  ["capacity_warranty", "\u5BB9\u91CF\u4FDD\u8BC1", "%", "warranty", "system", ["sohEnd"], ["Capacity Warranty", "Energy Retention"]],
  // delivery
  ["lead_time", "\u4EA4\u4ED8\u5468\u671F", "\u5468", "delivery", "system", [], ["Lead Time", "Delivery Time"]],
  ["local_service", "\u672C\u5730\u670D\u52A1\u80FD\u529B", "\u2014", "delivery", "plant", [], ["Local Service", "Service Network"]],
  ["om_model", "\u8FD0\u7EF4\u6A21\u5F0F", "\u2014", "delivery", "plant", [], ["O&M Model", "Service Model"]],
  ["spare_parts", "\u5907\u4EF6\u4FDD\u969C", "\u2014", "delivery", "plant", [], ["Spare Parts"]],
  ["commissioning", "\u5E76\u7F51\u8C03\u8BD5\u5468\u671F", "\u5468", "delivery", "plant", [], ["Commissioning"]],
  ["training", "\u57F9\u8BAD\u6295\u5165", "\u4EBA\u65E5", "delivery", "plant", [], ["Training"]],
  // commercial
  ["price_structure", "\u62A5\u4EF7\u7ED3\u6784", "\u2014", "commercial", "plant", [], ["Price Structure"]],
  ["payment_terms", "\u4ED8\u6B3E\u6761\u4EF6", "\u2014", "commercial", "plant", [], ["Payment Terms"]],
  ["performance_bond", "\u5C65\u7EA6\u4FDD\u51FD", "%", "commercial", "plant", [], ["Performance Bond"]],
  ["liquidated_damages", "\u8FDD\u7EA6\u8D54\u507F", "%/\u5468", "commercial", "plant", [], ["Liquidated Damages", "LD"]],
  ["insurance", "\u4FDD\u9669\u8981\u6C42", "\u2014", "commercial", "plant", [], ["Insurance"]],
  ["currency", "\u7ED3\u7B97\u5E01\u79CD", "\u2014", "commercial", "plant", [], ["Currency"]],
  ["price_index", "\u4EF7\u683C\u8C03\u6574\u673A\u5236", "\u2014", "commercial", "plant", [], ["Price Indexation"]],
  ["tax_note", "\u7A0E\u52A1\u53E3\u5F84", "\u2014", "commercial", "plant", [], ["Tax Treatment"]],
  ["escalator", "\u7EF4\u4FDD\u6DA8\u4EF7\u6761\u6B3E", "\u2014", "commercial", "plant", [], ["Escalation Clause"]]
];
var PARAM_DEFS = DEF_ROWS.map(([key, label, unit, domain, level, requiredConditions, aliases], i) => ({
  key,
  label,
  unit,
  domain,
  level,
  requiredConditions,
  aliases,
  version: key === "system_rte" || key === "cycle_life" ? 3 : 1 + i % 2
}));
var PARAM_DEF_MAP = new Map(PARAM_DEFS.map((d) => [d.key, d]));
var SOURCE_NAMES = {
  our: "\u6211\u65B9 Aster 5000",
  "c-a": "\u7ADE\u5BF9 A",
  "c-b": "\u7ADE\u5BF9 B",
  "c-c": "\u7ADE\u5BF9 C",
  "c-d": "\u7ADE\u5BF9 D",
  "c-e": "\u7ADE\u5BF9 E"
};
var DOC_RELIABILITY = {
  "doc-01": "official",
  "doc-02": "public",
  "doc-03": "official",
  "doc-04": "thirdParty",
  "doc-05": "official",
  "doc-07": "official",
  "doc-08": "public",
  "doc-09": "official",
  "doc-12": "public"
};
function mk(projectId, id, sourceId, defKey, rawValue, value, confidence, status, conditions = {}, ev, conflictValues) {
  const def = PARAM_DEF_MAP.get(defKey);
  if (!def) throw new Error("unknown param def: " + defKey);
  return {
    id,
    projectId,
    defKey,
    defLabel: def.label,
    sourceId,
    sourceName: SOURCE_NAMES[sourceId] ?? sourceId,
    rawName: def.aliases[0] ?? def.label,
    rawValue,
    value,
    unit: def.unit,
    conditions,
    level: def.level,
    evidence: ev ? {
      documentId: ev[0],
      page: ev[1],
      section: ev[2],
      snippet: ev[3],
      reliability: DOC_RELIABILITY[ev[0]] ?? "unknown"
    } : void 0,
    confidence,
    status,
    dimension: def.domain,
    correctedBy: status === "corrected" ? "u-01" : void 0,
    correctedAt: status === "corrected" ? "2026-10-23T16:20:00" : void 0,
    reason: status === "corrected" ? "\u53E3\u5F84\u4E0D\u540C\uFF1A\u539F\u6587\u4E3A DC \u4FA7\u6548\u7387\uFF0C\u6309 AC-AC \u53E3\u5F84\u91CD\u7B97" : void 0,
    conflictValues
  };
}
var PARAM_VALUES = [
  /* ---- p-01 我方（doc-05） ---- */
  mk("p-01", "pv-001", "our", "system_rte", "\u7CFB\u7EDF\u5F80\u8FD4\u6548\u7387 88.5%\uFF08AC-AC\uFF0C\u542B\u8F85\u52A9\u529F\u8017\uFF09", 88.5, 0.99, "confirmed", { boundary: "ac-ac", temperature: 25, loadRate: 50 }, ["doc-05", 9, "2.1 \u7CFB\u7EDF\u53C2\u6570", "\u7CFB\u7EDF\u5F80\u8FD4\u6548\u7387 88.5%\uFF08AC-AC\uFF0C\u542B\u8F85\u52A9\u529F\u8017\uFF0C25\u2103\uFF0C0.5C\uFF09"]),
  mk("p-01", "pv-002", "our", "cycle_life", "\u5FAA\u73AF\u5BFF\u547D 8500 \u6B21\uFF08DoD 90%\uFF0C25\u2103\uFF0CSoH 70%\uFF09", 8500, 0.98, "confirmed", { dod: 90, temperature: 25, sohEnd: 70 }, ["doc-05", 10, "2.1 \u7CFB\u7EDF\u53C2\u6570", "\u5FAA\u73AF\u5BFF\u547D 8500 \u6B21\uFF08DoD 90%\uFF0C25\u2103\uFF0CSoH 70%\uFF09"]),
  mk("p-01", "pv-003", "our", "availability", "\u5E74\u53EF\u7528\u7387\u4FDD\u8BC1 98.5%", 98.5, 0.97, "confirmed", { period: "year" }, ["doc-05", 12, "2.3 \u8D28\u4FDD", "\u5E74\u53EF\u7528\u7387\u4FDD\u8BC1 98.5%\uFF0C\u6309\u65F6\u95F4\u52A0\u6743\u7EDF\u8BA1"]),
  mk("p-01", "pv-004", "our", "warranty_years", "\u6574\u7CFB\u7EDF\u8D28\u4FDD 10 \u5E74", 10, 0.96, "confirmed", {}, ["doc-05", 13, "2.3 \u8D28\u4FDD", "\u6574\u7CFB\u7EDF\u8D28\u4FDD 10 \u5E74\uFF0C\u81EA\u5546\u4E1A\u8FD0\u884C\u65E5\u8D77\u7B97"]),
  mk("p-01", "pv-005", "our", "lead_time", "\u4EA4\u4ED8\u5468\u671F 28 \u5468\uFF08\u542B\u6D77\u8FD0\uFF09", 28, 0.95, "confirmed", {}, ["doc-05", 15, "2.4 \u4EA4\u4ED8", "\u6807\u51C6\u4EA4\u4ED8\u5468\u671F 28 \u5468\uFF0C\u542B 5 \u5468\u6D77\u8FD0\u4E0E 2 \u5468\u5E76\u7F51"]),
  mk("p-01", "pv-006", "our", "rated_energy", "\u989D\u5B9A\u80FD\u91CF 5.0 MWh / 20ft", 5, 0.99, "confirmed", {}, ["doc-05", 8, "2.1 \u7CFB\u7EDF\u53C2\u6570", "\u989D\u5B9A\u80FD\u91CF 5.0 MWh\uFF0C20 \u5C3A\u96C6\u88C5\u7BB1\uFF0C\u6DB2\u51B7"]),
  mk("p-01", "pv-007", "our", "usable_energy", "\u53EF\u7528\u80FD\u91CF 4.75 MWh\uFF08DoD 95%\uFF09", 4.75, 0.94, "confirmed", { dod: 95, sohEnd: 70 }, ["doc-05", 8, "2.1 \u7CFB\u7EDF\u53C2\u6570", "\u53EF\u7528\u80FD\u91CF 4.75 MWh\uFF0C\u5BF9\u5E94 DoD 95%\u3001SoH 70%"]),
  mk("p-01", "pv-008", "our", "thermal_type", "\u6DB2\u51B7\uFF08\u667A\u80FD\u6E29\u63A7\uFF09", "\u6DB2\u51B7", 0.97, "confirmed", {}, ["doc-05", 8, "2.1 \u7CFB\u7EDF\u53C2\u6570", "\u6DB2\u51B7\u6E29\u63A7\uFF0C\u7535\u82AF\u6E29\u5DEE \u22643\u2103"]),
  mk("p-01", "pv-009", "our", "aux_consumption", "\u8F85\u52A9\u529F\u8017 1.6%\uFF08\u989D\u5B9A\u5DE5\u51B5\uFF09", 1.6, 0.88, "pending", { loadRate: 100 }, ["doc-05", 9, "2.1 \u7CFB\u7EDF\u53C2\u6570", "\u8F85\u52A9\u529F\u8017\u7EA6\u4E3A\u989D\u5B9A\u529F\u7387\u7684 1.6%"]),
  mk("p-01", "pv-010", "our", "temp_range", "\u5DE5\u4F5C\u6E29\u5EA6 -30\u2103 ~ +50\u2103", "-30 ~ +50", 0.93, "confirmed", {}, ["doc-05", 9, "2.1 \u7CFB\u7EDF\u53C2\u6570", "\u5DE5\u4F5C\u6E29\u5EA6\u533A\u95F4 -30\u2103 \u81F3 +50\u2103"]),
  mk("p-01", "pv-011", "our", "fire_suppression", "\u6C14\u6EB6\u80F6 + \u6C14\u51DD\u80F6\u9694\u70ED + NFPA 68 \u6CC4\u538B", "\u6C14\u6EB6\u80F6 + NFPA 68", 0.95, "confirmed", {}, ["doc-05", 11, "2.2 \u5B89\u5168\u8BBE\u8BA1", "\u591A\u5C42\u5B89\u5168\u67B6\u6784\uFF1A\u6C14\u6EB6\u80F6\u706D\u706B\u3001\u6C14\u51DD\u80F6\u9694\u70ED\u3001NFPA 68 \u6CC4\u538B"]),
  mk("p-01", "pv-012", "our", "certifications", "UL9540 / IEC62619 / EN50549 / CE", "UL9540, IEC62619, EN50549, CE", 0.96, "confirmed", {}, ["doc-05", 11, "2.2 \u5B89\u5168\u8BBE\u8BA1", "\u5DF2\u53D6\u5F97 UL9540\u3001IEC62619\u3001EN50549 \u4E0E CE \u8BA4\u8BC1"]),
  mk("p-01", "pv-013", "our", "grid_code", "EN50549-1/-2\uFF0C\u652F\u6301 VDE-AR-N 4110", "EN50549, VDE-AR-N 4110", 0.9, "confirmed", {}, ["doc-05", 11, "2.2 \u5B89\u5168\u8BBE\u8BA1", "\u5E76\u7F51\u6EE1\u8DB3 EN50549 \u4E0E\u5FB7\u56FD VDE-AR-N 4110"]),
  mk("p-01", "pv-014", "our", "noise", "\u566A\u58F0 \u226465 dB(A) @1m", 65, 0.85, "pending", {}, ["doc-05", 14, "2.1 \u7CFB\u7EDF\u53C2\u6570", "\u566A\u58F0 \u226465 dB(A)\uFF0C\u8DDD\u8BBE\u5907 1 \u7C73\u5904\u6D4B\u91CF"]),
  mk("p-01", "pv-015", "our", "local_service", "\u6B27\u6D32 300+ \u670D\u52A1\u7F51\u70B9\uFF0C4h \u54CD\u5E94", "4 \u5C0F\u65F6\u54CD\u5E94", 0.9, "confirmed", {}, ["doc-05", 16, "2.5 \u670D\u52A1", "\u6B27\u6D32\u533A\u57DF 300+ \u670D\u52A1\u7F51\u70B9\uFF0C\u6545\u969C 4 \u5C0F\u65F6\u54CD\u5E94"]),
  mk("p-01", "pv-016", "our", "payment_terms", "\u9884\u4ED8 20% / \u53D1\u8D27\u524D 70% / \u9A8C\u6536\u540E 10%", "20/70/10", 0.8, "pending", {}, ["doc-05", 18, "3 \u5546\u52A1", "\u4ED8\u6B3E\u6761\u4EF6\uFF1A\u9884\u4ED8 20%\uFF0C\u53D1\u8D27\u524D 70%\uFF0C\u9A8C\u6536\u540E 10%"]),
  /* ---- p-01 竞对 A（doc-02） ---- */
  mk("p-01", "pv-017", "c-a", "system_rte", "up to 92% efficiency measured at DC terminals", 92, 0.88, "pending", { boundary: "dc-dc", temperature: 25, loadRate: 50 }, ["doc-02", 37, "5.1 Efficiency", "up to 92% round trip efficiency measured at DC terminals"]),
  mk("p-01", "pv-018", "c-a", "rated_energy", "5.0 MWh per container", 5, 0.94, "confirmed", {}, ["doc-02", 36, "5.0 Product", "5.0 MWh nominal energy per 20ft container"]),
  mk("p-01", "pv-019", "c-a", "cycle_life", "up to 12000 cycles, conditions to be confirmed", 12e3, 0.61, "conflict", {}, ["doc-02", 38, "5.2 Cycle life", "up to 12000 cycles, conditions to be confirmed per project"], [{ value: "12000 \u6B21\uFF08\u6761\u4EF6\u672A\u7ED9\uFF09", source: "\u6295\u6807\u6587\u4EF6 P.38" }, { value: "10000 \u6B21\uFF08DoD 80%\uFF09", source: "\u4EA7\u54C1\u624B\u518C 2026-03 P.22" }]),
  mk("p-01", "pv-020", "c-a", "availability", "\u672A\u5728\u5E94\u7B54\u6587\u4EF6\u4E2D\u62AB\u9732", null, 0.4, "pending", {}, void 0),
  mk("p-01", "pv-021", "c-a", "warranty_years", "10 years battery cells / 5 years PCS", "10/5", 0.9, "confirmed", {}, ["doc-02", 41, "5.4 Warranty", "10 years for battery cells, 5 years for PCS"]),
  mk("p-01", "pv-022", "c-a", "lead_time", "typical delivery 24 weeks excluding sea freight", 24, 0.72, "pending", {}, ["doc-02", 44, "5.6 Delivery", "typical delivery 24 weeks excluding sea freight"]),
  mk("p-01", "pv-023", "c-a", "fire_suppression", "aerosol + NFPA 68 deflagration venting", "\u6C14\u6EB6\u80F6 + NFPA 68", 0.86, "confirmed", {}, ["doc-02", 47, "5.7 Safety", "aerosol based suppression plus NFPA 68 deflagration venting"]),
  mk("p-01", "pv-024", "c-a", "noise", "68 dB(A) at 1 m", 68, 0.79, "pending", {}, ["doc-02", 48, "5.7 Safety", "noise level 68 dB(A) at 1 m distance"]),
  mk("p-01", "pv-025", "c-a", "pcs_efficiency", "98.2% at rated load", 98.2, 0.83, "pending", { loadRate: 100 }, ["doc-02", 37, "5.1 Efficiency", "PCS efficiency 98.2% at rated load"]),
  mk("p-01", "pv-026", "c-a", "temp_range", "-25 ~ +55 \u2103", "-25 ~ +55", 0.8, "pending", {}, ["doc-02", 42, "5.5 Environment", "operating temperature -25 to +55 \u2103"]),
  mk("p-01", "pv-027", "c-a", "certifications", "UL9540, IEC62619, CE", "UL9540, IEC62619, CE", 0.87, "confirmed", {}, ["doc-02", 49, "5.8 Certification", "UL9540, IEC62619 and CE certificates available"]),
  mk("p-01", "pv-028", "c-a", "payment_terms", "30% advance, 60% before shipment, 10% on acceptance", "30/60/10", 0.75, "pending", {}, ["doc-02", 55, "6 Commercial", "30% advance payment, 60% before shipment"]),
  mk("p-01", "pv-029", "c-a", "performance_bond", "10% of contract value", 10, 0.82, "pending", {}, ["doc-02", 56, "6 Commercial", "performance bond of 10% of contract value"]),
  mk("p-01", "pv-030", "c-a", "degradation", "\u22640.5%/year after first year", 0.5, 0.7, "pending", { temperature: 25 }, ["doc-02", 39, "5.2 Cycle life", "capacity degradation not exceeding 0.5% per year"]),
  /* ---- p-01 竞对 B（doc-03） ---- */
  mk("p-01", "pv-031", "c-b", "warranty_years", "12 years subject to extended warranty contract", 12, 0.68, "conflict", {}, ["doc-03", 26, "Warranty", "12 years subject to extended warranty contract"], [{ value: "12 \u5E74\uFF08\u9700\u5EF6\u4FDD\u5408\u540C\uFF09", source: "\u4EA7\u54C1\u624B\u518C P.26" }, { value: "10 \u5E74\uFF08\u6807\u51C6\u8D28\u4FDD\uFF09", source: "\u4EA7\u54C1\u624B\u518C P.25" }]),
  mk("p-01", "pv-032", "c-b", "system_rte", "89% AC-AC excluding auxiliary", 89, 0.83, "pending", { boundary: "ac-ac", temperature: 25, loadRate: 50 }, ["doc-03", 19, "Product specification", "89% AC-AC efficiency excluding auxiliary consumption"]),
  mk("p-01", "pv-033", "c-b", "availability", "99% on monthly reporting basis", 99, 0.79, "pending", { period: "month" }, ["doc-03", 21, "Product specification", "99% availability on a monthly reporting basis"]),
  mk("p-01", "pv-034", "c-b", "rated_energy", "5.0 MWh nominal", 5, 0.95, "confirmed", {}, ["doc-03", 18, "Product specification", "5.0 MWh nominal energy per 20ft container"]),
  mk("p-01", "pv-035", "c-b", "cycle_life", "8000 cycles at DoD 80%, SoH 60%", 8e3, 0.66, "pending", { dod: 80, temperature: 25, sohEnd: 60 }, ["doc-03", 20, "Product specification", "8000 cycles at DoD 80% and SoH 60%"]),
  mk("p-01", "pv-036", "c-b", "aux_consumption", "1.8% of rated power", 1.8, 0.81, "pending", { loadRate: 100 }, ["doc-03", 19, "Product specification", "Auxiliary consumption at nominal operation: 1.8% of rated power"]),
  mk("p-01", "pv-037", "c-b", "certifications", "UL9540, IEC62619, EN50549, CE pending", "UL9540, IEC62619, EN50549\uFF08CE \u5F85\u53D1\u8BC1\uFF09", 0.87, "pending", {}, ["doc-03", 24, "Certification", "UL 9540, IEC 62619, EN 50549, CE pending for new model"]),
  mk("p-01", "pv-038", "c-b", "local_service", "24/7 remote monitoring, 3 years annual visits", "\u8FDC\u7A0B\u76D1\u63A7 + 3 \u5E74\u5DE1\u68C0", 0.84, "confirmed", {}, ["doc-03", 21, "Product specification", "Annual service visit included for the first three years"]),
  mk("p-01", "pv-039", "c-b", "lead_time", "\u672A\u62AB\u9732", null, 0.35, "pending", {}, void 0),
  mk("p-01", "pv-040", "c-b", "thermal_type", "liquid cooled", "\u6DB2\u51B7", 0.92, "confirmed", {}, ["doc-03", 18, "Product specification", "liquid cooled, 4h duration configuration"]),
  /* ---- p-02（10 条，精简） ---- */
  mk("p-02", "pv-041", "our", "system_rte", "\u7CFB\u7EDF\u5F80\u8FD4\u6548\u7387 88.5%\uFF08AC-AC\uFF09", 88.5, 0.98, "confirmed", { boundary: "ac-ac", temperature: 25 }, ["doc-09", 11, "2.1 \u7CFB\u7EDF\u53C2\u6570", "\u7CFB\u7EDF\u5F80\u8FD4\u6548\u7387 88.5%\uFF08AC-AC\uFF0C\u542B\u8F85\u52A9\u529F\u8017\uFF09"]),
  mk("p-02", "pv-042", "c-c", "system_rte", "88.2% AC-AC", 88.2, 0.86, "confirmed", { boundary: "ac-ac", temperature: 25 }, ["doc-07", 21, "Technische Daten", "Wirkungsgrad 88,2 % AC-AC"]),
  mk("p-02", "pv-043", "c-d", "availability", "98% j\xE4hrlich", 98, 0.8, "pending", { period: "year" }, ["doc-08", 33, "Verf\xFCgbarkeit", "j\xE4hrliche Verf\xFCgbarkeit mindestens 98 %"]),
  mk("p-02", "pv-044", "c-c", "lead_time", "20 Wochen", 20, 0.64, "conflict", {}, ["doc-07", 30, "Lieferzeit", "Lieferzeit 20 Wochen ab Vertrag"], [{ value: "20 \u5468", source: "\u624B\u518C P.30" }, { value: "24 \u5468\uFF08\u542B\u6D77\u8FD0\uFF09", source: "\u6295\u6807\u6458\u8981 P.18" }]),
  mk("p-02", "pv-045", "c-d", "warranty_years", "12 Jahre mit Garantievertrag", 12, 0.7, "pending", {}, ["doc-08", 36, "Garantie", "12 Jahre Garantie mit separatem Garantievertrag"]),
  mk("p-02", "pv-046", "our", "cycle_life", "8500 \u6B21\uFF08DoD 90%/25\u2103/SoH 70%\uFF09", 8500, 0.97, "confirmed", { dod: 90, temperature: 25, sohEnd: 70 }, ["doc-09", 12, "2.1 \u7CFB\u7EDF\u53C2\u6570", "\u5FAA\u73AF\u5BFF\u547D 8500 \u6B21\uFF08DoD 90%\uFF0C25\u2103\uFF0CSoH 70%\uFF09"]),
  mk("p-02", "pv-047", "c-c", "cycle_life", "9000 Zyklen", 9e3, 0.65, "pending", { dod: 90, temperature: 25 }, ["doc-07", 23, "Technische Daten", "9000 Zyklen bei 90 % DoD"]),
  mk("p-02", "pv-048", "c-d", "fire_suppression", "Novec 1230 + NFPA 69", "\u5168\u6C1F\u5DF1\u916E + NFPA 69", 0.88, "confirmed", {}, ["doc-08", 29, "Sicherheit", "Loeschanlage mit Novec 1230 und NFPA 69"]),
  mk("p-02", "pv-049", "our", "lead_time", "28 \u5468", 28, 0.9, "confirmed", {}, ["doc-09", 15, "2.4 \u4EA4\u4ED8", "\u4EA4\u4ED8\u5468\u671F 28 \u5468"]),
  mk("p-02", "pv-050", "c-d", "certifications", "IEC62619, UL9540, VDE-AR-N 4110", "IEC62619, UL9540, VDE-AR-N 4110", 0.85, "pending", {}, ["doc-08", 31, "Zertifikate", "Zertifikate IEC62619, UL9540, VDE-AR-N 4110"]),
  /* ---- p-03（10 条，精简） ---- */
  mk("p-03", "pv-051", "our", "rated_energy", "3.6 MWh\uFF08\u98CE\u51B7\uFF09", 3.6, 0.92, "pending", {}, ["doc-11", 22, "Annex A", "3.6 MWh containerised system, air cooled"]),
  mk("p-03", "pv-052", "c-e", "rated_energy", "3.6 MWh", 3.6, 0.78, "pending", {}, ["doc-12", 12, "Specification", "3.6 MWh nominal energy per container"]),
  mk("p-03", "pv-053", "c-e", "system_rte", "87.5%", 87.5, 0.72, "pending", {}, ["doc-12", 14, "Specification", "round trip efficiency 87.5%"]),
  mk("p-03", "pv-054", "our", "system_rte", "88.0%\uFF08AC-AC\uFF09", 88, 0.9, "pending", { boundary: "ac-ac" }, ["doc-11", 23, "Annex A", "AC-AC round trip efficiency 88%"]),
  mk("p-03", "pv-055", "c-e", "lead_time", "18 weeks", 18, 0.6, "pending", {}, ["doc-12", 20, "Delivery", "delivery 18 weeks from PO"]),
  mk("p-03", "pv-056", "our", "lead_time", "26 \u5468", 26, 0.88, "pending", {}, ["doc-11", 30, "Delivery", "delivery within 26 weeks"]),
  mk("p-03", "pv-057", "c-e", "warranty_years", "8 years", 8, 0.75, "pending", {}, ["doc-12", 24, "Warranty", "warranty 8 years"]),
  mk("p-03", "pv-058", "our", "warranty_years", "10 \u5E74", 10, 0.9, "confirmed", {}, ["doc-11", 31, "Warranty", "warranty 10 years"]),
  mk("p-03", "pv-059", "c-e", "availability", "\u672A\u62AB\u9732", null, 0.3, "pending", {}, void 0),
  mk("p-03", "pv-060", "our", "availability", "98.5% \u5E74\u5EA6\u53E3\u5F84", 98.5, 0.91, "pending", { period: "year" }, ["doc-11", 32, "Availability", "annual availability 98.5%"])
];

// src/app/core/mock/comparison.ts
var NAMES = { our: "\u6211\u65B9", "c-a": "\u7ADE\u5BF9 A", "c-b": "\u7ADE\u5BF9 B", "c-c": "\u7ADE\u5BF9 C", "c-d": "\u7ADE\u5BF9 D" };
function cell(sourceId, display, status) {
  return { sourceId, sourceName: NAMES[sourceId] ?? sourceId, display, status };
}
function rules(list) {
  return list.map(([rule, detail]) => ({ rule, detail }));
}
function cmp(p = {}) {
  return { level: true, unit: true, conditions: true, boundary: true, ...p };
}
function R(id, projectId, defKey, defLabel, req, dimension, cells, judged, reason, ruleHits, comparable, clarify, weight) {
  return {
    id,
    projectId,
    defKey,
    defLabel,
    requirement: {
      id: "req-" + id,
      defKey,
      text: req.text,
      mandatory: req.mandatory,
      targetValue: req.targetValue,
      unit: req.unit,
      conditions: { note: req.cond }
    },
    dimension,
    mandatory: req.mandatory,
    cells,
    judged,
    reason,
    ruleHits,
    comparable,
    clarify,
    weight
  };
}
var COMPARISON_ROWS = [
  /* ---------- p-01 ---------- */
  R(
    "cmp-001",
    "p-01",
    "system_rte",
    "\u7CFB\u7EDF\u5F80\u8FD4\u6548\u7387",
    { text: "AC-AC \u5168\u7CFB\u7EDF\u5F80\u8FD4\u6548\u7387 \u2265 88%\uFF0C\u542B\u8F85\u52A9\u529F\u8017", mandatory: true, targetValue: "\u2265 88", unit: "%", cond: "25\u2103 \xB7 0.5C" },
    "performance",
    [
      cell("our", "88.5%\uFF08AC-AC\uFF0C\u542B\u8F85\u52A9\uFF09", "compliant"),
      cell("c-a", "92%\uFF08DC-DC\uFF0C\u4E0D\u542B\u8F85\u52A9\uFF09", "incomparable"),
      cell("c-b", "89%\uFF08AC-AC\uFF0C\u4E0D\u542B\u8F85\u52A9\uFF09", "potentialDeviation")
    ],
    "incomparable",
    "\u7ADE\u5BF9 A \u4E3A DC \u4FA7\u6548\u7387\uFF0C\u8FB9\u754C\u4E0E\u8981\u6C42\u4E0D\u4E00\u81F4\uFF1B\u7ADE\u5BF9 B \u672A\u8BA1\u8F85\u52A9\u529F\u8017\uFF0C\u6263\u51CF\u540E\u7EA6 87.8%\u3002",
    rules([["\u8FB9\u754C\u4E00\u81F4", "A: dc-dc \u2260 ac-ac"], ["\u8F85\u52A9\u529F\u8017\u8BA1\u5165", "B: \u672A\u8BA1\u5165"], ["\u9608\u503C", "\u226588"]]),
    cmp({ boundary: false }),
    "\u5EFA\u8BAE\u5728\u7B54\u7591\u4E2D\u63D0\u8BF7\u4E1A\u4E3B\u7EDF\u4E00\u6548\u7387\u6D4B\u91CF\u8FB9\u754C\u4E0E\u8F85\u52A9\u529F\u8017\u53E3\u5F84",
    3
  ),
  R(
    "cmp-002",
    "p-01",
    "cycle_life",
    "\u5FAA\u73AF\u5BFF\u547D",
    { text: "\u2265 8000 \u6B21\uFF08DoD 90%\u300125\u2103\u3001SoH 70%\uFF09", mandatory: true, targetValue: "\u2265 8000", unit: "\u6B21", cond: "DoD90/25\u2103/SOH70" },
    "performance",
    [
      cell("our", "8500 \u6B21\uFF08\u540C\u6761\u4EF6\uFF09", "compliant"),
      cell("c-a", "12000 \u6B21\uFF08\u6761\u4EF6\u7F3A\u5931\uFF09", "insufficientEvidence"),
      cell("c-b", "8000 \u6B21\uFF08DoD80/SOH60\uFF09", "incomparable")
    ],
    "incomparable",
    "\u7ADE\u5BF9 A \u672A\u7ED9\u51FA\u6D4B\u8BD5\u6761\u4EF6\uFF1B\u7ADE\u5BF9 B \u7684 DoD \u4E0E SoH \u7EC8\u70B9\u5747\u4F4E\u4E8E\u8981\u6C42\uFF0C\u4E0D\u53EF\u76F4\u63A5\u6BD4\u8F83\u3002",
    rules([["\u6761\u4EF6\u5B8C\u6574", "A: \u7F3A DoD/\u6E29\u5EA6/SoH"], ["\u6761\u4EF6\u4E00\u81F4", "B: DoD80\u226090\uFF0CSoH60\u226070"]]),
    cmp({ conditions: false }),
    "\u8981\u6C42\u4E1A\u4E3B\u7EDF\u4E00\u5FAA\u73AF\u5BFF\u547D\u6D4B\u8BD5\u6761\u4EF6\u540E\u518D\u505A\u6A2A\u5411\u6BD4\u8F83",
    3
  ),
  R(
    "cmp-003",
    "p-01",
    "availability",
    "\u53EF\u7528\u7387\u4FDD\u8BC1",
    { text: "\u5E74\u53EF\u7528\u7387 \u2265 98%\uFF0C\u6309\u65F6\u95F4\u52A0\u6743", mandatory: false, targetValue: "\u2265 98", unit: "%", cond: "\u5E74\u5EA6\u53E3\u5F84" },
    "warranty",
    [
      cell("our", "98.5%\uFF08\u5E74\uFF0C\u65F6\u95F4\u52A0\u6743\uFF09", "compliant"),
      cell("c-a", "\u672A\u62AB\u9732", "undisclosed"),
      cell("c-b", "99%\uFF08\u6708\u5EA6\u53E3\u5F84\uFF09", "incomparable")
    ],
    "incomparable",
    "\u7ADE\u5BF9 A \u5168\u6587\u672A\u62AB\u9732\uFF1B\u7ADE\u5BF9 B \u4E3A\u6708\u5EA6\u53E3\u5F84\uFF0C\u4E0E\u5E74\u5EA6\u65F6\u95F4\u52A0\u6743\u4E0D\u53EF\u6BD4\u3002",
    rules([["\u53E3\u5F84\u4E00\u81F4", "B: month \u2260 year"], ["\u7F3A\u5931\u4E0D\u7B49\u4E8E\u96F6", "A: \u65E0\u503C\uFF0C\u4E0D\u5224\u4E3A\u4E0D\u6EE1\u8DB3"]]),
    cmp({ conditions: false }),
    "\u5EFA\u8BAE\u8981\u6C42\u7ADE\u5BF9\u6309\u5E74\u5EA6\u65F6\u95F4\u52A0\u6743\u53E3\u5F84\u8865\u5145\u627F\u8BFA",
    2
  ),
  R(
    "cmp-004",
    "p-01",
    "warranty_years",
    "\u8D28\u4FDD\u5E74\u9650\u4E0E\u8303\u56F4",
    { text: "\u6574\u7CFB\u7EDF\u8D28\u4FDD \u2265 10 \u5E74\uFF08\u542B PCS\uFF09", mandatory: true, targetValue: "\u2265 10", unit: "\u5E74" },
    "warranty",
    [
      cell("our", "10 \u5E74\uFF08\u6574\u7CFB\u7EDF\uFF09", "compliant"),
      cell("c-a", "10 \u5E74\u7535\u82AF + 5 \u5E74 PCS", "potentialDeviation"),
      cell("c-b", "12 \u5E74\uFF08\u9700\u5EF6\u4FDD\u5408\u540C\uFF09", "potentialDeviation")
    ],
    "potentialDeviation",
    "\u7ADE\u5BF9 A \u7684 PCS \u8D28\u4FDD\u4EC5 5 \u5E74\uFF0C\u4F4E\u4E8E 10 \u5E74\u8981\u6C42\uFF1B\u7ADE\u5BF9 B \u7684 12 \u5E74\u4E3A\u6761\u4EF6\u6027\u627F\u8BFA\u3002",
    rules([["\u8986\u76D6\u8303\u56F4", "A: PCS 5 \u5E74 < 10 \u5E74"], ["\u627F\u8BFA\u6761\u4EF6", "B: \u9700\u5EF6\u4FDD\u5408\u540C"]]),
    cmp(),
    "\u8981\u6C42\u7ADE\u5BF9 A \u6F84\u6E05 PCS \u8D28\u4FDD\u8986\u76D6\uFF1B\u7ADE\u5BF9 B \u6F84\u6E05\u5EF6\u4FDD\u4EF7\u683C",
    2
  ),
  R(
    "cmp-005",
    "p-01",
    "lead_time",
    "\u4EA4\u4ED8\u5468\u671F",
    { text: "\u2264 30 \u5468\uFF08\u81EA\u5408\u540C\u751F\u6548\u8D77\u7B97\uFF0C\u542B\u6D77\u8FD0\uFF09", mandatory: false, targetValue: "\u2264 30", unit: "\u5468" },
    "delivery",
    [
      cell("our", "28 \u5468\uFF08\u542B\u6D77\u8FD0\uFF09", "compliant"),
      cell("c-a", "24 \u5468\uFF08\u4E0D\u542B\u6D77\u8FD0\uFF09", "potentialDeviation"),
      cell("c-b", "\u672A\u62AB\u9732", "undisclosed")
    ],
    "potentialDeviation",
    "\u7ADE\u5BF9 A \u672A\u660E\u786E\u8D77\u7B97\u70B9\u4E14\u4E0D\u542B\u6D77\u8FD0\uFF0C\u5B9E\u9645\u4EA4\u4ED8\u4E0D\u53EF\u6BD4\u3002",
    rules([["\u8D77\u7B97\u70B9", "A: \u4E0D\u542B\u6D77\u8FD0"], ["\u7F3A\u5931", "B: \u672A\u62AB\u9732"]]),
    cmp(),
    "\u8981\u6C42\u7ADE\u5BF9 A \u6309\u300C\u5408\u540C\u751F\u6548\u81F3\u5E76\u7F51\u300D\u53E3\u5F84\u91CD\u65B0\u62A5\u4EA4\u4ED8",
    1
  ),
  R(
    "cmp-006",
    "p-01",
    "rated_energy",
    "\u989D\u5B9A\u80FD\u91CF",
    { text: "\u5355\u7BB1\u989D\u5B9A\u80FD\u91CF \u2265 5.0 MWh", mandatory: false, targetValue: "\u2265 5.0", unit: "MWh" },
    "technical",
    [cell("our", "5.0 MWh", "compliant"), cell("c-a", "5.0 MWh", "compliant"), cell("c-b", "5.0 MWh", "compliant")],
    "compliant",
    "\u4E09\u5BB6\u5747\u6EE1\u8DB3\uFF0C\u65E0\u5DEE\u5F02\u3002",
    rules([["\u9608\u503C", "\u22655.0"]]),
    cmp(),
    void 0,
    1
  ),
  R(
    "cmp-007",
    "p-01",
    "usable_energy",
    "\u53EF\u7528\u80FD\u91CF",
    { text: "\u53EF\u7528\u80FD\u91CF \u2265 4.6 MWh\uFF08DoD 95%\u3001SoH 70%\uFF09", mandatory: false, targetValue: "\u2265 4.6", unit: "MWh", cond: "DoD95/SoH70" },
    "technical",
    [cell("our", "4.75 MWh\uFF08DoD95\uFF09", "compliant"), cell("c-a", "\u672A\u62AB\u9732", "undisclosed"), cell("c-b", "\u672A\u62AB\u9732", "undisclosed")],
    "undisclosed",
    "\u4E24\u5BB6\u7ADE\u5BF9\u5747\u53EA\u7ED9\u989D\u5B9A\u80FD\u91CF\uFF0C\u672A\u62AB\u9732\u53EF\u7528\u80FD\u91CF\u53E3\u5F84\u3002",
    rules([["\u53E3\u5F84", "\u4EC5\u989D\u5B9A\u503C"]]),
    cmp({ conditions: false }),
    "\u8981\u6C42\u7ADE\u5BF9\u6309 DoD 95%/SoH 70% \u62A5\u53EF\u7528\u80FD\u91CF",
    2
  ),
  R(
    "cmp-008",
    "p-01",
    "thermal_type",
    "\u6E29\u63A7\u65B9\u5F0F",
    { text: "\u6DB2\u51B7\u4F18\u5148\uFF0C\u7535\u82AF\u6E29\u5DEE \u2264 3\u2103", mandatory: false, targetValue: "\u6DB2\u51B7", unit: "\u2014" },
    "technical",
    [cell("our", "\u6DB2\u51B7\uFF0C\u6E29\u5DEE \u22643\u2103", "compliant"), cell("c-a", "\u6DB2\u51B7", "compliant"), cell("c-b", "\u6DB2\u51B7", "compliant")],
    "compliant",
    "\u4E09\u5BB6\u5747\u4E3A\u6DB2\u51B7\u65B9\u6848\u3002",
    rules([["\u4E00\u81F4\u6027", "\u5747\u6DB2\u51B7"]]),
    cmp(),
    void 0,
    1
  ),
  R(
    "cmp-009",
    "p-01",
    "aux_consumption",
    "\u8F85\u52A9\u529F\u8017",
    { text: "\u2264 2.5% \u989D\u5B9A\u529F\u7387\uFF08\u989D\u5B9A\u5DE5\u51B5\uFF09", mandatory: false, targetValue: "\u2264 2.5", unit: "%", cond: "\u989D\u5B9A\u5DE5\u51B5" },
    "performance",
    [cell("our", "1.6%", "compliant"), cell("c-a", "\u672A\u62AB\u9732", "undisclosed"), cell("c-b", "1.8%", "compliant")],
    "undisclosed",
    "\u7ADE\u5BF9 A \u672A\u5355\u72EC\u62AB\u9732\u8F85\u52A9\u529F\u8017\uFF0C\u5176\u6548\u7387\u6570\u503C\u672A\u8BF4\u660E\u662F\u5426\u542B\u8F85\u52A9\u3002",
    rules([["\u62AB\u9732\u5B8C\u6574\u6027", "A: \u7F3A\u503C"]]),
    cmp(),
    "\u8981\u6C42\u7ADE\u5BF9 A \u8865\u5145\u8F85\u52A9\u529F\u8017\u4E0E\u6548\u7387\u53E3\u5F84",
    2
  ),
  R(
    "cmp-010",
    "p-01",
    "temp_range",
    "\u5DE5\u4F5C\u6E29\u5EA6\u533A\u95F4",
    { text: "\u221230\u2103 ~ +50\u2103 \u53EF\u6B63\u5E38\u8FD0\u884C", mandatory: true, targetValue: "\u221230 ~ +50", unit: "\u2103" },
    "technical",
    [cell("our", "\u221230 ~ +50\u2103", "compliant"), cell("c-a", "\u221225 ~ +55\u2103", "compliant"), cell("c-b", "\u672A\u62AB\u9732", "undisclosed")],
    "undisclosed",
    "\u7ADE\u5BF9 B \u672A\u62AB\u9732\u73AF\u5883\u9002\u5E94\u6027\uFF0C\u9700\u6F84\u6E05\uFF08\u4E0D\u5F97\u63A8\u65AD\u4E3A\u4E0D\u5177\u5907\uFF09\u3002",
    rules([["\u7F3A\u5931\u4E0D\u7B49\u4E8E\u4E0D\u5177\u5907", "B: \u672A\u62AB\u9732"]]),
    cmp(),
    "\u8981\u6C42\u7ADE\u5BF9 B \u63D0\u4F9B\u9AD8\u4F4E\u6E29\u964D\u989D\u66F2\u7EBF",
    1
  ),
  R(
    "cmp-011",
    "p-01",
    "fire_suppression",
    "\u6D88\u9632\u65B9\u6848",
    { text: "\u6EE1\u8DB3 NFPA 68/69\uFF0C\u542B\u53EF\u71C3\u6C14\u4F53\u63A2\u6D4B\u4E0E\u6CC4\u538B", mandatory: true, targetValue: "NFPA 68/69", unit: "\u2014" },
    "safety",
    [cell("our", "\u6C14\u6EB6\u80F6 + NFPA 68 \u6CC4\u538B", "compliant"), cell("c-a", "\u6C14\u6EB6\u80F6 + NFPA 68", "compliant"), cell("c-b", "\u672A\u62AB\u9732", "undisclosed")],
    "undisclosed",
    "\u7ADE\u5BF9 B \u624B\u518C\u672A\u6D89\u53CA\u6D88\u9632\u7EC6\u8282\u3002",
    rules([["\u62AB\u9732", "B: \u672A\u62AB\u9732"]]),
    cmp(),
    "\u8981\u6C42\u7ADE\u5BF9 B \u63D0\u4F9B\u6D88\u9632\u8BBE\u8BA1\u4E0E\u6D4B\u8BD5\u62A5\u544A",
    2
  ),
  R(
    "cmp-012",
    "p-01",
    "certifications",
    "\u8BA4\u8BC1\u6E05\u5355",
    { text: "UL9540 / IEC62619 / EN50549 \u9F50\u5907\u4E14\u6709\u6548", mandatory: true, targetValue: "\u5168\u90E8\u9F50\u5907", unit: "\u2014" },
    "safety",
    [
      cell("our", "UL9540\u3001IEC62619\u3001EN50549\u3001CE", "compliant"),
      cell("c-a", "UL9540\u3001IEC62619\u3001CE", "potentialDeviation"),
      cell("c-b", "UL9540\u3001IEC62619\u3001EN50549\uFF08CE \u5F85\u53D1\u8BC1\uFF09", "potentialDeviation")
    ],
    "potentialDeviation",
    "\u7ADE\u5BF9 A \u7F3A EN50549\uFF1B\u7ADE\u5BF9 B \u7684 CE \u5C1A\u5728\u529E\u7406\u3002",
    rules([["\u6E05\u5355\u6BD4\u5BF9", "A: \u7F3A EN50549"], ["\u6709\u6548\u6027", "B: CE pending"]]),
    cmp(),
    "\u8981\u6C42\u4E24\u5BB6\u63D0\u4F9B\u5728\u6709\u6548\u671F\u5185\u7684\u8BC1\u4E66\u626B\u63CF\u4EF6\u4E0E\u53D1\u8BC1\u65E5\u671F",
    3
  ),
  R(
    "cmp-013",
    "p-01",
    "grid_code",
    "\u5E76\u7F51\u6807\u51C6",
    { text: "\u6EE1\u8DB3 EN50549\uFF0C\u5E76\u9002\u914D\u6377\u514B\u672C\u5730\u5E76\u7F51\u89C4\u8303", mandatory: true, targetValue: "EN50549 + \u672C\u5730", unit: "\u2014" },
    "safety",
    [cell("our", "EN50549 + VDE-AR-N 4110", "compliant"), cell("c-a", "\u672A\u62AB\u9732", "undisclosed"), cell("c-b", "EN50549", "compliant")],
    "undisclosed",
    "\u7ADE\u5BF9 A \u672A\u63D0\u4F9B\u5E76\u7F51\u7B26\u5408\u6027\u8BF4\u660E\u3002",
    rules([["\u62AB\u9732", "A: \u672A\u62AB\u9732"]]),
    cmp(),
    "\u8981\u6C42\u7ADE\u5BF9 A \u63D0\u4F9B\u5E76\u7F51\u4EFF\u771F\u62A5\u544A",
    2
  ),
  R(
    "cmp-014",
    "p-01",
    "noise",
    "\u566A\u58F0",
    { text: "\u2264 70 dB(A) @1m", mandatory: false, targetValue: "\u2264 70", unit: "dB(A)" },
    "technical",
    [cell("our", "65 dB(A)", "compliant"), cell("c-a", "68 dB(A)", "compliant"), cell("c-b", "\u672A\u62AB\u9732", "undisclosed")],
    "undisclosed",
    "\u7ADE\u5BF9 B \u672A\u62AB\u9732\u566A\u58F0\u6570\u636E\u3002",
    rules([["\u62AB\u9732", "B: \u672A\u62AB\u9732"]]),
    cmp(),
    void 0,
    1
  ),
  R(
    "cmp-015",
    "p-01",
    "pcs_efficiency",
    "PCS \u6548\u7387",
    { text: "\u2265 98%\uFF08\u989D\u5B9A\u8D1F\u8F7D\uFF09", mandatory: false, targetValue: "\u2265 98", unit: "%", cond: "\u989D\u5B9A\u8D1F\u8F7D" },
    "performance",
    [cell("our", "98.4%", "compliant"), cell("c-a", "98.2%", "compliant"), cell("c-b", "\u672A\u62AB\u9732", "undisclosed")],
    "undisclosed",
    "\u7ADE\u5BF9 B \u672A\u5355\u72EC\u62AB\u9732 PCS \u6548\u7387\u3002",
    rules([["\u62AB\u9732", "B: \u672A\u62AB\u9732"]]),
    cmp(),
    void 0,
    1
  ),
  R(
    "cmp-016",
    "p-01",
    "degradation",
    "\u5BB9\u91CF\u8870\u51CF\u4FDD\u8BC1",
    { text: "\u9996\u5E74\u540E\u5E74\u8870\u51CF \u2264 0.5%", mandatory: false, targetValue: "\u2264 0.5", unit: "%/\u5E74" },
    "performance",
    [cell("our", "0.4%/\u5E74", "compliant"), cell("c-a", "\u22640.5%/\u5E74", "compliant"), cell("c-b", "\u672A\u62AB\u9732", "undisclosed")],
    "undisclosed",
    "\u7ADE\u5BF9 B \u4EC5\u7ED9\u5FAA\u73AF\u5BFF\u547D\uFF0C\u672A\u7ED9\u5E74\u5EA6\u8870\u51CF\u627F\u8BFA\u3002",
    rules([["\u62AB\u9732", "B: \u672A\u62AB\u9732"]]),
    cmp(),
    void 0,
    2
  ),
  R(
    "cmp-017",
    "p-01",
    "local_service",
    "\u672C\u5730\u670D\u52A1\u80FD\u529B",
    { text: "\u6B27\u6D32\u672C\u5730\u5907\u4EF6\u4E0E \u22648 \u5C0F\u65F6\u54CD\u5E94", mandatory: false, targetValue: "\u22648 h", unit: "h" },
    "delivery",
    [cell("our", "300+ \u7F51\u70B9\uFF0C4h \u54CD\u5E94", "compliant"), cell("c-a", "\u672A\u62AB\u9732", "undisclosed"), cell("c-b", "24/7 \u8FDC\u7A0B + 3 \u5E74\u5DE1\u68C0", "compliant")],
    "undisclosed",
    "\u7ADE\u5BF9 A \u672A\u62AB\u9732\u6B27\u6D32\u672C\u5730\u670D\u52A1\u80FD\u529B\u3002",
    rules([["\u62AB\u9732", "A: \u672A\u62AB\u9732"]]),
    cmp(),
    void 0,
    2
  ),
  R(
    "cmp-018",
    "p-01",
    "payment_terms",
    "\u4ED8\u6B3E\u6761\u4EF6",
    { text: "\u9884\u4ED8 \u2264 20%\uFF0C\u9A8C\u6536\u540E\u4ED8 \u2265 10%", mandatory: false, targetValue: "\u9884\u4ED8\u226420%", unit: "\u2014" },
    "commercial",
    [cell("our", "20/70/10", "compliant"), cell("c-a", "30/60/10", "deviation"), cell("c-b", "\u672A\u62AB\u9732", "undisclosed")],
    "deviation",
    "\u7ADE\u5BF9 A \u9884\u4ED8\u6BD4\u4F8B 30% \u9AD8\u4E8E\u8981\u6C42\uFF0C\u5C5E\u5546\u52A1\u6761\u4EF6\u504F\u79BB\uFF08\u5BF9\u4E1A\u4E3B\u4E0D\u5229\uFF0C\u5BF9\u6211\u65B9\u6709\u5229\uFF09\u3002",
    rules([["\u9884\u4ED8\u6BD4\u4F8B", "A: 30% > 20%"]]),
    cmp(),
    void 0,
    1
  ),
  R(
    "cmp-019",
    "p-01",
    "performance_bond",
    "\u5C65\u7EA6\u4FDD\u51FD",
    { text: "\u2264 \u5408\u540C\u989D 10%", mandatory: false, targetValue: "\u2264 10", unit: "%" },
    "commercial",
    [cell("our", "10%", "compliant"), cell("c-a", "10%", "compliant"), cell("c-b", "\u672A\u62AB\u9732", "undisclosed")],
    "undisclosed",
    "\u7ADE\u5BF9 B \u672A\u62AB\u9732\u4FDD\u51FD\u8981\u6C42\u3002",
    rules([["\u62AB\u9732", "B: \u672A\u62AB\u9732"]]),
    cmp(),
    void 0,
    1
  ),
  R(
    "cmp-020",
    "p-01",
    "price_structure",
    "\u62A5\u4EF7\u7ED3\u6784",
    { text: "\u8981\u6C42\u5206\u8BBE\u5907/\u5B89\u88C5/\u8FD0\u7EF4\u4E09\u9879\u62A5\u4EF7", mandatory: false, targetValue: "\u4E09\u9879\u5206\u5217", unit: "\u2014" },
    "commercial",
    [cell("our", "\u4E09\u9879\u5206\u5217", "compliant"), cell("c-a", "\u672A\u62AB\u9732", "insufficientEvidence"), cell("c-b", "\u672A\u62AB\u9732", "insufficientEvidence")],
    "insufficientEvidence",
    "\u4E24\u5BB6\u516C\u5F00\u8D44\u6599\u5747\u672A\u5305\u542B\u62A5\u4EF7\u7ED3\u6784\uFF0C\u5C5E\u8BC1\u636E\u4E0D\u8DB3\u800C\u975E\u4E0D\u7B26\u3002",
    rules([["\u8BC1\u636E", "A/B: \u65E0\u62A5\u4EF7\u8D44\u6599"]]),
    cmp(),
    "\u82E5\u9700\u5546\u52A1\u5BF9\u6807\uFF0C\u5E94\u901A\u8FC7\u5408\u6CD5\u6E20\u9053\u83B7\u53D6\u62A5\u4EF7\u62C6\u5206",
    1
  ),
  R(
    "cmp-021",
    "p-01",
    "liquidated_damages",
    "\u8FDD\u7EA6\u8D54\u507F",
    { text: "\u2264 0.5%/\u5468\uFF0C\u4E0A\u9650 10%", mandatory: false, targetValue: "\u22640.5%/\u5468", unit: "%/\u5468" },
    "commercial",
    [cell("our", "0.5%/\u5468\uFF0C\u4E0A\u9650 10%", "compliant"), cell("c-a", "\u672A\u62AB\u9732", "undisclosed"), cell("c-b", "1%/\u5468\uFF0C\u4E0A\u9650 15%", "compliant")],
    "undisclosed",
    "\u7ADE\u5BF9 A \u672A\u62AB\u9732 LD \u6761\u6B3E\u3002",
    rules([["\u62AB\u9732", "A: \u672A\u62AB\u9732"]]),
    cmp(),
    void 0,
    1
  ),
  R(
    "cmp-022",
    "p-01",
    "duration",
    "\u6301\u7EED\u653E\u7535\u65F6\u957F",
    { text: "4 \u5C0F\u65F6\uFF08@25MW \u5E76\u7F51\u70B9\uFF09", mandatory: false, targetValue: "4", unit: "h" },
    "technical",
    [cell("our", "4 h", "compliant"), cell("c-a", "4 h", "compliant"), cell("c-b", "4 h", "compliant")],
    "compliant",
    "\u4E09\u5BB6\u4E00\u81F4\u3002",
    rules([["\u4E00\u81F4\u6027", "\u5747 4h"]]),
    cmp(),
    void 0,
    1
  ),
  R(
    "cmp-023",
    "p-01",
    "dc_ac_ratio",
    "DC/AC \u6BD4",
    { text: "\u2264 1.10", mandatory: false, targetValue: "\u2264 1.10", unit: "\u2014" },
    "technical",
    [cell("our", "1.00", "compliant"), cell("c-a", "1.05", "compliant"), cell("c-b", "\u672A\u62AB\u9732", "undisclosed")],
    "undisclosed",
    "\u7ADE\u5BF9 B \u672A\u62AB\u9732 DC/AC \u914D\u6BD4\u3002",
    rules([["\u62AB\u9732", "B: \u672A\u62AB\u9732"]]),
    cmp(),
    void 0,
    1
  ),
  R(
    "cmp-024",
    "p-01",
    "ip_rating",
    "\u9632\u62A4\u7B49\u7EA7",
    { text: "\u2265 IP54", mandatory: false, targetValue: "\u2265 IP54", unit: "IP" },
    "safety",
    [cell("our", "IP55", "compliant"), cell("c-a", "IP54", "compliant"), cell("c-b", "IP55", "compliant")],
    "compliant",
    "\u4E09\u5BB6\u5747\u6EE1\u8DB3\u3002",
    rules([["\u9608\u503C", "\u2265IP54"]]),
    cmp(),
    void 0,
    1
  ),
  R(
    "cmp-025",
    "p-01",
    "response_time",
    "\u54CD\u5E94\u65F6\u95F4",
    { text: "\u2264 500 ms", mandatory: false, targetValue: "\u2264 500", unit: "ms" },
    "performance",
    [cell("our", "100 ms", "compliant"), cell("c-a", "\u672A\u62AB\u9732", "undisclosed"), cell("c-b", "200 ms", "compliant")],
    "undisclosed",
    "\u7ADE\u5BF9 A \u672A\u62AB\u9732\u63A7\u5236\u54CD\u5E94\u65F6\u95F4\u3002",
    rules([["\u62AB\u9732", "A: \u672A\u62AB\u9732"]]),
    cmp(),
    void 0,
    1
  ),
  R(
    "cmp-026",
    "p-01",
    "thd",
    "\u7535\u6D41\u8C10\u6CE2\u7578\u53D8",
    { text: "THD \u2264 3%", mandatory: false, targetValue: "\u2264 3", unit: "%" },
    "safety",
    [cell("our", "3%", "compliant"), cell("c-a", "\u672A\u62AB\u9732", "undisclosed"), cell("c-b", "3%", "compliant")],
    "undisclosed",
    "\u7ADE\u5BF9 A \u672A\u62AB\u9732\u8C10\u6CE2\u6307\u6807\u3002",
    rules([["\u62AB\u9732", "A: \u672A\u62AB\u9732"]]),
    cmp(),
    void 0,
    1
  ),
  R(
    "cmp-027",
    "p-01",
    "pf_range",
    "\u529F\u7387\u56E0\u6570\u8303\u56F4",
    { text: "\u22121 ~ +1 \u8FDE\u7EED\u53EF\u8C03", mandatory: false, targetValue: "\u22121~+1", unit: "\u2014" },
    "safety",
    [cell("our", "\u22121 ~ +1", "compliant"), cell("c-a", "\u672A\u62AB\u9732", "undisclosed"), cell("c-b", "\u22120.9 ~ +0.9", "potentialDeviation")],
    "potentialDeviation",
    "\u7ADE\u5BF9 B \u529F\u7387\u56E0\u6570\u8303\u56F4\u5C0F\u4E8E\u8981\u6C42\u3002",
    rules([["\u8303\u56F4\u6BD4\u8F83", "B: 0.9 < 1.0"]]),
    cmp(),
    void 0,
    1
  ),
  R(
    "cmp-028",
    "p-01",
    "lvrt",
    "\u4F4E\u7535\u538B\u7A7F\u8D8A",
    { text: "\u6EE1\u8DB3 EN50549 \u4F4E\u7535\u538B\u7A7F\u8D8A\u66F2\u7EBF", mandatory: false, targetValue: "\u7B26\u5408\u66F2\u7EBF", unit: "\u2014" },
    "safety",
    [cell("our", "\u652F\u6301", "compliant"), cell("c-a", "\u672A\u62AB\u9732", "undisclosed"), cell("c-b", "\u652F\u6301", "compliant")],
    "undisclosed",
    "\u7ADE\u5BF9 A \u672A\u62AB\u9732 LVRT \u80FD\u529B\u3002",
    rules([["\u62AB\u9732", "A: \u672A\u62AB\u9732"]]),
    cmp(),
    void 0,
    1
  ),
  R(
    "cmp-029",
    "p-01",
    "cell_type",
    "\u7535\u82AF\u7C7B\u578B",
    { text: "LFP \u78F7\u9178\u94C1\u9502", mandatory: false, targetValue: "LFP", unit: "\u2014" },
    "technical",
    [cell("our", "LFP", "compliant"), cell("c-a", "LFP", "compliant"), cell("c-b", "LFP", "compliant")],
    "compliant",
    "\u4E09\u5BB6\u5747\u4E3A LFP\u3002",
    rules([["\u4E00\u81F4\u6027", "LFP"]]),
    cmp(),
    void 0,
    1
  ),
  R(
    "cmp-030",
    "p-01",
    "weight",
    "\u7CFB\u7EDF\u91CD\u91CF",
    { text: "\u2264 35 t / 20ft", mandatory: false, targetValue: "\u2264 35", unit: "t" },
    "technical",
    [cell("our", "32 t", "compliant"), cell("c-a", "30 t", "compliant"), cell("c-b", "\u672A\u62AB\u9732", "undisclosed")],
    "undisclosed",
    "\u7ADE\u5BF9 B \u672A\u62AB\u9732\u91CD\u91CF\uFF0C\u5F71\u54CD\u8FD0\u8F93\u4E0E\u540A\u88C5\u8BC4\u4F30\u3002",
    rules([["\u62AB\u9732", "B: \u672A\u62AB\u9732"]]),
    cmp(),
    "\u8981\u6C42\u7ADE\u5BF9 B \u63D0\u4F9B\u8FD0\u8F93\u5C3A\u5BF8\u4E0E\u91CD\u91CF",
    1
  ),
  /* ---------- p-02 ---------- */
  R(
    "cmp-031",
    "p-02",
    "system_rte",
    "\u7CFB\u7EDF\u5F80\u8FD4\u6548\u7387",
    { text: "AC-AC RTE \u2265 88%", mandatory: true, targetValue: "\u2265 88", unit: "%" },
    "performance",
    [cell("our", "88.5%\uFF08AC-AC\uFF09", "compliant"), cell("c-c", "88.2%\uFF08AC-AC\uFF09", "compliant"), cell("c-d", "\u672A\u62AB\u9732", "undisclosed")],
    "undisclosed",
    "\u7ADE\u5BF9 D \u672A\u62AB\u9732\u6548\u7387\u53E3\u5F84\u3002",
    rules([["\u62AB\u9732", "D: \u672A\u62AB\u9732"]]),
    cmp(),
    void 0,
    3
  ),
  R(
    "cmp-032",
    "p-02",
    "cycle_life",
    "\u5FAA\u73AF\u5BFF\u547D",
    { text: "\u2265 8000 \u6B21\uFF08DoD90/25\u2103/SOH70\uFF09", mandatory: true, targetValue: "\u2265 8000", unit: "\u6B21" },
    "performance",
    [cell("our", "8500 \u6B21\uFF08\u540C\u6761\u4EF6\uFF09", "compliant"), cell("c-c", "9000 \u6B21\uFF08\u7F3A SoH\uFF09", "insufficientEvidence"), cell("c-d", "\u672A\u62AB\u9732", "undisclosed")],
    "insufficientEvidence",
    "\u7ADE\u5BF9 C \u672A\u7ED9 SoH \u7EC8\u70B9\u3002",
    rules([["\u6761\u4EF6\u5B8C\u6574", "C: \u7F3A SoH"]]),
    cmp({ conditions: false }),
    void 0,
    3
  ),
  R(
    "cmp-033",
    "p-02",
    "availability",
    "\u53EF\u7528\u7387",
    { text: "\u5E74\u53EF\u7528\u7387 \u2265 98%", mandatory: true, targetValue: "\u2265 98", unit: "%" },
    "warranty",
    [cell("our", "98.5%\uFF08\u5E74\uFF09", "compliant"), cell("c-d", "98%\uFF08\u5E74\uFF09", "compliant"), cell("c-c", "\u672A\u62AB\u9732", "undisclosed")],
    "undisclosed",
    "\u7ADE\u5BF9 C \u672A\u62AB\u9732\u53EF\u7528\u7387\u3002",
    rules([["\u62AB\u9732", "C: \u672A\u62AB\u9732"]]),
    cmp(),
    void 0,
    2
  ),
  R(
    "cmp-034",
    "p-02",
    "warranty_years",
    "\u8D28\u4FDD\u5E74\u9650",
    { text: "\u2265 10 \u5E74", mandatory: true, targetValue: "\u2265 10", unit: "\u5E74" },
    "warranty",
    [cell("our", "10 \u5E74", "compliant"), cell("c-d", "12 \u5E74\uFF08\u9700\u5EF6\u4FDD\uFF09", "potentialDeviation"), cell("c-c", "\u672A\u62AB\u9732", "undisclosed")],
    "potentialDeviation",
    "\u7ADE\u5BF9 D \u7684 12 \u5E74\u4E3A\u6761\u4EF6\u6027\u627F\u8BFA\u3002",
    rules([["\u627F\u8BFA\u6761\u4EF6", "D: \u9700\u5EF6\u4FDD"]]),
    cmp(),
    void 0,
    2
  ),
  R(
    "cmp-035",
    "p-02",
    "lead_time",
    "\u4EA4\u4ED8\u5468\u671F",
    { text: "\u2264 30 \u5468", mandatory: false, targetValue: "\u2264 30", unit: "\u5468" },
    "delivery",
    [cell("our", "28 \u5468", "compliant"), cell("c-c", "20 \u5468 / 24 \u5468\uFF08\u51B2\u7A81\uFF09", "incomparable"), cell("c-d", "\u672A\u62AB\u9732", "undisclosed")],
    "incomparable",
    "\u7ADE\u5BF9 C \u7684\u8D44\u6599\u51FA\u73B0\u4E24\u4E2A\u4EA4\u4ED8\u5468\u671F\u4E14\u53E3\u5F84\u4E0D\u540C\uFF0C\u9700\u5148\u88C1\u51B3\u3002",
    rules([["\u51B2\u7A81", "C: 20 vs 24 \u5468"]]),
    cmp({ conditions: false }),
    "\u8981\u6C42\u7ADE\u5BF9 C \u660E\u786E\u4EA4\u4ED8\u8D77\u7B97\u70B9\u4E0E\u662F\u5426\u542B\u6D77\u8FD0",
    2
  ),
  R(
    "cmp-036",
    "p-02",
    "fire_suppression",
    "\u6D88\u9632\u65B9\u6848",
    { text: "\u6EE1\u8DB3 NFPA 68/69", mandatory: true, targetValue: "NFPA 68/69", unit: "\u2014" },
    "safety",
    [cell("our", "\u6C14\u6EB6\u80F6 + NFPA 68", "compliant"), cell("c-d", "\u5168\u6C1F\u5DF1\u916E + NFPA 69", "compliant"), cell("c-c", "\u672A\u62AB\u9732", "undisclosed")],
    "undisclosed",
    "\u7ADE\u5BF9 C \u672A\u62AB\u9732\u6D88\u9632\u8BBE\u8BA1\u3002",
    rules([["\u62AB\u9732", "C: \u672A\u62AB\u9732"]]),
    cmp(),
    void 0,
    2
  ),
  R(
    "cmp-037",
    "p-02",
    "certifications",
    "\u8BA4\u8BC1\u6E05\u5355",
    { text: "IEC62619 / UL9540 / VDE-AR-N 4110", mandatory: true, targetValue: "\u5168\u90E8\u9F50\u5907", unit: "\u2014" },
    "safety",
    [cell("our", "\u4E09\u9879\u9F50\u5907", "compliant"), cell("c-d", "\u4E09\u9879\u9F50\u5907", "compliant"), cell("c-c", "IEC62619 / CE", "potentialDeviation")],
    "potentialDeviation",
    "\u7ADE\u5BF9 C \u7F3A UL9540 \u4E0E VDE-AR-N 4110\u3002",
    rules([["\u6E05\u5355\u6BD4\u5BF9", "C: \u7F3A 2 \u9879"]]),
    cmp(),
    void 0,
    3
  ),
  R(
    "cmp-038",
    "p-02",
    "rated_energy",
    "\u989D\u5B9A\u80FD\u91CF",
    { text: "\u2265 5.0 MWh", mandatory: false, targetValue: "\u2265 5.0", unit: "MWh" },
    "technical",
    [cell("our", "5.0 MWh", "compliant"), cell("c-c", "4.2 MWh", "deviation"), cell("c-d", "5.2 MWh", "compliant")],
    "deviation",
    "\u7ADE\u5BF9 C \u5355\u7BB1\u80FD\u91CF\u4F4E\u4E8E\u8981\u6C42\uFF0C\u9700\u66F4\u591A\u7BB1\u6570\uFF0C\u5F71\u54CD\u5360\u5730\u4E0E BOP \u6210\u672C\u3002",
    rules([["\u9608\u503C", "C: 4.2 < 5.0"]]),
    cmp(),
    void 0,
    2
  ),
  R(
    "cmp-039",
    "p-02",
    "aux_consumption",
    "\u8F85\u52A9\u529F\u8017",
    { text: "\u2264 2.5%", mandatory: false, targetValue: "\u2264 2.5", unit: "%" },
    "performance",
    [cell("our", "1.6%", "compliant"), cell("c-d", "\u672A\u62AB\u9732", "undisclosed"), cell("c-c", "2.1%", "compliant")],
    "undisclosed",
    "\u7ADE\u5BF9 D \u672A\u62AB\u9732\u8F85\u52A9\u529F\u8017\u3002",
    rules([["\u62AB\u9732", "D: \u672A\u62AB\u9732"]]),
    cmp(),
    void 0,
    1
  ),
  R(
    "cmp-040",
    "p-02",
    "local_service",
    "\u672C\u5730\u670D\u52A1",
    { text: "\u5FB7\u56FD\u5883\u5185 \u22648h \u54CD\u5E94", mandatory: false, targetValue: "\u22648 h", unit: "h" },
    "delivery",
    [cell("our", "4h \u54CD\u5E94", "compliant"), cell("c-d", "6h \u54CD\u5E94", "compliant"), cell("c-c", "\u672A\u62AB\u9732", "undisclosed")],
    "undisclosed",
    "\u7ADE\u5BF9 C \u672A\u62AB\u9732\u5FB7\u56FD\u670D\u52A1\u7F51\u7EDC\u3002",
    rules([["\u62AB\u9732", "C: \u672A\u62AB\u9732"]]),
    cmp(),
    void 0,
    2
  ),
  R(
    "cmp-041",
    "p-02",
    "payment_terms",
    "\u4ED8\u6B3E\u6761\u4EF6",
    { text: "\u9884\u4ED8 \u2264 20%", mandatory: false, targetValue: "\u226420%", unit: "\u2014" },
    "commercial",
    [cell("our", "20/70/10", "compliant"), cell("c-d", "15/75/10", "compliant"), cell("c-c", "\u672A\u62AB\u9732", "undisclosed")],
    "undisclosed",
    "\u7ADE\u5BF9 C \u672A\u62AB\u9732\u5546\u52A1\u6761\u4EF6\u3002",
    rules([["\u62AB\u9732", "C: \u672A\u62AB\u9732"]]),
    cmp(),
    void 0,
    1
  ),
  R(
    "cmp-042",
    "p-02",
    "price_structure",
    "\u62A5\u4EF7\u7ED3\u6784",
    { text: "\u4E09\u9879\u5206\u5217\u62A5\u4EF7", mandatory: false, targetValue: "\u4E09\u9879\u5206\u5217", unit: "\u2014" },
    "commercial",
    [cell("our", "\u4E09\u9879\u5206\u5217", "compliant"), cell("c-d", "\u672A\u62AB\u9732", "insufficientEvidence"), cell("c-c", "\u672A\u62AB\u9732", "insufficientEvidence")],
    "insufficientEvidence",
    "\u516C\u5F00\u8D44\u6599\u65E0\u62A5\u4EF7\u4FE1\u606F\u3002",
    rules([["\u8BC1\u636E", "\u65E0\u62A5\u4EF7\u8D44\u6599"]]),
    cmp(),
    void 0,
    1
  )
];

// src/app/core/mock/insights.ts
var INSIGHTS = [
  { id: "ins-001", projectId: "p-01", type: "fact", text: "\u7ADE\u5BF9 A \u6807\u79F0\u7CFB\u7EDF\u6548\u7387 92%\uFF0C\u4F46\u5176\u539F\u6587\u660E\u786E\u4E3A DC \u7AEF\u6D4B\u91CF\uFF0C\u4E14\u4E0D\u542B\u8F85\u52A9\u529F\u8017\uFF0C\u4E0E\u62DB\u6807\u8981\u6C42\u7684 AC-AC \u53E3\u5F84\u4E0D\u4E00\u81F4\u3002", evidenceIds: ["anc-07"], state: "draft" },
  { id: "ins-002", projectId: "p-01", type: "fact", text: "\u7ADE\u5BF9 A \u5FAA\u73AF\u5BFF\u547D\u6807\u79F0 12000 \u6B21\uFF0C\u4F46\u672A\u7ED9\u51FA DoD\u3001\u6E29\u5EA6\u4E0E SoH \u7EC8\u70B9\uFF0C\u6761\u4EF6\u4E0D\u53EF\u6838\u9A8C\u3002", evidenceIds: ["anc-08"], state: "draft" },
  { id: "ins-003", projectId: "p-01", type: "fact", text: "\u7ADE\u5BF9 A \u5168\u7BC7\u672A\u62AB\u9732\u53EF\u7528\u7387\u4E0E\u6B27\u6D32\u672C\u5730\u670D\u52A1\u80FD\u529B\uFF0C\u4E24\u9879\u76EE\u524D\u65E0\u8BC1\u636E\u652F\u6491\uFF0C\u4E0D\u53EF\u89C6\u4E3A\u5176\u52A3\u52BF\u3002", evidenceIds: [], state: "draft" },
  { id: "ins-004", projectId: "p-01", type: "fact", text: "\u6211\u65B9\u7CFB\u7EDF\u6548\u7387 88.5% \u4E3A AC-AC \u53E3\u5F84\u4E14\u5DF2\u542B\u8F85\u52A9\u529F\u8017\uFF0C\u4E0E\u62DB\u6807\u8981\u6C42\u540C\u53E3\u5F84\uFF0C\u53EF\u6EE1\u8DB3 88% \u95E8\u69DB\u3002", evidenceIds: ["anc-01", "anc-16"], state: "draft" },
  { id: "ins-005", projectId: "p-01", type: "fact", text: "\u7ADE\u5BF9 B \u4EA4\u4ED8\u5468\u671F\u672A\u5728\u624B\u518C\u4E2D\u62AB\u9732\uFF0C\u5176\u300C24 \u5468\u300D\u53E3\u5F84\u6765\u81EA\u5386\u53F2\u6295\u6807\u6458\u8981\uFF0C\u4E0D\u542B\u6D77\u8FD0\uFF0C\u8D77\u7B97\u70B9\u4E0D\u540C\u3002", evidenceIds: ["anc-10"], state: "draft" },
  { id: "ins-006", projectId: "p-01", type: "inference", text: "\u5F85\u6838\u5B9E\uFF1A\u82E5\u4E1A\u4E3B\u63A5\u53D7\u7ADE\u5BF9 A \u7684 DC \u4FA7\u6548\u7387\u53E3\u5F84\uFF0C\u6211\u65B9\u5728\u6548\u7387\u9879\u5C06\u663E\u52A3\u52BF\uFF0C\u5EFA\u8BAE\u5728\u7B54\u7591\u9636\u6BB5\u4E3B\u52A8\u63D0\u51FA\u7EDF\u4E00\u53E3\u5F84\u3002", evidenceIds: ["anc-07", "anc-01"], state: "draft" },
  { id: "ins-007", projectId: "p-01", type: "inference", text: "\u5F85\u6838\u5B9E\uFF1A\u7ADE\u5BF9 B \u7684 99% \u53EF\u7528\u7387\u4E3A\u6708\u5EA6\u53E3\u5F84\uFF0C\u82E5\u6298\u7B97\u4E3A\u5E74\u5EA6\u65F6\u95F4\u52A0\u6743\uFF0C\u5176\u627F\u8BFA\u53EF\u80FD\u4F4E\u4E8E\u6211\u65B9 98.5%\u3002", evidenceIds: ["anc-14", "anc-18"], state: "draft" },
  { id: "ins-008", projectId: "p-01", type: "suggestion", text: "\u5EFA\u8BAE\u5C06\u300C\u4EA4\u4ED8\u786E\u5B9A\u6027\uFF085 \u5468\u6D77\u8FD0 + 2 \u5468\u5E76\u7F51\uFF09\u300D\u5199\u5165\u6280\u672F\u6807\u5DEE\u5F02\u5316\u7AE0\u8282\uFF0C\u800C\u975E\u5728\u6548\u7387\u53C2\u6570\u4E0A\u505A\u6B63\u9762\u6BD4\u62FC\u3002", evidenceIds: ["anc-06"], state: "draft" },
  { id: "ins-009", projectId: "p-01", type: "suggestion", text: "\u5EFA\u8BAE\u62A5\u4EF7\u7B56\u7565\u56F4\u7ED5\u672C\u5730\u670D\u52A1\u54CD\u5E94\uFF084 \u5C0F\u65F6\uFF09\u4E0E\u5907\u4EF6\u8986\u76D6\u6784\u5EFA\uFF0C\u5546\u52A1\u8BA9\u5229\u7A7A\u95F4\u7531\u5546\u52A1\u8D1F\u8D23\u4EBA\u586B\u5199\u3002", evidenceIds: ["anc-04"], state: "draft" },
  { id: "ins-010", projectId: "p-01", type: "inference", text: "\u65E0\u5F15\u7528\u6D4B\u8BD5\u6761\u76EE\uFF1A\u7ADE\u5BF9 A \u7684\u6D88\u9632\u65B9\u6848\u53EF\u80FD\u4E0D\u6EE1\u8DB3\u4E1A\u4E3B\u6700\u65B0\u8981\u6C42\u3002", evidenceIds: [], state: "draft" },
  { id: "ins-011", projectId: "p-02", type: "fact", text: "\u7ADE\u5BF9 D \u7684 12 \u5E74\u8D28\u4FDD\u9700\u53E6\u884C\u7B7E\u8BA2\u5EF6\u4FDD\u5408\u540C\uFF0C\u5C5E\u6761\u4EF6\u6027\u627F\u8BFA\uFF0C\u8BC4\u6807\u65F6\u5E94\u6309 10 \u5E74\u6807\u51C6\u8BA1\u5165\u3002", evidenceIds: ["anc-09"], state: "draft" },
  { id: "ins-012", projectId: "p-02", type: "fact", text: "\u7ADE\u5BF9 C \u5355\u7BB1\u989D\u5B9A\u80FD\u91CF 4.2 MWh\uFF0C\u4F4E\u4E8E 5.0 MWh \u8981\u6C42\uFF0C\u5C06\u589E\u52A0\u7BB1\u6570\u4E0E BOP \u6210\u672C\u3002", evidenceIds: ["anc-12"], state: "draft" }
];
var RISK_ITEMS = [
  { id: "risk-01", projectId: "p-01", level: "high", kind: "\u5E9F\u6807\u98CE\u9669", text: "\u7CFB\u7EDF\u6548\u7387\u6D4B\u91CF\u8FB9\u754C\u4E0E\u62DB\u6807\u8981\u6C42\u4E0D\u4E00\u81F4\uFF0C\u82E5\u6309 DC \u4FA7\u6570\u503C\u5E94\u7B54\uFF0C\u5B58\u5728\u88AB\u8BA4\u5B9A\u4E3A\u300C\u672A\u6309\u53E3\u5F84\u54CD\u5E94\u300D\u7684\u98CE\u9669\u3002", relatedKeys: ["system_rte"], suggestion: "\u5728\u6F84\u6E05\u9636\u6BB5\u786E\u8BA4\u8FB9\u754C\u5B9A\u4E49\uFF0C\u6280\u672F\u6807\u4E2D\u540C\u65F6\u7ED9\u51FA AC-AC \u4E0E DC-DC \u4E24\u5957\u6570\u636E\u5E76\u6CE8\u660E\u53E3\u5F84\u3002", owner: "\u738B\u741B", state: "mitigating" },
  { id: "risk-02", projectId: "p-01", level: "high", kind: "\u6280\u672F\u504F\u79BB", text: "\u7ADE\u5BF9 A \u7684 PCS \u8D28\u4FDD\u4EC5 5 \u5E74\uFF0C\u4F4E\u4E8E 10 \u5E74\u8981\u6C42\uFF1B\u6211\u65B9\u82E5\u672A\u5728\u504F\u79BB\u8868\u4E2D\u660E\u786E\u6574\u7CFB\u7EDF\u8986\u76D6\uFF0C\u53EF\u80FD\u88AB\u8981\u6C42\u5BF9\u6807\u5176\u4F4E\u4EF7\u914D\u7F6E\u3002", relatedKeys: ["warranty_years"], suggestion: "\u5728\u504F\u79BB\u8868\u4E2D\u5355\u72EC\u5217\u51FA PCS \u8D28\u4FDD\u8986\u76D6\u8303\u56F4\uFF0C\u907F\u514D\u6574\u4F53\u8D28\u4FDD\u88AB\u62C9\u4F4E\u3002", owner: "\u674E\u7EF4", state: "open" },
  { id: "risk-03", projectId: "p-01", level: "high", kind: "\u627F\u8BFA\u98CE\u9669", text: "\u5FAA\u73AF\u5BFF\u547D\u6D4B\u8BD5\u6761\u4EF6\u672A\u7EDF\u4E00\uFF0C\u82E5\u6211\u65B9\u6309\u66F4\u5BBD\u6761\u4EF6\u627F\u8BFA\uFF0C\u5C06\u627F\u62C5\u989D\u5916\u8870\u51CF\u8D54\u4ED8\u98CE\u9669\u3002", relatedKeys: ["cycle_life"], suggestion: "\u627F\u8BFA\u503C\u4E25\u683C\u91C7\u7528 DoD 90%/25\u2103/SoH 70% \u53E3\u5F84\uFF0C\u5E76\u5728\u5408\u540C\u4E2D\u9650\u5B9A\u6D4B\u8BD5\u65B9\u6CD5\u3002", owner: "\u9648\u7ACB", state: "open" },
  { id: "risk-04", projectId: "p-01", level: "mid", kind: "\u8BC1\u636E\u7F3A\u53E3", text: "\u7ADE\u5BF9 B \u7684\u6D88\u9632\u4E0E\u566A\u58F0\u6570\u636E\u7F3A\u5931\uFF0C\u6211\u65B9\u5728\u5B89\u5168\u7EF4\u5EA6\u7684\u4F18\u52BF\u76EE\u524D\u7F3A\u4E4F\u5BF9\u624B\u4FA7\u8BC1\u636E\u652F\u6491\uFF0C\u8BC4\u5BA1\u65F6\u8BF4\u670D\u529B\u5F31\u3002", relatedKeys: ["fire_suppression", "noise"], suggestion: "\u901A\u8FC7\u516C\u5F00\u6E20\u9053\u8865\u5145\u7ADE\u5BF9 B \u7684\u8BA4\u8BC1\u4E0E\u6D4B\u8BD5\u62A5\u544A\uFF0C\u6216\u8F6C\u4E3A\u6211\u65B9\u4E3B\u52A8\u62AB\u9732\u7684\u5BF9\u6BD4\u70B9\u3002", owner: "\u674E\u7EF4", state: "mitigating" },
  { id: "risk-05", projectId: "p-01", level: "mid", kind: "\u5546\u52A1\u98CE\u9669", text: "\u7ADE\u5BF9 A \u9884\u4ED8\u6BD4\u4F8B 30% \u9AD8\u4E8E\u6211\u65B9 20%\uFF0C\u4E1A\u4E3B\u53EF\u80FD\u636E\u6B64\u8981\u6C42\u6211\u65B9\u63D0\u9AD8\u9884\u4ED8\u6216\u964D\u4F4E\u603B\u4EF7\u3002", relatedKeys: ["payment_terms"], suggestion: "\u5546\u52A1\u4FA7\u51C6\u5907\u4E24\u79CD\u4ED8\u6B3E\u7ED3\u6784\u5907\u9009\uFF0C\u907F\u514D\u5728\u5355\u4E00\u7ED3\u6784\u4E0A\u88AB\u538B\u4EF7\u3002", owner: "\u5468\u654F", state: "open" },
  { id: "risk-06", projectId: "p-01", level: "low", kind: "\u8BC1\u636E\u7F3A\u53E3", text: "\u6211\u65B9\u566A\u58F0\u6570\u636E\u6765\u81EA\u5185\u90E8\u6D4B\u8BD5\uFF0C\u7F3A\u5C11\u7B2C\u4E09\u65B9\u62A5\u544A\u3002", relatedKeys: ["noise"], suggestion: "\u8865\u5145\u7B2C\u4E09\u65B9\u566A\u58F0\u6D4B\u8BD5\u62A5\u544A\uFF0C\u6216\u6539\u4E3A\u8303\u56F4\u503C\u62AB\u9732\u3002", owner: "\u674E\u7EF4", state: "closed" },
  { id: "risk-07", projectId: "p-02", level: "high", kind: "\u5546\u52A1\u98CE\u9669", text: "\u7ADE\u5BF9 D \u4EE5\u5EF6\u4FDD\u5F62\u5F0F\u63D0\u4F9B 12 \u5E74\u8D28\u4FDD\uFF0C\u82E5\u4E1A\u4E3B\u6309 12 \u5E74\u8BC4\u6807\uFF0C\u6211\u65B9 10 \u5E74\u5C06\u5931\u5206\u3002", relatedKeys: ["warranty_years"], suggestion: "\u6D4B\u7B97\u5EF6\u4FDD\u81F3 12 \u5E74\u7684\u6210\u672C\u5E76\u7EB3\u5165\u62A5\u4EF7\u65B9\u6848\uFF0C\u540C\u65F6\u660E\u786E\u5EF6\u4FDD\u6761\u4EF6\u3002", owner: "\u90D1\u4E00", state: "open" },
  { id: "risk-08", projectId: "p-03", level: "mid", kind: "\u8BC1\u636E\u7F3A\u53E3", text: "\u7ADE\u5BF9 E \u7684\u626B\u63CF\u4EF6\u89E3\u6790\u5931\u8D25\uFF0C\u5173\u952E\u53C2\u6570\u6682\u65E0\u6570\u636E\uFF0C\u62BD\u53D6\u9636\u6BB5\u65E0\u6CD5\u5B8C\u6210\u5BF9\u6BD4\u3002", relatedKeys: ["system_rte", "warranty_years"], suggestion: "\u7D22\u53D6\u53EF\u68C0\u7D22\u7248\u672C\u6216\u4EBA\u5DE5\u5F55\u5165\u5173\u952E\u5B57\u6BB5\uFF1B\u5FC5\u8981\u65F6\u5728\u5BF9\u6BD4\u4E2D\u6807\u6CE8\u300C\u8BC1\u636E\u4E0D\u8DB3\u300D\u3002", owner: "\u674E\u7EF4", state: "open" }
];
var CLARIFICATIONS = [
  { id: "clr-01", projectId: "p-01", question: "\u8BF7\u660E\u786E\u7CFB\u7EDF\u5F80\u8FD4\u6548\u7387\u7684\u6D4B\u91CF\u8FB9\u754C\u4E0E\u8F85\u52A9\u529F\u8017\u662F\u5426\u8BA1\u5165\uFF1F", background: "\u62DB\u6807\u6587\u4EF6 3.2 \u8981\u6C42 AC-AC \u226588%\uFF0C\u4F46\u672A\u8BF4\u660E\u8F85\u52A9\u529F\u8017\u5904\u7406\u65B9\u5F0F\uFF1B\u7ADE\u5BF9 A \u62A5\u4EF7\u57FA\u4E8E DC \u4FA7\u53E3\u5F84\u3002", impact: "\u5F71\u54CD\u6548\u7387\u9879\u6A2A\u5411\u53EF\u6BD4\u6027\u4E0E\u8BC4\u5206", evidenceIds: ["anc-01", "anc-07"] },
  { id: "clr-02", projectId: "p-01", question: "\u5FAA\u73AF\u5BFF\u547D\u7684\u6D4B\u8BD5\u6761\u4EF6\uFF08DoD\u3001\u6E29\u5EA6\u3001SoH \u7EC8\u70B9\u3001\u500D\u7387\uFF09\u662F\u5426\u7EDF\u4E00\u6309 3.2.4 \u6267\u884C\uFF1F", background: "\u7ADE\u5BF9 A \u672A\u7ED9\u51FA\u6761\u4EF6\uFF0C\u7ADE\u5BF9 B \u4F7F\u7528 DoD 80%/SoH 60%\uFF0C\u4E0E\u8981\u6C42\u4E0D\u4E00\u81F4\u3002", impact: "\u5F71\u54CD\u5BFF\u547D\u627F\u8BFA\u4E0E\u8D28\u4FDD\u6210\u672C", evidenceIds: ["anc-02", "anc-08"] },
  { id: "clr-03", projectId: "p-01", question: "\u53EF\u7528\u7387\u7684\u7EDF\u8BA1\u5468\u671F\u4E0E\u8BA1\u7B97\u65B9\u5F0F\u662F\u5426\u9650\u5B9A\u4E3A\u300C\u5E74\u5EA6\u3001\u65F6\u95F4\u52A0\u6743\u300D\uFF1F", background: "\u7ADE\u5BF9 B \u91C7\u7528\u6708\u5EA6\u53E3\u5F84\uFF0C\u6570\u503C\u504F\u9AD8\uFF0C\u6613\u9020\u6210\u8BC4\u6807\u8BEF\u5224\u3002", impact: "\u5F71\u54CD\u53EF\u7528\u7387\u627F\u8BFA\u4E0E\u8FDD\u7EA6\u8D54\u507F", evidenceIds: ["anc-03", "anc-14"] },
  { id: "clr-04", projectId: "p-01", question: "PCS \u662F\u5426\u7EB3\u5165 10 \u5E74\u6574\u7CFB\u7EDF\u8D28\u4FDD\u8303\u56F4\uFF1F", background: "\u7ADE\u5BF9 A \u7684 PCS \u4EC5\u4FDD 5 \u5E74\uFF0C\u82E5\u4E1A\u4E3B\u63A5\u53D7\u8BE5\u914D\u7F6E\uFF0C\u5C06\u538B\u4F4E\u6574\u4F53\u8D28\u4FDD\u57FA\u51C6\u3002", impact: "\u5F71\u54CD\u8D28\u4FDD\u6210\u672C\u4E0E\u504F\u79BB\u8868\u53E3\u5F84", evidenceIds: ["anc-04", "anc-09"] },
  { id: "clr-05", projectId: "p-01", question: "\u4EA4\u4ED8\u5468\u671F\u7684\u8D77\u7B97\u70B9\u4E0E\u662F\u5426\u5305\u542B\u6D77\u8FD0\u3001\u5E76\u7F51\u8C03\u8BD5\uFF1F", background: "\u7ADE\u5BF9 A \u7684 24 \u5468\u4E0D\u542B\u6D77\u8FD0\uFF0C\u7ADE\u5BF9 B \u672A\u62AB\u9732\uFF0C\u53E3\u5F84\u4E0D\u7EDF\u4E00\u3002", impact: "\u5F71\u54CD\u4EA4\u4ED8\u627F\u8BFA\u4E0E\u8FDD\u7EA6\u91D1\u98CE\u9669", evidenceIds: ["anc-06", "anc-10"] },
  { id: "clr-06", projectId: "p-02", question: "\u5EF6\u4FDD\u81F3 12 \u5E74\u7684\u4EF7\u683C\u4E0E\u6761\u4EF6\u662F\u5426\u63A5\u53D7\u5355\u72EC\u62A5\u4EF7\uFF1F", background: "\u7ADE\u5BF9 D \u4EE5\u5EF6\u4FDD\u5408\u540C\u5F62\u5F0F\u63D0\u4F9B 12 \u5E74\u8D28\u4FDD\u3002", impact: "\u5F71\u54CD\u5546\u52A1\u65B9\u6848\u4E0E\u62A5\u4EF7\u7ED3\u6784", evidenceIds: ["anc-09"] }
];

// src/app/core/mock/reviews.ts
var REVIEW_TASKS = [
  {
    id: "task-01",
    projectId: "p-01",
    kind: "\u53C2\u6570\u590D\u6838",
    targetRef: "pv-019",
    title: "\u7ADE\u5BF9 A \u5FAA\u73AF\u5BFF\u547D\uFF1A12000 \u6B21\uFF08\u6761\u4EF6\u7F3A\u5931\uFF09",
    priority: "high",
    assignee: "u-01",
    editor: "u-01",
    due: "2026-10-25",
    state: "pending",
    diff: [
      { field: "\u7F6E\u4FE1\u5EA6", current: "0.61", suggested: "0.90", changed: true },
      { field: "\u6761\u4EF6 DoD", current: "\u672A\u6807\u6CE8", suggested: "90", changed: true },
      { field: "\u6761\u4EF6 SoH", current: "\u672A\u6807\u6CE8", suggested: "70", changed: true },
      { field: "\u72B6\u6001", current: "\u51B2\u7A81\u5F85\u51B3", suggested: "\u5DF2\u786E\u8BA4", changed: true }
    ],
    note: "\u540C\u4E00\u7ADE\u5BF9\u5728\u6295\u6807\u6587\u4EF6\u4E0E\u4EA7\u54C1\u624B\u518C\u4E2D\u7ED9\u51FA\u4E24\u4E2A\u5BFF\u547D\u503C\uFF0C\u9700\u88C1\u51B3\u540E\u7EDF\u4E00\u53E3\u5F84\u3002"
  },
  {
    id: "task-02",
    projectId: "p-01",
    kind: "\u5F3A\u5236\u6761\u6B3E",
    targetRef: "cmp-001",
    title: "\u7CFB\u7EDF\u6548\u7387\u5F3A\u5236\u6761\u6B3E\uFF1A\u5224\u5B9A\u4E3A\u300C\u65E0\u6CD5\u76F4\u63A5\u6BD4\u8F83\u300D\uFF0C\u9700\u786E\u8BA4\u5E94\u7B54\u53E3\u5F84",
    priority: "high",
    assignee: "u-02",
    editor: "u-01",
    due: "2026-10-25",
    state: "pending",
    diff: [
      { field: "\u5224\u5B9A", current: "\u65E0\u6CD5\u76F4\u63A5\u6BD4\u8F83", suggested: "\u6EE1\u8DB3", changed: true },
      { field: "\u6211\u65B9\u5C55\u793A\u503C", current: "88.5%\uFF08AC-AC\uFF09", suggested: "88.5%\uFF08AC-AC\uFF0C\u542B\u8F85\u52A9\uFF09", changed: true }
    ],
    note: "\u82E5\u786E\u8BA4\u4E3A\u6EE1\u8DB3\uFF0C\u9700\u540C\u6B65\u5728\u504F\u79BB\u8868\u4E2D\u6CE8\u660E\u53E3\u5F84\uFF0C\u907F\u514D\u8BC4\u6807\u8BEF\u8BFB\u3002"
  },
  {
    id: "task-03",
    projectId: "p-01",
    kind: "\u7ED3\u8BBA\u5BA1\u6838",
    targetRef: "ins-006",
    title: "\u63A8\u65AD\u7C7B\u7ED3\u8BBA\uFF1A\u5EFA\u8BAE\u4E3B\u52A8\u63D0\u51FA\u6548\u7387\u53E3\u5F84\u63D0\u6848",
    priority: "mid",
    assignee: "u-02",
    editor: "u-01",
    due: "2026-10-26",
    state: "pending",
    diff: [
      { field: "\u7ED3\u8BBA\u7C7B\u578B", current: "\u63A8\u65AD", suggested: "\u5EFA\u8BAE", changed: true },
      { field: "\u63AA\u8F9E", current: "\u82E5\u4E1A\u4E3B\u63A5\u53D7\u2026\u5C06\u663E\u52A3\u52BF", suggested: "\u5EFA\u8BAE\u6F84\u6E05\u9636\u6BB5\u63D0\u51FA\u7EDF\u4E00\u53E3\u5F84", changed: true }
    ]
  },
  {
    id: "task-04",
    projectId: "p-01",
    kind: "\u627F\u8BFA\u98CE\u9669",
    targetRef: "risk-03",
    title: "\u5FAA\u73AF\u5BFF\u547D\u627F\u8BFA\u6761\u4EF6\u9700\u6CD5\u52A1\u786E\u8BA4",
    priority: "high",
    assignee: "u-04",
    editor: "u-01",
    due: "2026-10-24",
    state: "overdue",
    diff: [
      { field: "\u627F\u8BFA\u6761\u4EF6", current: "DoD 90%/25\u2103/SoH 70%", suggested: "DoD 90%/25\u2103/SoH 70%\uFF08\u5199\u5165\u5408\u540C\u9644\u4EF6\uFF09", changed: true }
    ],
    note: "\u8D85\u671F\u672A\u5904\u7406\uFF0C\u5DF2\u5347\u7EA7\u81F3\u6295\u6807\u7ECF\u7406\u3002"
  },
  {
    id: "task-05",
    projectId: "p-01",
    kind: "\u53C2\u6570\u590D\u6838",
    targetRef: "pv-009",
    title: "\u6211\u65B9\u8F85\u52A9\u529F\u8017 1.6%\uFF08\u7F6E\u4FE1\u5EA6 0.88\uFF09",
    priority: "low",
    assignee: "u-01",
    editor: "u-01",
    due: "2026-10-26",
    state: "pending",
    diff: [{ field: "\u72B6\u6001", current: "\u5F85\u590D\u6838", suggested: "\u5DF2\u786E\u8BA4", changed: true }]
  },
  {
    id: "task-06",
    projectId: "p-01",
    kind: "\u5165\u5E93\u7533\u8BF7",
    targetRef: "lib-c-a-cycle",
    title: "\u7ADE\u5BF9 A \u5FAA\u73AF\u5BFF\u547D\u7ED3\u8BBA\u7533\u8BF7\u8FDB\u5165\u4F01\u4E1A\u77E5\u8BC6\u5E93",
    priority: "mid",
    assignee: "u-02",
    editor: "u-07",
    due: "2026-10-27",
    state: "assigned",
    diff: [
      { field: "\u5165\u5E93\u8303\u56F4", current: "\u4EC5\u672C\u9879\u76EE", suggested: "\u4F01\u4E1A\u77E5\u8BC6\u5E93", changed: true },
      { field: "\u6709\u6548\u671F", current: "\u2014", suggested: "18 \u4E2A\u6708", changed: true }
    ]
  },
  {
    id: "task-07",
    projectId: "p-02",
    kind: "\u53C2\u6570\u590D\u6838",
    targetRef: "pv-044",
    title: "\u7ADE\u5BF9 C \u4EA4\u4ED8\u5468\u671F\u51FA\u73B0\u4E24\u4E2A\u503C\uFF1A20 \u5468 / 24 \u5468",
    priority: "high",
    assignee: "u-07",
    editor: "u-07",
    due: "2026-10-25",
    state: "pending",
    diff: [
      { field: "\u503C", current: "20 \u5468", suggested: "24 \u5468\uFF08\u542B\u6D77\u8FD0\uFF09", changed: true },
      { field: "\u6765\u6E90", current: "\u624B\u518C P.30", suggested: "\u6295\u6807\u6458\u8981 P.18", changed: true }
    ]
  },
  {
    id: "task-08",
    projectId: "p-02",
    kind: "\u7ED3\u8BBA\u5BA1\u6838",
    targetRef: "ins-011",
    title: "\u7ADE\u5BF9 D \u8D28\u4FDD\u6309 10 \u5E74\u8BA1\u5165\u7684\u7ED3\u8BBA\u786E\u8BA4",
    priority: "mid",
    assignee: "u-02",
    editor: "u-07",
    due: "2026-10-28",
    state: "approved",
    diff: [{ field: "\u7ED3\u8BBA\u7C7B\u578B", current: "\u4E8B\u5B9E", suggested: "\u4E8B\u5B9E", changed: false }]
  },
  {
    id: "task-09",
    projectId: "p-03",
    kind: "\u53C2\u6570\u590D\u6838",
    targetRef: "pv-053",
    title: "\u7ADE\u5BF9 E \u6548\u7387 87.5%\uFF08\u6765\u6E90\u4E3A\u65E7\u7248\u624B\u518C\uFF09",
    priority: "mid",
    assignee: "u-01",
    editor: "u-07",
    due: "2026-10-27",
    state: "pending",
    diff: [
      { field: "\u6765\u6E90\u65F6\u6548", current: "2025-11\uFF08\u5DF2\u8FC7 18 \u4E2A\u6708\uFF09", suggested: "\u9700\u66F4\u65B0", changed: true },
      { field: "\u7F6E\u4FE1\u5EA6", current: "0.72", suggested: "0.55", changed: true }
    ]
  }
];
var REPORT_TEMPLATES = [
  { id: "tpl-tech", name: "\u6280\u672F\u53C2\u6570\u5BF9\u6BD4\u62A5\u544A", audience: "\u6280\u672F\u5DE5\u7A0B\u5E08 / \u8BC4\u5BA1\u7EC4", sections: ["\u8303\u56F4\u4E0E\u65B9\u6CD5", "\u53C2\u6570\u77E9\u9635", "\u53E3\u5F84\u8BF4\u660E", "\u5DEE\u8DDD\u6E05\u5355", "\u8BC1\u636E\u7D22\u5F15"], estPages: 18, icon: "table" },
  { id: "tpl-gap", name: "\u6280\u672F\u5DEE\u8DDD\u4E0E\u98CE\u9669\u6E05\u5355", audience: "\u6295\u6807\u7ECF\u7406", sections: ["\u5DEE\u8DDD\u6458\u8981", "\u5F3A\u5236\u6761\u6B3E", "\u98CE\u9669\u5206\u7EA7", "\u5904\u7F6E\u5EFA\u8BAE"], estPages: 8, icon: "alert" },
  { id: "tpl-evidence", name: "\u5173\u952E\u53C2\u6570\u8BC1\u636E\u7D22\u5F15", audience: "\u6CD5\u52A1 / \u5BA1\u6838", sections: ["\u5B57\u6BB5\u6E05\u5355", "\u539F\u6587\u5F15\u7528", "\u6765\u6E90\u53EF\u9760\u6027", "\u5BA1\u6838\u8BB0\u5F55"], estPages: 12, icon: "link" },
  { id: "tpl-clarify", name: "\u5F85\u6F84\u6E05\u95EE\u9898\u6E05\u5355", audience: "\u7B54\u7591\u8D1F\u8D23\u4EBA", sections: ["\u95EE\u9898\u5217\u8868", "\u80CC\u666F", "\u5F71\u54CD\u9879", "\u5EFA\u8BAE\u8BDD\u672F"], estPages: 5, icon: "help" },
  { id: "tpl-brief", name: "\u7BA1\u7406\u5C42\u4E00\u9875\u7B80\u62A5", audience: "\u7BA1\u7406\u5C42", sections: ["\u4E00\u53E5\u8BDD\u7ED3\u8BBA", "\u80DC\u8D1F\u624B", "\u98CE\u9669\u7EA2\u9EC4\u7EFF", "\u5F85\u51B3\u7B56\u9879"], estPages: 1, icon: "doc" }
];
var REPORT_SNAPSHOTS = [
  { id: "snap-01", projectId: "p-01", templateId: "tpl-gap", version: "v1.0", publishedAt: "2026-10-20T18:20:00", author: "\u738B\u741B", watermark: "CZ-Morava \xB7 \u738B\u741B \xB7 2026-10-20 \xB7 \u5185\u90E8\u8D44\u6599", pages: 8 },
  { id: "snap-02", projectId: "p-01", templateId: "tpl-tech", version: "v1.1", publishedAt: "2026-10-23T10:05:00", author: "\u674E\u7EF4", watermark: "CZ-Morava \xB7 \u674E\u7EF4 \xB7 2026-10-23 \xB7 \u5185\u90E8\u8D44\u6599", pages: 18 },
  { id: "snap-03", projectId: "p-02", templateId: "tpl-brief", version: "v2.0", publishedAt: "2026-10-22T09:40:00", author: "\u738B\u741B", watermark: "DE-Lahn \xB7 \u738B\u741B \xB7 2026-10-22 \xB7 \u5185\u90E8\u8D44\u6599", pages: 1 }
];

// src/app/core/mock/audit.ts
var ROWS = [
  [42, "\u674E\u7EF4", "login", "\u767B\u5F55\u7CFB\u7EDF", "IP 10.20.31.17"],
  [38, "\u674E\u7EF4", "correct", "pv-017 \u7CFB\u7EDF\u5F80\u8FD4\u6548\u7387", "\u539F\u6587\u4E3A DC \u4FA7\u6548\u7387\uFF0C\u6309 AC-AC \u53E3\u5F84\u91CD\u7B97"],
  [35, "\u674E\u7EF4", "confirm", "pv-002 \u5FAA\u73AF\u5BFF\u547D", "\u786E\u8BA4\u6761\u4EF6 DoD90/25\u2103/SoH70"],
  [30, "\u738B\u741B", "login", "\u767B\u5F55\u7CFB\u7EDF", "IP 10.20.31.9"],
  [28, "\u738B\u741B", "approve", "task-08 \u7ED3\u8BBA\u5BA1\u6838", "\u901A\u8FC7"],
  [25, "\u5468\u654F", "export", "DE-Lahn \u4E00\u9875\u7B80\u62A5 v2.0", "\u8131\u654F\u6A21\u5F0F"],
  [22, "\u674E\u7EF4", "conflict", "pv-019 \u5FAA\u73AF\u5BFF\u547D", "\u53D1\u73B0\u4E24\u4E2A\u6765\u6E90\u503C\u4E0D\u4E00\u81F4"],
  [20, "\u9648\u7ACB", "login", "\u767B\u5F55\u7CFB\u7EDF", "IP 10.20.31.44"],
  [18, "\u9648\u7ACB", "confirm", "risk-03 \u627F\u8BFA\u6761\u4EF6", "\u8981\u6C42\u5199\u5165\u5408\u540C\u9644\u4EF6"],
  [15, "\u5B59\u9ECE", "config", "\u9608\u503C\u914D\u7F6E", "\u62BD\u68C0\u6BD4\u4F8B 10% \u2192 15%"],
  [13, "\u5B59\u9ECE", "config", "\u53C2\u6570\u5B57\u5178 system_rte v3", "\u65B0\u589E\u522B\u540D System Efficiency"],
  [11, "\u674E\u7EF4", "upload", "doc-13 \u7ADE\u5BF9E_\u6280\u672F\u5E94\u7B54_\u626B\u63CF\u4EF6.pdf", "\u6765\u6E90\u672A\u77E5"],
  [9, "\u674E\u7EF4", "parse", "doc-13", "\u89E3\u6790\u5931\u8D25\uFF1AOCR \u7F6E\u4FE1\u5EA6\u4E0D\u8DB3"],
  [8, "\u5434\u6850", "login", "\u767B\u5F55\u7CFB\u7EDF", "IP 10.20.32.5"],
  [7, "\u5434\u6850", "confirm", "pv-044 \u4EA4\u4ED8\u5468\u671F", "\u5F85\u590D\u6838"],
  [6, "\u738B\u741B", "export", "CZ-Morava \u6280\u672F\u5BF9\u6BD4\u62A5\u544A v1.1", "\u542B\u8BC1\u636E\u7D22\u5F15"],
  [5, "\u8D75\u6657", "login", "\u767B\u5F55\u7CFB\u7EDF", "IP 10.20.33.2"],
  [4, "\u8D75\u6657", "export", "\u7BA1\u7406\u5C42\u4E00\u9875\u7B80\u62A5", "\u53EA\u8BFB\u67E5\u770B"],
  [3, "\u674E\u7EF4", "extract", "doc-03", "\u62BD\u53D6 14 \u4E2A\u5B57\u6BB5"],
  [2, "\u738B\u741B", "approve", "task-02 \u5F3A\u5236\u6761\u6B3E", "\u5F85\u5904\u7406"],
  [1, "\u5B59\u9ECE", "config", "\u89D2\u8272\u6743\u9650\u77E9\u9635", "\u6CD5\u52A1\uFF1A\u5BFC\u51FA\u62A5\u544A \u2192 \u7981\u6B62"],
  [60, "\u90D1\u4E00", "login", "\u767B\u5F55\u7CFB\u7EDF", "IP 10.20.34.11"],
  [95, "\u90D1\u4E00", "export", "\u5546\u4E1A\u6761\u6B3E\u5BF9\u6BD4", "\u4EC5\u5546\u52A1\u7EF4\u5EA6"],
  [130, "\u674E\u7EF4", "upload", "doc-12 \u7ADE\u5BF9E_UrbanStore_\u4EA7\u54C1\u624B\u518C.pdf", "\u516C\u5F00\u6E20\u9053"],
  [180, "\u738B\u741B", "confirm", "cmp-004 \u8D28\u4FDD\u5E74\u9650", "\u8981\u6C42\u7ADE\u5BF9\u6F84\u6E05 PCS \u8986\u76D6"],
  [240, "\u5B59\u9ECE", "config", "\u9879\u76EE\u6210\u5458\uFF1Ap-03", "\u65B0\u589E\u7BA1\u7406\u5458"],
  [300, "\u5434\u6850", "correct", "pv-047 \u5FAA\u73AF\u5BFF\u547D", "\u8865\u5145 SoH \u6761\u4EF6"],
  [360, "\u9648\u7ACB", "approve", "risk-02 \u8D28\u4FDD\u504F\u79BB", "\u5904\u7F6E\u65B9\u6848\u5DF2\u786E\u8BA4"],
  [420, "\u674E\u7EF4", "export", "\u53C2\u6570\u77E9\u9635 CSV", "\u5BFC\u51FA 60 \u884C"],
  [480, "\u90D1\u4E00", "export", "\u62A5\u4EF7\u654F\u611F\u5B57\u6BB5", "\u6743\u9650\u4E0D\u8DB3\uFF0C\u5DF2\u62D2\u7EDD", true]
];
function pad(n) {
  return String(n).padStart(3, "0");
}
function iso(minutesAgo) {
  const base = (/* @__PURE__ */ new Date("2026-10-24T09:00:00")).getTime();
  return new Date(base - minutesAgo * 6e4).toISOString().slice(0, 16);
}
var AUDIT_EVENTS = ROWS.map(([minutesAgo, actor, action, target, detail, denied], i) => ({
  id: "aud-" + pad(i + 1),
  at: iso(minutesAgo),
  actor,
  action,
  target,
  result: denied ? "denied" : "ok",
  ip: "10.20.3" + (i % 5 + 1) + "." + (10 + i % 40),
  detail
}));

// src/app/core/mock/users.ts
var USERS = [
  { id: "u-01", name: "\u674E\u7EF4", role: "engineer", initials: "\u674E", lastLogin: "2026-10-24T08:41:00" },
  { id: "u-02", name: "\u738B\u741B", role: "bidManager", initials: "\u738B", lastLogin: "2026-10-24T08:05:00" },
  { id: "u-03", name: "\u5468\u654F", role: "commercial", initials: "\u5468", lastLogin: "2026-10-23T17:22:00" },
  { id: "u-04", name: "\u9648\u7ACB", role: "legal", initials: "\u9648", lastLogin: "2026-10-23T15:10:00" },
  { id: "u-05", name: "\u8D75\u6657", role: "exec", initials: "\u8D75", lastLogin: "2026-10-22T09:30:00" },
  { id: "u-06", name: "\u5B59\u9ECE", role: "admin", initials: "\u5B59", lastLogin: "2026-10-24T07:58:00" },
  { id: "u-07", name: "\u5434\u6850", role: "engineer", initials: "\u5434", lastLogin: "2026-10-23T19:02:00" },
  { id: "u-08", name: "\u90D1\u4E00", role: "commercial", initials: "\u90D1", lastLogin: "2026-10-20T11:47:00" }
];
var CURRENT_USER_ID = "u-01";
var PERMISSION_ACTIONS = [
  { key: "viewDoc", label: "\u67E5\u770B\u6587\u6863\u4E0E\u539F\u6587" },
  { key: "uploadDoc", label: "\u4E0A\u4F20/\u5220\u9664\u6587\u6863" },
  { key: "editParam", label: "\u786E\u8BA4/\u4FEE\u6539\u53C2\u6570" },
  { key: "generate", label: "\u53D1\u8D77\u5206\u6790\u4E0E\u7814\u5224" },
  { key: "reviewHigh", label: "\u5BA1\u6838\u9AD8\u98CE\u9669\u7ED3\u8BBA" },
  { key: "publish", label: "\u53D1\u5E03\u7ED3\u8BBA/\u5BFC\u51FA\u62A5\u544A" },
  { key: "viewPrice", label: "\u67E5\u770B\u62A5\u4EF7\u654F\u611F\u5B57\u6BB5" },
  { key: "configDict", label: "\u914D\u7F6E\u5B57\u5178/\u6743\u91CD/\u9608\u503C" },
  { key: "viewAudit", label: "\u67E5\u770B\u5BA1\u8BA1\u65E5\u5FD7" },
  { key: "manageMember", label: "\u7BA1\u7406\u9879\u76EE\u6210\u5458" }
];
var allow = (keys) => Object.fromEntries(keys.map((k) => [k, "allow"]));
var readOnly = (keys) => Object.fromEntries(keys.map((k) => [k, "read"]));
var DEFAULT_PERMISSIONS = {
  engineer: {
    ...allow(["viewDoc", "uploadDoc", "editParam", "generate", "reviewHigh"]),
    ...Object.fromEntries(
      ["publish", "viewPrice", "configDict", "viewAudit", "manageMember"].map((k) => [k, "deny"])
    )
  },
  bidManager: allow(PERMISSION_ACTIONS.map((a) => a.key)),
  commercial: {
    ...readOnly(["viewDoc", "generate"]),
    ...Object.fromEntries(
      ["uploadDoc", "editParam", "reviewHigh", "publish", "viewPrice", "configDict", "viewAudit", "manageMember"].map(
        (k) => [k, k === "viewPrice" ? "allow" : "deny"]
      )
    )
  },
  legal: {
    ...readOnly(["viewDoc", "generate", "reviewHigh"]),
    ...Object.fromEntries(
      ["uploadDoc", "editParam", "publish", "viewPrice", "configDict", "viewAudit", "manageMember"].map((k) => [
        k,
        "deny"
      ])
    )
  },
  exec: {
    ...readOnly(["viewDoc", "generate", "reviewHigh"]),
    ...Object.fromEntries(
      ["uploadDoc", "editParam", "configDict", "manageMember"].map((k) => [k, "deny"])
    ),
    publish: "allow",
    viewPrice: "allow",
    viewAudit: "read"
  },
  admin: {
    ...readOnly(["viewDoc", "editParam", "generate", "reviewHigh", "publish"]),
    ...allow(["configDict", "viewAudit", "manageMember"]),
    uploadDoc: "allow",
    viewPrice: "read"
  }
};
var ROLE_ORDER = ["engineer", "bidManager", "commercial", "legal", "exec", "admin"];

// src/app/core/mock/retro.ts
var FACTORS = [
  {
    id: "wf-01",
    title: "\u4EA4\u4ED8\u5468\u671F\u627F\u8BFA\u53EF\u9A8C\u8BC1\uFF0C\u8BC4\u5206\u8868\u5217\u4E3A\u672C\u9879\u6700\u9AD8\u5206",
    category: "delivery",
    level: "A",
    customerNeed: "\u4E1A\u4E3B\u5E76\u7F51\u8282\u70B9\u53D7\u8865\u8D34\u9000\u5761\u7EA6\u675F\uFF0C\u4EA4\u4ED8\u786E\u5B9A\u6027\u4F18\u5148\u4E8E\u5355\u4EF7",
    ourResponse: "28 \u5468\u4EA4\u4ED8\uFF08\u542B 5 \u5468\u6D77\u8FD0 + 2 \u5468\u5E76\u7F51\uFF09\uFF0C\u5E76\u63D0\u4F9B\u4E0A\u4E00\u9879\u76EE\u5B9E\u9645\u4EA4\u4ED8\u8BB0\u5F55",
    competitorGap: "\u7ADE\u5BF9 A \u62A5 24 \u5468\u4F46\u4E0D\u542B\u6D77\u8FD0\u4E0E\u5E76\u7F51\uFF0C\u5B9E\u9645\u7A97\u53E3\u4E0D\u53EF\u6BD4",
    evidence: ["\u6B63\u5F0F\u8BC4\u5206\u8868\u7B2C 4 \u9879\uFF1A\u4EA4\u4ED8\u8BA1\u5212\u5F97\u5206 9/10", "\u4E1A\u4E3B\u6F84\u6E05\u90AE\u4EF6 2024-06-11 \u660E\u786E\u8BA4\u53EF\u4EA4\u4ED8\u8BB0\u5F55"],
    confirmedBy: "\u738B\u741B"
  },
  {
    id: "wf-02",
    title: "AC-AC \u53E3\u5F84\u6548\u7387\u6570\u636E\u5B8C\u6574\uFF0C\u907F\u514D\u6F84\u6E05\u9636\u6BB5\u88AB\u964D\u5206",
    category: "efficiency",
    level: "A",
    customerNeed: "\u62DB\u6807\u8981\u6C42 AC-AC \u226588% \u4E14\u542B\u8F85\u52A9\u529F\u8017\uFF0C\u53E3\u5F84\u4E0D\u6E05\u5C06\u89E6\u53D1\u6F84\u6E05",
    ourResponse: "\u540C\u65F6\u63D0\u4EA4 AC-AC \u4E0E DC-DC \u4E24\u5957\u6570\u636E\u5E76\u6CE8\u660E\u8FB9\u754C",
    competitorGap: "\u7ADE\u5BF9 A \u53EA\u7ED9 DC \u4FA7 92%\uFF0C\u88AB\u8981\u6C42\u8865\u5145\u8BF4\u660E",
    evidence: ["\u8BC4\u5206\u8868\u7B2C 6 \u9879\uFF1A\u6280\u672F\u7B26\u5408\u6027\u6EE1\u5206", "\u6F84\u6E05\u7EAA\u8981 C-03"],
    confirmedBy: "\u674E\u7EF4"
  },
  {
    id: "wf-03",
    title: "\u672C\u5730\u670D\u52A1\u7F51\u70B9\u6570\u91CF\u6784\u6210\u5DEE\u5F02\u5316",
    category: "local",
    level: "B",
    customerNeed: "\u4E1A\u4E3B\u8981\u6C42 8 \u5C0F\u65F6\u5185\u73B0\u573A\u54CD\u5E94",
    ourResponse: "\u6B27\u6D32 300+ \u7F51\u70B9\uFF0C4 \u5C0F\u65F6\u54CD\u5E94\u627F\u8BFA",
    competitorGap: "\u7ADE\u5BF9 D \u4EC5\u627F\u8BFA 6 \u5C0F\u65F6\u4E14\u4E3A\u7B2C\u4E09\u65B9\u5408\u4F5C",
    evidence: ["\u6295\u6807\u6587\u4EF6\u670D\u52A1\u7AE0\u8282", "\u5408\u540C\u8C08\u5224\u8BB0\u5F55 2024-07-02"]
  },
  {
    id: "wf-04",
    title: "\u5B89\u5168\u8BA4\u8BC1\u8986\u76D6\u6295\u6807\u578B\u53F7",
    category: "compliance",
    level: "A",
    customerNeed: "UL9540 \u4E0E EN50549 \u5FC5\u987B\u8986\u76D6\u6295\u6807\u578B\u53F7\uFF0C\u7F3A\u4E00\u5373\u5E9F\u6807",
    ourResponse: "\u8BC1\u4E66\u578B\u53F7\u4E0E\u6295\u6807\u914D\u7F6E\u4E00\u81F4\uFF0C\u63D0\u4F9B\u53D1\u8BC1\u65E5\u671F\u4E0E\u6709\u6548\u671F",
    competitorGap: "\u7ADE\u5BF9 C \u7684 UL9540 \u578B\u53F7\u4E0D\u8986\u76D6\u65B0\u914D\u7F6E",
    evidence: ["\u8BC4\u5206\u8868\u7B2C 2 \u9879\uFF1A\u5408\u89C4\u6027\u901A\u8FC7", "\u8BC1\u4E66\u6838\u9A8C\u8BB0\u5F55"],
    confirmedBy: "\u9648\u7ACB"
  },
  {
    id: "wf-05",
    title: "\u62A5\u4EF7\u7ED3\u6784\u5206\u9879\u6E05\u6670\uFF0C\u4E1A\u4E3B\u4FBF\u4E8E\u505A TCO \u6BD4\u8F83",
    category: "tco",
    level: "B",
    customerNeed: "\u4E1A\u4E3B\u5185\u90E8\u9700\u6309 20 \u5E74 TCO \u8BC4\u5BA1\uFF0C\u8981\u6C42\u5206\u9879\u62A5\u4EF7",
    ourResponse: "\u8BBE\u5907/\u8FD0\u8F93/\u5B89\u88C5\u8C03\u8BD5/5 \u5E74\u8FD0\u7EF4\u56DB\u9879\u5206\u5217\uFF0C\u9644\u8870\u51CF\u4E0E\u8F85\u52A9\u529F\u8017\u5047\u8BBE",
    competitorGap: "\u7ADE\u5BF9 B \u4EC5\u7ED9\u603B\u4EF7\uFF0CTCO \u65E0\u6CD5\u6838\u7B97",
    evidence: ["\u6295\u6807\u62A5\u4EF7\u5355\u9644\u8868", "\u4E1A\u4E3B\u6280\u672F\u6F84\u6E05\u56DE\u590D"]
  },
  {
    id: "wf-06",
    title: "\u5FAA\u73AF\u5BFF\u547D\u6761\u4EF6\u4E0E\u62DB\u6807\u5B8C\u5168\u5BF9\u9F50",
    category: "efficiency",
    level: "A",
    customerNeed: "\u62DB\u6807\u8981\u6C42 8000 \u6B21 @ DoD90/25\u2103/SoH70",
    ourResponse: "\u6309\u540C\u6761\u4EF6\u627F\u8BFA 8500 \u6B21\uFF0C\u5E76\u9644\u7B2C\u4E09\u65B9\u6D4B\u8BD5\u62A5\u544A",
    competitorGap: "\u7ADE\u5BF9 B \u4F7F\u7528 DoD80/SoH60\uFF0C\u88AB\u8981\u6C42\u5F52\u4E00\u540E\u518D\u6BD4",
    evidence: ["\u8BC4\u5206\u8868\u7B2C 7 \u9879\uFF1A\u5BFF\u547D\u4E0E\u8D28\u4FDD\u5F97\u5206 8/10"],
    confirmedBy: "\u674E\u7EF4"
  },
  {
    id: "wf-07",
    title: "\u7591\u4F3C\u56E0\u54C1\u724C\u4E1A\u7EE9\u52A0\u5206\uFF08\u5F85\u9A8C\u8BC1\uFF09",
    category: "reference",
    level: "C",
    customerNeed: "\u62DB\u6807\u5BF9\u540C\u7C7B\u89C4\u6A21\u4E1A\u7EE9\u6709\u52A0\u5206\u9879",
    ourResponse: "\u63D0\u4EA4 3 \u4E2A\u6B27\u6D32\u540C\u7C7B\u9879\u76EE\u4E1A\u7EE9",
    competitorGap: "\u672A\u83B7\u53D6\u5BF9\u624B\u4E1A\u7EE9\u6750\u6599",
    evidence: ["\u4EC5\u6709\u6295\u6807\u6587\u4EF6\uFF0C\u65E0\u8BC4\u5206\u8868\u7EC6\u9879"]
  },
  {
    id: "wf-08",
    title: "\u4ED8\u6B3E\u6761\u4EF6\u4F18\u4E8E\u5BF9\u624B\u4F46\u975E\u51B3\u5B9A\u56E0\u7D20",
    category: "price",
    level: "B",
    customerNeed: "\u4E1A\u4E3B\u5E0C\u671B\u964D\u4F4E\u9884\u4ED8\u6B3E\u6BD4\u4F8B",
    ourResponse: "\u9884\u4ED8 20%\uFF0C\u4F4E\u4E8E\u5BF9\u624B 30%",
    competitorGap: "\u7ADE\u5BF9 A \u8981\u6C42 30% \u9884\u4ED8",
    evidence: ["\u5546\u52A1\u8C08\u5224\u7EAA\u8981 2024-07-05"]
  },
  {
    id: "wf-09",
    title: "\u6D88\u9632\u65B9\u6848\u91C7\u7528\u5168\u6C1F\u5DF1\u916E\uFF0C\u83B7\u4E1A\u4E3B\u5B89\u5168\u56E2\u961F\u8BA4\u53EF",
    category: "safety",
    level: "A",
    customerNeed: "\u7AD9\u5740\u9760\u8FD1\u5C45\u6C11\u533A\uFF0C\u6D88\u9632\u65B9\u6848\u662F\u8BC4\u5BA1\u91CD\u70B9",
    ourResponse: "\u5168\u6C1F\u5DF1\u916E + NFPA 69 \u9632\u7206 + \u53EF\u71C3\u6C14\u4F53\u63A2\u6D4B",
    competitorGap: "\u7ADE\u5BF9 D \u4F7F\u7528\u6C14\u6EB6\u80F6\u65B9\u6848\uFF0C\u88AB\u8981\u6C42\u8865\u5145\u8BBA\u8BC1",
    evidence: ["\u4E1A\u4E3B\u5B89\u5168\u8BC4\u5BA1\u610F\u89C1 2024-06-28"],
    confirmedBy: "\u674E\u7EF4"
  },
  {
    id: "wf-10",
    title: "\u5E76\u7F51\u4EFF\u771F\u62A5\u544A\u63D0\u524D\u63D0\u4EA4\u7F29\u77ED\u8BC4\u5BA1\u5468\u671F",
    category: "compliance",
    level: "B",
    customerNeed: "\u5E76\u7F51\u5BA1\u6279\u662F\u9879\u76EE\u5173\u952E\u8DEF\u5F84",
    ourResponse: "\u6295\u6807\u9636\u6BB5\u5373\u63D0\u4EA4 EN50549 \u4EFF\u771F\u62A5\u544A",
    competitorGap: "\u5BF9\u624B\u5728\u4E2D\u6807\u540E\u624D\u8865\u4EA4",
    evidence: ["\u6295\u6807\u9644\u4EF6\u6E05\u5355", "\u6F84\u6E05\u7EAA\u8981 C-07"]
  },
  {
    id: "wf-11",
    title: "\u7591\u4F3C\u56E0\u4EF7\u683C\u66F4\u4F4E\u800C\u4E2D\u6807\uFF08\u5F85\u9A8C\u8BC1\uFF09",
    category: "price",
    level: "C",
    customerNeed: "\u9884\u7B97\u654F\u611F",
    ourResponse: "\u6700\u7EC8\u62A5\u4EF7\u4F4E\u4E8E\u5BF9\u624B\u7EA6 4%",
    competitorGap: "\u672A\u83B7\u53D6\u5BF9\u624B\u6700\u7EC8\u62A5\u4EF7",
    evidence: ["\u4EC5\u6709 BAFO \u5185\u90E8\u8BB0\u5F55"]
  },
  {
    id: "wf-12",
    title: "\u8D28\u4FDD\u5E74\u9650\u4E0E\u8303\u56F4\u8986\u76D6 PCS",
    category: "tco",
    level: "A",
    customerNeed: "\u6574\u7CFB\u7EDF 10 \u5E74\u8D28\u4FDD\uFF0C\u542B PCS",
    ourResponse: "10 \u5E74\u6574\u7CFB\u7EDF\u542B PCS\uFF0C\u65E0\u9644\u52A0\u6761\u4EF6",
    competitorGap: "\u7ADE\u5BF9 A \u7684 PCS \u4EC5 5 \u5E74",
    evidence: ["\u8BC4\u5206\u8868\u7B2C 9 \u9879\uFF1A\u8D28\u4FDD\u6761\u6B3E\u5F97\u5206 9/10"],
    confirmedBy: "\u9648\u7ACB"
  },
  {
    id: "wf-13",
    title: "\u6295\u6807\u7EC4\u7EC7\uFF1A\u6CD5\u52A1\u63D0\u524D\u4ECB\u5165\u907F\u514D\u975E\u6807\u6761\u6B3E",
    category: "compliance",
    level: "B",
    customerNeed: "\u4E1A\u4E3B\u5408\u540C\u542B\u9AD8\u989D\u5EF6\u8FDF\u8D54\u507F\u6761\u6B3E",
    ourResponse: "\u6CD5\u52A1\u5728\u7B2C 2 \u5468\u4ECB\u5165\uFF0C\u63D0\u524D\u63D0\u51FA\u8D23\u4EFB\u4E0A\u9650\u4FEE\u8BA2",
    competitorGap: "\u672A\u77E5",
    evidence: ["\u5185\u90E8\u8BC4\u5BA1\u7EAA\u8981", "\u5408\u540C\u4FEE\u8BA2\u8BB0\u5F55"]
  },
  {
    id: "wf-14",
    title: "\u8FD0\u7EF4\u65B9\u6848\u6309 5 \u5E74\u62A5\u4EF7\uFF0C\u4E0E\u4E1A\u4E3B\u8FD0\u8425\u671F\u5339\u914D",
    category: "tco",
    level: "B",
    customerNeed: "\u4E1A\u4E3B\u81EA\u6301\u8FD0\u8425 5 \u5E74\u540E\u79FB\u4EA4",
    ourResponse: "\u8FD0\u7EF4\u6309 5 \u5E74\u6253\u5305\u62A5\u4EF7\uFF0C\u542B\u5907\u4EF6\u4E0E\u8FDC\u7A0B\u76D1\u63A7",
    competitorGap: "\u7ADE\u5BF9 B \u6309 3 \u5E74\u62A5\u4EF7\uFF0C\u540E\u7EED\u8D39\u7528\u4E0D\u786E\u5B9A",
    evidence: ["\u6295\u6807\u62A5\u4EF7\u5355", "\u4E1A\u4E3B\u6F84\u6E05\u56DE\u590D"]
  }
];
function pick(ids) {
  return FACTORS.filter((f) => ids.includes(f.id));
}
var AWARDED_PROJECTS = [
  {
    id: "rp-01",
    name: "DE-Lahn 200MWh \u7535\u7F51\u4FA7\u50A8\u80FD\uFF082024 \u4E2D\u6807\uFF09",
    country: "DE",
    mw: 50,
    mwh: 200,
    route: "LFP \u6DB2\u51B7",
    customerType: "\u5E02\u653F\u516C\u7528\u4E8B\u4E1A",
    bidMode: "\u516C\u5F00\u62DB\u6807\uFF08\u4E24\u9636\u6BB5\uFF09",
    contractMode: "EPC \u603B\u627F\u5305",
    productModel: "Aster 5000",
    awardedYear: 2024,
    competitorIds: ["c-a", "c-d"],
    hasScoreSheet: true,
    snapshotAt: "2026-08-14",
    factors: pick(["wf-01", "wf-02", "wf-03", "wf-04", "wf-05"])
  },
  {
    id: "rp-02",
    name: "UK-Northgate 100MWh \u914D\u50A8\uFF082025 \u4E2D\u6807\uFF09",
    country: "UK",
    mw: 25,
    mwh: 100,
    route: "LFP \u98CE\u51B7",
    customerType: "\u72EC\u7ACB\u53D1\u7535\u5546",
    bidMode: "\u6846\u67B6\u534F\u8BAE + \u7ADE\u6807",
    contractMode: "\u8BBE\u5907\u4F9B\u8D27 + \u8C03\u8BD5",
    productModel: "Aster 5000\uFF08\u98CE\u51B7\u6539\u578B\uFF09",
    awardedYear: 2025,
    competitorIds: ["c-b", "c-e"],
    hasScoreSheet: false,
    snapshotAt: "2026-09-02",
    factors: pick(["wf-07", "wf-10", "wf-14"])
  },
  {
    id: "rp-03",
    name: "CZ-Morava 320MWh \u72EC\u7ACB\u50A8\u80FD\uFF082025 \u4E2D\u6807\uFF09",
    country: "CZ",
    mw: 80,
    mwh: 320,
    route: "LFP \u6DB2\u51B7",
    customerType: "\u7535\u7F51\u516C\u53F8",
    bidMode: "\u516C\u5F00\u62DB\u6807",
    contractMode: "EPC \u603B\u627F\u5305",
    productModel: "Aster 5000",
    awardedYear: 2025,
    competitorIds: ["c-a", "c-c"],
    hasScoreSheet: true,
    snapshotAt: "2026-09-20",
    factors: pick(["wf-02", "wf-06", "wf-09", "wf-12"])
  },
  {
    id: "rp-04",
    name: "IT-Sardinia 80MWh \u5C9B\u5C7F\u50A8\u80FD\uFF082024 \u4E2D\u6807\uFF09",
    country: "IT",
    mw: 20,
    mwh: 80,
    route: "LFP \u6DB2\u51B7",
    customerType: "\u516C\u7528\u4E8B\u4E1A",
    bidMode: "\u6709\u9650\u9080\u8BF7\u62DB\u6807",
    contractMode: "\u8BBE\u5907 + 5 \u5E74\u8FD0\u7EF4",
    productModel: "Aster 5000",
    awardedYear: 2024,
    competitorIds: ["c-b", "c-d"],
    hasScoreSheet: true,
    snapshotAt: "2026-07-30",
    factors: pick(["wf-08", "wf-11", "wf-13"])
  }
];
var EXPERIENCES = [
  {
    id: "exp-01",
    category: "competitor",
    title: "\u7ADE\u5BF9 A \u7684\u6548\u7387\u6807\u79F0\u53E3\u5F84\u4E0E\u62A5\u4EF7\u8FB9\u754C",
    summary: "\u7ADE\u5BF9 A \u4E60\u60EF\u4EE5 DC \u4FA7\u6548\u7387\u6807\u79F0\uFF0892%\uFF09\uFF0C\u4E14\u660E\u786E\u4E0D\u542B\u8F85\u52A9\u529F\u8017\uFF1B\u82E5\u4E1A\u4E3B\u672A\u7EDF\u4E00\u53E3\u5F84\uFF0C\u5176\u6570\u503C\u4F1A\u9020\u6210\u8BEF\u5BFC\u3002\u5E94\u5BF9\uFF1A\u4E3B\u52A8\u63D0\u4EA4\u53CC\u53E3\u5F84\u6570\u636E\u5E76\u63A8\u52A8\u7B54\u7591\u7EDF\u4E00\u3002",
    projectId: "rp-01",
    country: "DE",
    scaleBand: "100\u2013300MWh",
    customerType: "\u5E02\u653F\u516C\u7528\u4E8B\u4E1A",
    bidMode: "\u516C\u5F00\u62DB\u6807\uFF08\u4E24\u9636\u6BB5\uFF09",
    productModel: "Aster 5000",
    requirement: "AC-AC \u5F80\u8FD4\u6548\u7387 \u226588%\uFF0C\u542B\u8F85\u52A9\u529F\u8017",
    strategy: "\u53CC\u53E3\u5F84\u62AB\u9732 + \u7B54\u7591\u9636\u6BB5\u63A8\u52A8\u7EDF\u4E00\u6D4B\u91CF\u8FB9\u754C",
    result: "\u4E2D\u6807\uFF0C\u6280\u672F\u7B26\u5408\u6027\u6EE1\u5206",
    evidenceLevel: "A",
    evidenceSources: ["\u6B63\u5F0F\u8BC4\u5206\u8868\u7B2C 6 \u9879", "\u6F84\u6E05\u7EAA\u8981 C-03"],
    reviewer: "\u674E\u7EF4",
    reviewedAt: "2026-08-14",
    scope: "\u9002\u7528\u4E8E\u6B27\u6D32\u516C\u5F00\u62DB\u6807\u3001\u4E1A\u4E3B\u5BF9\u6548\u7387\u53E3\u5F84\u654F\u611F\u7684\u9879\u76EE\uFF1B\u4E0D\u9002\u7528\u4E8E\u4EC5\u6BD4\u603B\u4EF7\u7684\u6846\u67B6\u91C7\u8D2D",
    state: "verified"
  },
  {
    id: "exp-02",
    category: "competitor",
    title: "\u7ADE\u5BF9 B \u7684\u53EF\u7528\u7387\u6309\u6708\u5EA6\u53E3\u5F84\u627F\u8BFA",
    summary: "\u7ADE\u5BF9 B \u5E38\u4EE5 99% \u6708\u5EA6\u53EF\u7528\u7387\u5448\u73B0\uFF0C\u6570\u503C\u9AD8\u4E8E\u5E74\u5EA6\u65F6\u95F4\u52A0\u6743\u53E3\u5F84\uFF1B\u9700\u5728\u6F84\u6E05\u4E2D\u8981\u6C42\u7EDF\u4E00\u4E3A\u5E74\u5EA6\u53E3\u5F84\u518D\u6BD4\u8F83\u3002",
    projectId: "rp-03",
    country: "CZ",
    scaleBand: "300MWh \u4EE5\u4E0A",
    customerType: "\u7535\u7F51\u516C\u53F8",
    bidMode: "\u516C\u5F00\u62DB\u6807",
    productModel: "Aster 5000",
    requirement: "\u5E74\u53EF\u7528\u7387 \u226598%\uFF0C\u65F6\u95F4\u52A0\u6743",
    strategy: "\u8981\u6C42\u5BF9\u624B\u6309\u5E74\u5EA6\u53E3\u5F84\u8865\u5145\uFF0C\u6211\u65B9\u76F4\u63A5\u7ED9\u5E74\u5EA6\u6570\u636E",
    result: "\u4E2D\u6807\uFF0C\u8D28\u4FDD\u6761\u6B3E\u5F97\u5206 9/10",
    evidenceLevel: "A",
    evidenceSources: ["\u6B63\u5F0F\u8BC4\u5206\u8868\u7B2C 9 \u9879", "\u7B54\u7591\u56DE\u590D 2025-05-18"],
    reviewer: "\u738B\u741B",
    reviewedAt: "2026-09-20",
    scope: "\u9002\u7528\u4E8E\u53EF\u7528\u7387\u8BA1\u5165\u8BC4\u5206\u6216\u8D54\u4ED8\u7684\u72EC\u7ACB\u50A8\u80FD\u9879\u76EE",
    state: "verified"
  },
  {
    id: "exp-03",
    category: "competitor",
    title: "\u7ADE\u5BF9 C \u7684\u4F4E\u4EF7 + \u77ED\u4EA4\u671F\u7EC4\u5408\uFF08\u5F85\u9A8C\u8BC1\uFF09",
    summary: "\u7ADE\u5BF9 C \u5728\u6CE2\u5170\u9879\u76EE\u4E2D\u4EE5\u4F4E\u4EF7\u4E0E 20 \u5468\u4EA4\u671F\u7EC4\u5408\u53C2\u4E0E\u7ADE\u4E89\uFF0C\u4F46\u6700\u7EC8\u672A\u4E2D\u6807\uFF1B\u63A8\u6D4B\u5176\u4EA4\u671F\u4E0D\u542B\u6D77\u8FD0\uFF0C\u9700\u5728\u540E\u7EED\u9879\u76EE\u6838\u5B9E\u3002",
    projectId: "rp-03",
    country: "CZ",
    scaleBand: "100\u2013300MWh",
    customerType: "\u7535\u7F51\u516C\u53F8",
    bidMode: "\u516C\u5F00\u62DB\u6807",
    productModel: "Aster 5000",
    requirement: "\u4EA4\u4ED8 \u226430 \u5468\uFF0C\u542B\u6D77\u8FD0\u4E0E\u5E76\u7F51",
    strategy: "\u4EE5\u53EF\u9A8C\u8BC1\u7684\u4EA4\u4ED8\u8BB0\u5F55\u5BF9\u6297\u5176\u77ED\u4EA4\u671F\u627F\u8BFA",
    result: "\u5BF9\u624B\u672A\u4E2D\u6807\uFF0C\u539F\u56E0\u672A\u516C\u5F00",
    evidenceLevel: "C",
    evidenceSources: ["\u5185\u90E8\u7ADE\u6807\u8BB0\u5F55\uFF08\u65E0\u8BC4\u6807\u53CD\u9988\uFF09"],
    reviewer: "\u674E\u7EF4",
    reviewedAt: "2026-09-20",
    scope: "\u4EC5\u4F5C\u5047\u8BBE\uFF1A\u7ADE\u5BF9 C \u7684\u4EA4\u671F\u53E3\u5F84\u53EF\u80FD\u4E0D\u542B\u6D77\u8FD0\uFF0C\u9700\u5728\u4E0B\u4E2A\u9879\u76EE\u7D22\u53D6\u5176\u6F84\u6E05\u6587\u4EF6",
    state: "draft"
  },
  {
    id: "exp-04",
    category: "competitor",
    title: "\u7ADE\u5BF9 D \u7684\u8D28\u4FDD\u4EE5\u5EF6\u4FDD\u5408\u540C\u5F62\u5F0F\u5305\u88C5",
    summary: "\u7ADE\u5BF9 D \u5BA3\u79F0 12 \u5E74\u8D28\u4FDD\uFF0C\u5B9E\u9645\u9700\u53E6\u7B7E\u5EF6\u4FDD\u5408\u540C\u5E76\u989D\u5916\u62A5\u4EF7\u3002\u5E94\u5BF9\uFF1A\u575A\u6301\u300C\u65E0\u6761\u4EF6\u6574\u7CFB\u7EDF\u8D28\u4FDD\u300D\u8868\u8FF0\uFF0C\u5E76\u8981\u6C42\u5BF9\u624B\u660E\u786E\u6761\u4EF6\u3002",
    projectId: "rp-04",
    country: "IT",
    scaleBand: "80\u2013150MWh",
    customerType: "\u516C\u7528\u4E8B\u4E1A",
    bidMode: "\u6709\u9650\u9080\u8BF7\u62DB\u6807",
    productModel: "Aster 5000",
    requirement: "\u6574\u7CFB\u7EDF\u8D28\u4FDD \u226510 \u5E74\uFF08\u542B PCS\uFF09",
    strategy: "\u660E\u786E\u65E0\u6761\u4EF6\u8D28\u4FDD\u8303\u56F4\uFF0C\u6307\u51FA\u5BF9\u624B\u6761\u4EF6\u6027\u627F\u8BFA",
    result: "\u4E2D\u6807\uFF0C\u8D28\u4FDD\u6761\u6B3E\u65E0\u504F\u79BB",
    evidenceLevel: "B",
    evidenceSources: ["\u6295\u6807\u6587\u4EF6\u5BF9\u6BD4\u8868", "\u5546\u52A1\u8C08\u5224\u7EAA\u8981 2024-09-12"],
    reviewer: "\u9648\u7ACB",
    reviewedAt: "2026-07-30",
    scope: "\u9002\u7528\u4E8E\u8D28\u4FDD\u6761\u6B3E\u6743\u91CD\u9AD8\u7684\u6B27\u6D32\u4E1A\u4E3B",
    state: "verified"
  },
  {
    id: "exp-05",
    category: "deviation",
    title: "\u5FAA\u73AF\u5BFF\u547D\u6D4B\u8BD5\u6761\u4EF6\u5FC5\u987B\u56DB\u9879\u9F50\u5168",
    summary: "\u82E5\u5BF9\u624B\u53EA\u7ED9\u5FAA\u73AF\u6B21\u6570\u3001\u4E0D\u7ED9 DoD/\u6E29\u5EA6/SoH \u7EC8\u70B9\uFF0C\u76F4\u63A5\u6BD4\u8F83\u5FC5\u7136\u51FA\u9519\u3002\u505A\u6CD5\uFF1A\u628A\u56DB\u9879\u6761\u4EF6\u4F5C\u4E3A\u5FC5\u586B\u5B57\u6BB5\uFF0C\u7F3A\u9879\u4E00\u5F8B\u5224\u300C\u65E0\u6CD5\u76F4\u63A5\u6BD4\u8F83\u300D\uFF0C\u5E76\u5217\u5165\u6F84\u6E05\u6E05\u5355\u3002",
    projectId: "rp-03",
    country: "CZ",
    scaleBand: "300MWh \u4EE5\u4E0A",
    customerType: "\u7535\u7F51\u516C\u53F8",
    bidMode: "\u516C\u5F00\u62DB\u6807",
    productModel: "Aster 5000",
    requirement: "\u22658000 \u6B21\uFF08DoD90/25\u2103/SoH70\uFF09",
    strategy: "\u6761\u4EF6\u7F3A\u5931\u5373\u5224\u4E0D\u53EF\u6BD4\uFF0C\u7981\u6B62\u6298\u7B97\u540E\u6BD4\u8F83",
    result: "\u4E2D\u6807\uFF0C\u5BFF\u547D\u9879\u5F97\u5206 8/10",
    evidenceLevel: "A",
    evidenceSources: ["\u6B63\u5F0F\u8BC4\u5206\u8868\u7B2C 7 \u9879", "\u6295\u6807\u6587\u4EF6\u6280\u672F\u5E94\u7B54 P.41"],
    reviewer: "\u674E\u7EF4",
    reviewedAt: "2026-09-20",
    scope: "\u5168\u90E8\u5927\u50A8\u9879\u76EE\u901A\u7528",
    state: "verified"
  },
  {
    id: "exp-06",
    category: "deviation",
    title: "\u8BA4\u8BC1\u578B\u53F7\u4E0D\u8986\u76D6\u65B0\u914D\u7F6E\u662F\u9AD8\u9891\u5E9F\u6807\u70B9",
    summary: "\u7ADE\u5BF9 C \u7684 UL9540 \u8BC1\u4E66\u672A\u8986\u76D6\u5176\u65B0\u914D\u7F6E\uFF0C\u88AB\u8981\u6C42\u8865\u5145\u3002\u505A\u6CD5\uFF1A\u6295\u6807\u524D\u9010\u9879\u6838\u5BF9\u8BC1\u4E66\u578B\u53F7\u4E0E\u6295\u6807\u914D\u7F6E\uFF0C\u767B\u8BB0\u53D1\u8BC1\u65E5\u671F\u4E0E\u6709\u6548\u671F\u3002",
    projectId: "rp-01",
    country: "DE",
    scaleBand: "100\u2013300MWh",
    customerType: "\u5E02\u653F\u516C\u7528\u4E8B\u4E1A",
    bidMode: "\u516C\u5F00\u62DB\u6807\uFF08\u4E24\u9636\u6BB5\uFF09",
    productModel: "Aster 5000",
    requirement: "UL9540 / IEC62619 / EN50549 \u8986\u76D6\u6295\u6807\u578B\u53F7",
    strategy: "\u5EFA\u7ACB\u8BC1\u4E66-\u578B\u53F7-\u6709\u6548\u671F\u4E09\u5217\u6838\u5BF9\u8868",
    result: "\u4E2D\u6807\uFF0C\u5408\u89C4\u6027\u901A\u8FC7",
    evidenceLevel: "A",
    evidenceSources: ["\u6B63\u5F0F\u8BC4\u5206\u8868\u7B2C 2 \u9879", "\u8BC1\u4E66\u6838\u9A8C\u8BB0\u5F55"],
    reviewer: "\u9648\u7ACB",
    reviewedAt: "2026-08-14",
    scope: "\u9002\u7528\u4E8E\u6240\u6709\u9700\u8981 UL/IEC/\u5E76\u7F51\u8BA4\u8BC1\u7684\u5E02\u573A",
    state: "verified"
  },
  {
    id: "exp-07",
    category: "deviation",
    title: "\u5E76\u7F51\u4EFF\u771F\u62A5\u544A\u63D0\u524D\u63D0\u4EA4\u53EF\u7F29\u77ED\u8BC4\u5BA1\uFF08\u5F85\u9A8C\u8BC1\uFF09",
    summary: "UK \u9879\u76EE\u4E2D\u6211\u4EEC\u5728\u6295\u6807\u9636\u6BB5\u5373\u63D0\u4EA4 EN50549 \u4EFF\u771F\u62A5\u544A\uFF0C\u8BC4\u5BA1\u5468\u671F\u7F29\u77ED\u7EA6 2 \u5468\uFF1B\u4F46\u65E0\u8BC4\u6807\u8BC1\u636E\u8BC1\u660E\u5176\u76F4\u63A5\u5F71\u54CD\u7ED3\u679C\u3002",
    projectId: "rp-02",
    country: "UK",
    scaleBand: "80\u2013150MWh",
    customerType: "\u72EC\u7ACB\u53D1\u7535\u5546",
    bidMode: "\u6846\u67B6\u534F\u8BAE + \u7ADE\u6807",
    productModel: "Aster 5000\uFF08\u98CE\u51B7\u6539\u578B\uFF09",
    requirement: "\u5E76\u7F51\u7B26\u5408 G99/EN50549",
    strategy: "\u6295\u6807\u9636\u6BB5\u9644\u4EFF\u771F\u62A5\u544A\u4E0E\u5E76\u7F51\u65F6\u95F4\u8868",
    result: "\u4E2D\u6807\uFF0C\u539F\u56E0\u672A\u516C\u5F00\u8BC4\u5206\u8868",
    evidenceLevel: "C",
    evidenceSources: ["\u6295\u6807\u9644\u4EF6\u6E05\u5355", "\u9879\u76EE\u5185\u90E8\u5468\u62A5"],
    reviewer: "\u5434\u6850",
    reviewedAt: "2026-09-02",
    scope: "\u5047\u8BBE\uFF1A\u9002\u7528\u4E8E\u5E76\u7F51\u5BA1\u6279\u4E3A\u5173\u952E\u8DEF\u5F84\u7684\u9879\u76EE\uFF0C\u9700\u5728\u540E\u7EED\u9879\u76EE\u9A8C\u8BC1",
    state: "draft"
  },
  {
    id: "exp-08",
    category: "commercial",
    title: "\u5206\u9879\u62A5\u4EF7\u662F TCO \u8BC4\u5BA1\u7684\u5165\u573A\u5238",
    summary: "\u4E1A\u4E3B\u505A 20 \u5E74 TCO \u8BC4\u5BA1\u65F6\uFF0C\u53EA\u7ED9\u603B\u4EF7\u7684\u65B9\u6848\u65E0\u6CD5\u88AB\u6838\u7B97\u3002\u505A\u6CD5\uFF1A\u8BBE\u5907/\u8FD0\u8F93/\u5B89\u88C5\u8C03\u8BD5/\u8FD0\u7EF4\u56DB\u9879\u5206\u5217\uFF0C\u5E76\u9644\u8870\u51CF\u4E0E\u8F85\u52A9\u529F\u8017\u5047\u8BBE\u3002",
    projectId: "rp-01",
    country: "DE",
    scaleBand: "100\u2013300MWh",
    customerType: "\u5E02\u653F\u516C\u7528\u4E8B\u4E1A",
    bidMode: "\u516C\u5F00\u62DB\u6807\uFF08\u4E24\u9636\u6BB5\uFF09",
    productModel: "Aster 5000",
    requirement: "\u8981\u6C42\u5206\u8BBE\u5907/\u5B89\u88C5/\u8FD0\u7EF4\u4E09\u9879\u62A5\u4EF7",
    strategy: "\u56DB\u9879\u5206\u5217 + TCO \u5047\u8BBE\u900F\u660E\u5316",
    result: "\u4E2D\u6807\uFF0C\u5546\u52A1\u8BC4\u5BA1\u65E0\u6F84\u6E05",
    evidenceLevel: "B",
    evidenceSources: ["\u62A5\u4EF7\u5355\u9644\u8868", "\u4E1A\u4E3B\u6280\u672F\u6F84\u6E05\u56DE\u590D"],
    reviewer: "\u5468\u654F",
    reviewedAt: "2026-08-14",
    scope: "\u9002\u7528\u4E8E\u4EE5 TCO \u6216 LCOE \u8BC4\u5BA1\u7684\u6B27\u6D32\u4E1A\u4E3B",
    state: "verified"
  },
  {
    id: "exp-09",
    category: "commercial",
    title: "\u9884\u4ED8\u6B3E\u6BD4\u4F8B\u662F\u5546\u52A1\u8BA9\u6B65\u7684\u4F4E\u6210\u672C\u7B79\u7801",
    summary: "\u5C06\u9884\u4ED8\u6BD4\u4F8B\u4ECE 30% \u964D\u81F3 20%\uFF0C\u5BF9\u73B0\u91D1\u6D41\u5F71\u54CD\u6709\u9650\uFF0C\u4F46\u5728\u5546\u52A1\u8BC4\u5BA1\u4E2D\u5F62\u6210\u5DEE\u5F02\uFF1B\u914D\u5408\u5206\u9879\u62A5\u4EF7\u6548\u679C\u66F4\u4F73\u3002",
    projectId: "rp-04",
    country: "IT",
    scaleBand: "80\u2013150MWh",
    customerType: "\u516C\u7528\u4E8B\u4E1A",
    bidMode: "\u6709\u9650\u9080\u8BF7\u62DB\u6807",
    productModel: "Aster 5000",
    requirement: "\u9884\u4ED8 \u226420%",
    strategy: "\u9884\u4ED8 20%\uFF0C\u6362\u53D6\u8D28\u4FDD\u6761\u6B3E\u4E0E\u4EA4\u4ED8\u8282\u70B9\u7F13\u548C",
    result: "\u4E2D\u6807",
    evidenceLevel: "B",
    evidenceSources: ["\u5546\u52A1\u8C08\u5224\u7EAA\u8981 2024-07-05"],
    reviewer: "\u5468\u654F",
    reviewedAt: "2026-07-30",
    scope: "\u9002\u7528\u4E8E\u4E1A\u4E3B\u73B0\u91D1\u6D41\u654F\u611F\u3001\u5546\u52A1\u6743\u91CD \u226530% \u7684\u9879\u76EE",
    state: "verified"
  },
  {
    id: "exp-10",
    category: "commercial",
    title: "\u5C65\u7EA6\u4FDD\u51FD\u4E0E LD \u4E0A\u9650\u9700\u5728\u6295\u6807\u9636\u6BB5\u9501\u5B9A",
    summary: "\u67D0\u9879\u76EE\u6295\u6807\u65F6\u63A5\u53D7 1%/\u5468\u3001\u4E0A\u9650 15% \u7684\u5EF6\u8FDF\u8D54\u507F\uFF0C\u5C65\u7EA6\u9636\u6BB5\u56E0\u6D77\u8FD0\u5EF6\u8BEF\u89E6\u53D1\u8D54\u4ED8\uFF1B\u5E94\u5728\u6295\u6807\u9636\u6BB5\u8BBE\u5B9A 0.5%/\u5468\u3001\u4E0A\u9650 10% \u7684\u8FB9\u754C\u3002",
    projectId: "rp-02",
    country: "UK",
    scaleBand: "80\u2013150MWh",
    customerType: "\u72EC\u7ACB\u53D1\u7535\u5546",
    bidMode: "\u6846\u67B6\u534F\u8BAE + \u7ADE\u6807",
    productModel: "Aster 5000\uFF08\u98CE\u51B7\u6539\u578B\uFF09",
    requirement: "LD \u22640.5%/\u5468\uFF0C\u4E0A\u9650 10%",
    strategy: "\u6CD5\u52A1\u63D0\u524D\u4ECB\u5165\uFF0C\u8BBE\u5B9A\u8D23\u4EFB\u4E0A\u9650\u5E76\u5199\u5165\u504F\u79BB\u8868",
    result: "\u4E2D\u6807\uFF0C\u4F46\u5C65\u7EA6\u671F\u53D1\u751F LD \u8D54\u4ED8",
    evidenceLevel: "A",
    evidenceSources: ["\u5408\u540C\u6761\u6B3E", "\u5C65\u7EA6\u8D54\u4ED8\u8BB0\u5F55 FR-04"],
    reviewer: "\u9648\u7ACB",
    reviewedAt: "2026-09-25",
    scope: "\u9002\u7528\u4E8E\u542B\u6D77\u8FD0\u4E14\u5E76\u7F51\u8282\u70B9\u521A\u6027\u7684\u9879\u76EE",
    state: "verified"
  },
  {
    id: "exp-11",
    category: "awarded",
    title: "\u4EA4\u4ED8\u8BB0\u5F55\u6BD4\u4EA4\u4ED8\u627F\u8BFA\u66F4\u6709\u8BF4\u670D\u529B",
    summary: "\u628A\u4E0A\u4E00\u9879\u76EE\u7684\u5B9E\u9645\u4EA4\u4ED8\u8BB0\u5F55\uFF08\u6D77\u8FD0 + \u5E76\u7F51\u5929\u6570\uFF09\u4F5C\u4E3A\u9644\u4EF6\u63D0\u4EA4\uFF0C\u6BD4\u5355\u7EAF\u627F\u8BFA\u4EA4\u671F\u66F4\u80FD\u83B7\u5F97\u4E1A\u4E3B\u4FE1\u4EFB\u3002",
    projectId: "rp-01",
    country: "DE",
    scaleBand: "100\u2013300MWh",
    customerType: "\u5E02\u653F\u516C\u7528\u4E8B\u4E1A",
    bidMode: "\u516C\u5F00\u62DB\u6807\uFF08\u4E24\u9636\u6BB5\uFF09",
    productModel: "Aster 5000",
    requirement: "\u4EA4\u4ED8 \u226430 \u5468\uFF0C\u542B\u6D77\u8FD0\u4E0E\u5E76\u7F51",
    strategy: "\u9644\u5386\u53F2\u4EA4\u4ED8\u8BB0\u5F55\u4E0E\u91CC\u7A0B\u7891\u7167\u7247",
    result: "\u4E2D\u6807\uFF0C\u4EA4\u4ED8\u9879\u5F97\u5206 9/10",
    evidenceLevel: "A",
    evidenceSources: ["\u6B63\u5F0F\u8BC4\u5206\u8868\u7B2C 4 \u9879", "\u4E1A\u4E3B\u6F84\u6E05\u90AE\u4EF6 2024-06-11"],
    reviewer: "\u738B\u741B",
    reviewedAt: "2026-08-14",
    scope: "\u9002\u7528\u4E8E\u4EA4\u4ED8\u786E\u5B9A\u6027\u6743\u91CD\u9AD8\u7684\u9879\u76EE",
    state: "verified"
  },
  {
    id: "exp-12",
    category: "awarded",
    title: "\u4E2D\u6807\u4E0D\u7B49\u4E8E\u65B9\u6848\u5168\u5BF9\uFF1A\u4E24\u5904\u8FC7\u5EA6\u914D\u7F6E",
    summary: "\u590D\u76D8\u53D1\u73B0\u8BE5\u9879\u76EE PCS \u5BB9\u91CF\u6309 1.1 \u500D\u8D85\u914D\u3001\u6D88\u9632\u6309\u6700\u9AD8\u7B49\u7EA7\u914D\u7F6E\uFF0C\u5747\u672A\u88AB\u8BC4\u5206\u8868\u52A0\u5206\uFF0C\u5BFC\u81F4\u6210\u672C\u504F\u9AD8\u7EA6 3%\u3002",
    projectId: "rp-03",
    country: "CZ",
    scaleBand: "300MWh \u4EE5\u4E0A",
    customerType: "\u7535\u7F51\u516C\u53F8",
    bidMode: "\u516C\u5F00\u62DB\u6807",
    productModel: "Aster 5000",
    requirement: "\u6309\u62DB\u6807\u6700\u4F4E\u8981\u6C42\u914D\u7F6E\u5373\u53EF",
    strategy: "\u540E\u7EED\u9879\u76EE\u6309\u300C\u786C\u95E8\u69DB + \u5DEE\u5F02\u5316\u300D\u4E24\u5206\u6CD5\u914D\u7F6E\uFF0C\u53D6\u6D88\u672A\u52A0\u5206\u7684\u8D85\u914D",
    result: "\u4E2D\u6807\u4F46\u6210\u672C\u504F\u9AD8",
    evidenceLevel: "B",
    evidenceSources: ["\u6210\u672C\u590D\u76D8\u8868 2026-03", "\u8BC4\u5206\u8868\u5206\u9879\u5BF9\u6BD4"],
    reviewer: "\u738B\u741B",
    reviewedAt: "2026-09-20",
    scope: "\u9002\u7528\u4E8E\u8BC4\u6807\u4EE5\u5408\u89C4+\u4EF7\u683C\u4E3A\u4E3B\u3001\u5DEE\u5F02\u5316\u52A0\u5206\u9879\u6709\u9650\u7684\u9879\u76EE",
    state: "verified"
  }
];
var FULFILMENTS = [
  { id: "fr-01", projectId: "rp-01", commitment: "\u4EA4\u4ED8\u5468\u671F 28 \u5468\uFF08\u542B\u6D77\u8FD0\u4E0E\u5E76\u7F51\uFF09", target: "28 \u5468", actual: "29 \u5468", variance: "+1 \u5468", status: "partial", note: "\u6D77\u8FD0\u56E0\u6E2F\u53E3\u62E5\u5835\u5EF6\u8BEF 1 \u5468\uFF0C\u672A\u89E6\u53D1 LD", verifiedAt: "2025-09-12" },
  { id: "fr-02", projectId: "rp-01", commitment: "AC-AC \u7CFB\u7EDF\u5F80\u8FD4\u6548\u7387 88.5%", target: "88.5%", actual: "88.2%", variance: "-0.3pp", status: "partial", note: "\u8F85\u52A9\u529F\u8017\u7565\u9AD8\u4E8E\u8BBE\u8BA1\u503C\uFF0C\u5DF2\u4E0E\u4E1A\u4E3B\u786E\u8BA4\u63A5\u53D7", verifiedAt: "2025-11-03" },
  { id: "fr-03", projectId: "rp-01", commitment: "\u5E74\u53EF\u7528\u7387 98.5%", target: "98.5%", actual: "98.9%", variance: "+0.4pp", status: "met", note: "\u9996\u5E74\u8FD0\u884C\u6570\u636E", verifiedAt: "2026-08-01" },
  { id: "fr-04", projectId: "rp-02", commitment: "\u5EF6\u8FDF\u4EA4\u4ED8\u8D54\u507F \u22640.5%/\u5468\uFF0C\u4E0A\u9650 10%", target: "\u4E0A\u9650 10%", actual: "\u5B9E\u9645\u8D54\u4ED8 6%", variance: "\u89E6\u53D1\u8D54\u4ED8", status: "missed", note: "\u6D77\u8FD0\u5EF6\u8BEF 6 \u5468\uFF0C\u6309 1%/\u5468\u6761\u6B3E\u8D54\u4ED8 6%\uFF08\u4E0A\u9650 15%\uFF09", verifiedAt: "2026-09-25" },
  { id: "fr-05", projectId: "rp-02", commitment: "\u5E76\u7F51\u8C03\u8BD5 2 \u5468\u5B8C\u6210", target: "2 \u5468", actual: "3 \u5468", variance: "+1 \u5468", status: "partial", note: "\u7535\u7F51\u516C\u53F8\u6392\u671F\u5EF6\u540E", verifiedAt: "2026-04-18" },
  { id: "fr-06", projectId: "rp-03", commitment: "\u5FAA\u73AF\u5BFF\u547D 8500 \u6B21\uFF08DoD90/25\u2103/SoH70\uFF09", target: "8500 \u6B21", actual: "\u8FD0\u884C 1 \u5E74\u8870\u51CF 1.8%", variance: "\u7B26\u5408\u66F2\u7EBF", status: "met", note: "\u6309\u5E74\u5EA6\u8870\u51CF\u62BD\u68C0", verifiedAt: "2026-06-30" },
  { id: "fr-07", projectId: "rp-03", commitment: "\u672C\u5730\u670D\u52A1 4 \u5C0F\u65F6\u54CD\u5E94", target: "\u22644h", actual: "\u5E73\u5747 3.2h", variance: "\u4F18\u4E8E\u627F\u8BFA", status: "met", note: "\u9996\u5E74 7 \u6B21\u5DE5\u5355\u7EDF\u8BA1", verifiedAt: "2026-07-15" },
  { id: "fr-08", projectId: "rp-04", commitment: "\u8FD0\u7EF4 5 \u5E74\u6253\u5305\uFF08\u542B\u5907\u4EF6\uFF09", target: "5 \u5E74", actual: "\u5C65\u7EA6\u4E2D", variance: "\u2014", status: "pending", note: "\u7B2C 2 \u5E74\uFF0C\u5907\u4EF6\u6D88\u8017\u4F4E\u4E8E\u9884\u7B97", verifiedAt: "2026-08-20" },
  { id: "fr-09", projectId: "rp-04", commitment: "\u6574\u7CFB\u7EDF\u8D28\u4FDD 10 \u5E74\uFF08\u542B PCS\uFF09", target: "10 \u5E74", actual: "\u5C65\u7EA6\u4E2D", variance: "\u2014", status: "pending", note: "\u65E0\u7D22\u8D54", verifiedAt: "2026-08-20" },
  { id: "fr-10", projectId: "rp-02", commitment: "\u9884\u4ED8\u6B3E 20%", target: "20%", actual: "20%", variance: "0", status: "met", note: "\u6309\u5408\u540C\u6267\u884C", verifiedAt: "2025-12-01" }
];
var LEVEL_CHANGES = [
  {
    id: "lc-01",
    experienceId: "exp-03",
    from: "C",
    to: "B",
    reason: "\u53D6\u5F97\u7ADE\u5BF9 C \u5728\u6CE2\u5170\u9879\u76EE\u7684\u6F84\u6E05\u6587\u4EF6\uFF0C\u5176\u4EA4\u671F\u786E\u8BA4\u4E3A\u4E0D\u542B\u6D77\u8FD0\uFF0C\u5C5E\u4E8E\u591A\u9879\u6750\u6599\u5171\u540C\u652F\u6301",
    evidenceSources: ["\u7ADE\u5BF9 C \u6F84\u6E05\u6587\u4EF6 2025-11-04", "\u6CE2\u5170\u9879\u76EE\u7B54\u7591\u7EAA\u8981 P.12"],
    requestedBy: "\u5434\u6850",
    requestedAt: "2026-10-22T14:20:00",
    state: "pending"
  },
  {
    id: "lc-02",
    experienceId: "exp-07",
    from: "C",
    to: "B",
    reason: "\u83B7\u4E1A\u4E3B\u9879\u76EE\u7ECF\u7406\u53E3\u5934\u786E\u8BA4\u5E76\u7F51\u62A5\u544A\u7F29\u77ED\u4E86\u8BC4\u5BA1\u5468\u671F\uFF0C\u4F46\u65E0\u4E66\u9762\u8BC4\u5206\u8BC1\u636E",
    evidenceSources: ["\u4E1A\u4E3B\u9879\u76EE\u7ECF\u7406\u8BBF\u8C08\u8BB0\u5F55 2026-10-18"],
    requestedBy: "\u674E\u7EF4",
    requestedAt: "2026-10-23T09:15:00",
    state: "pending"
  },
  {
    id: "lc-03",
    experienceId: "exp-04",
    from: "B",
    to: "A",
    reason: "\u8865\u5145\u53D6\u5F97\u5408\u540C\u8C08\u5224\u8BB0\u5F55\u4E0E\u4E1A\u4E3B\u8D28\u4FDD\u8BC4\u5BA1\u610F\u89C1\uFF0C\u53EF\u76F4\u63A5\u8BC1\u660E\u5BF9\u624B\u7684\u8D28\u4FDD\u4E3A\u6761\u4EF6\u6027\u627F\u8BFA",
    evidenceSources: ["\u5408\u540C\u8C08\u5224\u8BB0\u5F55 2024-09-12", "\u4E1A\u4E3B\u8D28\u4FDD\u8BC4\u5BA1\u610F\u89C1 2024-09-28"],
    requestedBy: "\u9648\u7ACB",
    requestedAt: "2026-08-02T10:30:00",
    state: "approved",
    reviewedBy: "\u738B\u741B",
    reviewedAt: "2026-08-03T09:05:00",
    reviewNote: "\u8BC1\u636E\u94FE\u5B8C\u6574\uFF0C\u540C\u610F\u5347\u7EA7\u4E3A A \u7EA7"
  }
];
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  ACTIVE_PROJECT_ID,
  AUDIT_EVENTS,
  AWARDED_PROJECTS,
  CLARIFICATIONS,
  COMPARISON_ROWS,
  COMPETITORS,
  CURRENT_USER_ID,
  DEFAULT_PERMISSIONS,
  DOCUMENTS,
  DOC_PAGES,
  EXPERIENCES,
  FULFILMENTS,
  INSIGHTS,
  LEVEL_CHANGES,
  PAGE_ANCHORS,
  PARAM_DEFS,
  PARAM_DEF_MAP,
  PARAM_VALUES,
  PARSE_ISSUES,
  PERMISSION_ACTIONS,
  PROJECTS,
  REPORT_SNAPSHOTS,
  REPORT_TEMPLATES,
  REVIEW_TASKS,
  RISK_ITEMS,
  ROLE_ORDER,
  USERS
});
