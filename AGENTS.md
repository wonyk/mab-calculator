# Working preferences

- Automatically create a local Git commit at each completed, verified checkpoint. Do not wait for the user to request a commit.
- Commit only changes belonging to the checkpoint; preserve unrelated user changes.
- Update `VERSION` at each checkpoint that changes application behavior: patch for fixes, minor for new features, major for incompatible changes.
- Keep checkpoint commits focused and describe the resulting behavior in the commit message.
- Run the relevant checks before committing. For calculator or date changes, run `node calculator.test.cjs`, `node dates.test.cjs`, and `node --check script.js`.
- Push only when the user requests it or has already authorized it.
