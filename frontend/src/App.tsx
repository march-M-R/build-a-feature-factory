import { useEffect, useMemo, useState } from "react";
import "./App.css";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5050";

type Issue = {
  id: string;
  title: string;
  subtitle: string;
  target: string;
  difficulty: string;
};

type Stage = {
  id: string;
  name: string;
  story: string;
  engineer: string;
  symbol: string;
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
  previewUrl: string | null;
  error: string | null;
  stations: RunStation[];
};

const issues: Issue[] = [
  {
    id: "#5368",
    title: "Markdown View Mode",
    subtitle: "Mermaid diagrams + node mention chips",
    target: "MarkdownViewer.tsx",
    difficulty: "Advanced",
  },
  {
    id: "#5366",
    title: "Canvas Version Diff",
    subtitle: "Highlight what changed between versions",
    target: "CanvasDiff.tsx",
    difficulty: "Medium",
  },
  {
    id: "#5164",
    title: "Send Execution to Agent Chat",
    subtitle: "Push run context into an AI chat",
    target: "AgentChat.tsx",
    difficulty: "Medium",
  },
  {
    id: "#5704",
    title: "Run Inspection UX",
    subtitle: "Fix inspection paper cuts",
    target: "RunInspection.tsx",
    difficulty: "Easy",
  },
  {
    id: "#5705",
    title: "Canvas Warnings Improvements",
    subtitle: "Make warnings grouped, clear, and actionable",
    target: "WarningsPanel.tsx",
    difficulty: "Easy",
  },
];

const stages: Stage[] = [
  {
    id: "choose",
    name: "Idea Atelier",
    story: "A rough idea enters the workshop.",
    engineer: "Issue intake event received.",
    symbol: "✦",
  },
  {
    id: "requirements",
    name: "Spec Loom",
    story: "AI weaves the idea into requirements.",
    engineer: "LLM generates requirement spec.",
    symbol: "⌘",
  },
  {
    id: "criteria",
    name: "Heart Check",
    story: "The feature gets acceptance criteria.",
    engineer: "Acceptance criteria generated.",
    symbol: "♥",
  },
  {
    id: "blueprint",
    name: "Blueprint Observatory",
    story: "AI maps the architecture and target files.",
    engineer: "Implementation plan + file map produced.",
    symbol: "⌬",
  },
  {
    id: "code",
    name: "Code Forge",
    story: "The agent shapes the codebase.",
    engineer: "Runner applies code changes.",
    symbol: "⚒",
  },
  {
    id: "quality",
    name: "Validation Lab",
    story: "The build is tested before shipping.",
    engineer: "Build/test validation gate.",
    symbol: "◎",
  },
  {
    id: "package",
    name: "PR Vault",
    story: "The feature is packaged for review.",
    engineer: "GitHub pull request created.",
    symbol: "▣",
  },
  {
    id: "ship",
    name: "Render Launchpad",
    story: "A live preview link is launched.",
    engineer: "Render preview deployment attached.",
    symbol: "↗",
  },
];

