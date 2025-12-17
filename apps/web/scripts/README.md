# Web App Scripts

Utility scripts for the web application.

## Available Scripts

### `check-feature-imports.sh`

Checks for direct imports into feature internals that violate the architecture boundaries.

**Usage:**
```bash
./scripts/check-feature-imports.sh
```

**Output:**
- Total count of violations
- Breakdown by feature
- Usage examples

**When to use:**
- Before committing changes
- During code review
- To track migration progress
- To verify refactoring didn't introduce new violations

**Example output:**
```
🔍 Checking for direct imports into feature internals...

Found 229 direct imports into feature internals

📊 Breakdown by feature:

 113 events
  38 chat
  17 admin
  ...
```

## Adding New Scripts

When adding new scripts:

1. Make them executable: `chmod +x scripts/your-script.sh`
2. Add documentation here
3. Add usage examples
4. Consider error handling

## Related Documentation

- `../ARCHITECTURE.md` - Architecture guidelines
- `../MIGRATION-GUIDE.md` - How to fix violations
- `../REFACTORING-SUMMARY.md` - What was done

