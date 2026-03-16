import * as vscode from "vscode";
import { runSpec } from "./runner.js";
import { ResultsTreeProvider } from "./resultsTree.js";
import { updateDiagnostics, clearDiagnostics } from "./diagnostics.js";
import { isSpecFile, findWorkspaceSpecs } from "./specFinder.js";
import { generateSpec } from "./generator.js";
import { runGenerateWizard } from "./generateWizard.js";

let outputChannel: vscode.OutputChannel;
let diagnosticCollection: vscode.DiagnosticCollection;
let resultsProvider: ResultsTreeProvider;

export function activate(context: vscode.ExtensionContext): void {
  outputChannel = vscode.window.createOutputChannel("MCP Workbench");
  diagnosticCollection =
    vscode.languages.createDiagnosticCollection("mcp-workbench");
  resultsProvider = new ResultsTreeProvider();

  const treeView = vscode.window.createTreeView("mcpWorkbenchResults", {
    treeDataProvider: resultsProvider,
    showCollapseAll: true,
  });

  context.subscriptions.push(
    outputChannel,
    diagnosticCollection,
    treeView,
    vscode.commands.registerCommand(
      "mcpWorkbench.runCurrentSpec",
      cmdRunCurrentSpec,
    ),
    vscode.commands.registerCommand(
      "mcpWorkbench.runWorkspaceSpecs",
      cmdRunWorkspaceSpecs,
    ),
    vscode.commands.registerCommand(
      "mcpWorkbench.updateSnapshots",
      cmdUpdateSnapshots,
    ),
    vscode.commands.registerCommand("mcpWorkbench.refreshResults", () => {
      resultsProvider.clear();
    }),
    vscode.commands.registerCommand(
      "mcpWorkbench.generateSpec",
      cmdGenerateSpec,
    ),
  );
}

export function deactivate(): void {
  // nothing to clean up — subscriptions handle disposal
}

// ── Commands ──────────────────────────────────────────────────────────────────

/** Returns the active editor if it contains a spec file, otherwise shows a warning and returns null. */
function requireActiveSpecEditor(): vscode.TextEditor | null {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    vscode.window.showWarningMessage(vscode.l10n.t("No active editor."));
    return null;
  }
  if (!isSpecFile(editor.document)) {
    vscode.window.showWarningMessage(
      vscode.l10n.t("Current file does not appear to be an MCP Workbench spec (missing apiVersion)."),
    );
    return null;
  }
  return editor;
}

async function cmdRunCurrentSpec(): Promise<void> {
  const editor = requireActiveSpecEditor();
  if (!editor) return;
  await executeRun(editor.document.uri, { updateSnapshots: false });
}

async function cmdUpdateSnapshots(): Promise<void> {
  const editor = requireActiveSpecEditor();
  if (!editor) return;

  const updateLabel = vscode.l10n.t("Update");
  const confirmed = await vscode.window.showInformationMessage(
    vscode.l10n.t("Update snapshots for this spec? This will overwrite existing baselines."),
    { modal: true },
    updateLabel,
  );
  if (confirmed !== updateLabel) return;

  await executeRun(editor.document.uri, { updateSnapshots: true });
}

async function cmdRunWorkspaceSpecs(): Promise<void> {
  const specFiles = await findWorkspaceSpecs();

  if (specFiles.length === 0) {
    vscode.window.showInformationMessage(
      vscode.l10n.t("No MCP Workbench spec files found in workspace."),
    );
    return;
  }

  outputChannel.show(true);
  outputChannel.appendLine(
    `\n[MCP Workbench] Running ${specFiles.length} spec file(s)...\n`,
  );

  let totalPassed = 0;
  let totalFailed = 0;
  let totalErrors = 0;

  for (const uri of specFiles) {
    const result = await executeRun(uri, {
      updateSnapshots: false,
      silent: true,
    });
    if (result) {
      totalPassed += result.passed;
      totalFailed += result.failed;
      totalErrors += result.errors;
    }
  }

  outputChannel.appendLine(
    `\n[MCP Workbench] Summary: ${totalPassed} passed, ${totalFailed} failed, ${totalErrors} errors\n`,
  );

  if (totalFailed + totalErrors > 0) {
    vscode.window.showErrorMessage(
      vscode.l10n.t("MCP Workbench: {0} test(s) failed. See Output panel.", totalFailed + totalErrors),
    );
  } else {
    vscode.window.showInformationMessage(
      vscode.l10n.t("MCP Workbench: All {0} test(s) passed.", totalPassed),
    );
  }
}

