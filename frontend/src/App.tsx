import { useEffect, useState } from "react";
import bearAsset from "./assets/bear-conductor.png";
import "./App.css";

const API_BASE =
  import.meta.env.VITE_API_BASE ||
  (import.meta.env.PROD
    ? "https://build-a-feature-factory-api.onrender.com"
    : "http://localhost:5050");
const OUTPUT_REPO = "https://github.com/march-M-R/feature-factory-demo-app";

type Issue = {
  id: string;
  title: string;
  subtitle: string;
  target: string;
  difficulty: string;
  runnable: boolean;
};

type RunStation = {
  id: string;
  status: "waiting" | "active" | "complete" | "failed";
};

type FactoryRun = {
  runId: string;
  issue: Issue;
  status: "running" | "complete" | "failed";
  activeStation: string;
  progress: number;
  logs: string[];
  requirements: string[];
  acceptanceCriteria: string[];
  blueprint: string[];
  prUrl: string | null;
  error: string | null;
  stations: RunStation[];
};

const issues: Issue[] = [
  {
    id: "#5705",
    title: "Canvas Warnings Improvements",
    subtitle: "Group warnings and make every next step clear.",
    target: "WarningsPanel.tsx",
    difficulty: "Live Demo",
    runnable: true,
  },
  {
    id: "#5368",
    title: "Markdown View Mode",
    subtitle: "Mermaid diagrams and node mention chips.",
    target: "MarkdownViewer.tsx",
    difficulty: "Queued",
    runnable: false,
  },
  {
    id: "#5366",
    title: "Canvas Version Diff",
    subtitle: "Highlight what changed between versions.",
    target: "CanvasDiff.tsx",
    difficulty: "Queued",
    runnable: false,
  },
  {
    id: "#5164",
    title: "Send Execution to Agent Chat",
    subtitle: "Push run context into an AI conversation.",
    target: "AgentChat.tsx",
    difficulty: "Queued",
    runnable: false,
  },
  {
    id: "#5704",
    title: "Run Inspection UX",
    subtitle: "Make execution failures easier to understand.",
    target: "RunInspection.tsx",
    difficulty: "Queued",
    runnable: false,
  },
];

const stages = [
  { id: "choose", short: "Intake", icon: "✦", copy: "A rough feature enters the factory." },
  { id: "requirements", short: "Requirements", icon: "≡", copy: "Intent becomes a focused product spec." },
  { id: "criteria", short: "Criteria", icon: "◇", copy: "Success becomes clear and testable." },
  { id: "blueprint", short: "Blueprint", icon: "⌘", copy: "The agent maps the implementation." },
  { id: "code", short: "Code", icon: "</>", copy: "A scoped patch is forged in the repo." },
  { id: "quality", short: "Validate", icon: "✓", copy: "TypeScript and Vite verify the build." },
  { id: "package", short: "PR", icon: "↗", copy: "The change is packaged for review." },
  { id: "ship", short: "Launch", icon: "◉", copy: "Render keeps the proof live." },
];

