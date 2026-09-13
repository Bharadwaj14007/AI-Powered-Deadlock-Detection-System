import type { LucideIcon } from "lucide-react";
import { Cpu } from "lucide-react";
import type { ReactNode } from "react";

export default function Layout({
  children,
  page,
  setPage,
  pages
}: {
  children: ReactNode;
  page: string;
  setPage: (page: string) => void;
  pages: { id: string; label: string; icon: LucideIcon }[];
}) {
  return (
    <div className="min-h-screen">
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark"><Cpu size={22} /></div>
          <div><strong>Deadlock Detection & Prediction</strong><span>React + Banker + WFG + DFS</span></div>
        </div>
        <nav className="nav">
          {pages.map(({ id, label, icon: Icon }) => (
            <button key={id} className={page === id ? "active" : ""} onClick={() => setPage(id)}>
              <Icon size={16} /> {label}
            </button>
          ))}
        </nav>
      </header>
      <main>{children}</main>
    </div>
  );
}
