# Installation

Install the `automation` runtime pack from the independently versioned
`gabros20/automation-skill` repository.

## Prerequisites

- An Agent Skills-compatible client.
- TODO: Add only real skill-specific tools, credentials, or runtime requirements.

## Install with skills.sh

```bash
npx skills add gabros20/automation-skill
```

## Clone and install

```bash
git clone https://github.com/gabros20/automation-skill.git
cd automation-skill
./install.sh codex
```

Available targets:

| Argument | Destination |
|---|---|
| `codex` | `${CODEX_HOME:-$HOME/.codex}/skills/automation/` |
| `agents` | `~/.agents/skills/automation/` |
| `claude` | `~/.claude/skills/automation/` |
| `cursor` | `~/.cursor/skills/automation/` |
| `antigravity` | Gemini IDE and Antigravity CLI skill paths |
| `opencode` | `~/.config/opencode/skills/automation/` |
| `grok` | `~/.grok/skills/automation/` |
| `hermes` | `~/.hermes/skills/automation/` |
| `all` | Claude, Codex, and the cross-agent path |

The installer stages a complete copy before replacing an existing installation. If replacement
fails, it restores the previous copy.

## Verify

Start a new client session and use the client's supported invocation form:

- Codex: `$automation`
- Slash-command clients: `/automation`
- Other clients: an `@` mention, skill tool, or natural-language trigger

For Codex, verify the installed files directly:

```bash
test -f "${CODEX_HOME:-$HOME/.codex}/skills/automation/SKILL.md"
```

## Update

```bash
cd automation-skill
git pull --ff-only
./install.sh codex
```

Review `CHANGELOG.md` and GitHub Releases for version history. Version metadata intentionally stays
outside runtime `SKILL.md`.

## Uninstall

```bash
rm -rf "${CODEX_HOME:-$HOME/.codex}/skills/automation"
```
