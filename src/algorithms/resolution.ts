import type { AnalysisResult, Recommendation, Scenario } from "../types";
import { cloneScenario, detectSystem } from "./deadlock";
import { predictRisk } from "./prediction";

const info = {
  rollback: ["Rollback", "Releases all resources held by a selected process.", "Progress since the last checkpoint is lost."],
  preempt: ["Resource Preemption", "Temporarily takes one allocated resource type from a process.", "Unsafe for resources that cannot be interrupted."],
  priority: ["Priority Adjustment", "Lets a near-complete process finish first and release resources.", "Other processes may wait longer."],
  throttle: ["Process Throttling", "Reduces outstanding demand while the system drains current work.", "Throughput may decrease temporarily."],
  terminate: ["Process Termination", "Stops a selected process and releases its resources.", "Most disruptive simulated action."]
} as const;

export function applyStrategy(scenario: Scenario, recommendation: Pick<Recommendation, "strategy" | "targetProcess">): Scenario {
  const next = cloneScenario(scenario);
  const p = recommendation.targetProcess;
  if ((recommendation.strategy === "rollback" || recommendation.strategy === "terminate" || recommendation.strategy === "priority") && p >= 0) {
    for (let j = 0; j < next.resources; j += 1) {
      next.available[j] += next.allocation[p][j];
      next.allocation[p][j] = 0;
      if (recommendation.strategy !== "rollback") next.maximum[p][j] = 0;
    }
  }
  if (recommendation.strategy === "preempt" && p >= 0) {
    const r = next.allocation[p].findIndex((value) => value > 0);
    if (r >= 0) {
      next.available[r] += next.allocation[p][r];
      next.allocation[p][r] = 0;
    }
  }
  if (recommendation.strategy === "throttle") {
    for (let i = 0; i < next.processes; i += 1) {
      for (let j = 0; j < next.resources; j += 1) {
        next.maximum[i][j] = Math.max(next.allocation[i][j], Math.min(next.maximum[i][j], next.allocation[i][j] + 1));
      }
    }
  }
  next.key = "simulation";
  next.name = "Simulated Scenario";
  next.summary = "A simulated recovery strategy has been applied.";
  return next;
}

export function suggestRecommendations(scenario: Scenario, analysis: Omit<AnalysisResult, "recommendations">): Recommendation[] {
  if (analysis.detection.isSafe && !analysis.detection.isDeadlocked && analysis.risk.percentage < 55) return [];
  const candidates = new Set<number>(analysis.detection.cycles.flatMap((cycle) => cycle.slice(0, -1)));
  analysis.detection.graph.edges.forEach((edge) => candidates.add(edge.from));
  if (!candidates.size) for (let i = 0; i < scenario.processes; i += 1) candidates.add(i);
  const list = [...candidates];
  const allocated = (p: number) => scenario.allocation[p].reduce((sum, value) => sum + value, 0);
  const needed = (p: number) => analysis.detection.banker.need[p].reduce((sum, value) => sum + value, 0);
  const rich = list.slice().sort((a, b) => allocated(b) - allocated(a))[0] ?? 0;
  const near = list.slice().sort((a, b) => needed(a) - needed(b))[0] ?? 0;
  const raw: Array<[Recommendation["strategy"], number, Recommendation["impact"], number, string]> = [
    ["rollback", rich, "Medium", 58, "Releases resources from a high-impact blocker."],
    ["preempt", list.find((p) => allocated(p) > 0) ?? rich, "Low", 42, "Breaks one wait dependency with lower disruption."],
    ["priority", near, "Low", 30, "Allows a near-complete process to finish first."],
    ["throttle", -1, "Medium", 36, "Limits additional pressure while resources recover."],
    ["terminate", rich, "High", 85, "Last-resort recovery for active circular wait."]
  ];
  return raw.map(([strategy, targetProcess, impact, cost, reason], index) => {
    const simulated = applyStrategy(scenario, { strategy, targetProcess });
    const detection = detectSystem(simulated);
    const risk = predictRisk(simulated, detection);
    return {
      id: `${strategy}-${targetProcess}-${index}`,
      strategy,
      name: info[strategy][0],
      targetProcess,
      targetLabel: targetProcess >= 0 ? `P${targetProcess}` : "all processes",
      explanation: info[strategy][1],
      sideEffects: info[strategy][2],
      reason,
      impact,
      cost,
      expectedResult: `${detection.status}, ${risk.percentage}% risk, ${detection.cycles.length} cycle(s).`
    };
  });
}
