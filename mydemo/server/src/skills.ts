import path from "node:path";
import { DefaultResourceLoader, getAgentDir, type Skill } from "@earendil-works/pi-coding-agent";
import { WORKSPACE } from "./config.js";

export interface SkillInfo {
  name: string;
  description: string;
  path: string;
  source: string;
}

const SKILLS_DIR = path.join(WORKSPACE, ".agents", "skills");

/**
 * Builds the same discovery surface `pi` uses for a project, minus CLI extensions.
 * One loader per run: the session keeps it for the lifetime of that conversation.
 */
export function createResourceLoader(): DefaultResourceLoader {
  return new DefaultResourceLoader({
    cwd: WORKSPACE,
    agentDir: getAgentDir(),
    additionalSkillPaths: [SKILLS_DIR],
    noExtensions: true,
  });
}

export function toSkillInfo(skill: Skill): SkillInfo {
  return {
    name: skill.name,
    description: skill.description,
    path: skill.filePath,
    source: skill.filePath.startsWith(SKILLS_DIR) ? "project" : "user",
  };
}

export async function discoverSkills(): Promise<{ skills: SkillInfo[]; diagnostics: string[] }> {
  const loader = createResourceLoader();
  await loader.reload();
  const { skills, diagnostics } = loader.getSkills();
  return {
    skills: skills.map(toSkillInfo),
    diagnostics: diagnostics.map((d) => `${d.type ?? "warning"}: ${d.message ?? String(d)}`),
  };
}