function App() {
  const [selectedIssue, setSelectedIssue] = useState<Issue>(issues[4]);
  const [run, setRun] = useState<FactoryRun | null>(null);
  const [mode, setMode] = useState<"story" | "engineer">("story");

  const activeStage = useMemo(() => {
    if (!run) return 0;
    const index = stages.findIndex((stage) => stage.id === run.activeStation);
    return index >= 0 ? index : 0;
  }, [run]);

  const progress =
    run?.progress ?? Math.round(((activeStage + 1) / stages.length) * 100);

  async function startFactoryRun(issue = selectedIssue) {
    setSelectedIssue(issue);

    const response = await fetch(`${API_BASE}/start-build`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ issue }),
    });

    if (!response.ok) {
      alert("Could not start factory run. Check backend terminal.");
      return;
    }

    const data: FactoryRun = await response.json();
    setRun(data);
  }

  useEffect(() => {
    if (!run?.runId) return;
    if (run.status === "complete" || run.status === "failed") return;

    const interval = window.setInterval(async () => {
      const response = await fetch(`${API_BASE}/status/${run.runId}`);
      const data: FactoryRun = await response.json();
      setRun(data);

      if (data.status === "complete" || data.status === "failed") {
        window.clearInterval(interval);
      }
    }, 700);

    return () => window.clearInterval(interval);
  }, [run?.runId, run?.status]);

  const currentRequirements = run?.requirements.length
    ? run.requirements
    : ["Waiting for the factory to generate requirements."];

  const currentCriteria = run?.acceptanceCriteria.length
    ? run.acceptanceCriteria
    : ["Waiting for acceptance criteria."];

  const currentBlueprint = run?.blueprint.length
    ? run.blueprint
    : [`Target file: ${selectedIssue.target}`];

  const currentLogs = run?.logs.length
    ? run.logs.join("\n")
    : `> waiting for feature selection
> selected ${selectedIssue.id} ${selectedIssue.title}
> press Start factory run`;

  return (
    <main className="app">
      <div className="noise" />
      <div className="aurora aurora-a" />
      <div className="aurora aurora-b" />
      <div className="aurora aurora-c" />

      <section className="shell">
        <nav className="topbar">
          <div className="brand">
            <span className="brand-mark">✧</span>
            <span>Build-a-Feature Factory</span>
          </div>

          <div className="nav-pills">
            <button
              className={mode === "story" ? "active" : ""}
              onClick={() => setMode("story")}
            >
              Story Mode
            </button>
            <button
              className={mode === "engineer" ? "active" : ""}
              onClick={() => setMode("engineer")}
            >
              Engineer Mode
            </button>
          </div>
        </nav>

        <section className="hero">
          <div className="hero-left">
            <div className="badge">
              <span className="badge-dot" />
              SuperPlane Hackathon · Build Your Own Software Factory
            </div>

            <h1>
              A magical factory for shipping
              <span> real software features.</span>
            </h1>

            <p className="hero-subtitle">
              Pick a rough issue. SuperPlane moves it through AI-powered
              stations: spec, blueprint, code, validation, PR, and Render
              preview.
            </p>

            <div className="hero-buttons">
              <button className="primary" onClick={() => startFactoryRun()}>
                {run?.status === "running"
                  ? "Factory running..."
                  : "Start factory run"}
              </button>
              <button
                className="secondary"
                onClick={() =>
                  setMode(mode === "story" ? "engineer" : "story")
                }
              >
                Toggle {mode === "story" ? "engineer" : "story"} view
              </button>
            </div>

            <div className="hero-stats">
              <div>
                <strong>5</strong>
                <span>validation issues</span>
              </div>
              <div>
                <strong>8</strong>
                <span>factory stations</span>
              </div>
              <div>
                <strong>2+</strong>
                <span>Render services</span>
              </div>
            </div>
          </div>

          <div className="hero-right">
            <ArchitectureHologram activeStage={activeStage} />
          </div>
        </section>

        <section className="main-grid">
          <aside className="panel issue-dock">
            <div className="panel-heading">
              <span>Choose a build</span>
              <h2>Issue Toybox</h2>
            </div>

            <div className="issue-stack">
              {issues.map((issue) => (
                <button
                  key={issue.id}
                  className={`issue-ticket ${
                    selectedIssue.id === issue.id ? "selected" : ""
                  }`}
                  onClick={() => {
                    setSelectedIssue(issue);
                    setRun(null);
                  }}
                >
                  <div className="ticket-top">
                    <span>{issue.id}</span>
                    <small>{issue.difficulty}</small>
                  </div>
                  <h3>{issue.title}</h3>
                  <p>{issue.subtitle}</p>
                  <div className="target-file">{issue.target}</div>
                </button>
              ))}
            </div>
          </aside>

          <section className="panel factory-floor">
            <div className="panel-heading row">
              <div>
                <span>Live assembly line</span>
                <h2>
                  {mode === "story"
                    ? "Magical station view"
                    : "SuperPlane node view"}
                </h2>
              </div>

              <div className="progress-mini">
                <span>{progress}%</span>
                <div>
                  <i style={{ width: `${progress}%` }} />
                </div>
              </div>
            </div>

            <div className="stage-runway">
              {stages.map((stage, index) => {
                const backendStation = run?.stations.find(
                  (s) => s.id === stage.id
                );
                const status = backendStation?.status;
                const done = status === "complete";
                const active = status === "active" || (!run && index === 0);
                const failed = status === "failed";

                return (
                  <article
                    key={stage.name}
                    className={`stage-card ${done ? "done" : ""} ${
                      active ? "active" : ""
                    } ${failed ? "failed" : ""}`}
                  >
                    <div className="stage-symbol">
                      {done ? "✓" : stage.symbol}
                    </div>
                    <div>
                      <div className="stage-title">
                        <h3>{stage.name}</h3>
                        <span>
                          {failed
                            ? "failed"
                            : done
                              ? "complete"
                              : active
                                ? run?.status === "running"
                                  ? "running"
                                  : "ready"
                                : "waiting"}
                        </span>
                      </div>
                      <p>{mode === "story" ? stage.story : stage.engineer}</p>
                    </div>
                  </article>
                );
              })}
            </div>
          </section>

          <aside className="panel certificate">
            <div className="panel-heading">
              <span>Feature certificate</span>
              <h2>{selectedIssue.title}</h2>
            </div>

            <div className="certificate-orb">
              <div className="orb-ring" />
              <div className="orb-ring second" />
              <div className="orb-center">🧸</div>
            </div>

            <div className="certificate-list">
              <div>
                <span>Issue</span>
                <strong>{selectedIssue.id}</strong>
              </div>
              <div>
                <span>Target</span>
                <strong>{selectedIssue.target}</strong>
              </div>
              <div>
                <span>Status</span>
                <strong>{run?.status ?? "Waiting"}</strong>
              </div>
              <div>
                <span>Deploy</span>
                <strong>{run?.previewUrl ? "Preview ready" : "Pending"}</strong>
              </div>
            </div>

            <div className="generated-card">
              <h3>Generated requirements</h3>
              <ul>
                {currentRequirements.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>

            <div className="generated-card">
              <h3>Acceptance criteria</h3>
              <ul>
                {currentCriteria.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>

            <div className="generated-card">
              <h3>Blueprint</h3>
              <ul>
                {currentBlueprint.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>

            <div className="launch-buttons">
              <button
                onClick={() => run?.prUrl && window.open(run.prUrl, "_blank")}
                disabled={!run?.prUrl}
              >
                GitHub PR
              </button>
              <button
                onClick={() =>
                  run?.previewUrl && window.open(run.previewUrl, "_blank")
                }
                disabled={!run?.previewUrl}
              >
                Render Preview
              </button>
            </div>
          </aside>
        </section>

        <section className="bottom-strip">
          <div className="terminal-card">
            <div className="terminal-top">
              <span />
              <span />
              <span />
              <strong>factory-run.log</strong>
            </div>
            <pre>{currentLogs}</pre>
          </div>

          <div className="story-card">
            <span>Demo line</span>
            <p>
              “The dashboard is the magical workshop. SuperPlane is the factory
              floor. AI agents do the heavy lifting, and each station validates
              before the feature can move forward.”
            </p>
          </div>
        </section>
      </section>
    </main>
  );
}

function ArchitectureHologram({ activeStage }: { activeStage: number }) {
  const nodes = ["Idea", "Spec", "Plan", "Agent", "Check", "PR", "Render"];

  return (
    <div className="hologram-card">
      <div className="holo-header">
        <span>Architecture Hologram</span>
        <strong>SuperPlane-controlled flow</strong>
      </div>

      <div className="holo-visual">
        <div className="core-planet">
          <span>SP</span>
          <small>Canvas</small>
        </div>

        {nodes.map((node, index) => (
          <div
            key={node}
            className={`holo-node node-${index + 1} ${
              index <= activeStage ? "lit" : ""
            }`}
          >
            {node}
          </div>
        ))}

        <svg className="holo-lines" viewBox="0 0 500 500">
          <path d="M250 250 C120 120, 80 190, 96 92" />
          <path d="M250 250 C260 90, 180 95, 250 62" />
          <path d="M250 250 C390 90, 370 170, 408 105" />
          <path d="M250 250 C420 260, 430 330, 420 390" />
          <path d="M250 250 C270 410, 330 410, 255 438" />
          <path d="M250 250 C120 410, 120 330, 90 385" />
          <path d="M250 250 C90 250, 90 290, 68 250" />
        </svg>
      </div>

      <div className="holo-caption">
        <span className="caption-dot" />
        Live factory run: station {activeStage + 1} / {stages.length}
      </div>
    </div>
  );
}

export default App;