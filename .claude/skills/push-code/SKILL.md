---
name: Push Code to Origin
description: Get current git branch name and push changes to git origin branch. Do git pull before making a push, be sure everything is up to date
---

# Push committed code

## Instructions
1. Run `git pull` to pull all latest changes from the brach
2. Get currently working branch name
3. Run `git push origin <current-branch-name>` to push changes to branch origin


## Best practices
- Do `git pull` and then `git push` to update branch and then push staged code into branch. If some errors occurred during pulling and pushing. Propose me few options how we can fix, and wait until I choose the better option 