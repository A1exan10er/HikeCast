# HikeCast Test Suite

This folder contains all test scripts for the HikeCast application. Each test focuses on different aspects of the application functionality.

## Test Files

### `verify-refactoring.js`
**Purpose**: Verification script for the modular architecture refactoring  
**What it tests**:
- All service modules import correctly
- All route modules import correctly  
- All utility modules import correctly
- Module function exports are present
- Database integration works
- Express routes are properly created
- Main application structure is correct

**Usage**: `node tests/verify-refactoring.js`

### `test_short_duration_weather.js`
**Purpose**: Tests the new short-duration weather analysis functionality  
**What it tests**:
- Short thunderstorms (1-2 hours) generate timing advice instead of prohibition
- Extended bad weather (3+ hours) still triggers hiking prohibition
- Safe hiking windows are identified and communicated
- Normal weather produces no unnecessary alerts
- Proper time formatting and message content

**Usage**: `node tests/test_short_duration_weather.js`

### `test_form_submission.js`
**Purpose**: Tests the dashboard form submission for extreme weather settings  
**What it tests**:
- User creation with extreme weather alert configuration
- Verification that custom check intervals are saved correctly
- Form validation and error handling
- Database persistence of extreme weather settings

**Usage**: `node tests/test_form_submission.js`

### `test_ui_integration.js`
**Purpose**: Comprehensive UI integration tests for extreme weather configuration  
**What it tests**:
- Complete end-to-end user workflow
- Creating users with different extreme weather settings
- Updating user preferences
- Predefined interval options
- Custom cron expression validation
- User cleanup and database consistency

**Usage**: `node tests/test_ui_integration.js`

### `test_extreme_weather_ai.js`
**Purpose**: Tests the AI-powered extreme weather detection system  
**What it tests**:
- Weather data analysis with AI
- Extreme weather condition detection
- Alert generation and formatting
- Integration with notification channels

**Usage**: `node tests/test_extreme_weather_ai.js`

### `test_configurable_extreme_weather.js`
**Purpose**: Tests the configurable extreme weather alert system  
**What it tests**:
- User-configurable alert settings
- Dynamic scheduling based on user preferences
- Cron expression validation
- Database schema for extreme weather settings

**Usage**: `node tests/test_configurable_extreme_weather.js`

### `quick_test.js`
**Purpose**: Quick verification test for extreme weather settings fix  
**What it tests**:
- Fast verification that extreme weather settings are properly saved
- Simple create/verify/cleanup workflow
- Used for debugging and quick verification

**Usage**: `node tests/quick_test.js`

## Running Tests

### Individual Tests
```bash
# Run a specific test
node tests/test_form_submission.js

# Run the quick verification test
node tests/quick_test.js
```

### All Tests
```bash
# Run all tests (if you create a test runner)
for test in tests/test_*.js; do echo "Running $test"; node "$test"; echo ""; done
```

## Test Prerequisites

1. **Server Running**: Make sure the HikeCast server is running on port 3000
   ```bash
   node index.js
   ```

2. **Dependencies**: Ensure all npm packages are installed
   ```bash
   npm install
   ```

3. **Database**: The SQLite database should be initialized with the proper schema including extreme weather columns

## Test Data

Tests create temporary users with names like:
- `TestUser_ExtremeWeather`
- `QuickTestUser`
- `FixTestUser`
- `TestUser_Predefined_X`

All test users are automatically cleaned up after test completion.

## Notes

- Tests use the axios library for HTTP requests to the API
- All tests include automatic cleanup to avoid polluting the database
- Tests verify both successful operations and error conditions
- Some tests include cron expression validation testing
