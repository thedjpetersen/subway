# CI/CD Documentation for Subway IRC Client

This document describes the automated checks and testing infrastructure for the Subway IRC client.

## Overview

The project uses GitHub Actions for continuous integration with comprehensive checks on every pull request and push to main branches.

## GitHub Actions Workflows

### 1. Main CI Workflow (`.github/workflows/ci.yml`)

Runs on pushes and pull requests to main, master, and develop branches.

#### Jobs:

**Test Matrix** (`test`)
- **Purpose**: Run the full test suite across multiple Node.js versions
- **Node.js versions tested**: 18.x, 20.x, 22.x
- **Steps**:
  1. Checkout code
  2. Setup Node.js with caching
  3. Install dependencies with `npm ci --legacy-peer-deps`
  4. Run ESLint linter
  5. Run Mocha test suite (105 tests)
  6. Generate code coverage report
  7. Upload coverage to Codecov (Node.js 22.x only)
- **Runs**: On every push and PR
- **Fail strategy**: `fail-fast: false` (all versions run even if one fails)

**Security Audit** (`security`)
- **Purpose**: Check for security vulnerabilities in dependencies
- **Steps**:
  1. Run `npm audit --production --audit-level=moderate`
  2. Run custom audit checks
- **Runs**: On every push and PR
- **Continues on error**: Yes (informational)

**Dependency Review** (`dependency-review`)
- **Purpose**: Review new dependencies in PRs for security issues
- **Tool**: GitHub's dependency-review-action
- **Minimum severity**: Moderate
- **Runs**: On pull requests only

**Code Quality** (`code-quality`)
- **Purpose**: Enforce code quality standards
- **Checks**:
  - Code formatting validation
  - Type checking (placeholder for future TypeScript)
- **Runs**: On every push and PR

**Build Verification** (`build`)
- **Purpose**: Verify the project builds and all files are valid
- **Checks**:
  1. Node.js and npm version verification
  2. package.json syntax validation
  3. All JavaScript files compile without syntax errors
- **Runs**: On every push and PR

**Compatibility Check** (`compatibility`)
- **Purpose**: Ensure backward compatibility is maintained
- **Tests**:
  - All integration tests
  - Critical dependency loading verification (express, socket.io, bcrypt, uuid, async)
- **Runs**: On every push and PR

### 2. Pull Request Checks (`.github/workflows/pr-checks.yml`)

Additional validation specifically for pull requests.

#### Jobs:

**PR Validation** (`pr-validation`)
- **Checks**:
  1. Semantic PR title validation
  2. Breaking changes detection
  3. Regression test suite
  4. Backward compatibility validation
  5. Test coverage analysis
- **Artifacts**: Test results and coverage reports

**Dependency Change Analysis** (`dependency-changes`)
- **Purpose**: Analyze and document dependency modifications
- **Output**:
  - Lists added dependencies
  - Lists removed dependencies
  - Provides security recommendations

**API Compatibility Check** (`api-compatibility`)
- **Purpose**: Detect breaking changes in public APIs
- **Scans**:
  - lib/ directory changes
  - subway.js modifications
  - module.exports changes
  - Removed exports detection

**Sanity Checks** (`sanity-checks`)
- **Checks**:
  1. package.json integrity (required fields, version format)
  2. Node.js version requirement validation
  3. TODO/FIXME comment tracking
  4. console.log detection in library code
  5. Test structure validation

## NPM Scripts

### Test Scripts

```bash
npm test                # Run all tests
npm run test:unit       # Run unit tests only
npm run test:integration # Run integration tests only
npm run test:watch      # Run tests in watch mode
npm run test:coverage   # Run tests with coverage report
```

### Linting Scripts

```bash
npm run lint            # Run ESLint on all JavaScript files
npm run lint:fix        # Run ESLint and auto-fix issues
```

### CI/Validation Scripts

```bash
npm run ci              # Run full CI pipeline locally (lint + coverage + audit)
npm run validate        # Quick validation (lint + test)
npm run audit:check     # Check for dependency vulnerabilities
```

