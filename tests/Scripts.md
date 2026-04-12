# Test Scripts

This file is the single place for test commands.  
Add new tests using the same naming pattern so we can bolt new suites on quickly.

## NPM scripts

- `npm run test:run` - run all Vitest tests
- `npm run test:app` - run all app tests
- `npm run test:agency-portal` - run all agency portal tests
- `npm run test:admin` - run all admin tests

## Bolt-on pattern for new live tests

1. Add a file in `tests/<area>/` named `<feature>.live.test.ts`
2. Keep each live file focused on one real flow
3. Add an npm script only when needed for repeated local use
