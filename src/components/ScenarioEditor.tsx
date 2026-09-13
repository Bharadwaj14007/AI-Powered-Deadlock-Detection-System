import { RotateCcw, Search } from "lucide-react";
import { presets } from "../presets";
import type { Scenario } from "../types";
import { MatrixEditor, VectorEditor } from "./MatrixEditor";

export default function ScenarioEditor({
  scenario,
  errors,
  updateCounts,
  updateCell,
  loadPreset,
  resetScenario,
  runAnalysis
}: {
  scenario: Scenario;
  errors: string[];
  updateCounts: (p: number, r: number) => void;
  updateCell: (kind: "allocation" | "maximum" | "available", i: number, j: number, value: number | "") => void;
  loadPreset: (key: string) => void;
  resetScenario: () => void;
  runAnalysis: () => void;
}) {
  return (
    <section className="space-y-5">
      <div className="section-head">
        <div><h1>Scenario Editor</h1><p>Edit matrices, load presets, validate inputs, and run analysis.</p></div>
        <div className="actions">
          <button className="btn" onClick={resetScenario}><RotateCcw size={16} />Reset</button>
          <button className="btn primary" disabled={errors.length > 0} onClick={runAnalysis}><Search size={16} />Run Analysis</button>
        </div>
      </div>
      <div className={errors.length ? "notice error" : "notice"}>{errors.length ? errors.map((e) => <div key={e}>{e}</div>) : "Inputs are valid."}</div>
      <div className="card space-y-5">
        <div className="grid two">
          <label>Process count<input type="number" min={1} max={10} value={scenario.processes} onChange={(e) => updateCounts(Number(e.target.value), scenario.resources)} /></label>
          <label>Resource count<input type="number" min={1} max={8} value={scenario.resources} onChange={(e) => updateCounts(scenario.processes, Number(e.target.value))} /></label>
        </div>
        <div className="preset-grid">
          {Object.values(presets).map((preset) => <button className={scenario.key === preset.key ? "preset active" : "preset"} key={preset.key} onClick={() => loadPreset(preset.key)}><strong>{preset.name}</strong><span>{preset.summary}</span></button>)}
        </div>
        <div className="grid two">
          <MatrixEditor title="Allocation Matrix" description="Resources currently held by each process." matrix={scenario.allocation} kind="allocation" updateCell={updateCell} />
          <MatrixEditor title="Maximum Demand Matrix" description="Maximum resource demand for each process." matrix={scenario.maximum} kind="maximum" updateCell={updateCell} />
        </div>
        <VectorEditor vector={scenario.available} updateCell={updateCell} />
      </div>
    </section>
  );
}
