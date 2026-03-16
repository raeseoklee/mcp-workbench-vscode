# MCP Workbench — VS Code Extension

[English](README.md) | **한국어**

VS Code에서 직접 [MCP](https://modelcontextprotocol.io) 서버를 실행·검사·검증합니다.

**[MCP Workbench](https://github.com/raeseoklee/mcp-workbench)** 공식 IDE 통합 확장입니다.

[![VS Code Marketplace Version](https://img.shields.io/visual-studio-marketplace/v/raeseoklee.mcp-workbench-vscode)](https://marketplace.visualstudio.com/items?itemName=raeseoklee.mcp-workbench-vscode)
[![Downloads](https://img.shields.io/visual-studio-marketplace/d/raeseoklee.mcp-workbench-vscode)](https://marketplace.visualstudio.com/items?itemName=raeseoklee.mcp-workbench-vscode)
[![License](https://img.shields.io/github/license/raeseoklee/mcp-workbench-vscode)](LICENSE)

---

## 개요

MCP Workbench for VS Code는 에디터 안에서 MCP 서버를 직접 실행하고 검증할 수 있는 통합 환경을 제공합니다.

- 에디터를 벗어나지 않고 YAML 기반 MCP 테스트 스펙 실행
- 전용 트리 뷰에서 테스트 결과, 어서션 실패, diff 확인
- 실패한 어서션은 파일 위치와 함께 Problems 패널에 진단 항목으로 표시
- MCP Workbench 출력 채널에 전체 실행 로그 스트리밍

이 확장은 **mcp-workbench CLI**에 실행을 위임하고, 그 결과를 VS Code 안에서 보여줍니다.

---

## 기능

- **서버에서 스펙 생성** — 실행 중인 MCP 서버에 연결하여 가이드 위저드로 YAML 테스트 스펙 자동 생성
- **한국어 UI** — VS Code 로케일이 `ko`로 설정된 경우 모든 커맨드, 설정 설명, 알림이 한국어로 표시됨
- **현재 스펙 실행** — 열려 있는 YAML 스펙 파일을 실행하고 인라인으로 결과 확인
- **워크스페이스 전체 스펙 실행** — 워크스페이스의 모든 스펙 파일을 탐색하여 실행
- **스냅샷 업데이트** — 현재 스펙의 스냅샷 baseline 재생성
- **테스트 결과 트리** — 모든 테스트와 어서션을 접을 수 있는 트리 뷰로 표시
- **Problems 패널 연동** — 실패한 어서션이 Problems 패널에 진단 항목으로 표시
- **출력 채널 로그** — MCP Workbench 출력 패널에 전체 실행 로그 표시

---

## 설치

### VS Code Marketplace에서 설치

1. **Extensions** 패널 열기 (`Ctrl+Shift+X` / `Cmd+Shift+X`)
2. **MCP Workbench** 검색
3. **Install** 클릭

### 사전 요구사항

이 확장을 사용하려면 MCP Workbench CLI가 필요합니다:

```bash
# 기본 — 스코프 패키지
npm install -g @mcp-workbench/cli

# 대안 — 편의용 래퍼
npm install -g mcp-workbench-cli
```

두 방법 모두 동일한 `mcp-workbench` 커맨드를 설치합니다.

> **참고:** npm의 unscoped 패키지 `mcp-workbench`는 관련 없는 별개의 프로젝트입니다.
> 반드시 위의 두 가지 중 하나를 설치하세요.

---

## 빠른 시작

1. CLI 설치: `npm install -g @mcp-workbench/cli`
2. 스펙 파일 생성 (아래 [스펙 파일 형식](#스펙-파일-형식) 참고)
3. VS Code에서 스펙 파일 열기
4. `Cmd+Shift+P` → **MCP Workbench: Run Current Spec**
5. Activity Bar의 **MCP Workbench** 패널에서 결과 확인

---

## 사용법

### 서버에서 스펙 생성

MCP Workbench Test Results 패널의 **✦** 버튼을 클릭하거나,
Command Palette에서 실행합니다:

```
MCP Workbench: Generate Spec from Server
```

위저드가 4단계로 안내합니다:

1. **Transport** — `stdio` (로컬 프로세스) 또는 `streamable-http` (HTTP 서버)
2. **연결 정보** — stdio는 커맨드 + 인자, HTTP는 URL
3. **Depth** — `shallow` (기능 목록만) 또는 `deep` (안전한 툴 호출 포함)
4. **출력 파일** — 생성된 YAML 스펙을 저장할 위치

### 현재 스펙 실행

`*.yaml` 스펙 파일을 열고 에디터 제목 표시줄의 **▷** 버튼을 클릭하거나,
Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`)를 사용합니다:

```
MCP Workbench: Run Current Spec
```

### 워크스페이스 전체 스펙 실행

```
MCP Workbench: Run All Workspace Specs
```

### 스냅샷 업데이트

```
MCP Workbench: Update Snapshots
```

---

## 설정

| 설정 | 기본값 | 설명 |
|------|--------|------|
| `mcpWorkbench.cliPath` | `"mcp-workbench"` | CLI 실행 파일 경로 |
| `mcpWorkbench.timeout` | `30000` | 요청당 타임아웃 (ms) |
| `mcpWorkbench.specGlob` | `"**/*.{yaml,yml}"` | 워크스페이스 스펙 탐색용 Glob 패턴 |

---

## 스펙 파일 형식

이 확장은 `apiVersion: mcp-workbench.dev/v0alpha1`이 포함된 파일을 인식합니다.

최소 예시:

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

스냅샷, 어서션, 클라이언트 시뮬레이터 fixtures를 포함한 전체 스펙 형식은 [MCP Workbench 문서](https://github.com/raeseoklee/mcp-workbench)를 참고하세요.

---

## 트러블슈팅

| 증상 | 원인 | 해결 방법 |
|------|------|-----------|
| `Failed to launch mcp-workbench` | CLI가 PATH에 없음 | `mcpWorkbench.cliPath` 설정 또는 `npm install -g @mcp-workbench/cli` 실행 |
| `Failed to parse mcp-workbench output` | CLI 버전이 너무 오래됨 | 업그레이드: `npm install -g @mcp-workbench/cli` |
| `mcp-workbench` 설치했는데 다른 도구가 실행됨 | 관련 없는 npm 패키지 | 해당 패키지 제거 후 `@mcp-workbench/cli` 또는 `mcp-workbench-cli` 설치 |
| `No active editor` | 파일 없이 커맨드 실행 | `.yaml` 스펙 파일을 먼저 열기 |
| `Current file does not appear to be an MCP Workbench spec` | 파일에 `apiVersion` 없음 | 스펙에 `apiVersion: mcp-workbench.dev/v0alpha1` 추가 |
| 결과 트리에 아무것도 표시되지 않음 | 아직 실행된 스펙 없음 | **Run Current Spec**으로 스펙 실행 |

---

## FAQ

**왜 npm 패키지 이름이 단순히 `mcp-workbench`가 아닌가요?**

npm의 unscoped 패키지 `mcp-workbench`는 관련 없는 별개 프로젝트(MCP 서버 aggregator)가 사용 중입니다. 저희 CLI는 `@mcp-workbench/cli`로 배포되며, `mcp-workbench-cli`는 편의를 위한 대안입니다. 두 가지 모두 동일한 `mcp-workbench` 커맨드를 설치합니다.

---

## 로드맵

| 기능 | 상태 |
|------|------|
| CLI를 통한 스펙 실행 | ✓ |
| 스냅샷 업데이트 | ✓ |
| 테스트 결과 트리 뷰 | ✓ |
| Problems 패널 진단 | ✓ |
| 출력 채널 로그 | ✓ |
| 서버에서 스펙 생성 | ✓ |
| 한국어 UI | ✓ |
| 에디터 인라인 테스트 decoration | 계획 중 |
| VS Code Testing API 통합 | 계획 중 |
| 인터랙티브 MCP 서버 inspector | 계획 중 |
| 실시간 프로토콜 타임라인 뷰어 | 계획 중 |

---

## 개발

```bash
npm install
npm run build:watch   # 증분 빌드
```

VS Code에서 **F5**를 눌러 Extension Development Host를 실행합니다.

---

## 기여

기여를 환영합니다. 이슈를 열거나 pull request를 제출해 주세요.

핵심 CLI 및 스펙 엔진 개발은 [MCP Workbench 메인 저장소](https://github.com/raeseoklee/mcp-workbench)를 참고하세요.

---

## 라이선스

[Apache-2.0](LICENSE)
