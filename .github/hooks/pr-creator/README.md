---
name: "PR Creator"
description: "Automatically creates a pull request from the current branch to a target base branch (default: main) at the end of a Copilot coding agent session"
tags: ["pull-request", "automation", "session-end", "gh-cli"]
---

# PR Creator Hook

Automatically opens a GitHub pull request from the current branch to a configurable base branch (default: `main`) when a Copilot coding agent session ends.

## Overview

After a Copilot session finishes its work on a feature branch, this hook fires and calls the GitHub CLI (`gh pr create`) so a PR is ready for review immediately — no manual step required.

Key behaviours:

- **Idempotent**: If an open PR already exists for the same head → base pair, the hook logs its URL and exits without creating a duplicate.
- **Safe guards**: Skips PR creation when on the base branch itself, when there are no commits ahead of the base, or when the `gh` CLI is not available.
- **Configurable title & body**: Defaults to the last commit message as the title and an auto-generated body, but both can be overridden via environment variables.
- **Draft support**: Optionally open the PR as a draft.

## Installation

1. Copy the hook folder to your repository:

   ```bash
   cp -r hooks/pr-creator .github/hooks/
   ```

2. Ensure the script is executable:

   ```bash
   chmod +x .github/hooks/pr-creator/create-pr.sh
   ```

3. Authenticate the GitHub CLI (required once per machine / CI runner):

   ```bash
   gh auth login
   ```

4. Commit the hook configuration to your repository's default branch.

## Configuration

The hook is configured in `hooks.json` to run on the `sessionEnd` event:

```json
{
  "version": 1,
  "hooks": {
    "sessionEnd": [
      {
        "type": "command",
        "bash": ".github/hooks/pr-creator/create-pr.sh",
        "cwd": ".",
        "env": {
          "PR_BASE_BRANCH": "main",
          "PR_DRAFT": "false"
        },
        "timeoutSec": 60
      }
    ]
  }
}
```

### Environment Variables

| Variable          | Values          | Default                       | Description                                                              |
| ----------------- | --------------- | ----------------------------- | ------------------------------------------------------------------------ |
| `PR_BASE_BRANCH`  | branch name     | `main`                        | Target base branch for the pull request                                  |
| `PR_TITLE`        | string          | Last commit message subject   | Title of the pull request                                                |
| `PR_BODY`         | string          | Auto-generated markdown body  | Body text of the pull request                                            |
| `PR_DRAFT`        | `true`, `false` | `false`                       | Open the PR as a draft                                                   |
| `SKIP_PR_CREATION`| `true`          | unset                         | Disable PR creation entirely for this session                            |

## Requirements

- [GitHub CLI (`gh`)](https://cli.github.com) installed and authenticated (`gh auth login`)
- The current branch must be pushed to the remote before the hook runs

## How It Works

1. When a Copilot coding agent session ends the hook executes.
2. Verifies guards: `gh` CLI present, inside a git repo, not already on the base branch, and commits exist ahead of base.
3. Checks for an existing open PR with the same head → base pair; if one exists, logs its URL and exits.
4. Builds the PR title (last commit message subject) and body (auto-generated summary).
5. Calls `gh pr create --base <PR_BASE_BRANCH> --head <current-branch>` to open the PR.
6. Logs the resulting PR URL on success.

## Example Output

### PR created successfully

```
🔀 Creating PR: 'feature/my-change' → 'main'...
✅ Pull request created: https://github.com/org/repo/pull/42
```

### PR already exists

```
ℹ️  An open PR already exists for 'feature/my-change' → 'main': https://github.com/org/repo/pull/42
```

### No commits ahead of base

```
ℹ️  No commits ahead of 'main' — skipping PR creation.
```

### gh CLI not installed

```
⚠️  gh CLI not found — skipping PR creation.
⚠️  Install the GitHub CLI (https://cli.github.com) and authenticate with 'gh auth login'.
```

## Pairing with Other Hooks

This hook pairs naturally with the **Secrets Scanner** hook. Configure them in the same `sessionEnd` list so the secrets scan runs first:

```json
{
  "version": 1,
  "hooks": {
    "sessionEnd": [
      {
        "type": "command",
        "bash": ".github/hooks/secrets-scanner/scan-secrets.sh",
        "cwd": ".",
        "env": { "SCAN_MODE": "block", "SCAN_SCOPE": "diff" },
        "timeoutSec": 30
      },
      {
        "type": "command",
        "bash": ".github/hooks/pr-creator/create-pr.sh",
        "cwd": ".",
        "env": { "PR_BASE_BRANCH": "main" },
        "timeoutSec": 60
      }
    ]
  }
}
```

With `SCAN_MODE=block`, the secrets scanner will exit non-zero and prevent the PR creator from running if secrets are detected.

## Disabling

To temporarily skip PR creation for a session:

- Set `SKIP_PR_CREATION=true` in the hook environment, or
- Remove or comment out the `sessionEnd` entry from `hooks.json`.

## Limitations

- Requires the `gh` CLI to be authenticated in the execution environment.
- The current branch must have been pushed to the remote before the hook fires; commits that have not been pushed will not appear in the PR.
- Does not currently support creating PRs across forks (base and head must be in the same repository).
