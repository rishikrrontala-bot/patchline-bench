# Synthetic signal model v1

Purpose: distinguish injected steady, coordinated-shift and sensor-fault simulator families. Not an infection detector or medical triage tool. No dose or treatment output.

Implementation: NumPy, 24 standardized features (mean, population standard deviation, elapsed-time slope, end-to-start difference, range, missing fraction per channel),32 tanh hidden units,3 softmax outputs. Weight seed81204; training-only normalization;600 candidate epochs; validation loss chooses epoch590. No family, run ID, seed, provenance, or generation parameters enter the features.

Data:1,800 independent simulated windows of24 samples. Train1,200 / validation300 / test300;400/100/100 per family. Run IDs are avalanche-mixed before the simulator PRNG to reduce neighboring-seed baseline correlations. No rows from the same run cross partitions. Physiology and treatment response are not modeled.

Held-out results: accuracy89.67%, macro F1 89.41%. Confusion rows/columns steady,shift,sensor_fault: `[[100,0,0],[0,100,0],[31,0,69]]`. Missed fault cases are a material failure mode. The report exposes this; no further feature/epoch tuning was performed against those test labels. Numeric parity checks cover examples from all three families against a separate NumPy forward computation.

Assumptions:24-sample windows on the simulator's elapsed-time scale, bounded input features. Counts outside24 or standardized feature magnitudes above10 cause abstention. The magnitude guard is heuristic, not a validated distribution detector. Softmax values are uncalibrated synthetic-family likelihoods; the UI must never call them infection probability.

Separate policy: imported/bench provenance, missing readings, four equal readings, estimated sensor_fault, or synthetic likelihood under80% produce hold. Passing a gate permits manual review, not autonomous therapy. Manual approval is cleared when data changes, errors occur, USB disconnects, or valid telemetry goes stale. Virtual rehearsal only records an inert software event.

What would be needed for any clinical claim: appropriately governed real data and reference labels, representative external evaluation, validated sensor calibration, uncertainty assessment, domain-expert review, and an applicable regulatory pathway. This repository contains none of that evidence.
