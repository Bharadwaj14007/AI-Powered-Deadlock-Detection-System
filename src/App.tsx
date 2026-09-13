import { useCallback, useEffect, useMemo, useState } from "react";
import { BookOpen, Clock, GitCompare, Network, ShieldCheck, SlidersHorizontal } from "lucide-react";
import { analyzeResources, cloneScenario, detectSystem, resizeScenario, validateScenario } from "./algorithms/deadlock";
import { predictRisk } from "./algorithms/prediction";
import { applyStrategy, suggestRecommendations } from "./algorithms/resolution";
import Dashboard from "./components/Dashboard";
import Layout from "./components/Layout";
import ResolutionPanel from "./components/ResolutionPanel";
import RiskPanel from "./components/RiskPanel";
import ScenarioEditor from "./components/ScenarioEditor";
import WaitForGraph from "./components/WaitForGraph";
import { initialScenario, presets } from "./presets";
import type { AnalysisResult, HistoryEntry, Recommendation, Scenario } from "./types";

const HISTORY_KEY = "deadlock-react-history-v1";

function makeAnalysis(scenario: Scenario): AnalysisResult {
  const detection = detectSystem(scenario);
  const risk = predictRisk(scenario, detection);
  const resource = analyzeResources(scenario);
  const base = { detection, risk, ...resource };
  return { ...base, recommendations: suggestRecommendations(scenario, base) };
}

function readHistory(): HistoryEntry[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export default function App() {
  const [page, setPage] = useState("dashboard");
  const [scenario, setScenario] = useState(() => cloneScenario(initialScenario));
  const [baseline, setBaseline] = useState(() => cloneScenario(initialScenario));
  const [analysis, setAnalysis] = useState<AnalysisResult>(() => makeAnalysis(initialScenario));
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [selectedRecommendation, setSelectedRecommendation] = useState<Recommendation | null>(null);

  const errors = useMemo(() => validateScenario(scenario), [scenario]);
  const liveAnalysis = useMemo(() => (errors.length ? null : makeAnalysis(scenario)), [scenario, errors.length]);

  useEffect(() => setHistory(readHistory()), []);

  const persistHistory = useCallback((result: AnalysisResult, source: Scenario) => {
    const entry: HistoryEntry = {
      timestamp: new Date().toLocaleString(),
      scenario: source.name,
      status: result.detection.status,
      risk: result.risk.percentage,
      cycles: result.detection.cycles.length
    };
    const next = [entry, ...readHistory()].slice(0, 30);
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(next));
    } catch {
      /* localStorage can be disabled; UI still works in memory. */
    }
    setHistory(next);
  }, []);

  const runAnalysis = useCallback(() => {
    const validation = validateScenario(scenario);
    if (validation.length) return;
    const result = makeAnalysis(scenario);
    setAnalysis(result);
    setSelectedRecommendation(null);
    persistHistory(result, scenario);
  }, [scenario, persistHistory]);

  const loadPreset = (key: string) => {
    const next = cloneScenario(presets[key]);
    setScenario(next);
    setBaseline(cloneScenario(next));
    const result = makeAnalysis(next);
    setAnalysis(result);
    setSelectedRecommendation(null);
  };

  const resetScenario = () => {
    const next = cloneScenario(initialScenario);
    setScenario(next);
    setBaseline(cloneScenario(next));
    setAnalysis(makeAnalysis(next));
    setSelectedRecommendation(null);
  };

  const updateCounts = (processes: number, resources: number) => {
    if (!Number.isInteger(processes) || !Number.isInteger(resources) || processes < 1 || resources < 1) return;
    setScenario((current) => resizeScenario(current, Math.min(processes, 10), Math.min(resources, 8)));
    setSelectedRecommendation(null);
  };

  const updateCell = (kind: "allocation" | "maximum" | "available", i: number, j: number, value: number | "") => {
    setScenario((current) => {
      const next = cloneScenario({ ...current, key: "custom", name: "Custom Scenario", summary: `${current.processes} processes and ${current.resources} resources.` });
      if (kind === "available") next.available[j] = value as number;
      else next[kind][i][j] = value as number;
      return next;
    });
    setSelectedRecommendation(null);
  };

  const preview = useMemo(() => {
    if (!selectedRecommendation || errors.length) return null;
    const afterScenario = applyStrategy(scenario, selectedRecommendation);
    const after = makeAnalysis(afterScenario);
    return { before: liveAnalysis ?? analysis, after, afterScenario };
  }, [selectedRecommendation, scenario, errors.length, liveAnalysis, analysis]);

  const applySimulation = () => {
    if (!preview || !selectedRecommendation) return;
    setScenario(preview.afterScenario);
    setAnalysis(preview.after);
    setSelectedRecommendation(null);
    persistHistory(preview.after, preview.afterScenario);
  };

  const resetSimulation = () => {
    const next = cloneScenario(baseline);
    setScenario(next);
    setAnalysis(makeAnalysis(next));
    setSelectedRecommendation(null);
  };

  const clearHistory = () => {
    try {
      localStorage.removeItem(HISTORY_KEY);
    } catch {
      /* ignore */
    }
    setHistory([]);
  };

  const activeAnalysis = liveAnalysis ?? analysis;
  const pages = [
    { id: "dashboard", label: "Dashboard", icon: ShieldCheck },
    { id: "scenario", label: "Scenario", icon: SlidersHorizontal },
    { id: "banker", label: "Banker", icon: GitCompare },
    { id: "graph", label: "Graph", icon: Network },
    { id: "risk", label: "Risk", icon: ShieldCheck },
    { id: "resolution", label: "Resolution", icon: GitCompare },
    { id: "history", label: "History", icon: Clock },
    { id: "learn", label: "Learn", icon: BookOpen }
  ];

  return (
    <Layout page={page} setPage={setPage} pages={pages}>
      {page === "dashboard" && <Dashboard scenario={scenario} analysis={activeAnalysis} errors={errors} setPage={setPage} runAnalysis={runAnalysis} />}
      {page === "scenario" && (
        <ScenarioEditor
          scenario={scenario}
          errors={errors}
          updateCounts={updateCounts}
          updateCell={updateCell}
          loadPreset={loadPreset}
          resetScenario={resetScenario}
          runAnalysis={runAnalysis}
        />
      )}
      {page === "banker" && <Dashboard scenario={scenario} analysis={activeAnalysis} errors={errors} setPage={setPage} runAnalysis={runAnalysis} bankerOnly />}
      {page === "graph" && <WaitForGraph detection={activeAnalysis.detection} />}
      {page === "risk" && <RiskPanel risk={activeAnalysis.risk} />}
      {page === "resolution" && (
        <ResolutionPanel
          recommendations={activeAnalysis.recommendations}
          selected={selectedRecommendation}
          select={setSelectedRecommendation}
          preview={preview}
          applySimulation={applySimulation}
          resetSimulation={resetSimulation}
          runAnalysis={runAnalysis}
        />
      )}
      {page === "history" && <HistoryPanel history={history} clearHistory={clearHistory} />}
      {page === "learn" && <LearnPanel />}
    </Layout>
  );
}

