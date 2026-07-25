# markstream-svelte

Svelte 5 streaming Markdown renderer for AI chat, LLM token streams, SSE/WebSocket output, incomplete Markdown states, long documents, custom components, Mermaid, KaTeX, Monaco, D2, and Infographic.

## When to use it

Use `markstream-svelte` when Markdown changes while users are reading it:
LLM output, SSE streams, WebSocket streams, AI chat messages, long generated answers,
progressive diagrams, math, or code blocks.

For normal chat streaming, start with the raw `content` string path. Use pre-parsed
`nodes` only when another part of your app already owns the parser or AST state.

## Known limitations

- **Svelte 5.33.1 or newer.** The renderer uses rune-backed classes and attachments; Svelte 4 is not supported.
- This package is currently beta. Check npm and the [Svelte guide](https://markstream.simonhe.me/guide/svelte) for the latest API maturity.
- It is not the first choice for short static Markdown or apps that require a fully stable Svelte 4-compatible API.

## Install

```bash
pnpm add markstream-svelte "svelte@>=5.33.1"
```

Optional heavy renderers stay as peer dependencies, matching the Vue and React packages.
Plain Markdown does not require these packages:

```bash
pnpm add katex mermaid stream-monaco @terrastruct/d2 @antv/infographic
```

## Basic Usage

```svelte
<script lang="ts">
  import MarkdownRender from 'markstream-svelte'
  import 'markstream-svelte/index.css'

  const content = `# Hello

Inline math: $E = mc^2$

\`\`\`mermaid
flowchart LR
  A --> B
\`\`\`
`
</script>

<MarkdownRender {content} />
```

## Workers

```svelte
<script lang="ts">
  import MarkdownRender, { setKaTeXWorker, setMermaidWorker } from 'markstream-svelte'
  import KatexWorker from 'markstream-svelte/workers/katexRenderer.worker?worker&inline'
  import MermaidWorker from 'markstream-svelte/workers/mermaidParser.worker?worker&inline'

  setKaTeXWorker(new KatexWorker())
  setMermaidWorker(new MermaidWorker())
</script>

<MarkdownRender content="Inline math: $x^2$" />
```

Advanced worker clients, CDN worker builders, backpressure controls, runtime
errors, and wire-protocol types are available from `markstream-svelte/workers`.

## Node renderer overrides

Built-in node components live on the focused `markstream-svelte/nodes`
subpath instead of the root entry:

```ts
import { CodeBlockNode, ImageNode } from 'markstream-svelte/nodes'
```

Node components use narrow, tiered prop contracts. Leaf renderers receive only
`node`; contextual renderers add `context`; recursive renderers also add
`indexKey`. Built-in and custom components read renderer-specific settings from
`context`, so overrides follow the same data flow as the default renderer.

## Custom Components

Prefer a renderer-local, discriminant-checked map when one rendering surface
owns the override:

```ts
import type {
  CustomMarkdownNode,
  RendererCustomComponentMap,
} from 'markstream-svelte'
import ThinkingNode from './ThinkingNode.svelte'

type AppNode = CustomMarkdownNode<'thinking'>

export const components = {
  thinking: ThinkingNode,
} satisfies RendererCustomComponentMap<AppNode>
```

Use the scoped registry when several renderers intentionally share a mapping:

```svelte
<script lang="ts">
  import type { CustomMarkdownNode } from 'markstream-svelte'
  import MarkdownRender, {
    defineCustomComponents,
    setCustomComponents,
  } from 'markstream-svelte'
  import ThinkingNode from './ThinkingNode.svelte'

  type AppNodes = {
    thinking: CustomMarkdownNode<'thinking'>
  }

  const customId = 'demo'
  const components = defineCustomComponents<AppNodes>({
    thinking: ThinkingNode,
  })
  setCustomComponents(customId, components)
</script>

<MarkdownRender
  content="<thinking>nested markdown</thinking>"
  {customId}
  customHtmlTags={['thinking']}
/>
```

```svelte
<!-- ThinkingNode.svelte -->
<script lang="ts">
  import type {
    CustomMarkdownNode,
    MarkstreamCustomComponentProps,
  } from 'markstream-svelte'
  import MarkdownRender from 'markstream-svelte'

  let {
    node,
    context = undefined,
  }: MarkstreamCustomComponentProps<
    CustomMarkdownNode<'thinking'>
  > = $props()
</script>

<section class="thinking-node">
  <MarkdownRender
    content={node.content}
    final={context?.final ?? node.loading === false}
    {context}
  />
</section>
```

Nested renderers can forward the complete parent configuration with
`{context}`. Explicit props such as `final` override the inherited value.

## Typed nodes

Built-in nodes are an explicit discriminated union. Custom AST owners can add
their own union at the public boundary:

```ts
import type {
  CustomMarkdownNode,
  RenderableMarkdownNode,
} from 'markstream-svelte'
import { isCustomNodeType, isNodeType } from 'markstream-svelte'

type AppNode
  = | CustomMarkdownNode<'thinking'>
    | CustomMarkdownNode<'citation', { href: string }>

function inspect(node: RenderableMarkdownNode<AppNode>) {
  if (isNodeType(node, 'code_block'))
    return node.language
  if (isCustomNodeType<AppNode, 'thinking'>(node, 'thinking'))
    return node.content
  return node.type
}
```

`NodeRendererInput<TCustomNode>` provides a strict `content`-or-`nodes`
contract for wrappers and application-level component APIs.

`createMarkdownNodeParser()` returns `ParsedMarkdownNode<TCustomNode>[]`.
Unlike caller-owned `RenderableMarkdownNode` input, parsed content can contain
the upstream parser's runtime catch-all nodes, so callers should narrow it with
`isNodeType` or `isCustomNodeType` before reading node-specific fields.

Renderer-specific settings use option bags:

```svelte
<MarkdownRender
  {content}
  codeBlockProps={{ stream: true, monacoOptions: { fontSize: 14 } }}
  d2Props={{ renderDebounceMs: 120 }}
  infographicProps={{ renderDebounceMs: 120 }}
  mathProps={{
    workerTimeoutMs: 3000,
    workerWaitTimeoutMs: 1500,
    workerRetries: 1,
  }}
/>
```

## Scoped runtime services

The compatibility helpers use contained default instances. Applications and
tests that require isolation can create their own services:

```ts
import {
  createCustomComponentRegistry,
  createKatexRuntime,
  createMarkdownHtmlRenderer,
  createMermaidRuntime,
  createTooltipService,
} from 'markstream-svelte'

const registry = createCustomComponentRegistry()
const markdownHtml = createMarkdownHtmlRenderer()
const mermaid = createMermaidRuntime()
const katex = createKatexRuntime()
const tooltip = createTooltipService()
```

Optional peer loaders use each package's declared runtime value, so custom
loaders are checked against the dependency's own TypeScript declarations.
Workers use typed ES-module request/response protocols; classic `importScripts`
workers and global UMD discovery are not supported.

## Migration notes

- Custom component `node` is required and typed. The deprecated `ctx` alias was
  removed; use `context`.
- Prefer `defineCustomComponents<NodeSchema>()` before registration.
- Use `RendererCustomComponentMap<TCustomNode>` for renderer-local overrides;
  the erased runtime registry map is internal.
- Use `RenderableMarkdownNode<TCustomNode>` instead of catch-all parser node
  types when your app owns custom nodes.
- Import built-in node renderers from `markstream-svelte/nodes`. Deprecated
  root aliases such as `SvelteCodeBlockNode` and `MarkdownCodeBlockNode` were
  removed.
- Import advanced worker APIs from `markstream-svelte/workers`; only common
  worker setup remains on the root entry.
- Reactive helpers now use Svelte rune classes. Instantiate
  `SmoothMarkdownStream` with `new` instead of calling
  `useSmoothMarkdownStream`, and call `destroy()` when its owner is disposed.
- `getSafeI18n()` replaces the former hook-shaped `useSafeI18n()` helper.
- Node renderers and custom components now receive only their standard
  `node`/`context`/`indexKey` props. Renderer settings are read from `context`.
- `batchRendering` retains its batch budget and idle timeout controls, and
  `maxLiveNodes <= 0` remains a supported `smoothStreaming="auto"` signal.
  Inert viewport/windowing props were removed.
- Svelte 5.33.1 is now the minimum because state models declare lazy derived
  fields in class constructors.
- Optional renderer overrides use the exported runtime singletons' `setLoader()`
  methods, or isolated instances from `create*Runtime()`.

Run the local playground with:

```bash
pnpm play:svelte
```
