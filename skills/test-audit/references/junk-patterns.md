# Junk patterns

The shared checklist for test value: `/test-audit` hunts existing tests that match one, and `/tdd` rejects a new test that matches one. A match is a candidate, not a verdict, until the retention bar below is checked.

- **Tautological**: the test passes by construction and can never disagree with the code:
  - self-comparisons and identity copiers;
  - expected values produced by the helper or renderer under test;
  - mocks that implement the asserted behavior, or one identical mock standing in for different APIs;
  - fixtures that supply the result, ordering, or callback the owner should produce, or persistence asserted against a store the path never writes.
- assertion-free coverage probes;
- copied fixtures, inventories, manifests, or export lists;
- exact source, import, or string greps;
- private predicate or call-shape tests duplicated at the real seam;
- duplicate invocations of the same contract, or the same shared helper replayed in every caller's tests;
- tests whose only purpose is keeping a **backdoor** alive: an export, global, flag, wrapper, or injection point no production caller uses;
- dead production code whose only callers are tests;
- capability tests that restate declared flags instead of exercising the behavior the flag promises;
- negative controls that pass for an unrelated reason, such as a denial from a different guard or a rejection the production path never reaches;
- names or fixtures that promise more than the input exercises, such as a "clears the cache" test asserting the cache was not cleared.

## Retention bar

Keep a test when it independently enforces a public API, protocol, config, migration, storage, security, platform, default, package, release, or architecture contract. Also keep:

- call ordering when order is observable behavior;
- regressions with a credible failure mode;
- source inspection when it is the cheapest independent guard: it fails when the contract changes (the user-facing key, byte, or path) and survives an identifier-only refactor;
- a retained test that goes red on the baseline: treat it as a possible product bug, reproduce it, and repair the owner.

Static or slow is not a deletion reason. A test that resembles implementation may still be the independent contract; prove otherwise before removing it.
