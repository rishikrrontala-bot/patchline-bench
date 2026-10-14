# Patchline Bench

## One-line summary
An open-source workbench for smart-bandage research: inspect a sensing board, simulate four signal channels, and test a local AI model before trusting its output.

## Inspiration
I started with a smart-bandage idea: could a patch monitor signals around a diabetic wound and eventually help guide care? Building that responsibly starts with a smaller question: what do the sensors actually measure, and when should the system refuse to act?

Patchline Bench is my working first step. It brings the board design, firmware, reproducible simulation, machine-learning model and dashboard into one inspectable prototype. It is a nonclinical research tool. It does not diagnose infection or deliver treatment.

## What it does
The website opens with an exploded anatomy view inspired by the layered assembly reference I supplied. Scrolling separates six concept layers, numbered leader lines explain the parts, and a separate green PCB view shows the actual passive sensing hub routing. Cover, mount and carrier shapes are explicitly labelled design concepts.

The observatory generates reproducible pH, temperature, wetness and glucose-signal windows in three injected families: steady, coordinated shift and sensor fault. A model trained from scratch runs locally in the browser. The dashboard displays its synthetic-family likelihoods alongside the actual traces, provenance and independent quality checks.

Missing readings, held signals, low model confidence, estimated sensor faults, imported data and bench data produce a hold. An eligible synthetic window still requires manual review. Changing the window revokes approval. A virtual rehearsal records an inert software event; it cannot send a therapeutic dose or hardware command.

Users can export CSV, import bounded window JSON locally and explicitly select a USB serial port in a compatible browser. The firmware reports raw voltages and calibration status. Uncalibrated channels stay null instead of being presented as measured values. Glucose signal is arbitrary units, not blood glucose.

## How I built it
The sensing design uses an ESP32-S3 Feather, an ADS1115 ADC and a TMP117 temperature module around a passive 65 × 40 mm hub. The hub has seven connectors, 25 pads and two copper layers. The modules otherwise share the same default I²C address; the wiring requires changing TMP117 to 0x49 while ADS1115 stays at 0x48.

Firmware uses checked I²C register transactions, bus timeouts and bounded ADC conversion polling. The acquisition path has no treatment output circuitry or actuator command channel. Raw pH and glucose electrodes need suitable conditioning interfaces and reviewed calibration; they cannot connect directly to this board.

For the software model, I generated 1,800 independent simulated windows: 1,200 training, 300 validation and 300 held-out test runs. The feature vector has six statistics per channel, giving 24 inputs. A 32-unit tanh hidden layer feeds three softmax outputs. I implemented training with NumPy, fitted normalization on training data only and selected the epoch using validation loss. The exported weights run in dependency-free browser JavaScript.

The app uses HTML, CSS, JavaScript, SVG and CSS 3D transforms. It supports keyboard operation and a static reduced-motion assembly view. Sensor-window inference and imported files stay in the browser; the deployed app does not need an inference API key.

## How I used AI and Codex
Featherless GLM 5.2 supplied an initial simulator implementation. I reviewed, corrected and tested the code instead of treating generated output as ground truth. Featherless DeepSeek V3.2 reviewed the first firmware version; its useful failure-recovery finding was implemented, while incorrect claims were documented and rejected.

Codex helped build and integrate the app, dataset pipeline, firmware, board-generation tooling and verification. Separate agents worked on UI motion, hardware/firmware verification and the Adaption workflow, with distinct file ownership.

I also uploaded 1,000 verified instruction pairs to Adaption for a separate nonclinical evidence-summarizer experiment. Its processed export matches all original pairs. That language-model fine-tuning job has not started: an exact provider quote must fit the agreed credit cap before launch. The local numerical classifier is already trained; the two models are separate.

## Technical evidence
The held-out synthetic model accuracy is **89.7%**, with **89.4% macro F1**. The confusion matrix is published. It correctly identified all 100 steady and all 100 coordinated-shift test windows, but classified 31 of 100 injected sensor faults as steady. This is a material limitation, not a clinical accuracy claim.

**30 automated project tests** cover deterministic generation, malformed inputs, missing data, analytic feature calculations, independent run seeds, training-only normalization, Python/JavaScript inference agreement, review-state resets, telemetry discontinuities, scroll controls and firmware transport failures.

**10 additional offline Adaption workflow checks** cover credential redaction, redirects, exact training configuration, credit caps, stale quotes and duplicate-job prevention. They make no paid provider requests.

