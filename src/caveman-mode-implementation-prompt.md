# Caveman Mode — Implementation Prompt

## Role

You are a senior engineer working inside this existing project.

## Goal

Implement a token-reduction communication mode based on the uploaded `SKILL.md` file.

The feature should reduce response/token length while preserving:

- Technical accuracy
- Original meaning
- Developer usefulness
- Code block integrity
- Raw error/log integrity

## Feature Name

**Caveman Mode**

## Primary Behavior

Create a persistent compressed-output mode that rewrites assistant/system responses into shorter, technical, high-signal language.

The mode should:

- Reduce unnecessary tokens.
- Preserve all technical meaning.
- Preserve code blocks exactly.
- Preserve raw error messages exactly.
- Avoid fluff, filler, and unnecessary politeness.
- Support multiple compression intensity levels.
- Stay active across turns until explicitly disabled.
- Temporarily disable itself for safety-critical or clarity-critical content.

---

## Before Coding

Inspect the project end-to-end and understand:

- Existing prompt/config system
- Existing assistant behavior layer
- Existing response formatter/middleware
- Existing user preference/session state handling
- Existing command parser, if any
- Existing tests
- Existing documentation style
- Existing feature flag or settings pattern

Do not break existing behavior. Reuse existing architecture.

---

# Functional Requirements

## 1. Activation Triggers

Caveman Mode should activate when user says any of:

- `caveman mode`
- `talk like caveman`
- `use caveman`
- `less tokens`
- `be brief`
- `/caveman`

Also activate when user clearly requests token efficiency or shorter responses.

---

## 2. Persistence

Once enabled:

- Mode remains active for every future response.
- Mode does not automatically revert.
- Mode remains active even if assistant is uncertain.
- Mode only disables when user says:
  - `stop caveman`
  - `normal mode`

Persist setting using existing session/user preference mechanism.

---

## 3. Default Level

Default compression level:

- `full`

If user enables Caveman Mode without level, use `full`.

---

## 4. Supported Levels

Support these levels:

- `lite`
- `full`
- `ultra`
- `wenyan-lite`
- `wenyan-full`
- `wenyan-ultra`

Support command format:

```text
/caveman lite
/caveman full
/caveman ultra
/caveman wenyan-lite
/caveman wenyan-full
/caveman wenyan-ultra
```

Changing level should update persisted mode level.

---

## 5. Lite Level Rules

For `lite`:

- Remove filler and hedging.
- Keep full sentences.
- Keep articles where needed.
- Maintain professional concise style.

---

## 6. Full Level Rules

For `full`:

- Drop articles where safe.
- Use sentence fragments.
- Use short synonyms.
- Keep technical terms exact.
- Maintain readability.

Example:

```text
Instead of:
Sure, I can help you fix the issue.

Use:
Issue fix below.
```

---

## 7. Ultra Level Rules

For `ultra`:

Use abbreviations where clear:

| Long Form | Short Form |
|---|---|
| database | DB |
| authentication | auth |
| configuration | config |
| request | req |
| response | res |
| function | fn |
| implementation | impl |

Additional rules:

- Remove conjunctions where safe.
- Use arrows: `X → Y`.
- Prefer short direct statements.
- Preserve technical accuracy.

---

## 8. Wenyan Levels

Implement if project supports multilingual style formatting.

### `wenyan-lite`

- Semi-classical Chinese tone.
- Concise but readable.

### `wenyan-full`

- Classical Chinese style.
- Very terse.
- Use particles like `之`, `乃`, `為`, `其`.
- Omit subject where safe.

### `wenyan-ultra`

- Extreme compression.
- Classical symbolic phrasing.
- Preserve meaning as much as possible.

If project has no multilingual response pipeline, add structure/hooks but avoid risky implementation. Document limitation.

---

## 9. Text Removal Rules

When Caveman Mode is active, remove:

### Articles where safe

- `a`
- `an`
- `the`

