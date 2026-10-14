# Firmware

Select **Adafruit Feather ESP32-S3 No PSRAM** in Arduino. Copy `patchline_bench.ino` and `bench_core.h` into a sketch folder named `patchline_bench`. Serial output is115200 baud,2 frames/second.

The shipped sketch defaults to labelled synthetic telemetry and no hardware actuation. For real dry-bench acquisition, set BENCH_SIMULATION0 only after reviewing wiring and address configuration: ADS1115 0x48, TMP1170x49. The modules otherwise share the same default address. External ADC inputs must stay within0–3.0V on the3.3V supply; ±4.096V gain does not permit exceeding supply rails.

pH/moisture/glucose calibration defaults unreviewed, so values stay null while raw voltages remain visible. Supply a reviewed bench-only linear calibration and valid raw/value bounds before interpreting those channels. Some sensor interfaces need nonlinear calibration or a dedicated potentiostat; this sketch does not invent that interface. Glucose is AU, not blood glycemia. Temperature is the module reading, not a validated wound measurement.

The pure acquisition/calibration/timing core is host-testable with C++17. Hardware communication and electrical behavior require the actual modules; a successful compile is not a physical test. No firmware API accepts therapeutic doses or actuator commands.

Transport now uses checked Wire register transactions directly; no Adafruit sensor libraries are required. I²C transactions have a 50 ms bus timeout, ADS conversion polling a 100 ms elapsed deadline. Failed or short reads emit missing values; each sampling tick retries, allowing a reconnected sensor to recover. Native host stubs exercise these failures but do not substitute for physical timing checks.

Verified target compilation: Arduino CLI1.5.2-rc.1, Espressif Arduino core3.3.12, `esp32:esp32:adafruit_feather_esp32s3_nopsram`. Simulation build uses389,350 flash bytes and55,896 global RAM bytes. Compile logs and hashes are recorded in proof/. No board has been flashed or electrically tested.

Run `node --test tests/hardware.test.mjs` from the project directory for native transport/calibration checks plus board geometry and reproducibility checks. The native transport fixture builds both simulation and acquisition modes, rejects a wrong TMP117 device ID, verifies signed decoding and the three ADC channel configuration words, and confirms that invalid raw input never becomes a calibrated value. Firmware and electronic bench behavior still require physical verification.
