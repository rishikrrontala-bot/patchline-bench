# Patchline Bench — 2:30 voiceover

Read only the paragraphs under each timestamp. Headings, timing labels, and this guide are not spoken. Match each section to the corresponding video chapter. Speak naturally and leave a brief pause after key actions; the chapter boundaries provide the timing, rather than an exact words-per-minute guarantee. Record your voice separately in a quiet room, then align it with the silent demo.

## 0:00–0:15 — Problem and introduction

I'm Rishik, and this is Patchline Bench. My smart-bandage idea started with wound monitoring. Before trusting a patch, I needed a way to inspect its signals and test when the software should refuse to proceed.

## 0:15–0:35 — Exploded assembly

The six concept layers close into one patch, from the carrier to the cover. The inspection link opens the actual passive sensing-board routing. The design uses an ESP32-S3, an analog converter, and a temperature module. These are design files; I haven't assembled or physically tested this hardware yet.

## 0:35–1:15 — Working application

Here, I generate a reproducible synthetic window and inspect four channels: pH, temperature, wetness, and glucose signal. Glucose is in arbitrary units, not blood glucose.

The model identifies the injected pattern, but that alone doesn't enable a rehearsal. I review this exact window first. Now the virtual rehearsal records an inert software event.

Switching to a sensor fault clears that approval and puts the system on hold. Imported and bench readings also stay held. There is no treatment command channel.

## 1:15–1:40 — Architecture and model

The simulator, model inference, and review policy are separate modules. I trained the numerical model from scratch with NumPy: twenty-four features, thirty-two hidden units, and three outputs. Training, validation, and test sets contain independent runs. The exported weights run directly in the browser, without sending readings to an inference server.

## 1:40–1:55 — Evidence and limits

Held-out synthetic accuracy is eighty-nine point seven percent. But it missed thirty-one simulated faults, which I publish openly. This is signal-pattern research. It does not detect infection, prescribe doses, or deliver therapy.

## 1:55–2:20 — Business and scaling

My first users would be student engineering teams and early sensor researchers. The business hypothesis is a free core with a future twenty-nine-dollar monthly team plan for shared experiment records and reports. Demand and pricing aren't validated yet. Local inference keeps computation small, while bounded inputs and stale-data checks control the data flow.

## 2:20–2:30 — Close

Next come physical measurements and user interviews. Patchline Bench makes failures inspectable. Try the app and explore the source today.

## Recording notes — not spoken

Keep “synthetic” audible when discussing results. Pronounce NumPy as “num-pie.” ESP32-S3 can be read “E S P thirty-two S three”; ADC and I²C may be expanded if needed. Do not read timestamps, file names, or captions aloud.

Spoken word count: **318** (whitespace count). Section counts: 35, 48, 80, 50, 32, 53, 20. Numerals and abbreviations expand in speech; rehearse once and use the available pauses.
