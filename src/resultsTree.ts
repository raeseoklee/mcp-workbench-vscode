import * as vscode from "vscode";
import type { RunReport, TestResultSummary } from "./types.js";

type TreeItemType = "suite" | "test" | "assertion";

export class ResultsTreeItem extends vscode.TreeItem {
  constructor(
    public readonly itemType: TreeItemType,
    label: string,
    collapsibleState: vscode.TreeItemCollapsibleState,
    public readonly testResult?: TestResultSummary,
  ) {
    super(label, collapsibleState);
  }
}

export class ResultsTreeProvider
  implements vscode.TreeDataProvider<ResultsTreeItem>
{
  private _onDidChangeTreeData = new vscode.EventEmitter<
    ResultsTreeItem | undefined | void
  >();
  readonly onDidChangeTreeData = this._onDidChangeTreeData.event;

  private report: RunReport | null = null;
  private specFile: string | null = null;

  setReport(report: RunReport, specFile: string): void {
    this.report = report;
    this.specFile = specFile;
    this._onDidChangeTreeData.fire();
  }

  clear(): void {
    this.report = null;
    this.specFile = null;
    this._onDidChangeTreeData.fire();
  }

  getTreeItem(element: ResultsTreeItem): vscode.TreeItem {
    return element;
  }

  getChildren(element?: ResultsTreeItem): ResultsTreeItem[] {
    if (!this.report) {
      return [];
    }

    if (!element) {
      return this.buildSuiteItems();
    }

    if (element.itemType === "suite") {
      return this.buildTestItems();
    }

    if (element.itemType === "test" && element.testResult) {
      return this.buildAssertionItems(element.testResult);
    }

    return [];
  }

  private buildSuiteItems(): ResultsTreeItem[] {
    if (!this.report) return [];

    const specLabel = this.specFile
      ? this.specFile.split("/").pop() ?? this.specFile
      : vscode.l10n.t("Test Suite");

    const allGood = this.report.failed === 0 && this.report.errors === 0;
    const icon = allGood
      ? new vscode.ThemeIcon("pass", new vscode.ThemeColor("testing.iconPassed"))
      : new vscode.ThemeIcon("error", new vscode.ThemeColor("testing.iconFailed"));

    const summary = `${this.report.passed}✓  ${this.report.failed}✗  ${this.report.total} total`;

    const item = new ResultsTreeItem(
      "suite",
      specLabel,
      vscode.TreeItemCollapsibleState.Expanded,
    );
    item.description = summary;
    item.iconPath = icon;
    item.tooltip = `${specLabel} — ${this.report.durationMs}ms`;

    return [item];
  }

  private buildTestItems(): ResultsTreeItem[] {
    if (!this.report) return [];

    return this.report.tests.map((test) => {
      const label = test.description
        ? `${test.testId} — ${test.description}`
        : test.testId;

      const hasChildren = test.assertionResults.length > 0;
      const collapsible = hasChildren
        ? vscode.TreeItemCollapsibleState.Collapsed
        : vscode.TreeItemCollapsibleState.None;

      const item = new ResultsTreeItem("test", label, collapsible, test);
      item.description = `${test.durationMs}ms`;
      item.iconPath = statusIcon(test.status);
      item.tooltip = test.error ?? test.description;

      if (test.status === "error" && test.error) {
        item.description = test.error;
      }

      return item;
    });
  }

  private buildAssertionItems(test: TestResultSummary): ResultsTreeItem[] {
    return test.assertionResults.map((ar) => {
      const name = ar.assertion.label ?? ar.assertion.kind;
      const item = new ResultsTreeItem(
        "assertion",
        name,
        vscode.TreeItemCollapsibleState.None,
      );
      item.iconPath = ar.passed
        ? new vscode.ThemeIcon(
            "pass",
            new vscode.ThemeColor("testing.iconPassed"),
          )
        : new vscode.ThemeIcon(
            "error",
            new vscode.ThemeColor("testing.iconFailed"),
          );
      item.description = ar.passed ? vscode.l10n.t("passed") : (ar.message ?? vscode.l10n.t("failed"));
      if (!ar.passed && ar.actual !== undefined) {
        item.tooltip = `actual: ${JSON.stringify(ar.actual)}`;
      }
      return item;
    });
  }
}

function statusIcon(status: TestResultSummary["status"]): vscode.ThemeIcon {
  switch (status) {
    case "passed":
      return new vscode.ThemeIcon(
        "pass",
        new vscode.ThemeColor("testing.iconPassed"),
      );
    case "failed":
      return new vscode.ThemeIcon(
        "error",
        new vscode.ThemeColor("testing.iconFailed"),
      );
    case "skipped":
      return new vscode.ThemeIcon(
        "debug-step-over",
        new vscode.ThemeColor("testing.iconSkipped"),
      );
    case "error":
      return new vscode.ThemeIcon(
        "warning",
        new vscode.ThemeColor("testing.iconErrored"),
      );
  }
}
