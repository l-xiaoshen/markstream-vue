# Svelte component architecture

`markstream-svelte` keeps framework-level feature parity without mirroring
another renderer's internal component tree.

## Public entries

- `markstream-svelte` exports the renderer, typed custom-component APIs,
  built-in node renderers, optional-peer controls, parser/HTML helpers, and
  worker APIs.
- Dedicated `markstream-svelte/workers/*` entries expose the bundled KaTeX and
  Mermaid worker scripts.

Internal orchestration components such as `NodeOutlet`, `CodeBlockOutlet`,
`RenderChildren`, and `InlineWrapNode` are not public API.
`PreCodeNode` is public from the root entry for callers that want the built-in
non-Monaco code renderer explicitly.

## Prop contracts

- Leaf nodes receive `{ node }`.
- Context-aware nodes receive `{ node, context? }`.
- Recursive/indexed nodes receive `{ node, context?, indexKey? }`.
- Rich blocks read domain-specific settings from `context` instead of extending
  their component props. Their former direct settings remain deprecated
  compatibility props.
- Custom components canonically receive `node`, `context`, and `indexKey`;
  renderer settings such as dark mode, streaming, and option bags live in
  `context`. Deprecated top-level aliases and rich option-bag fields are also
  supplied for compatibility.

All public node inputs are discriminated unions derived from
`stream-markdown-parser`; application-owned custom nodes remain generic at the
renderer and registry boundaries.
