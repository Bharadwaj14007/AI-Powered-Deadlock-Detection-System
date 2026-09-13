import type { RiskResult } from "../types";

export default function RiskPanel({ risk }: { risk: RiskResult }) {
  return (
    <section className="space-y-5">
      <div className="section-head"><div><h1>Explainable Heuristic Risk Engine</h1><p>Transparent weighted scoring. This is not trained AI or machine learning.</p></div><span className={`badge ${risk.category.toLowerCase()}`}>{risk.category} {risk.percentage}%</span></div>
      <div className="grid two">
        <div className="card"><h2>Risk Score</h2><strong className="big-number">{risk.percentage}%</strong><p>{risk.category} deadlock risk based on current system state.</p><h2>Suggestions</h2>{risk.suggestions.map((s) => <div className="notice" key={s}>{s}</div>)}</div>
        <div className="card"><h2>Factor Contributions</h2>{risk.factors.map((factor) => <div className="factor" key={factor.name}><div><strong>{factor.name}</strong><span>{factor.contribution.toFixed(1)}%</span></div><div className="bar"><span style={{ width: `${Math.round((factor.contribution / factor.weight) * 100)}%` }} /></div><p>{factor.explanation} Weight: {factor.weight}%.</p></div>)}</div>
      </div>
    </section>
  );
}
