# MCP Workbench — VS Code Extension

**English** | [한국어](README.ko.md)

Run, inspect, and validate [MCP](https://modelcontextprotocol.io) servers directly from VS Code.

Official IDE integration for **[MCP Workbench](https://github.com/raeseoklee/mcp-workbench)**.

[![VS Code Marketplace Version](https://img.shields.io/visual-studio-marketplace/v/raeseoklee.mcp-workbench-vscode)](https://marketplace.visualstudio.com/items?itemName=raeseoklee.mcp-workbench-vscode)
[![Downloads](https://img.shields.io/visual-studio-marketplace/d/raeseoklee.mcp-workbench-vscode)](https://marketplace.visualstudio.com/items?itemName=raeseoklee.mcp-workbench-vscode)
[![License](https://img.shields.io/github/license/raeseoklee/mcp-workbench-vscode)](LICENSE)

---

## Overview

MCP Workbench for VS Code provides an integrated environment for running and validating MCP servers directly inside the editor.

- Run YAML-based MCP test specifications without leaving the editor
- View test results, assertion failures, and diffs in a dedicated tree view
- Failed assertions surface as Problems panel diagnostics with file locations
- Full execution logs streamed to the MCP Workbench output channel

This extension delegates execution to the **mcp-workbench CLI** and presents its output inside VS Code.

---

## Features

- **Run Current Spec** — run the open YAML spec file and see results inline
- **Run All Workspace Specs** — discover and run all spec files in the workspace
- **Update Snapshots** — regenerate snapshot baselines for the current spec
- **Test Results Tree** — collapsible view showing every test and assertion
- **Problems Panel Integration** — failed assertions appear as diagnostics in the Problems panel
- **Output Channel Logs** — full run log in the MCP Workbench output panel

---

## Installation

### From the VS Code Marketplace

1. Open the **Extensions** panel (`Ctrl+Shift+X` / `Cmd+Shift+X`)
2. Search for **MCP Workbench**
3. Click **Install**

### Prerequisites

The extension requires the MCP Workbench CLI:

```bash
# Primary — scoped package
npm install -g @mcp-workbench/cli

# Alternative — convenience wrapper
npm install -g mcp-workbench-cli
```

Both install the same `mcp-workbench` command.

> **Note:** The unscoped `mcp-workbench` npm package is an unrelated project.
> Make sure to install one of the two options above.

---

## Quick Start

1. Install the CLI: `npm install -g @mcp-workbench/cli`
2. Create a spec file (see [Spec File Format](#spec-file-format) below)
3. Open the spec file in VS Code
4. Press `Cmd+Shift+P` → **MCP Workbench: Run Current Spec**
5. View results in the **MCP Workbench** panel in the Activity Bar

---

## Usage

### Run the current spec

Open a `*.yaml` spec file and click the **▷** button in the editor title bar,
or use the Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`):

```
MCP Workbench: Run Current Spec
```

### Run all specs in the workspace

```
MCP Workbench: Run All Workspace Specs
```

### Update snapshots

```
MCP Workbench: Update Snapshots
```

---

## Configuration

| Setting | Default | Description |
|---------|---------|-------------|
| `mcpWorkbench.cliPath` | `"mcp-workbench"` | Path to the CLI executable |
| `mcpWorkbench.timeout` | `30000` | Per-request timeout (ms) |
| `mcpWorkbench.specGlob` | `"**/*.{yaml,yml}"` | Glob for workspace spec discovery |

---

## Spec File Format

The extension recognises files containing `apiVersion: mcp-workbench.dev/v0alpha1`.

Minimal example:

```yaml
apiVersion: mcp-workbench.dev/v0alpha1

server:
  transport: stdio
  command: node
  args:
    - dist/server.js

tests:
  - id: tools-list
    act:
      method: tools/list
    assert:
      - kind: status
        equals: success
```

See the [MCP Workbench documentation](https://github.com/raeseoklee/mcp-workbench) for the full spec format including snapshots, assertions, and client simulator fixtures.

---

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| `Failed to launch mcp-workbench` | CLI not on PATH | Set `mcpWorkbench.cliPath` or run `npm install -g @mcp-workbench/cli` |
| `Failed to parse mcp-workbench output` | CLI version too old | Upgrade: `npm install -g @mcp-workbench/cli` |
| Installed `mcp-workbench` but wrong tool | Unrelated npm package | Uninstall it, then install `@mcp-workbench/cli` or `mcp-workbench-cli` |
| `No active editor` | Command run without a file open | Open a `.yaml` spec file first |
| `Current file does not appear to be an MCP Workbench spec` | File missing `apiVersion` | Add `apiVersion: mcp-workbench.dev/v0alpha1` to your spec |
| Results tree shows nothing | No spec has been run yet | Run a spec with **Run Current Spec** |

---

## FAQ

**Why isn't the npm package named simply `mcp-workbench`?**

The unscoped `mcp-workbench` name on npm is taken by an unrelated project (an MCP server aggregator). Our CLI is published as `@mcp-workbench/cli`, with `mcp-workbench-cli` as a convenience alternative. Both install the same `mcp-workbench` command.

---

## Roadmap

| Feature | Status |
|---------|--------|
| Run spec via CLI | ✓ |
| Update snapshots | ✓ |
| Test Results tree view | ✓ |
| Problems panel diagnostics | ✓ |
| Output channel log | ✓ |
| Inline test decorations in the editor | Planned |
| VS Code Testing API integration | Planned |
| Interactive MCP server inspector | Planned |
| Live protocol timeline viewer | Planned |

---

## Development

```bash
npm install
npm run build:watch   # incremental build
```

Press **F5** in VS Code to launch the Extension Development Host.

---

## Contributing

Contributions are welcome. Please open an issue or submit a pull request.

For core CLI and spec engine development, see the [main MCP Workbench repository](https://github.com/raeseoklee/mcp-workbench).

---

## License

[Apache-2.0](LICENSE)
