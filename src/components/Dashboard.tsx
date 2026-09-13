import { AlertTriangle, CheckCircle2, Play, XCircle } from "lucide-react";
import type { AnalysisResult, Scenario } from "../types";

export default function Dashboard({
  scenario,
  analysis,
  errors,
  setPage,
  runAnalysis,
  bankerOnly = false
}: {
  scenario: Scenario;
  analysis: AnalysisResult;
  errors: string[];
  setPage: (page: string) => void;
  runAnalysis: () => void;
  bankerOnly?: boolean;
}) {
  const banker = analysis.detection.banker;
  if (bankerOnly) {
    return (
      <section className="space-y-5">
        <div className="section-head">
          <div><h1>Banker's Algorithm</h1><p>Need, Work, Finish, and safe sequence execution.</p></div>
          <button className="btn primary" disabled={errors.length > 0} onClick={runAnalysis}><Play size={16} />Run Analysis</button>
        </div>
        <div className="grid two">
          <div className="card"><h2>Need Matrix</h2><ReadOnlyMatrix matrix={banker.need} /></div>
          <div className="card"><h2>Result</h2><p>{analysis.detection.explanation}</p><Sequence sequence={banker.sequence} /></div>
        </div>
        <div className="card"><h2>Execution Steps</h2><div className="step-list">{banker.steps.map((step, i) => <div className={step.stalled ? "notice error" : "notice"} key={i}>{step.reason}{step.workAfter ? <><br />After completion Work = [{step.workAfter.join(", ")}]</> : null}</div>)}</div></div>
      </section>
    );
  }

  const statusIcon = analysis.detection.status === "Safe" ? CheckCircle2 : analysis.detection.status === "Deadlocked" ? XCircle : AlertTriangle;
  const StatusIcon = statusIcon;
  const metrics = [
    ["System status", analysis.detection.status, analysis.detection.explanation],
    ["Risk", `${analysis.risk.percentage}%`, analysis.risk.category],
    ["Processes", scenario.processes, "Configured process count"],
    ["Resources", scenario.resources, "Configured resource types"],
    ["Available", `[${scenario.available.join(", ")}]`, "Current vector"],
    ["Safe sequence", banker.sequence.length ? banker.sequence.map((p) => `P${p}`).join(" -> ") : "None", banker.safe ? "Valid completion order" : "No complete safe sequence"],
    ["Cycles", analysis.detection.cycles.length, "Circular-wait cycles"],
    ["Scenario", scenario.name, scenario.summary]
  ];

  return (
    <section className="space-y-5">
      <div className="hero">
        <div>
          <span className={`badge ${tone(analysis.detection.status)}`}><StatusIcon size={14} />{analysis.detection.status}</span>
          <h1>Deadlock analysis dashboard</h1>
          <p>Banker's Algorithm, Wait-For Graph, DFS cycle detection, heuristic risk scoring, and simulated recovery in one connected React app.</p>
          <div className="actions">
            <button className="btn primary" disabled={errors.length > 0} onClick={runAnalysis}><Play size={16} />Run Analysis</button>
            <button className="btn" onClick={() => setPage("scenario")}>Edit Scenario</button>
            <button className="btn" onClick={() => setPage("learn")}>Viva Notes</button>
          </div>
        </div>
        <div className="card"><h2>{scenario.name}</h2><p>{scenario.summary}</p><ReadOnlyMatrix matrix={banker.need} /></div>
      </div>
      <div className="metric-grid">{metrics.map(([label, value, detail]) => <div className="card metric" key={String(label)}><span>{label}</span><strong>{value}</strong><p>{detail}</p></div>)}</div>
      <div className="grid two">
        <div className="card"><h2>Safe Sequence</h2><Sequence sequence={banker.sequence} /></div>
        <div className="card"><h2>Detected Cycles</h2>{analysis.detection.cycles.length ? analysis.detection.cycles.map((c) => <div className="notice error" key={c.join("-")}>{c.map((p) => `P${p}`).join(" -> ")}</div>) : <div className="notice">No circular wait cycles detected.</div>}</div>
      </div>
    </section>
  );
}

export function ReadOnlyMatrix({ matrix }: { matrix: number[][] }) {
  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead><tr><th>Process</th>{matrix[0]?.map((_, j) => <th key={j}>R{j}</th>)}</tr></thead>
        <tbody>{matrix.map((row, i) => <tr key={i}><th>P{i}</th>{row.map((value, j) => <td key={j}>{value}</td>)}</tr>)}</tbody>
      </table>
    </div>
  );
}

export function Sequence({ sequence }: { sequence: number[] }) {
  return <div className="sequence">{sequence.length ? sequence.map((p) => <span className="pill" key={p}>P{p}</span>) : <span className="muted">No safe sequence.</span>}</div>;
}

function tone(status: string) {
  if (status === "Safe") return "success";
  if (status === "Deadlocked") return "danger";
  return "warning";
}