function HistoryPanel({ history, clearHistory }: { history: HistoryEntry[]; clearHistory: () => void }) {
  return (
    <section className="space-y-5">
      <div className="section-head">
        <div><h1>Analysis History</h1><p>Saved locally and restored safely after refresh.</p></div>
        <button className="btn danger" onClick={clearHistory}>Clear History</button>
      </div>
      <div className="card overflow-auto">
        {history.length ? (
          <table className="data-table">
            <thead><tr><th>Timestamp</th><th>Scenario</th><th>Status</th><th>Risk</th><th>Cycles</th></tr></thead>
            <tbody>{history.map((item, index) => <tr key={`${item.timestamp}-${index}`}><td>{item.timestamp}</td><td>{item.scenario}</td><td>{item.status}</td><td>{item.risk}%</td><td>{item.cycles}</td></tr>)}</tbody>
          </table>
        ) : <div className="empty">No analysis history yet.</div>}
      </div>
    </section>
  );
}

function LearnPanel() {
  const items = [
    ["What is deadlock?", "A set of processes is deadlocked when each waits indefinitely for resources held by another process in the same set."],
    ["Coffman's conditions", "Mutual exclusion, hold and wait, no preemption, and circular wait must all hold for deadlock."],
    ["Banker's Algorithm", "A safety algorithm that searches for a process completion sequence using Need, Work, and Finish."],
    ["Wait-For Graph", "A directed graph where P0 -> P1 means P0 waits for a resource currently held by P1."],
    ["DFS cycle detection", "DFS identifies circular wait by finding a back edge to a process already in the recursion stack."],
    ["Unsafe vs deadlock", "Unsafe means no guaranteed safe sequence. Deadlock requires an actual circular wait cycle."],
    ["Heuristic prediction", "Risk is transparent scoring from resource pressure, wait chains, safety state, and cycles. It is not trained AI/ML."],
    ["Limitations", "This app analyzes static educational snapshots and does not control real operating-system processes."]
  ];
  return <section><h1>Educational Notes</h1><div className="learn-grid">{items.map(([title, body]) => <article className="card" key={title}><h2>{title}</h2><p>{body}</p></article>)}</div></section>;
}
