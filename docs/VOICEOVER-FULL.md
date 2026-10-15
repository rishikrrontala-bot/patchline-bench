# Patchline Bench — 5:00 voiceover

Read only the paragraphs under each timestamp. Headings, timing labels, and this guide are not spoken. Match each section to the corresponding video chapter. Speak naturally and leave a brief pause after key actions; the chapter boundaries provide the timing, rather than an exact words-per-minute guarantee. Record your voice separately in a quiet room, then align it with the silent demo.

## 0:00–0:35 — Problem and introduction

I'm Rishik Rontala, and I built Patchline Bench. I started with a smart-bandage idea for monitoring diabetic wounds. But before asking whether a patch could guide care, I had to answer a more basic question: can I inspect the sensing pipeline and see when its output should not be trusted?

This prototype brings the board design, firmware, simulated signals, trained model, and dashboard into one research workbench. It does not diagnose infection or deliver treatment.

## 0:35–1:15 — Exploded assembly and board

Here, the six concept layers separate, revealing the carrier, spacer, mount, signal interface, controller, and cover. The numbered labels connect the visual model to each part. The green board beside it shows the actual passive hub routing.

The bench design uses an ESP32-S3 Feather, an ADS1115 analog converter, and a TMP117 temperature module. Their default addresses collide, so the wiring moves the temperature module to a different address. These are inspectable design files. I haven't assembled or physically tested the hardware yet.

## 1:15–2:25 — Working demonstration

Now I'll open the observatory and generate a steady synthetic window with a fixed seed. That makes the example reproducible. Here are the four traces: pH, temperature, wetness, and glucose signal. The glucose channel uses arbitrary units; it isn't a blood-glucose measurement.

The classifier identifies the injected signal family, and a separate policy checks whether the window is eligible for review. I still have to approve this exact synthetic window before running a virtual rehearsal. Clicking it records an inert software event. It cannot activate hardware.

Now I'll switch to a sensor-fault pattern. Approval disappears, the status changes to hold, and rehearsal is blocked. Missing readings, held signals, and low confidence can also trigger a hold.

Imported files and bench telemetry remain held regardless of model output. If USB readings pause or a frame is malformed, old readings are discarded and collection needs twenty-four fresh samples.

## 2:25–3:20 — Code, firmware, and trained model

The architecture separates simulation, numerical inference, and review policy. That matters because a model prediction shouldn't silently become permission to act.

I trained the local classifier from scratch with NumPy. Each window becomes twenty-four features: six statistics for each of four channels. Those feed thirty-two hidden units and three output classes.

There are eighteen hundred independent simulated windows, split into twelve hundred training, three hundred validation, and three hundred held-out test runs. Normalization uses training data only. Validation loss selects the saved epoch. Browser JavaScript then loads the exported weights for local inference.

The firmware checks bus transactions and conversion timeouts. Uncalibrated channels report null instead of invented measurements. Both firmware modes compile for the selected controller.

## 3:20–3:55 — Evidence and failure modes

On the held-out synthetic set, accuracy is eighty-nine point seven percent. The confusion matrix also shows a serious limitation: thirty-one injected sensor faults were classified as steady. I publish that failure instead of turning the score into a medical claim.

The release passes thirty-three project tests and ten offline Adaption workflow checks. Those cover data handling, inference agreement, review resets, telemetry, motion, and failure recovery. Compilation and software tests do not establish physical performance or clinical safety.

## 3:55–4:40 — Business hypothesis and scalability

My initial users would be student engineering teams and sensor researchers who need reproducible acquisition and experiment records.

My proposed business model keeps the core simulator free. A future twenty-nine-dollar monthly team plan could add shared experiment histories, calibration records, and report exports. Those paid features aren't built yet, and I haven't validated demand or pricing. Twenty paying teams would mean five hundred eighty dollars monthly before costs; that's an illustration, not current revenue.

The app processes small, fixed-size windows locally. More users can run it without uploading readings to a central inference service. Any future collaboration service would need separate storage, authentication, and privacy design.

## 4:40–5:00 — Next steps and close

My next milestones are physical assembly, electrical measurements, reviewed calibration, and interviews with target users. Any clinical research would require a separate validation effort.

Patchline Bench gives me a foundation I can inspect, reproduce, and challenge. Explore the live app, source, model evidence, and limitations.

## Recording notes — not spoken

Keep “synthetic” audible when discussing results. Pronounce NumPy as “num-pie.” ESP32-S3 can be read “E S P thirty-two S three”; ADC and I²C may be expanded if needed. Do not read timestamps, file names, or captions aloud.

Spoken word count: **648** (whitespace count). Section counts: 75, 82, 146, 117, 77, 106, 45. Numerals and abbreviations expand in speech; rehearse once and use the available pauses.
