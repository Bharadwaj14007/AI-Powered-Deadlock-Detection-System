import { Play, RotateCcw } from "lucide-react";
import type { AnalysisResult, Recommendation, Scenario } from "../types";

export default function ResolutionPanel({
  recommendations,
  selected,
  select,
  preview,
  applySimulation,
  resetSimulation,
  runAnalysis
}: {
  recommendations: Recommendation[];
  selected: Recommendation | null;
  select: (recommendation: Recommendation) => void;
  preview: { before: AnalysisResult; after: AnalysisResult; afterScenario: Scenario } | null;
  applySimulation: () => void;
  resetSimulation: () => void;
  runAnalysis: () => void;
}) {
  return (
    <section className="space-y-5">
      <div className="section-head">
        <div><h1>Resolution Simulation</h1><p>All recovery actions are browser simulations, not real operating-system control.</p></div>
        <div className="actions"><button className="btn" onClick={resetSimulation}><RotateCcw size={16} />Reset Simulation</button><button className="btn primary" onClick={runAnalysis}><Play size={16} />Re-run Analysis</button></div>
      </div>
      <div className="grid two">
        <div className="card">
          <h2>Recommendations</h2>
          <div className="recommendation-grid">
            {recommendations.length ? recommendations.map((rec) => (
              <article className={selected?.id === rec.id ? "recommendation active" : "recommendation"} key={rec.id}>
                <span className={`badge ${rec.impact.toLowerCase()}`}>{rec.impact} impact</span>
                <h2>{rec.name}</h2>
                <p>{rec.explanation} Target: {rec.targetLabel}.</p>
                <p><strong>Reason:</strong> {rec.reason}</p>
                <p><strong>Cost:</strong> {rec.cost}</p>
                <p><strong>Expected simulated result:</strong> {rec.expectedResult}</p>
                <p><strong>Side effects:</strong> {rec.sideEffects}</p>
                <button className="btn" onClick={() => select(rec)}>Preview Strategy</button>
              </article>
            )) : <div className="empty">No resolution is required for this safe low-risk state.</div>}
          </div>
        </div>
        <div className="card">
          <h2>Before / After Preview</h2>
          {preview ? (
            <div className="space-y-3">
              <div className="notice">Simulation only: selected strategy preview.</div>
              <Compare label="Risk" before={`${preview.before.risk.percentage}%`} after={`${preview.after.risk.percentage}%`} />
              <Compare label="Status" before={preview.before.detection.status} after={preview.after.detection.status} />
              <Compare label="Available" before={`[${preview.before.totalResources.map((total, i) => total - preview.before.totalAllocated[i]).join(", ")}]`} after={`[${preview.after.totalResources.map((total, i) => total - preview.after.totalAllocated[i]).join(", ")}]`} />
              <Compare label="Cycles" before={preview.before.detection.cycles.length} after={preview.after.detection.cycles.length} />
              <Compare label="Safe sequence" before={preview.before.detection.banker.sequence.map((p) => `P${p}`).join(" -> ") || "None"} after={preview.after.detection.banker.sequence.map((p) => `P${p}`).join(" -> ") || "None"} />
              <button className="btn primary" onClick={applySimulation}>Apply Simulated Strategy</button>
            </div>
          ) : <div className="empty">Select a strategy to preview its simulated effect.</div>}
        </div>
      </div>
    </section>
  );
}

function Compare({ label, before, after }: { label: string; before: string | number; after: string | number }) {
  return <div className="compare"><span>{label}</span><strong>{before} {'->'} {after}</strong></div>;
}