async function cmdGenerateSpec(): Promise<void> {
  const opts = await runGenerateWizard();
  if (!opts) return;

  outputChannel.show(true);
  outputChannel.appendLine(`\n[MCP Workbench] Generating spec → ${opts.outputFile}`);

  await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: vscode.l10n.t("MCP Workbench: connecting to server and generating spec..."),
      cancellable: false,
    },
    async () => {
      try {
        await generateSpec(opts);
        outputChannel.appendLine("  ✓ Spec generated successfully\n");

        const uri = vscode.Uri.file(opts.outputFile);
        await vscode.window.showTextDocument(uri);
        vscode.window.showInformationMessage(
          vscode.l10n.t("MCP Workbench: spec generated → {0}", opts.outputFile.split("/").pop() ?? opts.outputFile),
        );
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        outputChannel.appendLine(`  ✗ Error: ${message}\n`);
        vscode.window.showErrorMessage(`MCP Workbench: ${message}`);
      }
    },
  );
}

// ── Core run logic ─────────────────────────────────────────────────────────────

interface ExecuteOpts {
  updateSnapshots: boolean;
  silent?: boolean;
}

async function executeRun(
  specUri: vscode.Uri,
  opts: ExecuteOpts,
): Promise<{ passed: number; failed: number; errors: number } | null> {
  const specFile = specUri.fsPath;
  const cwd =
    vscode.workspace.getWorkspaceFolder(specUri)?.uri.fsPath ??
    vscode.workspace.workspaceFolders?.[0]?.uri.fsPath;

  clearDiagnostics(diagnosticCollection, specUri);
  resultsProvider.clear();

  if (!opts.silent) {
    outputChannel.show(true);
  }

  outputChannel.appendLine(`[MCP Workbench] Running: ${specFile}`);

  return await vscode.window.withProgress(
    {
      location: vscode.ProgressLocation.Notification,
      title: vscode.l10n.t("MCP Workbench: running {0}", specUri.path.split("/").pop() ?? specUri.path),
      cancellable: false,
    },
    async () => {
      try {
        const { report } = await runSpec({
          specFile,
          updateSnapshots: opts.updateSnapshots,
          cwd,
        });

        // Output channel
        const status =
          report.failed + report.errors === 0 ? "✓ PASS" : "✗ FAIL";
        outputChannel.appendLine(
          `  ${status}  ${report.passed}/${report.total} passed  (${report.durationMs}ms)`,
        );

        for (const test of report.tests) {
          const icon =
            test.status === "passed"
              ? "  ✓"
              : test.status === "skipped"
                ? "  ○"
                : "  ✗";
          const label = test.description
            ? `${test.testId} — ${test.description}`
            : test.testId;
          outputChannel.appendLine(`${icon} ${label}  (${test.durationMs}ms)`);

          if (test.status === "error" && test.error) {
            outputChannel.appendLine(`      ↳ ${test.error}`);
          }

          for (const ar of test.assertionResults) {
            if (!ar.passed) {
              const name = ar.assertion.label ?? ar.assertion.kind;
              outputChannel.appendLine(
                `      ✗ ${name}: ${ar.message ?? "failed"}`,
              );
            }
          }
        }

        if (report.snapshotsUpdated > 0) {
          outputChannel.appendLine(
            `  Snapshots updated: ${report.snapshotsUpdated}`,
          );
        }
        outputChannel.appendLine("");

        // Tree view
        resultsProvider.setReport(report, specFile);

        // Diagnostics
        updateDiagnostics(diagnosticCollection, specUri, report);

        // Status bar notification
        if (!opts.silent) {
          if (report.failed + report.errors > 0) {
            vscode.window.showErrorMessage(
              vscode.l10n.t("MCP Workbench: {0} test(s) failed.", report.failed + report.errors),
            );
          } else {
            vscode.window.showInformationMessage(
              vscode.l10n.t("MCP Workbench: All {0} test(s) passed.", report.passed),
            );
          }
        }

        return {
          passed: report.passed,
          failed: report.failed,
          errors: report.errors,
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        outputChannel.appendLine(`  ✗ Error: ${message}`);
        outputChannel.appendLine("");

        if (!opts.silent) {
          vscode.window.showErrorMessage(`MCP Workbench: ${message}`);
        }

        return null;
      }
    },
  );
}
