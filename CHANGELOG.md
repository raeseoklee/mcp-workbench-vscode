# Changelog

All notable changes to the MCP Workbench VS Code extension will be documented here.

The format follows [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [0.2.0] — 2026-03-17

### Added

- **Generate Spec from Server** command — launches a 4-step wizard (transport → connection → depth → output file) and calls `mcp-workbench generate` to scaffold a YAML test spec from a live MCP server
- `$(sparkle)` toolbar button in the Test Results panel to trigger spec generation
- `onCommand:mcpWorkbench.generateSpec` activation event so the command works before any YAML file is opened

---

## [0.1.1] — 2026-03-16

### Fixed

- Use the spec file's directory as `cwd` when no VS Code workspace folder is open, preventing `spawn ENOENT` errors when running specs from arbitrary locations

---

## [0.1.0] — 2026-03-15

### Added

- **Run Current Spec** command — runs the open YAML spec file via the `mcp-workbench` CLI
- **Run All Workspace Specs** command — discovers and runs all spec files in the workspace
- **Update Snapshots** command — regenerates snapshot baselines with `--update-snapshots`
- **Test Results tree view** in the Explorer panel (suite → test → assertion hierarchy)
- **Problems panel diagnostics** — failed assertions appear as warnings in the Problems panel
- **Output channel** (`MCP Workbench`) — full run log with per-test and per-assertion details
- **`mcpWorkbench.cliPath`** setting — path to the `mcp-workbench` CLI executable
- **`mcpWorkbench.timeout`** setting — per-request timeout in milliseconds
- **`mcpWorkbench.specGlob`** setting — glob pattern for workspace spec discovery
- Spec file detection via `apiVersion: mcp-workbench.dev/v0alpha1` marker
- Editor title bar **▷** button on YAML files
- Confirmation dialog before overwriting snapshot baselines
