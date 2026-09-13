import type { BankerResult, DetectionResult, GraphEdge, Matrix, Scenario } from "../types";

export function cloneScenario(scenario: Scenario): Scenario {
  return {
    ...scenario,
    allocation: scenario.allocation.map((row) => [...row]),
    maximum: scenario.maximum.map((row) => [...row]),
    available: [...scenario.available]
  };
}

export function resizeScenario(scenario: Scenario, processes: number, resources: number): Scenario {
  const allocation = Array.from({ length: processes }, (_, i) =>
    Array.from({ length: resources }, (_, j) => cleanNumber(scenario.allocation[i]?.[j], 0))
  );
  const maximum = Array.from({ length: processes }, (_, i) =>
    Array.from({ length: resources }, (_, j) => Math.max(cleanNumber(scenario.maximum[i]?.[j], 0), allocation[i][j]))
  );
  return {
    ...scenario,
    key: "custom",
    name: "Custom Scenario",
    summary: `${processes} processes and ${resources} resource types.`,
    processes,
    resources,
    allocation,
    maximum,
    available: Array.from({ length: resources }, (_, j) => cleanNumber(scenario.available[j], 0))
  };
}

export function validateScenario(scenario: Scenario): string[] {
  const errors: string[] = [];
  const { processes, resources } = scenario;
  if (!Number.isInteger(processes) || processes < 1 || processes > 10) errors.push("Process count must be an integer from 1 to 10.");
  if (!Number.isInteger(resources) || resources < 1 || resources > 8) errors.push("Resource count must be an integer from 1 to 8.");
  if (scenario.allocation.length !== processes) errors.push("Allocation matrix row count does not match process count.");
  if (scenario.maximum.length !== processes) errors.push("Maximum matrix row count does not match process count.");
  if (scenario.available.length !== resources) errors.push("Available vector length does not match resource count.");

  for (let i = 0; i < processes; i += 1) {
    if (scenario.allocation[i]?.length !== resources) errors.push(`Allocation row P${i} has invalid dimensions.`);
    if (scenario.maximum[i]?.length !== resources) errors.push(`Maximum row P${i} has invalid dimensions.`);
    for (let j = 0; j < resources; j += 1) {
      const allocation = scenario.allocation[i]?.[j];
      const maximum = scenario.maximum[i]?.[j];
      if (!Number.isInteger(allocation) || allocation < 0) errors.push(`Allocation P${i}, R${j} must be a non-negative integer.`);
      if (!Number.isInteger(maximum) || maximum < 0) errors.push(`Maximum P${i}, R${j} must be a non-negative integer.`);
      if (Number.isInteger(allocation) && Number.isInteger(maximum) && maximum < allocation) {
        errors.push(`Maximum demand cannot be lower than allocation at P${i}, R${j}.`);
      }
    }
  }
  for (let j = 0; j < resources; j += 1) {
    const available = scenario.available[j];
    if (!Number.isInteger(available) || available < 0) errors.push(`Available R${j} must be a non-negative integer.`);
  }
  return [...new Set(errors)];
}

export function calculateNeed(allocation: Matrix, maximum: Matrix): Matrix {
  return maximum.map((row, i) => row.map((value, j) => value - allocation[i][j]));
}

export function analyzeResources(scenario: Scenario) {
  const totalAllocated = Array(scenario.resources).fill(0);
  for (let i = 0; i < scenario.processes; i += 1) {
    for (let j = 0; j < scenario.resources; j += 1) totalAllocated[j] += scenario.allocation[i][j];
  }
  const totalResources = scenario.available.map((available, j) => available + totalAllocated[j]);
  const utilization = totalResources.map((total, j) => (total === 0 ? 0 : (totalAllocated[j] / total) * 100));
  return { totalAllocated, totalResources, utilization };
}