### Filler

- `just`
- `really`
- `basically`
- `actually`
- `simply`

### Pleasantries

- `sure`
- `certainly`
- `of course`
- `happy to help`

### Hedging

- `maybe`
- `possibly`
- `likely`

Exception:

Keep hedging when technically required to avoid false certainty.

---

## 10. Allowed Style

Allow:

- Sentence fragments
- Short synonyms
- Exact technical terminology
- Raw errors unchanged
- Code blocks unchanged
- Technical symbols when clear

Preferred pattern:

```text
[thing] [action] [reason]. [next step].
```

Example:

```text
Bad:
Sure! I'd be happy to help you. The issue you're experiencing is likely caused by the auth middleware.

Good:
Bug in auth middleware. Token expiry check wrong. Fix below.
```

---

## 11. Auto-Clarity Override

Temporarily disable Caveman Mode for:

- Security warnings
- Irreversible/destructive actions
- Multi-step instructions where exact order matters
- When user asks for clarification
- When user repeats the question because previous answer was unclear

During override:

- Use clear complete standard language.
- Avoid fragments.
- Prioritize safety and clarity.
- Resume Caveman Mode immediately after critical section.

---

## 12. Boundaries

Always keep normal formatting for:

- Code blocks
- Commit messages
- Pull request descriptions
- Documentation
- Raw logs
- Raw errors
- API payloads
- JSON/YAML/TOML/config snippets

Do not compress inside code blocks.

---

## 13. Command Parser

Implement parser behavior:

- Detect activation commands.
- Detect disable commands.
- Detect level change commands.
- Detect token-efficiency intent.
- Avoid false positives where user is only discussing the phrase, unless intent is clear.

---

## 14. State Model

Create or reuse state similar to:

```json
{
  "cavemanMode": {
    "enabled": true,
    "level": "full"
  }
}
```

Store according to existing project pattern.

---

## 15. Formatter Design

Implement as reusable/common layer.

Suggested structure:

- `cavemanModeConfig`
- `cavemanModeParser`
- `cavemanModeFormatter`
- `cavemanModeState`
- `applyCavemanMode(response, options)`
- `shouldUseClarityOverride(context)`
- `normalizeCavemanLevel(level)`

Adapt names to project conventions.

---

## 16. No Regression

Do not break:

- Existing response generation
- Existing formatting
- Existing code rendering
- Existing markdown rendering
- Existing user settings
- Existing localization
- Existing tests
- Existing commands

Caveman Mode should only modify final assistant text when active and safe.

---

## 17. Tests

Add/update tests for:

- Activation by phrase
- Activation by `/caveman`
- Default level `full`
- Level switching
- Persistence across turns
- Disable by `stop caveman`
- Disable by `normal mode`
- Filler removal
- Pleasantry removal
- Code block preservation
- Raw error preservation
- Auto-clarity override for security warning
- Auto-clarity override for destructive action
- Documentation not compressed
- Commit/PR text not compressed
- Wenyan level behavior if implemented
- No false activation when phrase is only mentioned

---

## 18. Documentation

Add short developer documentation if project has docs pattern.

Include:

- What Caveman Mode does
- Trigger commands
- Disable commands
- Supported levels
- Persistence behavior
- Override behavior
- Known limitations

---

## 19. Acceptance Criteria

Implementation complete when:

- User can enable Caveman Mode.
- Mode persists across turns.
- User can switch levels.
- User can disable mode.
- Output becomes shorter while preserving meaning.
- Code blocks remain unchanged.
- Safety-critical instructions remain clear.
- Existing functionality unaffected.
- Tests pass.
- Build/lint/typecheck pass.

---

## 20. Final Response Required

After implementation, report:

1. Files changed.
2. Feature summary.
3. How activation/disable works.
4. How level switching works.
5. How persistence works.
6. How clarity override works.
7. Tests added/updated.
8. Commands run and results.
9. Any assumptions or limitations.