## Code Coverage

**Tool**: NYC (Istanbul)

**Configuration**: `.nycrc.json`

**Thresholds**:
- Lines: 60% (target: 80%)
- Statements: 60% (target: 80%)
- Functions: 50% (target: 75%)
- Branches: 50% (target: 75%)

**Coverage includes**:
- `lib/**/*.js`
- `subway.js`

**Coverage excludes**:
- `node_modules/**`
- `test/**`
- `tmp/**`
- `bower_components/**`

**Reports generated**:
- HTML report: `coverage/index.html`
- LCOV format: `coverage/lcov.info`
- Text summary: Console output

## ESLint Configuration

**Configuration**: `.eslintrc.json`

**Base rules**: `eslint:recommended`

**Key rules**:
- `no-console`: off (allowed in Node.js)
- `no-unused-vars`: warn (with ignore patterns for `_` prefix)
- `no-undef`: error
- `semi`: warn (enforce semicolons)

**File-specific overrides**:

1. **Test files** (`test/**/*.js`):
   - Mocha environment enabled
   - `expect` global defined
   - Unused expressions allowed (for Chai assertions)

2. **Browser code** (`src/js/**/*.js`):
   - Browser and jQuery environments
   - Globals: `app`, `util`, `_`, `$`, `React`, `Backbone`, `moment`

3. **Settings files** (`settings/**/*.js`):
   - `settings` global allowed

## Test Suite Details

**Framework**: Mocha + Chai

**Total tests**: 105 passing

### Unit Tests (65 tests)

- **bcrypt integration** (9 tests): Password hashing, salt generation, backward compatibility
- **UUID integration** (13 tests): v1/v4 generation, validation, session ID pattern
- **Express 4.x** (15 tests): Middleware setup, routing, backward compatibility
- **Async library** (10 tests): Waterfall, series, parallel execution
- **Database models** (12 tests): UUID generation, field structures, JSON serialization
- **Other dependencies** (6 tests)

### Integration Tests (40 tests)

- **Authentication flow** (13 tests): Registration, login/logout, password security
- **Express routes** (15 tests): Body/cookie parsing, route handling, error handling
- **Socket.io** (12 tests): Connections, events, IRC patterns, namespaces

## Pre-commit Recommendations

While not enforced, consider running locally before committing:

```bash
npm run validate        # Runs lint + tests
npm run test:coverage   # Check coverage impact
```

## Debugging CI Failures

### Tests fail locally but pass in CI

1. Check Node.js version: `node -v`
2. Clean install: `rm -rf node_modules package-lock.json && npm install --legacy-peer-deps`
3. Clear cache: `npm cache clean --force`

### Linting errors

1. Auto-fix: `npm run lint:fix`
2. Check ignored files in `.eslintrc.json`
3. Review error messages for actual issues vs. style preferences

### Coverage too low

Coverage is informational. The test suite focuses on dependency validation, not application code coverage.

### Dependency audit failures

1. Check severity: Moderate+ will warn but not fail
2. Review `npm audit` output
3. Consider: `npm audit fix` (test thoroughly after)

## Adding New Checks

### Add a new workflow job

1. Edit `.github/workflows/ci.yml` or `.github/workflows/pr-checks.yml`
2. Add new job under `jobs:`
3. Test with a draft PR
4. Document the check in this file

### Add a new npm script

1. Edit `package.json` scripts section
2. Update this documentation
3. Add to relevant workflow if needed

## Resources

- [Mocha Documentation](https://mochajs.org/)
- [Chai Assertions](https://www.chaijs.com/)
- [ESLint Rules](https://eslint.org/docs/rules/)
- [GitHub Actions](https://docs.github.com/en/actions)
- [NYC Coverage](https://github.com/istanbuljs/nyc)

## Support

For CI/CD issues:
1. Check GitHub Actions logs
2. Review this documentation
3. Run tests locally with `DEBUG_TESTS=1 npm test`
4. Open an issue with:
   - CI logs
   - Local test output
   - Node.js version
   - npm version
