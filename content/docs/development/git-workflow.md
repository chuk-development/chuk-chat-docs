---
title: Git Workflow
weight: 7
---

Git branching strategy and workflow for Chuk Chat development.

## Branch Strategy

```
main (production)
  └── develop (integration)
        ├── feature/add-voice-input
        ├── feature/improve-encryption
        ├── bugfix/fix-message-sync
        └── hotfix/security-patch
```

## Branch Types

| Branch | Purpose | Base | Merge To |
|--------|---------|------|----------|
| `main` | Production releases | - | - |
| `develop` | Integration branch | main | main |
| `feature/*` | New features | develop | develop |
| `bugfix/*` | Bug fixes | develop | develop |
| `hotfix/*` | Urgent fixes | main | main, develop |

## Workflow

### Starting a Feature

```bash
# Update develop
git checkout develop
git pull origin develop

# Create feature branch
git checkout -b feature/add-voice-input

# Work on feature
# ... make changes ...

# Commit changes
git add .
git commit -m "feat: add voice input recording"
```

### Committing

Follow [Conventional Commits](https://www.conventionalcommits.org/):

```bash
# Feature
git commit -m "feat: add voice message transcription"

# Bug fix
git commit -m "fix: resolve message sync race condition"

# Documentation
git commit -m "docs: update API reference"

# Refactor
git commit -m "refactor: extract message handler logic"

# Performance
git commit -m "perf: optimize image compression"

# Chore
git commit -m "chore: update dependencies"
```

### Commit Message Format

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Types:**
- `feat` - New feature
- `fix` - Bug fix
- `docs` - Documentation
- `style` - Formatting
- `refactor` - Code restructuring
- `perf` - Performance
- `test` - Tests
- `chore` - Maintenance

### Creating a Pull Request

```bash
# Push feature branch
git push -u origin feature/add-voice-input

# Create PR on GitHub
# - Base: develop
# - Compare: feature/add-voice-input
# - Add description and reviewers
```

### PR Template

```markdown
## Description
Brief description of changes.

## Type of Change
- [ ] Feature
- [ ] Bug fix
- [ ] Refactor
- [ ] Documentation

## Testing
- [ ] Unit tests added/updated
- [ ] Widget tests added/updated
- [ ] Manual testing completed

## Screenshots
(if applicable)

## Checklist
- [ ] Code follows style guidelines
- [ ] Self-review completed
- [ ] Documentation updated
- [ ] No new warnings
```

### Merging

```bash
# After PR approval, merge to develop
# Use "Squash and merge" for clean history

# For releases, merge develop to main
git checkout main
git merge develop
git push origin main
git tag v1.2.0
git push origin v1.2.0
```

## Hotfix Process

```bash
# Create hotfix from main
git checkout main
git checkout -b hotfix/security-patch

# Fix and commit
git commit -m "fix: patch security vulnerability"

# Merge to main
git checkout main
git merge hotfix/security-patch
git push origin main

# Also merge to develop
git checkout develop
git merge hotfix/security-patch
git push origin develop

# Delete hotfix branch
git branch -d hotfix/security-patch
```

## Useful Commands

```bash
# View branch graph
git log --oneline --graph --all

# Rebase feature on develop
git checkout feature/my-feature
git rebase develop

# Interactive rebase (squash commits)
git rebase -i HEAD~3

# Stash changes
git stash
git stash pop

# Cherry-pick commit
git cherry-pick <commit-hash>
```
