# Safety Lexicon — Clinical / Product Sign-off Gate

> **Status: ⛔ PENDING clinical/product sign-off — gated from production.**
> The lexicon below is a provisional **engineering** starting point. It must be
> reviewed and signed off by a product + clinical owner before any production
> (non dev-host) deployment of `apply_medical_safety_gate`.

## Why this gate exists

`packages/nurture-scenario/src/domain/safety-classifier.ts` is the **single
escalation owner** for the scenario. It is **recall-biased**: a false positive
(over-escalation) is acceptable; a false negative (missing a real
emergency/medication/diagnosis intent) is **not**. The keyword lists were
authored by engineering to get the gate working end-to-end; they have **not**
been vetted by anyone with clinical authority. Shipping them to real families
without sign-off risks both missed escalations and mis-scoped ones.

The classifier is fail-closed (no health-relevant text ⇒ level `none`) and the
`nurture.health_state.safety_escalated` event is forbidden from chat / forum /
knowledge / notification routing (scenario_internal invariant). Those structural
guards stand regardless of sign-off; **this gate is specifically about the
lexicon content.**

## Current provisional lexicon (for review)

Severity-ordered. Any match in a `restricted` class ⇒ `escalate`.

### `emergency` → `SAFETY_EMERGENCY_INTENT` (restricted)
zh: 急救 / 呼吸困难 / 抽搐 / 昏迷 / 大量出血 / 出血不止 / 自杀 / 自残 / 轻生 / 胸痛 / 中毒 / 窒息 / 高烧不退 / 失去意识 / 急诊 · self-harm/ideation: 不想活 / 不想活了 / 了结自己 / 结束生命 / 自我了断
en: emergency, can't/cant/cannot breathe, not breathing, seizure, unconscious, overdose, self-harm, hurt/harm myself, suicide, suicidal, kill(ing) myself, want/wanna to die, end(ing) my life, don't want to live, no reason to live, bleeding heavily, choking, call 911, emergency room

### `medication_decision` → `SAFETY_MEDICATION_DECISION` (restricted)
zh: 剂量 / 加药 / 减药 / 停药 / 换药 / 用药 / 抗生素 / 处方药 / 退烧药 / 吃多少 / mg / 毫克
en: dose, dosage, increase/lower the dose, stop the medication, antibiotic, how much medicine, how many mg

### `prescription` → `SAFETY_PRESCRIPTION_INTENT` (restricted)
zh: 开药 / 该吃什么药 / 吃什么药 / 推荐药 / 开点药
en: prescribe, what medication/medicine should, which drug

### `diagnosis` → `SAFETY_DIAGNOSIS_INTENT` (restricted)
zh: 确诊 / 是不是得了 / 是什么病 / 诊断 / 自闭症 / 多动症 / 抑郁症 / 焦虑症
en: diagnose, diagnosis, does he/she have, is it autism, adhd, depression disorder

### `general_health_mention` (low — does not escalate)
zh: 睡不好 / 发烧 / 咳嗽 / 肚子疼 / 不舒服 / 情绪 / 焦虑 / 压力
en: fever, cough, sick, unwell, stomachache, not sleeping, stressed, anxious

> Known engineering guards already applied (do not regress): apostrophes are
> stripped before tokenizing (so `can't breathe` ≡ `cant breathe`); bare `想死`
> is intentionally excluded (idiom `想死你了` would false-match); `"er "` was
> removed (matched `fewer`/`general`) in favor of `emergency room` / `call 911`.

## Sign-off process

1. **Owner:** product + clinical reviewer (named at sign-off). _Not_ engineering alone.
2. **Acceptance criteria:**
   - Recall over precision — every plausible emergency / medication / prescription / diagnosis phrasing a parent might type (zh + en, colloquial + formal) is covered.
   - No term so generic it floods the gate (precision sanity check on the `low` tier).
   - Escalation copy is non-diagnostic, non-prescriptive, and directs to real emergency services where appropriate.
3. **Evidence to produce at sign-off:** a labelled phrase set (positives + hard negatives) and the classifier's results on it.
4. **On approval:** record the reviewer + date below, flip the status banner to APPROVED, and remove the `TODO(clinical-sign-off)` marker in `safety-classifier.ts`.

## Sign-off record

| Date | Reviewer (product) | Reviewer (clinical) | Lexicon version / commit | Decision |
|---|---|---|---|---|
| — | — | — | — | _pending_ |

## Links

- Code: [safety-classifier.ts](../../../packages/nurture-scenario/src/domain/safety-classifier.ts) (`TODO(clinical-sign-off)`)
- Scope note: [01-plan.md](01-plan.md) — 范围外 / 上线前
- Routing invariant: scenario_internal `nurture.health_state.safety_escalated` (see [02-architecture.md](02-architecture.md))
