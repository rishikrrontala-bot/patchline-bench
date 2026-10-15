# Patchline Bench release verification

Built by Rishik Rontala. Verified October 14, 2026 (EDT).

Production: https://patchline-bench.vercel.app/
Repository: https://github.com/rishikrrontala-bot/patchline-bench

33 project tests and 10 offline Adaption workflow checks pass. Both ESP32 firmware modes previously compiled for the selected target; no firmware source changed in this release. The latest code fixes stale USB collection: arrival gaps exceeding ten seconds, malformed frames and backwards arrival clocks clear the partial window before fresh collection.

Production browser checks passed for local inference, explicit one-use review, injected fault hold, imported-data hold, CSV export, keyboard assembly control, and all image assets. The exported CSV was independently read back: correct unit-labelled columns and 24 complete samples. No browser errors or warnings were observed. The desktop viewport had no horizontal overflow. Credential exclusion checks covered tracked files and the nested source ZIP.

The package includes the dashboard, standalone offline HTML, model weights, synthetic training evidence, PCB draft, wiring instructions, firmware, tests, documentation and Devpost write-up. The local numerical classifier is trained; Adaption fine-tuning has not started because an exact provider quote is still unavailable. No new provider spending was needed for final verification.

This is the finished nonclinical software/bench-design release. Physical assembly, measured calibration and KiCad manufacturing checks remain unperformed. It does not diagnose infection or deliver therapy. The public/unlisted narrated demo and final Devpost entry remain separate submission requirements.

Rollback: if model loading, imports, review gating or core assets fail in production, restore the preceding verified Vercel deployment and revert the offending Git commit. No database migration or patient data is involved.
