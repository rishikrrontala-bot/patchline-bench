# Verification record

Completed:34 Node tests; deterministic simulator validation across300 generated windows; analytic linear slope/time-translation tests; null/nonfinite/getter/schema rejection; disjoint1,800 run seeds; training-only scaler means; NumPy/JS inference parity from all3 families; manual review reset/one-use policy; serial discontinuity/status validation, malformed-frame reset, and a monotonic arrival timeout that requires 24 fresh frames after a gap exceeding 10 seconds. C++17 native calibration core and transport tests cover signed conversion, NACK, short read, stuck conversion, timing, invalid/raw values, and both telemetry modes.

Browser checks completed using the actual dashboard: initial local model load; review→virtual event; injected spike→fault hold with disabled approval; imported JSON→hold despite high shift likelihood. A screenshot is saved under proof/dashboard.jpg. Browser USB permission and real serial reception have not been exercised because no device exists.

PCB draft:25 pads,31 track segments,7 nets; layer-aware connectivity through plated pads; centerline foreign-net crossing checks; reproducible generation. These do not replace clearance/DRC/ERC or an engineering wiring review.

Target compilation: simulation firmware successfully compiled with official Arduino CLI and Espressif core for Feather ESP32-S3 No PSRAM. Bench-mode target compilation is tracked separately in proof/firmware-build.json. No flash, hardware assembly, patient test, clinical outcome, or therapeutic experiment has been performed.

Adaption:1,000 locally verified prompt/completion rows uploaded as an original dataset. Website training selector excludes original raw data. Authenticated raw API ingestion completed, preserving all1,000 instruction pairs. Exact training cost quotation remains pending because the Mac locked before UI confirmation. Training has not launched. No training completion claim is made.

Telemetry recovery regression: a 23-frame partial window followed by a 10,001 ms arrival gap no longer combines old and new samples. Malformed frames and backwards arrival clocks also clear collection. These are deterministic software checks; real USB reception still requires a physical device.
