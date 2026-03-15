import * as cp from "child_process";
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
export function runSpec(opts: RunOptions): Promise<RunResult> {
  return new Promise((resolve, reject) => {
    const cli = getCliPath();
    const timeout = opts.timeout ?? getTimeout();

    const args: string[] = ["run", opts.specFile, "--json"];
    if (opts.updateSnapshots) {
      args.push("--update-snapshots");
    }
    if (opts.timeout) {
      args.push("--timeout", String(opts.timeout));
    }

    const cwd = opts.cwd ?? vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;

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
      reject(new Error(`mcp-workbench timed out after ${timeout}ms`));
    }, timeout + 5000);

    proc.on("close", () => {
      clearTimeout(timer);
      try {
        const report = JSON.parse(stdout.trim()) as RunReport;
        resolve({ report, raw: stdout });
      } catch {
        reject(
          new Error(
            `Failed to parse mcp-workbench output.\n${stderr || stdout}`.trim(),
          ),
        );
      }
    });

    proc.on("error", (err) => {
      clearTimeout(timer);
      reject(
        new Error(
          `Failed to launch mcp-workbench: ${err.message}\n` +
            `Make sure '${cli}' is installed (npm install -g mcp-workbench).`,
        ),
      );
    });
  });
}
