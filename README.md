# MCP Workbench — VS Code Extension

Run, inspect, and validate [MCP](https://modelcontextprotocol.io) servers directly from VS Code.

This extension is the official IDE integration for [MCP Workbench](https://github.com/raeseoklee/mcp-workbench).

---

## Prerequisites

Install the MCP Workbench CLI:

```bash
npm install -g mcp-workbench
```

---

## Features

- **Run Current Spec** — run the open YAML spec file and see results inline
- **Run All Workspace Specs** — discover and run all spec files in the workspace
- **Update Snapshots** — regenerate snapshot baselines for the current spec
- **Test Results tree** — collapsible view showing every test and assertion
- **Problems panel** — failed assertions appear as diagnostics in the Problems panel
- **Output channel** — full run log in the MCP Workbench output panel

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

## Spec file format

The extension recognises files containing `apiVersion: mcp-workbench.dev/v0alpha1`:

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

See the [MCP Workbench documentation](https://github.com/raeseoklee/mcp-workbench) for the full spec format.

---

## Development

```bash
npm install
npm run build:watch   # incremental build
# Press F5 in VS Code to launch the Extension Development Host
```

---

## License

[Apache-2.0](LICENSE)
