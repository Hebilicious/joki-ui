We use Quadratique for issues: every task is an issue there. Use the `quadratique` skill (`.agents/skills/quadratique/SKILL.md`) for anything about tasks.

## Branches and pull requests

- Never work directly on `main`. GitHub blocks pushes to `main`. Changes go in through a pull request that is merged with a squash merge.
- Each issue gets its own branch and its own worktree in `.worktrees/<branch>`. Create it from `main` with `git worktree add .worktrees/<branch> -b <branch> main`, and do all the work in that worktree. Keep the main worktree as you found it.
- When you start a subagent, tell it which branch and worktree it uses: the parent's, or a new one that you name. The subagent does not choose.
- Commit titles and pull request titles are semantic: `type(scope): subject`, for example `fix(menu): close on Tab`. The types are `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `build`, `ci`, `chore` and `revert`. The scope is required. Add `!` after the scope for a breaking change. The `semantic` check (`scripts/check-semantic.sh`) enforces this. The pull request title and body become the commit on `main`.
- Push the branch and open a pull request against `main` with `gh pr create --base main --head <branch>`. The body ends with a `Refs: JOKI-<n>` line for each issue that the pull request does, so that the squash commit carries it and Quadratique sees the merge.
- When a change is too large for one pull request, use `gh stack` (see `.agents/skills/gh-stack`): one branch and one pull request for each layer, in one worktree. Use it when the work splits into layers that a reviewer can read one at a time.
- Before you hand off a pull request, run `pnpm typecheck` and `pnpm test` in its worktree.
- A human reviews each pull request. Hand off the pull request URL, the issue and the evidence. Merge only after the human accepts the work, or when the human explicitly says to merge without review.
- Each session owns its own branch. Do not push to, rebase or merge a branch that another session owns.
- The session that merges a branch makes CI pass on it. Rebase on `main`, fix what fails, and merge only when every required check is green. Never skip or weaken a check to make it pass.
- To bring a branch up to date with `main`, rebase it and push it with `--force-with-lease`. Do not use `gh pr update-branch`: it adds a merge commit, and the `semantic` check rejects the title of that commit. Push only when `git status` shows no rebase in progress.
- Merge a stack with `gh stack merge <top pull request> --yes --squash`. GitHub does not merge one pull request of a stack by itself, and does not change its base.
- "Merge" means the work is on `main` both locally and on `origin`: merge the pull request and pull `main`. It is one step: never stop halfway, and never ask whether to do the second half. `main` and `origin/main` are always the same commit: check before reporting a merge as done, and if you find them apart, pull.
- After the merge, remove the worktree with `git worktree remove .worktrees/<branch>`.

## Checks

- `pnpm typecheck` and `pnpm test` run every package. CI (`.github/workflows/ci.yml`) runs both on each pull request and on each push to `main`; the `typecheck and test` and `semantic` checks are required to merge.
- Toolchains come from `.prototools` (`proto install`). Each Node dependency comes from the `catalog:` in `pnpm-workspace.yaml`.
