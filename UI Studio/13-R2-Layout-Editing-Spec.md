# 13 - R2 Layout Editing Slice Specification

## Summary

This specification defines the section-level layout editing slice for the hidden UI Studio builder route.

Decisions:

- Section-level add/remove/reorder only
- In-memory draft persistence only
- Strict structural validation enforced
- Same hidden `/ui-studio/builder` route and existing feature-flag guard

## 1. Layout Operation Contract

### Add Section

- API: `addSectionToDraft({ sectionId, afterSectionId? })`
- Behavior:
  - Adds a new section node under layout root
  - Inserts after `afterSectionId` when provided
  - Rejects duplicates by returning unchanged draft

### Remove Section

- API: `removeSectionFromDraft({ sectionId })`
- Behavior:
  - Removes section node
  - Removes orphaned components referenced only by removed section
  - Prevents deletion that would leave root with zero sections

### Reorder Section

- API: `reorderSectionsInDraft({ fromIndex, toIndex })`
- Behavior:
  - Deterministically reorders root section array
  - Index validation prevents invalid operations

## 2. Builder UI Updates

- Left panel includes:
  - Add Section
  - Remove Selected Section
  - Move Section Up
  - Move Section Down
- Existing field add/remove/reorder remains active
- Canvas remains read-only and selectable in this slice

## 3. Structural Validation Additions

Validation now blocks:

1. Root node not typed as `root`
2. Duplicate layout node IDs
3. Root children not section type
4. Empty root section list
5. Existing orphan component references

## 4. Deferred Work

- Row/column editing
- Rule editor
- Action contract editor
- Visible navigation exposure

## 5. Hard-Freeze Compliance

- Changes remain in `src/ui-studio/*` plus approved route integration files only.
- No edits in `src/pages`, `src/components/common`, `src/styles`.
