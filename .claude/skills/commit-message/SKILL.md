---
name: Generating Commit Messages
description: Generates clear commit messages from git diffs. Use when writing commit messages or reviewing staged changes.
---

# Generating Commit Messages

## Instructions

1. Run `git diff --staged` to see changes
2. You'll suggest a commit message with:
   - Summary under 50 characters
   - Detailed description
   - Affected components
3. Git will run pre-commit hook with biomeJS checks. If some errors appeared ask me permission to fix them

## Best practices

- Always add .claude and CLAUDE.md to committed files
- Use present tense
- Explain what and why, not how