# UI Studio Documentation Pack (Zero-Impact Mode)

This folder contains the implementation-ready planning pack for **IDMS UI Studio**. It is intentionally documentation-only and follows a hard freeze policy to prevent impact on already developed screens, routes, styles, and runtime behavior.

## Document Index

1. [01-Implementation-Plan](./01-Implementation-Plan.md)
2. [02-Agents-Model](./02-Agents-Model.md)
3. [03-Skills-Playbooks](./03-Skills-Playbooks.md)
4. [04-Artifacts-Catalog](./04-Artifacts-Catalog.md)
5. [05-Non-Impact-Guardrails](./05-Non-Impact-Guardrails.md)
6. [06-Traceability-Matrix](./06-Traceability-Matrix.md)
7. [07-Test-and-Gate-Plan](./07-Test-and-Gate-Plan.md)
8. [08-R1-Gate-Hardening-Report](./08-R1-Gate-Hardening-Report.md)
9. [09-Feature-Flag-Integration-Spec](./09-Feature-Flag-Integration-Spec.md)
10. [10-Integration-Evidence-Report](./10-Integration-Evidence-Report.md)
11. [11-R2-Builder-Foundation-Spec](./11-R2-Builder-Foundation-Spec.md)
12. [12-R2-Builder-Foundation-Evidence](./12-R2-Builder-Foundation-Evidence.md)
13. [13-R2-Layout-Editing-Spec](./13-R2-Layout-Editing-Spec.md)
14. [14-R2-Layout-Editing-Evidence](./14-R2-Layout-Editing-Evidence.md)
15. [15-R2-Behavior-Rules-Spec](./15-R2-Behavior-Rules-Spec.md)
16. [16-R2-Behavior-Rules-Evidence](./16-R2-Behavior-Rules-Evidence.md)
17. [17-R2-Action-Contract-Editor-Spec](./17-R2-Action-Contract-Editor-Spec.md)
18. [18-R2-Action-Contract-Editor-Evidence](./18-R2-Action-Contract-Editor-Evidence.md)
19. [19-R2.5-UX-Intelligence-Spec](./19-R2.5-UX-Intelligence-Spec.md)
20. [20-R2.5-UX-Intelligence-Evidence](./20-R2.5-UX-Intelligence-Evidence.md)
21. [21-R2.6-Draft-Persistence-Spec](./21-R2.6-Draft-Persistence-Spec.md)
22. [22-R2.6-Draft-Persistence-Evidence](./22-R2.6-Draft-Persistence-Evidence.md)
23. [23-R2.7-Rule-Condition-Builder-Spec](./23-R2.7-Rule-Condition-Builder-Spec.md)
24. [24-R2.7-Rule-Condition-Builder-Evidence](./24-R2.7-Rule-Condition-Builder-Evidence.md)

## How To Use This Pack

- Product and architecture teams: start with [01-Implementation-Plan](./01-Implementation-Plan.md).
- Delivery leads and coordination owners: use [02-Agents-Model](./02-Agents-Model.md) and [06-Traceability-Matrix](./06-Traceability-Matrix.md).
- Engineers: execute by playbooks in [03-Skills-Playbooks](./03-Skills-Playbooks.md), produce outputs from [04-Artifacts-Catalog](./04-Artifacts-Catalog.md), and validate using [07-Test-and-Gate-Plan](./07-Test-and-Gate-Plan.md).
- QA and release: enforce [05-Non-Impact-Guardrails](./05-Non-Impact-Guardrails.md) before approving any implementation batch.

## Pack Design Principles

- Metadata-first, renderer-first, governance-first.
- Additive implementation only during initial UI Studio rollout.
- Builder convenience features only after contract and publish safety are stable.
- Runtime security remains server-authoritative.

## Hard Freeze Compliance

- This pack does not authorize changes to existing `src/pages`, `src/routes`, `src/components/common`, or current business screen flows.
- Until explicit approval is provided, implementation work must be isolated to new `UI Studio`-scoped modules and documentation artifacts.
- Every implementation PR must include a no-impact declaration referencing [05-Non-Impact-Guardrails](./05-Non-Impact-Guardrails.md).
