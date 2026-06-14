export const kaliTerms = {
  agent: "Worker",
  agents: "Workers",
  issue: "Task",
  issues: "Tasks",
  board: "Workspace",
  company: "Company",
  projectManager: "Project Manager",
} as const;

export type KaliTerm = keyof typeof kaliTerms;

export function kaliLabel(term: KaliTerm): string {
  return kaliTerms[term];
}
