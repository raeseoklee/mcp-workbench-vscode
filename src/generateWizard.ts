import * as vscode from "vscode";
import * as path from "path";
import type { GenerateOptions } from "./generator.js";

/**
 * Runs a multi-step wizard to collect generate options.
 * Returns null if the user cancelled at any step.
 */
export async function runGenerateWizard(): Promise<GenerateOptions | null> {
  // ── Step 1: Transport ──────────────────────────────────────────────────────
  const transportPick = await vscode.window.showQuickPick(
    [
      { label: "stdio", description: "Launch a local process (most common)" },
      { label: "streamable-http", description: "Connect to an HTTP server" },
    ],
    { title: "Generate Spec (1/4)", placeHolder: "Select transport" },
  );
  if (!transportPick) return null;
  const transport = transportPick.label as "stdio" | "streamable-http";

  // ── Step 2: Server connection ──────────────────────────────────────────────
  let command: string | undefined;
  let args: string | undefined;
  let url: string | undefined;

  if (transport === "stdio") {
    command = await vscode.window.showInputBox({
      title: "Generate Spec (2/4)",
      prompt: "Command to launch the MCP server",
      placeHolder: "e.g. node",
      ignoreFocusOut: true,
    });
    if (command === undefined) return null;

    args = await vscode.window.showInputBox({
      title: "Generate Spec (2/4)",
      prompt: "Arguments (space-separated)",
      placeHolder: "e.g. dist/server.js",
      ignoreFocusOut: true,
    });
    if (args === undefined) return null;
  } else {
    url = await vscode.window.showInputBox({
      title: "Generate Spec (2/4)",
      prompt: "Server URL",
      placeHolder: "e.g. http://localhost:3000/mcp",
      ignoreFocusOut: true,
    });
    if (url === undefined) return null;
  }

  // ── Step 3: Depth ──────────────────────────────────────────────────────────
  const depthPick = await vscode.window.showQuickPick(
    [
      {
        label: "shallow",
        description: "Discover tools/resources/prompts only (fast, safe)",
        picked: true,
      },
      {
        label: "deep",
        description: "Also call tools to infer response shapes (slower)",
      },
    ],
    { title: "Generate Spec (3/4)", placeHolder: "Generation depth" },
  );
  if (!depthPick) return null;
  const depth = depthPick.label as "shallow" | "deep";

  // ── Step 4: Output file ────────────────────────────────────────────────────
  const defaultUri = defaultOutputUri();
  const outputUri = await vscode.window.showSaveDialog({
    title: "Generate Spec (4/4) — Save spec file",
    defaultUri,
    filters: { "YAML spec": ["yaml", "yml"] },
  });
  if (!outputUri) return null;

  return {
    transport,
    command: command || undefined,
    args: args || undefined,
    url,
    depth,
    outputFile: outputUri.fsPath,
    cwd: vscode.workspace.getWorkspaceFolder(outputUri)?.uri.fsPath,
  };
}

function defaultOutputUri(): vscode.Uri {
  const folder = vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;
  const dir = folder ?? (process.env.HOME ?? "");
  return vscode.Uri.file(path.join(dir, "spec.yaml"));
}
