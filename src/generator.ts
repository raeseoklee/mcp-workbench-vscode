import * as cp from "child_process";
import * as vscode from "vscode";

export interface GenerateOptions {
  transport: "stdio" | "streamable-http";
  command?: string;
  args?: string;
  url?: string;
  depth: "shallow" | "deep";
  outputFile: string;
  timeout?: number;
  cwd?: string;
}

function getCliPath(): string {
  return vscode.workspace
    .getConfiguration("mcpWorkbench")
    .get<string>("cliPath", "mcp-workbench");
}

const GENERATE_TIMEOUT_MS = 60_000;
const TIMEOUT_BUFFER_MS = 5_000;

export function generateSpec(opts: GenerateOptions): Promise<string> {
  return new Promise((resolve, reject) => {
    let settled = false;
    const settle = (fn: () => void) => {
      if (settled) return;
      settled = true;
      fn();
    };

    const cli = getCliPath();
    const args: string[] = ["generate", "--overwrite", "--output", opts.outputFile];

    args.push("--transport", opts.transport);
    args.push("--depth", opts.depth);

    if (opts.transport === "stdio") {
      if (opts.command) args.push("--command", opts.command);
      if (opts.args) args.push("--args", opts.args);
    } else {
      if (opts.url) args.push("--url", opts.url);
    }

    if (opts.timeout) args.push("--timeout", String(opts.timeout));

    const timeout = opts.timeout ?? GENERATE_TIMEOUT_MS;
    const cwd = opts.cwd ?? vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;

    const proc = cp.spawn(cli, args, {
      cwd,
      env: { ...process.env },
      shell: false,
    });

    let stdout = "";
    let stderr = "";

    proc.stdout.on("data", (chunk: Buffer) => { stdout += chunk.toString(); });
    proc.stderr.on("data", (chunk: Buffer) => { stderr += chunk.toString(); });

    const timer = setTimeout(() => {
      proc.kill();
      settle(() => reject(new Error(`mcp-workbench generate timed out after ${timeout}ms`)));
    }, timeout + TIMEOUT_BUFFER_MS);

    proc.on("close", (code) => {
      clearTimeout(timer);
      settle(() => {
        if (code === 0) {
          resolve(stdout);
        } else {
          reject(new Error((stderr || stdout).trim() || `mcp-workbench generate exited with code ${code}`));
        }
      });
    });

    proc.on("error", (err) => {
      clearTimeout(timer);
      settle(() =>
        reject(
          new Error(
            `Failed to launch mcp-workbench: ${err.message}\n` +
              `Make sure '${cli}' is installed (npm install -g @mcp-workbench/cli).`,
          ),
        ),
      );
    });
  });
}
