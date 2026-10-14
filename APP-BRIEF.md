# Patchline Bench

Built by Rishik Rontala. Nonclinical sensor and software research prototype, separate from the existing Patchline submissions.

## Authorized build

A modular bench sensing interface, firmware, reproducible synthetic data, a model trained from scratch on simulated signal families, and a dashboard. Optional Featherless synthetic-data reviewer and Adaption fine-tuning experiment. Featherless cumulative cap: $10 shared with previous work. Adaption cap: 100 existing credits for this build; estimate before launch, no purchases or new subscription.

## Scope boundary

No autonomous wound treatment, clinical infection probability, prescribed dose, UV/ultrasound power drivers, or patient-contact use. Treatment is an inert software rehearsal requiring manual review; no hardware command channel exists. Clinical validation and engineered patient safety cannot be replaced by generated training data. Model families describe injected simulation behavior only.

## Bench architecture

ESP32-S3 Feather + ADS1115 module + TMP117 module. A passive sensor hub carries 3.3V I2C and three conditioned low-voltage signals. Raw pH and glucose electrodes cannot connect directly; electrical front ends and calibration are separate unknowns. Glucose defaults to arbitrary units; wound-fluid glucose is not blood glycemia. Firmware reports raw measurements and calibration validity. Missing/uncalibrated readings stay missing.

Browser dashboard imports bounded telemetry, charts pH/temperature/moisture/glucose-AU, runs the exported model locally, shows provenance and quality flags, and records a manually approved virtual rehearsal. No patient data are accepted by the optional cloud reviewer.

## Decisive proof

Seeded synthetic window → firmware-compatible telemetry → quality gate and model → transparent pattern probabilities → manual review → virtual rehearsal log. Invalid/stale/uncalibrated data hold the rehearsal. Attempts to send a dose or actuator command are refused.

## Remaining physical evidence

No hardware has been purchased or measured. Board files are bench prototype design artifacts; fabrication/assembly review, electrical checks, sensor-specific interfaces and calibration remain distinct from software verification.
