const express = require("express");
const cors = require("cors");
const { randomUUID } = require("crypto");
const fs = require("fs");
const path = require("path");
const { exec } = require("child_process");

const app = express();
const PORT = process.env.PORT || 5050;
const RENDER_DEPLOY_HOOK_URL = process.env.RENDER_DEPLOY_HOOK_URL;

app.use(cors());
app.use(express.json());

const runs = new Map();

const DEMO_REPO_PATH = path.resolve(__dirname, "../demo-repo");
const WARNINGS_FILE = path.join(
  DEMO_REPO_PATH,
  "src",
  "components",
  "WarningsPanel.tsx"
);

const stations = [
  "choose",
  "requirements",
  "criteria",
  "blueprint",
  "code",
  "quality",
  "package",
  "ship",
];

function createRun(issue) {
  const runId = randomUUID();

  const run = {
    runId,
    issue,
    status: "running",
    activeStation: "choose",
    progress: 0,
    logs: [],
    requirements: [],
    acceptanceCriteria: [],
    blueprint: [],
    prUrl: null,
    previewUrl: "https://build-a-feature-factory.onrender.com",
    error: null,
    stations: stations.map((id) => ({
      id,
      status: id === "choose" ? "active" : "waiting",
    })),
  };

  runs.set(runId, run);
  return run;
}

function addLog(run, message) {
  const timestamp = new Date().toLocaleTimeString();
  run.logs.push(`[${timestamp}] ${message}`);
}

function setStation(run, stationId, status) {
  run.activeStation = stationId;
  run.stations = run.stations.map((station) =>
    station.id === stationId ? { ...station, status } : station
  );

  const activeIndex = stations.indexOf(stationId);
  run.progress = Math.round(((activeIndex + 1) / stations.length) * 100);
}

function completeStation(run, stationId) {
  run.stations = run.stations.map((station) =>
    station.id === stationId ? { ...station, status: "complete" } : station
  );
}

function failStation(run, stationId) {
  run.stations = run.stations.map((station) =>
    station.id === stationId ? { ...station, status: "failed" } : station
  );
}

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function runCommand(command, cwd) {
  return new Promise((resolve, reject) => {
    exec(command, { cwd, maxBuffer: 1024 * 1024 * 10 }, (error, stdout, stderr) => {
      if (error) {
        reject({ error, stdout, stderr });
        return;
      }

      resolve({ stdout, stderr });
    });
  });
}

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/#/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function getPrCompareUrl(branchName) {
  const encodedBranch = encodeURIComponent(branchName);
  return `https://github.com/march-M-R/feature-factory-demo-app/compare/main...${encodedBranch}?expand=1`;
}

async function triggerRenderDeploy(run) {
  if (!RENDER_DEPLOY_HOOK_URL) {
    addLog(run, "Render deploy hook not configured yet; skipping deploy trigger.");
    return null;
  }

  const response = await fetch(RENDER_DEPLOY_HOOK_URL, {
    method: "POST",
  });

  if (!response.ok) {
    throw new Error(`Render deploy hook failed with status ${response.status}`);
  }

  addLog(run, "Render deploy hook triggered.");
  return "Render deploy triggered";
}

function generateRequirements(issue) {
  return [
    `Turn ${issue.title} into a clear, testable product improvement.`,
    "Make the UI easier for users to understand without reading technical logs.",
    "Keep the implementation scoped to one existing component in the demo repo.",
  ];
}

function generateAcceptanceCriteria(issue) {
  if (issue.id === "#5705") {
    return [
      "Warnings are grouped by severity.",
      "Each warning explains the issue in plain language.",
      "Each warning includes a suggested next action.",
      "The panel has a polished visual state that is easy to scan.",
    ];
  }

  return [
    "The feature has a visible proof of concept.",
    "The target component renders without build errors.",
    "The change is small enough to review in a pull request.",
  ];
}

function generateBlueprint(issue) {
  return [
    `Target file: src/components/${issue.target}`,
    "Generate a safe component-level change.",
    "Run npm build to validate the repo still compiles.",
    "Package the change as a pull request.",
  ];
}

