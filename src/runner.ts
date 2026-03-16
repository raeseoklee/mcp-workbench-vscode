import * as cp from "child_process";
import * as path from "path";
import * as vscode from "vscode";
import type { RunReport } from "./types.js";

export interface RunOptions {
  specFile: string;
  updateSnapshots?: boolean;
  timeout?: number;
  cwd?: string;
}

export interface RunResult {
  report: RunReport;
  raw: string;
}

function getCliPath(): string {
  return vscode.workspace
    .getConfiguration("mcpWorkbench")
    .get<string>("cliPath", "mcp-workbench");
}

function getTimeout(): number {
  return vscode.workspace
    .getConfiguration("mcpWorkbench")
    .get<number>("timeout", 30000);
}

/**
 * Invokes `mcp-workbench run <specFile> --json` as a subprocess.
 * Returns the parsed RunReport, or throws with the stderr output on failure.
 */
const TIMEOUT_BUFFER_MS = 5000;

export function runSpec(opts: RunOptions): Promise<RunResult> {
  return new Promise((resolve, reject) => {
    let settled = false;
    const settle = (fn: () => void) => {
      if (settled) return;
      settled = true;
      fn();
    };

    const cli = getCliPath();
    const timeout = opts.timeout ?? getTimeout();

    const args: string[] = ["run", opts.specFile, "--json"];
    if (opts.updateSnapshots) {
      args.push("--update-snapshots");
    }
    if (opts.timeout) {
      args.push("--timeout", String(opts.timeout));
    }

    const cwd =
      opts.cwd ??
      vscode.workspace.workspaceFolders?.[0]?.uri.fsPath ??
      path.dirname(opts.specFile);

    const proc = cp.spawn(cli, args, {
      cwd,
      env: { ...process.env },
      shell: false,
    });

    let stdout = "";
    let stderr = "";

    proc.stdout.on("data", (chunk: Buffer) => {
      stdout += chunk.toString();
    });

    proc.stderr.on("data", (chunk: Buffer) => {
      stderr += chunk.toString();
    });

    const timer = setTimeout(() => {
      proc.kill();
      settle(() => reject(new Error(vscode.l10n.t("mcp-workbench timed out after {0}ms", timeout))));
    }, timeout + TIMEOUT_BUFFER_MS);

    proc.on("close", () => {
      clearTimeout(timer);
      settle(() => {
        try {
          const report = JSON.parse(stdout.trim()) as RunReport;
          resolve({ report, raw: stdout });
        } catch {
          reject(
            new Error(
              `${vscode.l10n.t("Failed to parse mcp-workbench output.")}\n${(stderr || stdout).trim()}`,
            ),
          );
        }
      });
    });

    proc.on("error", (err) => {
      clearTimeout(timer);
      settle(() =>
        reject(
          new Error(
            vscode.l10n.t(
              "Failed to launch mcp-workbench: {0}\nMake sure '{1}' is installed (npm install -g @mcp-workbench/cli).",
              err.message,
              cli,
            ),
          ),
        ),
      );
    });
  });
}
