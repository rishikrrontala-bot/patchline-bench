# Adaption evidence summarizer status

The private credential authenticated successfully. The API reports 1000 rows in the uploaded UI dataset `28d6f159-dcf9-4370-abc8-4c930ab42478`, but its status is `awaiting_input`, with only `prompt` mapped and no completion. It cannot yet be used as a raw training dataset.

A corrected raw ingestion is now complete: dataset `44abbe5b-efbd-4a76-915a-9a97edd1dc50`, status **succeeded**, exactly 1000 rows. The initial API upload put raw options outside `source`; those options were silently ignored. The corrected request follows SDK 0.14.0 types and places them inside `source`. The unused first API dataset is recorded separately. No adaptation was launched.

The intended task is supervised fine-tuning of a nonclinical evidence summarizer. This is separate from the numerical classifier trained locally from scratch. Its permitted response schema contains `decision` (`hold` or `review`), supplied quality `reasons`, and `hardwareActuation: false`. Review requires a human; it grants no therapy permission. No diagnosis, dosage, or actuator command is being trained.

The authenticated model catalog currently offers `Qwen/Qwen3.5-0.8B` with LoRA SFT. It is the smallest available eligible model and a reasonable candidate for this narrow structured-output task. Quality must still be evaluated after fine-tuning; size alone is not evidence of quality.

`tools/adaption-api.py` supports inspection, raw upload, and hyperparameter recommendation. It refuses redirects, sends credentials only to the documented API host, and sends only file bytes to the presigned S3 upload. Its guarded training launch action requires a verified provider quote within the credit cap. A proof/state file prevents accidental repeat uploads. The upload action refuses repeats when the recorded raw state exists. The initial five offline checks cover parameter nesting, redirect refusal, credential redaction, repeat protection, and omission of account/download metadata.

The authorized cap is **100 existing credits**, without purchases or subscription changes. The reviewed public API exposes no training credit-price or maximum-credit parameter. Raw processing skips adaptation. Based on the official paid-operation list, it was treated as ingestion within the authorized upload scope; neither create nor complete returned cost metadata. This is an inference, not a zero-credit provider quote. Training must wait for a provider quote covering the exact dataset, model, one iteration, and zero augmentation; any provider ingestion charge must count against the same overall cap. A one-epoch LoRA recipe was obtained through the non-launching recommendation endpoint. No paid training has been started.

Sources:

- [Raw training ingestion](https://docs.adaptionlabs.ai/autoscientist/run-on-non-adapted-data/)
- [Dataset create endpoint](https://docs.adaptionlabs.ai/api/resources/datasets/methods/create)
- [AutoScientist create endpoint](https://docs.adaptionlabs.ai/api/resources/autoscientist/methods/create)
- [Hyperparameter recommendation without launch](https://docs.adaptionlabs.ai/api/resources/autoscientist/methods/recommend_hyperparams)
- [Credit-consuming operations](https://docs.adaptionlabs.ai/tools/mcp/)
- [Website training order summary](https://docs.adaptionlabs.ai/tutorials/autoscientist-app-walkthrough/)

## Verified raw labels and guarded continuation

A provider export contains exactly the 1000 original prompt/completion pairs supplied locally (compared as multisets). Its `enhanced_prompt` and `enhanced_completion` fields are null for every row because adaptation was skipped. Explicit training mappings therefore use `original_prompt` and `original_completion`; no generated completions are substituted.

Nine offline checks now pass. The launcher refuses a missing, unverified, expired, mismatched, nonfinite, or over-budget provider quote. A quote must bind to the exact proposed configuration and be observed within two hours. An exclusive launch-claim file and saved run ID prevent blind retries and terminal-job duplication. A network failure after claiming requires reconciling the existing provider run rather than repeating a paid request.

Continue from the project folder:

1. Inspect the exact configuration in `proof/adaption-proposed-training.json`.
2. Obtain the provider's training order summary for dataset `44abbe5b-efbd-4a76-915a-9a97edd1dc50`, Qwen 3.5 0.8B, one LoRA epoch, one iteration, zero augmentation. Keep all known provider charges within the same 100-credit total cap.
3. Run `python3 tools/adaption-api.py quote-template`. Save a completed quote as `proof/adaption-price-quote.json`, using the exact configuration hash, verified total credits, evidence reference, and current observation timestamp. Never fabricate provider evidence or infer a training price from model size.
4. Run `python3 tools/adaption-api.py launch` only after the quote is verified. The current missing-quote rejection was tested without a provider request.
5. Run `python3 tools/adaption-api.py status` to inspect the single saved run. Record success, failure, or cancellation honestly; do not call a started job a completed trained model.

The private credential stays in the workspace's `.secrets/adaption.env`; it is never embedded in browser files or proof artifacts. Parent agent owns UI quotation. This agent owns only the Adaption workflow tools and proof files, leaving numerical model, firmware, app, and training split unchanged.
