/**
 * SDK connectivity check: verifies that this machine can create a pi session,
 * discover the workspace skills, and (optionally) complete one prompt.
 *
 *   npx tsx scripts/smoke.ts            # session + skills only
 *   npx tsx scripts/smoke.ts --ask      # also send one prompt
 */
import { createAgentSession, SessionManager } from "@earendil-works/pi-coding-agent";
import { WORKSPACE } from "../server/src/config";
import { createResourceLoader } from "../server/src/skills";

const ask = process.argv.includes("--ask");

const loader = createResourceLoader();
await loader.reload();
const { skills, diagnostics } = loader.getSkills();
console.log(`workspace: ${WORKSPACE}`);
console.log(`skills: ${skills.map((skill) => skill.name).join(", ") || "(none)"}`);
if (diagnostics.length) console.log("diagnostics:", diagnostics);

const { session } = await createAgentSession({
  cwd: WORKSPACE,
  resourceLoader: loader,
  sessionManager: SessionManager.inMemory(WORKSPACE),
  tools: ["read", "bash", "edit", "write"],
});
console.log(`session: ${session.sessionId}`);
console.log(`model: ${session.model?.provider}/${session.model?.id}`);

if (ask) {
  const started = Date.now();
  let text = "";
  const unsubscribe = session.subscribe((event) => {
    if (event.type === "message_update" && event.assistantMessageEvent.type === "text_delta") {
      text += event.assistantMessageEvent.delta;
    }
  });
  try {
    await session.prompt("只回复两个字母：OK。不要调用任何工具。");
    console.log(`reply: ${session.getLastAssistantText() ?? text} (${Date.now() - started} ms)`);
  } finally {
    unsubscribe();
  }
}

session.dispose();
