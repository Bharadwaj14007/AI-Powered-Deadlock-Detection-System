import type { DetectionResult, RiskResult, Scenario } from "../types";
import { analyzeResources } from "./deadlock";

export function longestWaitChain(edges: DetectionResult["graph"]["edges"], processCount: number) {
  const adjacency = Array.from({ length: processCount }, () => [] as number[]);
  edges.forEach((edge) => adjacency[edge.from].push(edge.to));
  let longest = 0;
  const dfs = (node: number, visited: Set<number>) => {
    if (visited.has(node)) return;
    const next = new Set(visited).add(node);
    longest = Math.max(longest, next.size);
    adjacency[node].forEach((child) => dfs(child, next));
  };
  for (let i = 0; i < processCount; i += 1) dfs(i, new Set());
  return longest;
}

export function predictRisk(scenario: Scenario, detection: DetectionResult): RiskResult {
  const resource = analyzeResources(scenario);
  const averageUtilization = resource.utilization.reduce((sum, value) => sum + value, 0) / scenario.resources;
  const exhausted = resource.totalResources.filter((total, j) => total > 0 && scenario.available[j] / total <= 0.2).length;
  const chain = longestWaitChain(detection.graph.edges, scenario.processes);
  const multiResource = detection.banker.need.filter((row) => row.filter((value) => value > 0).length > 1).length;
  const factors = [
    { name: "Resource utilization", weight: 22, score: Math.min(averageUtilization / 100, 1), explanation: `Average utilization is ${averageUtilization.toFixed(1)}%.` },
    { name: "Resource exhaustion", weight: 18, score: exhausted / scenario.resources, explanation: `${exhausted} of ${scenario.resources} resource types are nearly exhausted.` },
    { name: "Wait-chain length", weight: 18, score: Math.min(chain / scenario.processes, 1), explanation: `Longest wait chain contains ${chain} process(es).` },
    { name: "Multi-resource requests", weight: 14, score: multiResource / scenario.processes, explanation: `${multiResource} process(es) request multiple resource types.` },
    { name: "Safety state", weight: 18, score: detection.isSafe ? 0 : 1, explanation: detection.isSafe ? "Banker found a safe sequence." : "Banker found no safe sequence." },
    { name: "Existing cycles", weight: 10, score: detection.isDeadlocked ? 1 : 0, explanation: detection.isDeadlocked ? `${detection.cycles.length} circular wait cycle(s) exist.` : "No circular wait cycle exists." }
  ].map((factor) => ({ ...factor, contribution: factor.score * factor.weight }));
  let percentage = factors.reduce((sum, factor) => sum + factor.contribution, 0);
  if (detection.isDeadlocked) percentage = Math.max(percentage, 92);
  if (!detection.isSafe && !detection.isDeadlocked) percentage = Math.max(percentage, 62);
  if (detection.isSafe && !detection.isDeadlocked) percentage = Math.min(percentage, 28);
  percentage = Math.round(Math.min(100, percentage));
  const category = percentage < 30 ? "Low" : percentage < 55 ? "Medium" : percentage < 80 ? "High" : "Critical";
  const suggestions = [
    exhausted > 0 ? "Increase availability or reduce demand for exhausted resources." : "",
    chain > 1 ? "Shorten wait chains by scheduling near-complete processes first." : "",
    !detection.isSafe ? "Avoid granting new requests until a safe sequence exists." : "",
    detection.isDeadlocked ? "Break one circular wait edge using a simulated recovery strategy." : ""
  ].filter(Boolean);
  if (!suggestions.length) suggestions.push("Current state is stable; continue monitoring request spikes.");
  return { percentage, category, factors, suggestions };
}
