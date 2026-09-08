# Performance regressions

Load in Phase 4 when the bug is a performance regression.

Logs are usually the wrong probe. Establish a baseline measurement first (timing harness, `performance.now()`, profiler, query plan), then bisect. Measure first, fix second. Re-measure after the fix so the Phase 1 loop's verdict is a number, not a vibe.