function applyWarningsImprovement(runId) {
  const improvedCode = String.raw`type WarningSeverity = "critical" | "warning" | "info";

type Warning = {
  id: number;
  severity: WarningSeverity;
  title: string;
  message: string;
  nextAction: string;
};

const factoryRunId = "${runId.slice(0, 8)}";

const warnings: Warning[] = [
  {
    id: 1,
    severity: "critical",
    title: "Missing input",
    message: "A Canvas node is missing a required input before execution.",
    nextAction: "Connect a valid input to the node before running the canvas.",
  },
  {
    id: 2,
    severity: "warning",
    title: "Incomplete configuration",
    message: "Execution may fail because one or more settings are incomplete.",
    nextAction: "Open the node settings and complete the highlighted fields.",
  },
  {
    id: 3,
    severity: "info",
    title: "No output connected",
    message: "This node currently has no output connection.",
    nextAction: "Connect the output if another step depends on this result.",
  },
];

const severityLabels: Record<WarningSeverity, string> = {
  critical: "Critical",
  warning: "Warning",
  info: "Info",
};

export default function WarningsPanel() {
  const groupedWarnings = warnings.reduce<Record<WarningSeverity, Warning[]>>(
    (groups, warning) => {
      groups[warning.severity].push(warning);
      return groups;
    },
    { critical: [], warning: [], info: [] }
  );

  return (
    <section className="panel warning-panel">
      <p className="panel-label">#5705 · AI generated PoC · Run {factoryRunId}</p>
      <h2>Canvas Warnings</h2>
      <p>
        Warnings are now grouped by severity with plain-language explanations
        and next-step guidance.
      </p>

      <div className="warning-groups">
        {(Object.keys(groupedWarnings) as WarningSeverity[]).map((severity) => {
          const items = groupedWarnings[severity];

          if (items.length === 0) return null;

          return (
            <div className={"warning-group " + severity} key={severity}>
              <div className="warning-group-header">
                <span>{severityLabels[severity]}</span>
                <strong>{items.length}</strong>
              </div>

              <ul>
                {items.map((warning) => (
                  <li key={warning.id}>
                    <h3>{warning.title}</h3>
                    <p>{warning.message}</p>
                    <small>{warning.nextAction}</small>
                  </li>
                ))}
              </ul>
            </div>
          );
        })}
      </div>
    </section>
  );
}
`;

  fs.writeFileSync(WARNINGS_FILE, improvedCode, "utf8");
}

async function executePipeline(runId) {
  const run = runs.get(runId);

  try {
    addLog(run, "Factory run started.");
    await sleep(500);

    setStation(run, "choose", "active");
    addLog(run, `Selected ${run.issue.id}: ${run.issue.title}`);
    await sleep(800);
    completeStation(run, "choose");

    setStation(run, "requirements", "active");
    addLog(run, "Generating requirements.");
    run.requirements = generateRequirements(run.issue);
    await sleep(1000);
    completeStation(run, "requirements");

    setStation(run, "criteria", "active");
    addLog(run, "Generating acceptance criteria.");
    run.acceptanceCriteria = generateAcceptanceCriteria(run.issue);
    await sleep(1000);
    completeStation(run, "criteria");

    setStation(run, "blueprint", "active");
    addLog(run, "Creating implementation blueprint.");
    run.blueprint = generateBlueprint(run.issue);
    await sleep(900);
    completeStation(run, "blueprint");

    setStation(run, "code", "active");
    addLog(run, `Applying code change to ${run.issue.target}.`);

    const branchName = `factory/${slugify(run.issue.title)}-${run.runId.slice(0, 6)}`;

    await runCommand("git checkout main", DEMO_REPO_PATH);
    await runCommand("git pull origin main", DEMO_REPO_PATH);
    await runCommand(`git checkout -B ${branchName}`, DEMO_REPO_PATH);
    addLog(run, `Created branch ${branchName}.`);

    if (run.issue.id === "#5705") {
      applyWarningsImprovement(run.runId);
      addLog(run, "WarningsPanel.tsx updated with grouped warnings PoC.");
    } else {
      addLog(run, "Demo mode: this issue is queued for the same factory workflow.");
    }

    await sleep(900);
    completeStation(run, "code");

    setStation(run, "quality", "active");
    addLog(run, "Running npm build validation.");

    const buildResult = await runCommand("npm run build", DEMO_REPO_PATH);
    addLog(run, "Build passed.");
    if (buildResult.stdout) {
      addLog(run, buildResult.stdout.split("\n").slice(-4).join(" "));
    }

    completeStation(run, "quality");

    setStation(run, "package", "active");
    addLog(run, "Packaging change for GitHub PR.");

    await runCommand("git add .", DEMO_REPO_PATH);

    try {
      await runCommand(
        `git commit -m "Factory: implement ${run.issue.title}"`,
        DEMO_REPO_PATH
      );
      addLog(run, "Committed generated code changes.");
    } catch {
      addLog(run, "No new changes to commit.");
    }

    await runCommand(`git push -u origin ${branchName} --force`, DEMO_REPO_PATH);
    addLog(run, `Pushed branch ${branchName} to GitHub.`);

    run.prUrl = getPrCompareUrl(branchName);
    await sleep(900);
    completeStation(run, "package");

    setStation(run, "ship", "active");
    await triggerRenderDeploy(run);
    addLog(run, "Render Launchpad completed.");
    await sleep(900);
    completeStation(run, "ship");

    run.status = "complete";
    run.progress = 100;
    addLog(run, "Factory run complete.");
  } catch (err) {
    run.status = "failed";
    run.error = err.stderr || err.message || "Unknown error";
    failStation(run, run.activeStation);
    addLog(run, `Factory run failed: ${run.error}`);
  }
}

app.get("/", (req, res) => {
  res.json({ ok: true, service: "Build-a-Feature Factory API" });
});

