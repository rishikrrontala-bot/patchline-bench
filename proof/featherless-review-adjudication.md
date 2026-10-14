# Independent model review adjudication

DeepSeek-V3.2 through Featherless reviewed the initial sensing firmware. Its raw report is retained beside this file; model suggestions are not treated as verified facts.

Accepted: sensor failure recovery and bounded conversion waits were missing in the initial library path. Final transport checks each register transaction, rejects short reads, enforces a conversion deadline, and retries on the next acquisition tick. Host tests cover NACK, short read, stuck conversion, signed raw values and both telemetry modes.

Rejected or corrected:
- TMP117 default address is 0x48, not 0x49 as the review claimed. Setting ADDR high changes it to 0x49. The wiring instructions correctly require that change.
- The initial conversion function already checks nonfinite voltages. Its calibration remains deliberately unreviewed because no actual calibration exists.
- The -40 to100 °C accepted range is the declared bench ingestion envelope, not a claim about the sensor's full rating.
- The supplied pragma is in the header, not the implementation. `#pragma once` is a valid header guard for this toolchain.
- The existing uint32 subtraction already handled rollover. Native tests exercise that behavior.
- `snprintf` is size bounded; the proposed unbounded-style formatting change was unnecessary.
- Increasing timeouts or adding partial simulation modes without evidence would not establish correctness.

No generated replacement header was applied. Firmware host tests do not demonstrate an ESP32 device build, actual bus timing or electrical performance. Those checks remain outstanding.