Both simulation and bench firmware modes compile for the selected ESP32-S3 target. The board generator checks layer-aware connectivity and conservative copper geometry, with a measured geometric gap of 0.74 mm against its 0.25 mm threshold. These custom checks do not replace KiCad DRC or physical electrical tests.

## Business and financial sustainability
The initial target users are student engineering teams and early sensor researchers who need a reproducible path from simulated signals to inspectable bench telemetry. The immediate product is a research workbench, not a medical device sold to patients.

My proposed model keeps the public simulator and reference files free. A future team plan could charge for saved experiment histories, shared calibration records and reproducible report exports, with paid onboarding for compatible bench setups. Those commercial features and pricing are not implemented or validated yet.

As an illustrative pilot hypothesis, a $29 monthly team plan serving 20 paying teams would produce $580 monthly revenue before costs. Browser inference reduces server-side inference costs, but support time, development, payment fees and any cloud training still need to be measured. The next commercial checkpoint is interviews with target users followed by a small paid pilot measuring repeated use, willingness to pay and support cost. There are no claimed customers, sales or purchase commitments today.

## Scalability
The browser processes fixed 24-sample model windows using small matrices. Serial buffers and imported files are bounded; discontinuities restart collection, and stale data revoke review. More users can run the static app without sending their readings to a central model server.

A future shared-experiment service would require authentication, storage limits and an explicit privacy design. It is not part of the current prototype, and I do not claim that the present app handles clinical workloads or patient records.

## Challenges I ran into
The largest challenge was separating a convincing prototype from an unsupported medical claim. Synthetic labels can test software behavior, but they cannot establish infection detection or safe treatment.

Other challenges included the I²C address collision, conversion calls that could wait after a sensor disconnected, a certificate-path assumption caught by Linux CI, and an Adaption upload configuration that silently ignored incorrectly nested raw-processing options. Each fix has saved evidence or regression checks.

The animation also required a second design pass: the first version did not match my supplied reference. I rebuilt it around a vertical stack of pale enclosure layers, thin electronics, labelled leaders and a separate board view.

## Accomplishments I am proud of
The result connects several parts of the build into one working demonstration: board artifacts, compiled sensing firmware, a reproducible simulation pipeline, a model trained from scratch, browser inference, quality checks and a review flow that visibly refuses unsafe assumptions.

I also published the model's failures and kept them visible in the dashboard. That makes the prototype easier to inspect and gives the next iteration a concrete starting point.

## What I learned
A high model score matters less if nobody can explain its labels, data split or failure modes. I learned to make those visible, keep calibration status separate from a numerical reading and verify generated code with independent calculations and real build tools.

## What's next
Assemble the dry-bench prototype, run KiCad DRC, measure rail and ADC behavior against references, and validate sensor-specific conditioning and calibration. Test the workbench with real target users. If the Adaption quote fits the cap, fine-tune and evaluate the separate summarizer against held-out structured-output cases.

Any future clinical research or therapeutic device would be a separate effort requiring appropriate expertise, governed real data, external validation and a regulatory pathway. This submission makes no infection-detection or autonomous-treatment claim.

## Built with
JavaScript, HTML, CSS, SVG, Python, NumPy, C++, Arduino, ESP32-S3, ADS1115, TMP117, Featherless AI, GitHub, Vercel. Adaption is used for verified raw dataset preparation; language-model fine-tuning remains pending.

## Repository
https://github.com/rishikrrontala-bot/patchline-bench

## Public demo
Deployment verification is in progress. Add the verified public URL before posting.

## Demo video
A public or unlisted five-minute working demo with voiceover is still required for Next Founders. The saved GIF is a preview of actual browser states, not a continuous demo video. Use docs/DEMO-SCRIPT.md for the recording sequence.

## Screenshot selection
1. Exploded six-layer concept with the separate actual PCB view.
2. Four-channel signal traces and visible provenance.
3. Sensor-fault hold with review disabled.
4. Manual review followed by a virtual rehearsal event.
5. Published model confusion matrix and firmware build evidence.

## Team
Rishik Rontala — solo builder, product, software, firmware and design.

## Draft readiness
This is a local Devpost-ready write-up, not a posted or entered project. Confirm event rules for prior work, add the verified demo link and upload the five-minute video before final entry. No live URL, customer result, hardware measurement or cloud-training success is assumed.