app.post("/start-build", (req, res) => {
  const issue = req.body.issue;

  if (!issue) {
    return res.status(400).json({ error: "Missing issue payload" });
  }

  const run = createRun(issue);

  executePipeline(run.runId);

  res.json(run);
});

app.get("/status/:runId", (req, res) => {
  const run = runs.get(req.params.runId);

  if (!run) {
    return res.status(404).json({ error: "Run not found" });
  }

  res.json(run);
});

/**
 * SuperPlane-compatible stage endpoints.
 * These let SuperPlane call each factory station as a separate API node.
 */

app.post("/superplane/intake", (req, res) => {
  const { issue } = req.body;

  if (!issue) {
    return res.status(400).json({ error: "Missing issue" });
  }

  const run = createRun(issue);
  addLog(run, "SuperPlane intake received.");
  completeStation(run, "choose");

  res.json({
    ok: true,
    runId: run.runId,
    issue,
    next: "requirements",
  });
});

app.post("/superplane/requirements", (req, res) => {
  const { runId } = req.body;
  const run = runs.get(runId);

  if (!run) {
    return res.status(404).json({ error: "Run not found" });
  }

  setStation(run, "requirements", "active");
  run.requirements = generateRequirements(run.issue);
  completeStation(run, "requirements");
  addLog(run, "SuperPlane generated requirements.");

  res.json({
    ok: true,
    runId,
    requirements: run.requirements,
    next: "criteria",
  });
});

app.post("/superplane/criteria", (req, res) => {
  const { runId } = req.body;
  const run = runs.get(runId);

  if (!run) {
    return res.status(404).json({ error: "Run not found" });
  }

  setStation(run, "criteria", "active");
  run.acceptanceCriteria = generateAcceptanceCriteria(run.issue);
  completeStation(run, "criteria");
  addLog(run, "SuperPlane generated acceptance criteria.");

  res.json({
    ok: true,
    runId,
    acceptanceCriteria: run.acceptanceCriteria,
    next: "blueprint",
  });
});

app.post("/superplane/blueprint", (req, res) => {
  const { runId } = req.body;
  const run = runs.get(runId);

  if (!run) {
    return res.status(404).json({ error: "Run not found" });
  }

  setStation(run, "blueprint", "active");
  run.blueprint = generateBlueprint(run.issue);
  completeStation(run, "blueprint");
  addLog(run, "SuperPlane generated implementation blueprint.");

  res.json({
    ok: true,
    runId,
    blueprint: run.blueprint,
    next: "build",
  });
});

app.post("/superplane/build", async (req, res) => {
  const { runId } = req.body;
  const run = runs.get(runId);

  if (!run) {
    return res.status(404).json({ error: "Run not found" });
  }

  res.json({
    ok: true,
    runId,
    message: "Build accepted. Poll /status/:runId for updates.",
  });

  try {
    const branchName = `factory/${slugify(run.issue.title)}-${run.runId.slice(0, 6)}`;

    setStation(run, "code", "active");
    addLog(run, `SuperPlane Code Forge started branch ${branchName}.`);

    await runCommand("git checkout main", DEMO_REPO_PATH);
    await runCommand("git pull origin main", DEMO_REPO_PATH);
    await runCommand(`git checkout -B ${branchName}`, DEMO_REPO_PATH);

    if (run.issue.id === "#5705") {
      applyWarningsImprovement(run.runId);
      addLog(run, "WarningsPanel.tsx updated by SuperPlane-triggered run.");
    } else {
      addLog(run, "Demo mode: only #5705 currently performs a real code patch.");
    }

    completeStation(run, "code");

    setStation(run, "quality", "active");
    addLog(run, "SuperPlane Validation Lab running npm build.");
    await runCommand("npm run build", DEMO_REPO_PATH);
    addLog(run, "Build validation passed.");
    completeStation(run, "quality");

    setStation(run, "package", "active");
    addLog(run, "SuperPlane PR Vault packaging GitHub branch.");
    await runCommand("git add .", DEMO_REPO_PATH);

    try {
      await runCommand(
        `git commit -m "Factory: implement ${run.issue.title}"`,
        DEMO_REPO_PATH
      );
      addLog(run, "Committed generated code changes.");
    } catch {
      addLog(run, "No new changes to commit.");
    }

    await runCommand(`git push -u origin ${branchName} --force`, DEMO_REPO_PATH);
    run.prUrl = getPrCompareUrl(branchName);
    addLog(run, `Pushed branch ${branchName}.`);
    completeStation(run, "package");

    setStation(run, "ship", "active");
    await triggerRenderDeploy(run);
    addLog(run, "SuperPlane Render Launchpad completed.");
    completeStation(run, "ship");

    run.status = "complete";
    run.progress = 100;
    addLog(run, "SuperPlane-controlled factory run complete.");
  } catch (err) {
    run.status = "failed";
    run.error = err.stderr || err.message || "Unknown error";
    failStation(run, run.activeStation);
    addLog(run, `SuperPlane build failed: ${run.error}`);
  }
});

app.listen(PORT, () => {
  console.log(`Build-a-Feature Factory API running on http://localhost:${PORT}`);
});