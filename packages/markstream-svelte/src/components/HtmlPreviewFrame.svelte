<script lang="ts">
  import type { Attachment } from 'svelte/attachments'
  import { getSafeI18n } from '../i18n/safeI18n'

  interface Props {
    code?: string
    title?: string
    isDark?: boolean
    htmlPreviewAllowScripts?: boolean
    htmlPreviewSandbox?: string | undefined
    onClose?: () => void
  }

  let {
    code = '',
    title = 'Preview',
    isDark = false,
    htmlPreviewAllowScripts = false,
    htmlPreviewSandbox = undefined,
    onClose = undefined,
  }: Props = $props()

  const { t } = getSafeI18n()
  const sandbox = $derived(htmlPreviewSandbox ?? (htmlPreviewAllowScripts ? 'allow-scripts' : ''))
  const closeButtonAttachment: Attachment<HTMLButtonElement> = (element) => {
    const previousFocus = document.activeElement instanceof HTMLElement
      ? document.activeElement
      : null
    queueMicrotask(() => element.focus())
    return () => {
      if (previousFocus?.isConnected)
        previousFocus.focus()
    }
  }
</script>

<div class:is-dark={isDark} class="html-preview-frame">
  <div class="html-preview-frame__header">
    <span>{title}</span>
    <button {@attach closeButtonAttachment} type="button" aria-label={t('common.close') || 'Close'} onclick={() => onClose?.()}>
      {t('common.close') || 'Close'}
    </button>
  </div>
  <iframe title={title} class="html-preview-frame__iframe" srcdoc={code} sandbox={sandbox}></iframe>
</div>
