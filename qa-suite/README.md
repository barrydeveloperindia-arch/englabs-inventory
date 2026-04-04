# ENGLABS INVENTORY - QA Suite

This suite contains comprehensive automated tests for the Command OS ecosystem.

## Structure
- `ui-tests/`: Cypress E2E tests for the web dashboard.
- `api-tests/`: API validation (Postman collections/scripts).
- `load-tests/`: Performance benchmarks using k6.
- `config/`: Environment-specific settings.

## Running Tests

### UI Tests
```bash
npx cypress run --project ./qa-suite
```

### Load Tests
```bash
k6 run qa-suite/load-tests/dashboard-load.js
```
