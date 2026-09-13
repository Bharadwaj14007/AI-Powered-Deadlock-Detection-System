import type { Scenario } from "./types";

export const presets: Record<string, Scenario> = {
  safe: {
    key: "safe",
    name: "Safe State",
    summary: "Classic safe state with a valid completion sequence.",
    processes: 5,
    resources: 3,
    allocation: [[0, 1, 0], [2, 0, 0], [3, 0, 2], [2, 1, 1], [0, 0, 2]],
    maximum: [[7, 5, 3], [3, 2, 2], [9, 0, 2], [2, 2, 2], [4, 3, 3]],
    available: [3, 3, 2]
  },
  unsafe: {
    key: "unsafe",
    name: "Unsafe State",
    summary: "Unsafe snapshot without a circular wait cycle.",
    processes: 3,
    resources: 3,
    allocation: [[1, 0, 0], [0, 1, 0], [0, 0, 0]],
    maximum: [[1, 1, 0], [0, 1, 1], [0, 0, 1]],
    available: [0, 0, 0]
  },
  deadlock: {
    key: "deadlock",
    name: "Actual Deadlock",
    summary: "Three processes form a circular wait.",
    processes: 3,
    resources: 3,
    allocation: [[1, 0, 0], [0, 1, 0], [0, 0, 1]],
    maximum: [[1, 1, 0], [0, 1, 1], [1, 0, 1]],
    available: [0, 0, 0]
  },
  highContention: {
    key: "highContention",
    name: "High Contention",
    summary: "Acyclic wait chain with exhausted resources and high risk.",
    processes: 5,
    resources: 4,
    allocation: [[2, 0, 0, 0], [0, 2, 0, 0], [0, 0, 2, 0], [0, 0, 0, 1], [1, 0, 0, 0]],
    maximum: [[2, 1, 0, 0], [0, 2, 1, 0], [0, 0, 2, 1], [0, 0, 0, 2], [1, 1, 0, 1]],
    available: [0, 0, 0, 0]
  }
};

export const initialScenario = presets.safe;
