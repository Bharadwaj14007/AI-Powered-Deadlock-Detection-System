export type Matrix = number[][];

export type Scenario = {
  key: string;
  name: string;
  summary: string;
  processes: number;
  resources: number;
  allocation: Matrix;
  maximum: Matrix;
  available: number[];
};

export type BankerStep = {
  pass: number;
  process?: number;
  workBefore?: number[];
  workAfter?: number[];
  need?: number[];
  canRun?: boolean;
  reason: string;
  stalled?: boolean;
};

export type BankerResult = {
  safe: boolean;
  sequence: number[];
  finish: boolean[];
  finalWork: number[];
  need: Matrix;
  steps: BankerStep[];
};

export type GraphNode = { id: number; inCycle: boolean };
export type GraphEdge = { from: number; to: number; resources: number[] };

export type DetectionResult = {
  status: "Safe" | "Unsafe" | "Deadlocked";
  isSafe: boolean;
  isDeadlocked: boolean;
  banker: BankerResult;
  graph: { nodes: GraphNode[]; edges: GraphEdge[] };
  cycles: number[][];
  explanation: string;
};

export type RiskFactor = {
  name: string;
  weight: number;
  score: number;
  contribution: number;
  explanation: string;
};

export type RiskResult = {
  percentage: number;
  category: "Low" | "Medium" | "High" | "Critical";
  factors: RiskFactor[];
  suggestions: string[];
};

export type Recommendation = {
  id: string;
  strategy: "rollback" | "preempt" | "priority" | "throttle" | "terminate";
  name: string;
  targetProcess: number;
  targetLabel: string;
  explanation: string;
  reason: string;
  impact: "Low" | "Medium" | "High";
  cost: number;
  expectedResult: string;
  sideEffects: string;
};

export type AnalysisResult = {
  detection: DetectionResult;
  risk: RiskResult;
  recommendations: Recommendation[];
  totalAllocated: number[];
  totalResources: number[];
  utilization: number[];
};

export type HistoryEntry = {
  timestamp: string;
  scenario: string;
  status: string;
  risk: number;
  cycles: number;
};
