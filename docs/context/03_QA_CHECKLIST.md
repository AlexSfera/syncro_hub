# QA Checklist — SYNCROSFERA Platform

## Minimum QA

1. Open app.
2. Login or select role if applicable.
3. Create a new record.
4. Save.
5. Reload page.
6. Verify persistence.
7. Create incident.
8. Verify incident appears in Follow-up.
9. Close incident.
10. Verify resolution time.
11. Create task.
12. Verify deadline.
13. Verify Dashboard count.
14. Verify role permissions.
15. Verify no technical text is visible.
16. Verify no arrays like `["Desayuno","Comida"]` are visible.
17. Verify responsive view.
18. Verify that unrelated modules are not broken.

## Required QA Output

When Codex changes code, it must provide:

- Files inspected.
- Files modified.
- What changed.
- How to test.
- Risks.
- Pending questions marked as `[NO DATA]`.