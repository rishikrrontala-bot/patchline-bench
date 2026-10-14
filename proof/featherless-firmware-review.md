# Firmware Review - Concrete Fixes

## Critical Issues Found

### 1. I2C Address Collision Risk
**Issue**: The code defines `ADC_ADDRESS=0x48` and `TEMP_ADDRESS=0x49`, but the comment states "TMP117 MUST be configured to 0x49; ADS1115 retains 0x48. Default addresses collide." This is contradictory - if TMP117 is configured to 0x49 and ADS1115 to 0x48, they don't collide.

**Fix**: Clarify the comment and ensure proper address configuration:
- ADS1115 default: 0x48 (ADDR pin to GND)
- TMP117 default: 0x49 (ADDR pin to VCC)
- Update comment to reflect correct non-colliding configuration

### 2. I2C Failure Recovery Missing
**Issue**: No bounded retry logic or failure recovery for I2C communication. The `adc_ok` and `temp_ok` flags are only set once during setup with no reinitialization attempts.

**Fix**: Implement bounded retry logic with exponential backoff:
```cpp
bool initialize_i2c_device(TwoWire& wire, uint8_t address, int max_retries = 3) {
  for (int attempt = 0; attempt < max_retries; attempt++) {
    wire.beginTransmission(address);
    if (wire.endTransmission() == 0) return true;
    delay(10 * (1 << attempt)); // Exponential backoff
  }
  return false;
}
```

### 3. Invalid Reading Detection Incomplete
**Issue**: Temperature validation only checks range -40°C to 100°C, but TMP117 datasheet specifies -40°C to +125°C. Also missing validation for NaN/INF values from `adc.computeVolts()`.

**Fix**:
- Update temperature range to -40°C to +125°C
- Add validation for ADC voltage readings before conversion
- Add timeout for I2C reads

### 4. Calibration Structure Issues
**Issue**: Calibration constants are defined with `reviewed=false`, making all readings return `Status::uncalibrated`. The `convert()` function has redundant bounds checks.

**Fix**:
- Set `reviewed=true` for calibration constants after actual calibration
- Simplify bounds checking in `convert()` function
- Add calibration validation function

### 5. Build Compatibility Issues
**Issue**: `#pragma once` in implementation file (should be in header). Missing include guards in `bench_core.h`. Potential Arduino version compatibility issues with `std::snprintf`.

**Fix**:
- Move `#pragma once` to header file
- Add proper include guards
- Use Arduino-compatible formatting for portability

### 6. Timing and Rollover Issues
**Issue**: `elapsed_ms` uses `uint64_t` but calculation uses `uint32_t` difference, which may overflow incorrectly. No protection against millis() rollover.

**Fix**: Use proper rollover-safe timing:
```cpp
inline bool elapsed(uint32_t now, uint32_t then, uint32_t interval) {
  return (now - then) >= interval;
}

// In loop():
elapsed_ms += (now - last_tick); // This handles rollover correctly
```

### 7. I2C Timeout Configuration
**Issue**: `Wire.setTimeOut(50)` sets timeout to 50ms, which may be too short for some I2C operations, especially with multiple devices.

**Fix**: Increase timeout to 250ms or make it configurable based on expected operation time.

### 8. Missing Error Reporting
**Issue**: No detailed error codes or reasons for I2C failures, making debugging difficult.

**Fix**: Add error enumeration and reporting:
```cpp
enum class I2CError { none, timeout, nack, bus_busy, arbitration_lost };
I2CError last_i2c_error;
```

### 9. Simulation Mode Hardcoded
**Issue**: `BENCH_SIMULATION` macro controls everything, making partial simulation (e.g., only temperature simulated) impossible.

**Fix**: Use individual simulation flags per sensor type for more flexible testing.

### 10. Buffer Size Risks
**Issue**: Fixed-size char arrays (32 bytes) for number formatting with `%.8g` format could overflow with extreme values.

**Fix**: Increase buffer size or use safer formatting:
```cpp
inline void number(char* out, size_t length, double value) {
  if (std::isfinite(value)) {
    snprintf(out, length, "%.6f", value); // More controlled format
  } else {
    strncpy(out, "null", length - 1);
    out[length - 1] = '\0';
  }
}
```

## Recommended Implementation Order
1. Fix I2C address configuration and comments
2. Implement bounded retry logic for I2C initialization
3. Add proper timing with rollover protection
4. Fix calibration constants and validation
5. Add comprehensive error reporting
6. Test with both simulation and hardware modes

## Safety Notes
- All fixes maintain the "sensing-only" requirement
- No therapeutic or actuation code added
- Focus remains on reliable data acquisition and validation
- Hardware abstraction preserved for future implementation