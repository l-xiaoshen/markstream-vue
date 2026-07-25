# Svelte component architecture

`markstream-svelte` keeps framework-level feature parity without mirroring
another renderer's internal component tree.

## Public entries

- `markstream-svelte` exports the renderer, typed custom-component APIs,
  optional-peer controls, parser/HTML helpers, and common worker setup.
- `markstream-svelte/nodes` exports built-in node renderers for explicit
  overrides.
- `markstream-svelte/workers` exports advanced worker clients, CDN builders,
  backpressure controls, runtime errors, and protocol types.

Internal orchestration components such as `NodeOutlet`, `CodeBlockOutlet`,
`RenderChildren`, and `InlineWrapNode` are not public API.
`PreCodeNode` is public from `markstream-svelte/nodes` for callers that want
the built-in non-Monaco code renderer explicitly.

## Prop contracts

- Leaf nodes receive `{ node }`.
- Context-aware nodes receive `{ node, context? }`.
- Recursive/indexed nodes receive `{ node, context?, indexKey? }`.
- Rich blocks read domain-specific settings from `context` instead of extending
  their component props.
- Custom components receive only `node`, `context`, and `indexKey`; renderer
  settings such as dark mode, streaming, and option bags live in `context`.

All public node inputs are discriminated unions derived from
`stream-markdown-parser`; application-owned custom nodes remain generic at the
renderer and registry boundaries.
