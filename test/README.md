# Subway Test Suite

Comprehensive test suite for the Subway IRC client, specifically designed to validate the modernization of dependencies and APIs.

## Test Structure

```
test/
├── unit/               # Unit tests for individual components
│   ├── bcrypt.test.js  # bcrypt-nodejs → bcrypt migration
│   ├── uuid.test.js    # node-uuid → uuid migration
│   ├── express.test.js # Express 3.x → 4.x migration
│   ├── async.test.js   # async 0.2.x → 3.x migration
│   └── models.test.js  # Database model tests
├── integration/        # Integration tests
│   ├── auth.test.js           # Authentication flow
│   ├── express-routes.test.js # Express HTTP routes
│   └── socketio.test.js       # Socket.io real-time communication
└── helpers/
    └── setup.js        # Test utilities and helpers
```

## What We're Testing

### Critical Dependency Upgrades

1. **bcrypt-nodejs → bcrypt (v5.1.1)**
   - Password hashing API changes
   - Removed deprecated null parameter in hash()
   - Backward compatibility verification

2. **node-uuid → uuid (v9.0.1)**
   - UUID v1 and v4 generation
   - Session ID generation pattern (v1 + v4)
   - Validation and version detection

3. **Express 3.x → 4.x (v4.19.2)**
   - Removed `app.configure()`
   - Middleware moved to separate packages (body-parser, cookie-parser)
   - New middleware API patterns

4. **Socket.io 1.0.x → 4.x (v4.7.5)**
   - Event emission patterns
   - Connection/disconnection handling
   - Namespace support

5. **async 0.2.x → 3.x (v3.2.5)**
   - Waterfall pattern (used in subway.js)
   - Series and parallel execution
   - Error handling

### Node.js Version Compatibility

Tests verify compatibility with Node.js >=18.0.0 (upgraded from >=0.10.2)

## Running Tests

### Run all tests
```bash
npm test
```

### Run unit tests only
```bash
npm run test:unit
```

### Run integration tests only
```bash
npm run test:integration
```

### Run tests in watch mode
```bash
npm run test:watch
```

### Run specific test file
```bash
npm test -- test/unit/bcrypt.test.js
```

### Enable debug output
```bash
DEBUG_TESTS=1 npm test
```

## Test Coverage

### Unit Tests (116+ assertions)
- ✓ bcrypt password hashing and comparison
- ✓ UUID generation and validation
- ✓ Express 4.x middleware setup
- ✓ async library patterns
- ✓ Database model structure

### Integration Tests (80+ assertions)
- ✓ Complete authentication flow
- ✓ HTTP route handling (login, logout)
- ✓ Socket.io event emission
- ✓ Cookie and session management
- ✓ Request body parsing

## Test Philosophy

These tests focus on:

1. **Regression Prevention**: Ensure upgraded dependencies don't break existing functionality
2. **API Compatibility**: Verify new API signatures work correctly
3. **Security**: Validate password hashing and session management
4. **Real-world Patterns**: Test actual usage patterns from the codebase

## CI/CD Integration

Tests are designed to run in CI environments:
- No external dependencies required
- Mock IRC servers and databases
- Fast execution (< 30 seconds)
- Clear failure messages

## Troubleshooting

### Tests timing out
Increase timeout in `.mocharc.json` or use:
```bash
npm test -- --timeout 20000
```

### Socket.io connection issues
Ensure ports are available. Tests use random ports to avoid conflicts.

### bcrypt compilation errors
bcrypt requires native compilation. Ensure build tools are installed:
```bash
npm install --build-from-source
```

## Future Test Additions

Consider adding:
- End-to-end tests with real IRC servers
- Load testing for Socket.io connections
- Database migration tests
- Static asset compilation tests
- Plugin system tests
