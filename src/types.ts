/**
 * Shape of `mcp-workbench run --json` output.
 * Mirrors RunReport / TestResultSummary / AssertionSummary from @mcp-workbench/plugin-sdk.
 */

export interface RunReport {
  passed: number;
  failed: number;
  skipped: number;
  errors: number;
  total: number;
  durationMs: number;
  snapshotsUpdated: number;
  tests: TestResultSummary[];
}

export interface TestResultSummary {
  testId: string;
  description?: string;
  status: "passed" | "failed" | "skipped" | "error";
  durationMs: number;
  assertionResults: AssertionSummary[];
  error?: string;
}

export interface AssertionSummary {
  assertion: { kind: string; label?: string };
  passed: boolean;
  actual: unknown;
  message?: string;
  diff?: string;
}
