# GitHub Actions Setup Instructions

The GitHub Actions workflow files are ready but need to be added manually due to repository security restrictions.

## Quick Setup

The workflow files are located in `.github/workflows/` on your branch:
- `ci.yml` - Main CI pipeline
- `pr-checks.yml` - Pull request validation

### Option 1: Add via GitHub Web Interface (Recommended)

1. Go to your repository on GitHub
2. Navigate to the branch: `claude/modernize-dependencies-014Do9e5t4uMcCyWtNqJehLr`
3. Click "Add file" → "Create new file"
4. Name: `.github/workflows/ci.yml`
5. Copy the contents from the local file `.github/workflows/ci.yml`
6. Commit directly to the branch
7. Repeat for `pr-checks.yml`

### Option 2: Add via Pull Request

1. Create a new branch from `claude/modernize-dependencies-014Do9e5t4uMcCyWtNqJehLr`
2. Add the workflow files
3. Create a pull request
4. Merge after review

### Option 3: Local Manual Add

If you have write access to push workflows:

```bash
# Add the workflow files
git add .github/workflows/

# Commit
git commit -m "Add GitHub Actions workflows for CI/CD"

# Push (requires workflows permission)
git push
```

## Workflow Files Overview

### ci.yml - Main CI Pipeline

**Triggers**: Push and PR to main/master/develop branches

**Jobs**:
1. **test** - Multi-version Node.js testing (18.x, 20.x, 22.x)
   - Install dependencies
   - Run linter
   - Run test suite (105 tests)
   - Generate coverage
   - Upload to Codecov

2. **security** - Security audit
   - npm audit for vulnerabilities
   - Custom security checks

3. **dependency-review** - Dependency analysis (PRs only)
   - Reviews new dependencies
   - Checks for vulnerabilities

4. **code-quality** - Code quality checks
   - Format validation
   - Type checking

5. **build** - Build verification
   - Verify Node.js/npm versions
   - Validate package.json
   - Check all JS files compile

6. **compatibility** - Backward compatibility
   - Run integration tests
   - Verify critical dependencies load

### pr-checks.yml - PR Validation

**Triggers**: Pull requests (opened, synchronized, reopened)

**Jobs**:
1. **pr-validation** - Core PR validation
   - Semantic PR title check
   - Breaking change detection
   - Regression tests
   - Backward compatibility
   - Coverage analysis

2. **dependency-changes** - Dependency tracking
   - Analyzes dependency modifications
   - Lists additions/removals
   - Security recommendations

3. **api-compatibility** - API change detection
   - Scans lib/ and subway.js
   - Detects removed exports
   - Breaking change warnings

4. **sanity-checks** - General sanity
   - package.json integrity
   - Node.js version validation
   - TODO/FIXME tracking
   - console.log detection
   - Test structure validation

## Verification

After adding the workflows:

1. Check the "Actions" tab in your repository
2. You should see the workflows listed
3. On the next push/PR, they will run automatically

## Testing the Workflows

### Test the main CI workflow:

Push any change to the branch:
```bash
git commit --allow-empty -m "Test CI workflow"
git push
```

Then check: Repository → Actions → CI

### Test the PR checks:

Create a pull request from your branch to main/master.
The pr-checks workflow will run automatically.

## Troubleshooting

### Workflows don't appear

- Check that files are in `.github/workflows/` directory
- Verify the YAML syntax is valid
- Ensure you have Actions enabled in repository settings

### Workflows fail

- Check the error logs in the Actions tab
- Common issues:
  - `npm ci` fails: Try `npm install --legacy-peer-deps`
  - Tests timeout: Increase timeout in workflow
  - Linting errors: Run `npm run lint` locally first

### Permission errors

- Ensure repository has Actions enabled
- Check branch protection rules
- Verify you have write access

## Integration with Codecov (Optional)

For coverage reporting:

1. Sign up at https://codecov.io
2. Add your repository
3. Add `CODECOV_TOKEN` to repository secrets
4. The ci.yml workflow will automatically upload coverage

## Local Testing

Before pushing, test locally:

```bash
# Run the same checks that CI will run
npm run ci

# Or individually:
npm run lint
npm test
npm run test:coverage
npm run audit:check
```

## Next Steps

Once workflows are added:

1. ✓ Every push will be tested
2. ✓ Every PR will be validated
3. ✓ Coverage reports will be generated
4. ✓ Dependencies will be audited
5. ✓ Breaking changes will be detected

## Questions?

See `CI_DOCUMENTATION.md` for complete documentation.
