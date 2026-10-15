# Five-minute demonstration guide

Record the working browser and your voiceover separately, then combine them. Keep the recording silent during automated testing. The saved exploded-view GIF uses actual captured browser states; it is a visual preview, not a continuous screen recording or clinical experiment.

0:00–0:35 — Problem and scope. “Patchline Bench explores how to inspect a four-channel sensing prototype before trusting its output. This is an early research build. It does not diagnose infection or deliver treatment.” Show the editorial hero and visible builder credit.

0:35–1:15 — Exploded assembly. Scroll through the six-layer concept: cover, controller, signal interface, mount, spacer and carrier. Show the actual passive PCB routing beside it. Explain external wired modules and why the address collision requires TMP117 at0x49. State that the placement diagram is conceptual and hardware remains unassembled.

1:15–2:10 — Working demo. Open the observatory. Generate steady seed81204. Inspect all four traces, review the exact synthetic window, and run a virtual rehearsal. Change to sensor_fault at the same seed; show the spike and disabled review. Import a saved JSON window; show that imported provenance stays held despite a high model likelihood.

2:10–3:15 — Build and architecture. Show simulator.js, inference.js and policy.js; injected families provide labels,24 features feed a32-unit model, and a separate policy governs review. Explain1,200/300/300 run-level splits, training-only normalization and validation-selected epoch. The local numerical model was trained from scratch. Any Adaption job fine-tunes a separate existing language model; show its actual status, never claim completion prematurely.

3:15–4:00 — Evidence and failure modes. Show training.json and confusion matrix. Say89.7% held-out synthetic accuracy and31 missed simulated faults. Show automated test results and target firmware build records. Compilation is not a hardware test. Glucose is signal AU, not blood glucose. No clinical risk score or dosing is inferred.

4:00–4:35 — Scalability. Inference runs locally on a fixed-size24-sample window with small matrices. Serial data is bounded; discontinuities reset collection, stale telemetry holds review. Adding real sensors needs reviewed calibration and appropriate interfaces. More users do not require uploading sensor readings to a central server in this version.

4:35–5:00 — Business hypothesis and next validation. A research bench toolkit could serve student or early sensor teams that need reproducible acquisition and audit trails. That is a hypothesis, not proven demand. Next milestones are physical assembly/measurement, external user interviews and appropriately governed real-data research; patient treatment is outside this deliverable.

## Finished cuts

The edited silent videos are in `artifacts/demo/`: `Patchline-Bench-2m30s-silent.mp4` and `Patchline-Bench-5m00s-silent.mp4`. They use actual app captures, original source excerpts and saved evidence cards. Use `VOICEOVER-SHORT.md` for the 2:30 cut and `VOICEOVER-FULL.md` for the 5:00 cut. Record each chapter separately and align it to the timestamp headings in your editor. Export the combined narration and video, then upload Public or Unlisted for the submission. The silent cut alone does not contain a spoken technical explanation.

The assembly portion uses eleven captured UI poses; the live workflow uses browser captures sampled at five frames per second. The final files are chapter-paced edits, encoded at 1280×720 and 30 output frames per second. `proof/demo-verification.json` records exact durations, stream decoding and the absence of audio. Raw local captures are excluded from the public repository. The local editing tools accept `FFMPEG=/path/to/ffmpeg`; rendering also requires Pillow and the macOS system fonts.
