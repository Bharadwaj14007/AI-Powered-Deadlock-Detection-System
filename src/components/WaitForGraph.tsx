import type { DetectionResult } from "../types";

export default function WaitForGraph({ detection }: { detection: DetectionResult }) {
  return (
    <section className="space-y-5">
      <div className="section-head"><div><h1>Wait-For Graph</h1><p>Edges are calculated from current Need, Available, and Allocation data.</p></div><span className="badge">{detection.cycles.length} cycle(s)</span></div>
      <div className="grid two">
        <div className="card"><GraphSvg detection={detection} /></div>
        <div className="card space-y-4">
          <h2>Dependencies</h2>
          {detection.graph.edges.length ? detection.graph.edges.map((edge) => <div className="notice" key={`${edge.from}-${edge.to}`}>P{edge.from} -&gt; P{edge.to}<br />Waiting on {edge.resources.map((r) => `R${r}`).join(", ")}</div>) : <div className="empty">No wait dependencies.</div>}
          <h2>Cycles</h2>
          {detection.cycles.length ? detection.cycles.map((cycle) => <div className="notice error" key={cycle.join("-")}>{cycle.map((p) => `P${p}`).join(" -> ")}</div>) : <div className="notice">No circular wait cycles detected.</div>}
        </div>
      </div>
    </section>
  );
}

function GraphSvg({ detection }: { detection: DetectionResult }) {
  const { nodes, edges } = detection.graph;
  if (!nodes.length) return <div className="empty">No processes.</div>;
  const width = 720;
  const height = 420;
  const cx = width / 2;
  const cy = height / 2;
  const radius = Math.min(160, 70 + nodes.length * 18);
  const positions = nodes.map((node, index) => {
    const angle = (Math.PI * 2 * index) / nodes.length - Math.PI / 2;
    return { id: node.id, x: cx + Math.cos(angle) * radius, y: cy + Math.sin(angle) * radius };
  });
  const pos = (id: number) => positions.find((p) => p.id === id)!;
  const cycleEdges = new Set<string>();
  detection.cycles.forEach((cycle) => {
    for (let i = 0; i < cycle.length - 1; i += 1) cycleEdges.add(`${cycle[i]}-${cycle[i + 1]}`);
  });
  return (
    <svg className="graph-svg" viewBox={`0 0 ${width} ${height}`} role="img" aria-label="Wait-For Graph">
      <defs>
        <marker id="arrow" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto"><path d="M0,0 L0,6 L9,3 z" fill="#4cc9d8" /></marker>
        <marker id="arrow-danger" markerWidth="10" markerHeight="10" refX="8" refY="3" orient="auto"><path d="M0,0 L0,6 L9,3 z" fill="#ff6b6b" /></marker>
      </defs>
      <rect width={width} height={height} rx={8} fill="#0f131a" />
      {edges.map((edge) => {
        const from = pos(edge.from);
        const to = pos(edge.to);
        const dx = to.x - from.x;
        const dy = to.y - from.y;
        const dist = Math.max(Math.hypot(dx, dy), 1);
        const sx = from.x + (dx / dist) * 34;
        const sy = from.y + (dy / dist) * 34;
        const ex = to.x - (dx / dist) * 42;
        const ey = to.y - (dy / dist) * 42;
        const mx = (sx + ex) / 2 - (dy / dist) * 28;
        const my = (sy + ey) / 2 + (dx / dist) * 28;
        const active = cycleEdges.has(`${edge.from}-${edge.to}`);
        return <g key={`${edge.from}-${edge.to}`}><path d={`M ${sx} ${sy} Q ${mx} ${my} ${ex} ${ey}`} fill="none" stroke={active ? "#ff6b6b" : "#4cc9d8"} strokeWidth={active ? 3 : 2} markerEnd={`url(#${active ? "arrow-danger" : "arrow"})`} /><text x={mx + 8} y={my - 6} fill="#a7b0bd" fontSize="12">{edge.resources.map((r) => `R${r}`).join(",")}</text></g>;
      })}
      {nodes.map((node) => {
        const p = pos(node.id);
        return <g key={node.id}><circle cx={p.x} cy={p.y} r={34} fill={node.inCycle ? "rgba(255,107,107,.14)" : "rgba(76,201,216,.12)"} stroke={node.inCycle ? "#ff6b6b" : "#4cc9d8"} strokeWidth="2" /><text x={p.x} y={p.y + 5} textAnchor="middle" fill={node.inCycle ? "#ff8a8a" : "#79ddea"} fontWeight="800">P{node.id}</text></g>;
      })}
    </svg>
  );
}
