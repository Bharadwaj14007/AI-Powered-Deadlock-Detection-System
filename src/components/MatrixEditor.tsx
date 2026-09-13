import type { Matrix } from "../types";

export function MatrixEditor({
  title,
  description,
  matrix,
  kind,
  updateCell
}: {
  title: string;
  description: string;
  matrix: Matrix;
  kind: "allocation" | "maximum";
  updateCell: (kind: "allocation" | "maximum", i: number, j: number, value: number | "") => void;
}) {
  return (
    <div className="card">
      <h2>{title}</h2>
      <p>{description}</p>
      <div className="table-wrap">
        <table className="data-table">
          <thead><tr><th>Process</th>{matrix[0]?.map((_, j) => <th key={j}>R{j}</th>)}</tr></thead>
          <tbody>
            {matrix.map((row, i) => (
              <tr key={i}>
                <th>P{i}</th>
                {row.map((value, j) => (
                  <td key={j}><NumberInput value={value} onChange={(next) => updateCell(kind, i, j, next)} label={`${kind} P${i} R${j}`} /></td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export function VectorEditor({
  vector,
  updateCell
}: {
  vector: number[];
  updateCell: (kind: "available", i: number, j: number, value: number | "") => void;
}) {
  return (
    <div className="card">
      <h2>Available Vector</h2>
      <p>Free resource units before any process completes.</p>
      <div className="table-wrap">
        <table className="data-table">
          <thead><tr>{vector.map((_, j) => <th key={j}>R{j}</th>)}</tr></thead>
          <tbody><tr>{vector.map((value, j) => <td key={j}><NumberInput value={value} onChange={(next) => updateCell("available", 0, j, next)} label={`available R${j}`} /></td>)}</tr></tbody>
        </table>
      </div>
    </div>
  );
}

function NumberInput({ value, onChange, label }: { value: number; onChange: (value: number | "") => void; label: string }) {
  return <input aria-label={label} className="cell-input" type="number" min={0} step={1} value={value} onChange={(event) => onChange(event.target.value === "" ? "" : Number(event.target.value))} />;
}
