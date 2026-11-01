const fs = require('fs');
const m = require('./mock.cjs');

const PID = 'p-01';
const project = m.PROJECTS.find((p) => p.id === PID);
const users = new Map(m.USERS.map((u) => [u.id, u]));
const docs = m.DOCUMENTS.filter((d) => d.projectId === PID);
const anchorByDocPage = new Map();
for (const a of m.PAGE_ANCHORS) {
  anchorByDocPage.set(`${a.documentId}:${a.page}:${a.paramKey}`, a.id);
  if (!anchorByDocPage.has(`${a.documentId}:${a.page}`)) {
    anchorByDocPage.set(`${a.documentId}:${a.page}`, a.id);
  }
}

const params = m.PARAM_VALUES.filter((p) => p.projectId === PID).map((p) => ({
  id: p.id,
  defKey: p.defKey,
  defLabel: p.defLabel,
  sourceId: p.sourceId,
  sourceName: p.sourceName,
  value: p.value,
  unit: p.unit,
  status: p.status,
  confidence: p.confidence,
  conditions: p.conditions && Object.keys(p.conditions).length ? p.conditions : undefined,
  anchorId: p.evidence
    ? anchorByDocPage.get(`${p.evidence.documentId}:${p.evidence.page}:${p.defKey}`) ||
      anchorByDocPage.get(`${p.evidence.documentId}:${p.evidence.page}`) ||
      null
    : null,
  conflictValues: p.conflictValues,
}));

const rows = m.COMPARISON_ROWS.filter((r) => r.projectId === PID).map((r) => ({
  id: r.id,
  defKey: r.defKey,
  defLabel: r.defLabel,
  dimension: r.dimension,
  mandatory: r.mandatory,
  requirement: {
    text: r.requirement.text,
    targetValue: r.requirement.targetValue,
    unit: r.requirement.unit,
    conditions: r.requirement.conditions,
  },
  cells: r.cells,
  judged: r.judged,
  reason: r.reason,
  ruleHits: r.ruleHits,
  comparable: r.comparable,
  clarify: r.clarify ?? null,
  weight: r.weight,
}));

const bundle = {
  sourceBundle: PID,
  asOf: '2026-10-24',
  project: {
    id: project.id,
    name: project.name,
    customer: project.customer,
    country: project.country,
    mw: project.mw,
    mwh: project.mwh,
    route: project.route,
    deadline: project.deadline,
    customerType: project.customerType,
    contractMode: project.contractMode,
    stage: project.stage,
  },
  members: project.members.map((mm) => ({
    userId: mm.userId,
    name: users.get(mm.userId).name,
    role: mm.role,
  })),
  documents: docs.map((d) => ({
    id: d.id,
    name: d.name,
    type: d.type,
    reliability: d.reliability,
    pages: d.pages,
    qualityScore: d.qualityScore,
    parseStatus: d.parseStatus,
  })),
  anchors: m.PAGE_ANCHORS.map((a) => ({
    id: a.id,
    documentId: a.documentId,
    page: a.page,
    section: a.section,
    paramKey: a.paramKey,
    paramLabel: a.paramLabel,
    snippet: a.snippet,
    confidence: a.confidence,
  })),
  paramValues: params,
  comparisonRows: rows,
  baseline: {
    insights: m.INSIGHTS.filter((i) => i.projectId === PID),
    risks: m.RISK_ITEMS.filter((r) => r.projectId === PID),
    clarifications: m.CLARIFICATIONS.filter((c) => c.projectId === PID),
  },
};

const out = process.argv[2];
fs.writeFileSync(out, JSON.stringify(bundle, null, 2) + '\n', 'utf8');
console.log('wrote', out);
console.log('params', params.length, 'rows', rows.length, 'anchors', bundle.anchors.length, 'docs', docs.length);
console.log('confirmed', params.filter((p) => p.status === 'confirmed').length);
console.log('conflict', params.filter((p) => p.status === 'conflict').length);
console.log('mandatory rows', rows.filter((r) => r.mandatory).length);