function App() {
  const liveIssue = issues[0];
  const [run, setRun] = useState<FactoryRun | null>(null);
  const [requestError, setRequestError] = useState<string | null>(null);

  async function startFactoryRun() {
    if (run?.status === "running") return;
    setRequestError(null);

    try {
      const response = await fetch(`${API_BASE}/start-build`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ issue: liveIssue }),
      });

      if (!response.ok) throw new Error("The factory API did not accept the run.");
      setRun((await response.json()) as FactoryRun);
    } catch (error) {
      setRequestError(error instanceof Error ? error.message : "Could not reach the factory API.");
    }
  }

  useEffect(() => {
    if (!run?.runId || run.status !== "running") return;

    const interval = window.setInterval(async () => {
      try {
        const response = await fetch(`${API_BASE}/status/${run.runId}`);
        if (!response.ok) throw new Error("Run status is unavailable.");
        const nextRun = (await response.json()) as FactoryRun;
        setRun(nextRun);
        if (nextRun.status !== "running") window.clearInterval(interval);
      } catch (error) {
        setRequestError(error instanceof Error ? error.message : "Lost contact with the factory API.");
        window.clearInterval(interval);
      }
    }, 700);

    return () => window.clearInterval(interval);
  }, [run?.runId, run?.status]);

  function stationStatus(id: string, index: number) {
    const backendStatus = run?.stations.find((station) => station.id === id)?.status;
    if (backendStatus) return backendStatus;
    return index === 0 ? "active" : "waiting";
  }

  const requirements = run?.requirements.length
    ? run.requirements
    : ["A focused, testable product improvement.", "A UI that explains warnings without technical logs."];
  const criteria = run?.acceptanceCriteria.length
    ? run.acceptanceCriteria
    : ["Warnings are grouped by severity.", "Every warning includes a suggested next action."];
  const blueprint = run?.blueprint.length
    ? run.blueprint
    : ["Target: src/components/WarningsPanel.tsx", "Build validation gates the generated branch."];
  const logs = run?.logs.length
    ? run.logs.join("\n")
    : "> factory standing by\n> live issue loaded: #5705\n> waiting for SuperPlane trigger";

  return (
    <main className="site-shell">
      <div className="ambient ambient-one" />
      <div className="ambient ambient-two" />

      <nav className="nav-wrap">
        <a className="wordmark" href="#top" aria-label="Build-a-Feature Factory home">
          <span>✦</span> Feature Factory
        </a>
        <div className="nav-links">
          <a href="#flow">How it works</a>
          <a href="#demo">Live demo</a>
          <span className="live-pill"><i /> Hackathon live</span>
        </div>
      </nav>

      <section className="hero" id="top">
        <div className="hero-copy">
          <div className="eyebrow"><span>↗</span> SuperPlane Hackathon · Live proof</div>
          <h1>Build-a-Feature <em>Factory.</em></h1>
          <p className="hero-lede">From rough feature request to validated GitHub PR.</p>
          <p className="hero-story">
            SuperPlane triggers it. <strong>Render hosts it.</strong> GitHub proves it.
            One elegant workflow turns product intent into reviewable code.
          </p>
          <div className="hero-actions">
            <button className="button button-primary" onClick={startFactoryRun} disabled={run?.status === "running"}>
              <span>{run?.status === "running" ? "Factory in motion" : "Start live demo run"}</span>
              <b>{run?.status === "running" ? `${run.progress}%` : "→"}</b>
            </button>
            <button className="button button-ghost" onClick={() => window.open(run?.prUrl || `${OUTPUT_REPO}/pulls`, "_blank")}>
              Open proof PR
            </button>
          </div>
          {requestError && <p className="request-error">{requestError} Check that the backend is running.</p>}
          <div className="hero-footnote"><span>☕</span> From vague issue to working PoC—before the coffee gets cold.</div>
        </div>

        <div className="control-room" aria-label="Feature factory control room">
          <div className="room-topline"><span>Feature Factory Control</span><i /></div>
          <div className="factory-window">
            <div className="window-grid" />
            <div className="skyline"><i /><i /><i /><i /><i /><i /><i /></div>
            <div className="status-screen">
              <small>Factory status</small>
              <strong>{run?.status === "complete" ? "Feature shipped." : run?.status === "failed" ? "Needs attention." : run ? "Everything is moving." : "Ready for ignition."}</strong>
              <div className="chart-line"><i /><i /><i /><i /><i /><i /></div>
            </div>
          </div>
          <div className="conductor">
            <div className="asset-halo" />
            <div className="bear-lift">
              <img src={bearAsset} alt="Teddy bear factory conductor rising from the control console" />
            </div>
            <span>SuperPlane</span>
            <small>orchestration core</small>
          </div>
          <div className="console-lights">{Array.from({ length: 11 }, (_, index) => <i key={index} />)}</div>
        </div>
      </section>

      <section className="section flow-section" id="flow">
        <div className="section-heading">
          <div><span className="kicker">01 · The assembly line</span><h2>One idea. Eight precise stations.</h2></div>
          <p>Each stage leaves visible proof before the next one begins.</p>
        </div>
        <div className="station-track">
          {stages.map((stage, index) => {
            const status = stationStatus(stage.id, index);
            return (
              <article className={`station ${status}`} key={stage.id}>
                <div className="station-number">{String(index + 1).padStart(2, "0")}</div>
                <div className="station-icon">{status === "complete" ? "✓" : stage.icon}</div>
                <div><h3>{stage.short}</h3><p>{stage.copy}</p></div>
                <span className="station-status">{status}</span>
              </article>
            );
          })}
        </div>
      </section>

      <section className="section ecosystem-grid">
        <article className="orchestration-card">
          <span className="kicker">02 · The conductor</span>
          <h2>SuperPlane keeps every station in rhythm.</h2>
          <p>It triggers the run, calls the factory API, and carries context from intent to validated output.</p>
          <div className="node-flow">
            <div><span>01</span><strong>Start Factory Run</strong><small>SuperPlane trigger</small></div>
            <b>→</b>
            <div><span>02</span><strong>Run Full Factory</strong><small>Factory API</small></div>
          </div>
        </article>
        <article className="render-card">
          <span className="kicker">03 · The launchpad</span>
          <h2>Render makes the proof public.</h2>
          <div className="hosting-list">
            <div><i>●</i><span>Frontend dashboard</span><strong>Live</strong></div>
            <div><i>●</i><span>Factory API</span><strong>Live</strong></div>
            <div><i>●</i><span>Stable demo URL</span><strong>Public</strong></div>
          </div>
        </article>
      </section>

      <section className="section demo-section" id="demo">
        <div className="section-heading">
          <div><span className="kicker">04 · Live demonstration</span><h2>The factory floor is yours.</h2></div>
          <div className={`run-badge ${run?.status || "ready"}`}><i /> {run?.status || "Ready to run"}</div>
        </div>

        <div className="demo-grid">
          <aside className="issue-queue">
            <div className="panel-title"><span>Issue queue</span><small>1 live · 4 queued</small></div>
            {issues.map((issue) => (
              <button className={`issue-card ${issue.runnable ? "selected" : "queued"}`} key={issue.id} disabled={!issue.runnable} onClick={issue.runnable ? startFactoryRun : undefined}>
                <div><span>{issue.id}</span><em>{issue.difficulty}</em></div>
                <h3>{issue.title}</h3>
                <p>{issue.subtitle}</p>
                <small>{issue.target}</small>
              </button>
            ))}
          </aside>

          <article className="certificate">
            <div className="certificate-head">
              <div><span>Feature certificate</span><h2>Canvas Warnings Improvements</h2></div>
              <div className="seal"><span>✓</span><small>PoC</small></div>
            </div>
            <div className="certificate-meta">
              <div><small>Issue</small><strong>#5705</strong></div>
              <div><small>Target</small><strong>WarningsPanel.tsx</strong></div>
              <div><small>Progress</small><strong>{run?.progress ?? 0}%</strong></div>
              <div><small>Status</small><strong>{run?.status ?? "Waiting"}</strong></div>
            </div>
            <div className="proof-columns">
              <ProofList title="Generated requirements" number="01" items={requirements} />
              <ProofList title="Acceptance criteria" number="02" items={criteria} />
              <ProofList title="Blueprint" number="03" items={blueprint} />
            </div>
            {run?.error && <p className="run-error">{run.error}</p>}
            <div className="output-actions">
              <button className="button button-primary" disabled={!run?.prUrl} onClick={() => run?.prUrl && window.open(run.prUrl, "_blank")}>Generated PR <span>↗</span></button>
              <button className="button button-ghost" onClick={() => window.open(OUTPUT_REPO, "_blank")}>Output Repo <span>↗</span></button>
            </div>
          </article>
        </div>

        <div className="terminal">
          <div className="terminal-bar"><div><i /><i /><i /></div><span>factory-run.log</span><small>{run ? `run ${run.runId.slice(0, 8)}` : "standing by"}</small></div>
          <pre>{logs}</pre>
        </div>
      </section>

      <footer><span>Build-a-Feature Factory</span><p>Built by humans. Supercharged by SuperPlane.</p><small>Hackathon 2026</small></footer>
    </main>
  );
}

function ProofList({ title, number, items }: { title: string; number: string; items: string[] }) {
  return (
    <section className="proof-list">
      <div><span>{number}</span><h3>{title}</h3></div>
      <ul>{items.map((item) => <li key={item}>{item}</li>)}</ul>
    </section>
  );
}

export default App;
