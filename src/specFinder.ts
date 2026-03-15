import * as vscode from "vscode";

const MCP_WORKBENCH_API_VERSION = "mcp-workbench.dev/v0alpha1";

/**
 * Returns true if the document looks like an MCP Workbench spec file
 * (contains the apiVersion marker).
 */
export function isSpecFile(doc: vscode.TextDocument): boolean {
  const text = doc.getText();
  return text.includes(MCP_WORKBENCH_API_VERSION);
}

/**
 * Returns all spec files in the workspace matching the configured glob.
 */
export async function findWorkspaceSpecs(): Promise<vscode.Uri[]> {
  const glob = vscode.workspace
    .getConfiguration("mcpWorkbench")
    .get<string>("specGlob", "**/*.{yaml,yml}");

  const files = await vscode.workspace.findFiles(
    glob,
    "**/node_modules/**",
  );

  // Filter to files that contain the apiVersion marker
  const specFiles: vscode.Uri[] = [];
  for (const uri of files) {
    try {
      const doc = await vscode.workspace.openTextDocument(uri);
      if (isSpecFile(doc)) {
        specFiles.push(uri);
      }
    } catch {
      // skip unreadable files
    }
  }

  return specFiles;
}
