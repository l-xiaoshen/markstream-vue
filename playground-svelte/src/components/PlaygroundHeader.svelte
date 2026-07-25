<script lang="ts">
  import type { PlaygroundPath } from '../types/playground'

  interface HeaderProps {
    variant: 'home' | 'test'
    title: string
    isStreaming: boolean
    isPaused: boolean
    selectedTheme: string
    renderModeLabel?: string
    onNavigate: (path: PlaygroundPath) => void
    onTogglePause?: () => void
    onReplay?: () => void
  }

  let {
    variant,
    title,
    isStreaming,
    isPaused,
    selectedTheme,
    renderModeLabel,
    onNavigate,
    onTogglePause,
    onReplay,
  }: HeaderProps = $props()
</script>

<header class:chat-header--test={variant === 'test'} class="chat-header">
  <div class="chat-header__brand">
    {#if variant === 'home'}
      <div class="chat-header__logo">MS</div>
    {/if}
    <div class="chat-header__info">
      <h1 class="chat-header__title">{title}</h1>
      <p class="chat-header__subtitle">Streaming Markdown Renderer</p>
      <div class="chat-header__meta">
        <span class:chat-header__meta-pill--active={isStreaming} class="chat-header__meta-pill">
          {isStreaming ? (isPaused ? 'Paused' : 'Streaming') : 'Ready'}
        </span>
        <span class="chat-header__meta-pill">{selectedTheme}</span>
        {#if renderModeLabel}
          <span class="chat-header__meta-pill">{renderModeLabel}</span>
        {/if}
      </div>
    </div>
  </div>

  <nav class="chat-header__nav">
    {#if variant === 'test'}
      <a href="https://github.com/Simon-He95/markstream-vue" target="_blank" rel="noreferrer" class="nav-btn nav-btn--github">GitHub</a>
      <button type="button" class="nav-btn nav-btn--docs" onclick={() => onNavigate('/')}>Home</button>
      <button type="button" class="nav-btn nav-btn--test" onclick={() => onNavigate('/test')}>Test</button>
    {:else}
      <a href="https://github.com/Simon-He95/markstream-vue" target="_blank" rel="noreferrer" class="nav-btn nav-btn--github">Star</a>
      <a href="https://markstream.simonhe.me/" target="_blank" rel="noreferrer" class="nav-btn nav-btn--docs">Docs</a>
      <button type="button" class="nav-btn nav-btn--stream" disabled={!isStreaming} onclick={() => onTogglePause?.()}>
        {isPaused ? 'Resume' : 'Pause'}
      </button>
      <button type="button" class="nav-btn nav-btn--test" onclick={() => onNavigate('/test')}>Test</button>
      <button type="button" class="nav-btn nav-btn--cdn" onclick={() => onReplay?.()}>Replay</button>
    {/if}
  </nav>
</header>
