import * as vscode from "vscode";
import type { RunReport } from "./types.js";

const MCP_WORKBENCH_SOURCE = "mcp-workbench";

/**
 * Updates the diagnostic collection based on a run report.
 * Maps failed tests / errors back to the spec file so VS Code
 * shows them in the Problems panel.
 */
export function updateDiagnostics(
  collection: vscode.DiagnosticCollection,
  specUri: vscode.Uri,
  report: RunReport,
): void {
  const diagnostics: vscode.Diagnostic[] = [];

  for (const test of report.tests) {
    if (test.status === "passed" || test.status === "skipped") {
      continue;
    }

    if (test.status === "error" && test.error) {
      const diag = new vscode.Diagnostic(
        new vscode.Range(0, 0, 0, 0),
        `[${test.testId}] ${test.error}`,
        vscode.DiagnosticSeverity.Error,
      );
      diag.source = MCP_WORKBENCH_SOURCE;
      diagnostics.push(diag);
      continue;
    }

    // failed — collect assertion failures
    for (const ar of test.assertionResults) {
      if (ar.passed) continue;

      const name = ar.assertion.label ?? ar.assertion.kind;
      const msg = ar.message ?? `Assertion '${name}' failed`;
      const detail = ar.actual !== undefined
        ? ` (actual: ${JSON.stringify(ar.actual)})`
        : "";

      const diag = new vscode.Diagnostic(
        new vscode.Range(0, 0, 0, 0),
        `[${test.testId}] ${msg}${detail}`,
        vscode.DiagnosticSeverity.Warning,
      );
      diag.source = MCP_WORKBENCH_SOURCE;
      diagnostics.push(diag);
    }
  }

  collection.set(specUri, diagnostics);
}

/**
 * Clears diagnostics for a spec file (e.g. before a new run).
 */
export function clearDiagnostics(
  collection: vscode.DiagnosticCollection,
  specUri: vscode.Uri,
): void {
  collection.delete(specUri);
}