export function bankersSafetyCheck(scenario: Scenario): BankerResult {
  const need = calculateNeed(scenario.allocation, scenario.maximum);
  const work = [...scenario.available];
  const finish = Array(scenario.processes).fill(false);
  const sequence: number[] = [];
  const steps: BankerResult["steps"] = [];
  let pass = 1;

  while (sequence.length < scenario.processes) {
    let progressed = false;
    for (let i = 0; i < scenario.processes; i += 1) {
      if (finish[i]) continue;
      const canRun = need[i].every((value, j) => value <= work[j]);
      const step = {
        pass,
        process: i,
        workBefore: [...work],
        need: [...need[i]],
        canRun,
        reason: canRun
          ? `P${i} can execute because Need [${need[i].join(", ")}] <= Work [${work.join(", ")}].`
          : `P${i} cannot execute because Need [${need[i].join(", ")}] exceeds Work [${work.join(", ")}].`
      };
      if (canRun) {
        for (let j = 0; j < scenario.resources; j += 1) work[j] += scenario.allocation[i][j];
        finish[i] = true;
        sequence.push(i);
        steps.push({ ...step, workAfter: [...work] });
        progressed = true;
      } else {
        steps.push(step);
      }
    }
    if (!progressed) {
      steps.push({ pass, stalled: true, reason: `No unfinished process can proceed with Work [${work.join(", ")}].` });
      break;
    }
    pass += 1;
  }

  return { safe: finish.every(Boolean), sequence, finish, finalWork: work, need, steps };
}

export function buildWaitForGraph(scenario: Scenario) {
  const need = calculateNeed(scenario.allocation, scenario.maximum);
  const edgeMap = new Map<string, GraphEdge>();
  for (let i = 0; i < scenario.processes; i += 1) {
    for (let r = 0; r < scenario.resources; r += 1) {
      if (need[i][r] > scenario.available[r]) {
        for (let holder = 0; holder < scenario.processes; holder += 1) {
          if (holder !== i && scenario.allocation[holder][r] > 0) {
            const key = `${i}-${holder}`;
            const edge = edgeMap.get(key) ?? { from: i, to: holder, resources: [] };
            if (!edge.resources.includes(r)) edge.resources.push(r);
            edgeMap.set(key, edge);
          }
        }
      }
    }
  }
  return { nodes: Array.from({ length: scenario.processes }, (_, id) => ({ id, inCycle: false })), edges: [...edgeMap.values()] };
}

export function detectCycles(edges: GraphEdge[], processCount: number): number[][] {
  const adjacency = Array.from({ length: processCount }, () => [] as number[]);
  edges.forEach((edge) => adjacency[edge.from].push(edge.to));
  adjacency.forEach((list) => list.sort((a, b) => a - b));
  const color = Array(processCount).fill(0);
  const stack: number[] = [];
  const cycles: number[][] = [];
  const seen = new Set<string>();

  const canonical = (cycle: number[]) => {
    const body = cycle.slice(0, -1);
    const rotations = body.map((_, i) => body.slice(i).concat(body.slice(0, i)));
    rotations.sort((a, b) => a.join("-").localeCompare(b.join("-")));
    return rotations[0].join("-");
  };

  const dfs = (node: number) => {
    color[node] = 1;
    stack.push(node);
    for (const next of adjacency[node]) {
      if (color[next] === 0) dfs(next);
      else if (color[next] === 1) {
        const start = stack.indexOf(next);
        if (start >= 0) {
          const cycle = stack.slice(start).concat(next);
          const key = canonical(cycle);
          if (!seen.has(key) && cycle.length > 2) {
            seen.add(key);
            cycles.push(cycle);
          }
        }
      }
    }
    stack.pop();
    color[node] = 2;
  };

  for (let i = 0; i < processCount; i += 1) if (color[i] === 0) dfs(i);
  return cycles;
}

export function detectSystem(scenario: Scenario): DetectionResult {
  const banker = bankersSafetyCheck(scenario);
  const graph = buildWaitForGraph(scenario);
  const cycles = detectCycles(graph.edges, scenario.processes);
  const cycleNodes = new Set(cycles.flatMap((cycle) => cycle.slice(0, -1)));
  graph.nodes.forEach((node) => { node.inCycle = cycleNodes.has(node.id); });
  const isDeadlocked = cycles.length > 0;
  const status = isDeadlocked ? "Deadlocked" : banker.safe ? "Safe" : "Unsafe";
  const explanation = isDeadlocked
    ? `Circular-wait deadlock detected in ${cycles.length} cycle(s).`
    : banker.safe
      ? `Safe state. Safe sequence: ${banker.sequence.map((p) => `P${p}`).join(" -> ")}.`
      : "Unsafe state. No guaranteed safe sequence exists, but the Wait-For Graph has no circular wait cycle.";
  return { status, isSafe: banker.safe, isDeadlocked, banker, graph, cycles, explanation };
}

function cleanNumber(value: unknown, fallback: number) {
  return Number.isInteger(value) && Number(value) >= 0 ? Number(value) : fallback;
}
