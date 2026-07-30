<script lang="ts">
  import type { Snippet } from 'svelte'
  import { hideTooltip } from '../../tooltip/singletonTooltip'

  let {
    className,
    disabled = false,
    icon,
    label,
    onClick,
    onShowTooltip = undefined,
    pressed = undefined,
  }: {
    className: string
    disabled?: boolean | undefined
    icon: Snippet
    label: string
    onClick: () => void
    onShowTooltip?: ((event: MouseEvent | FocusEvent) => void) | undefined
    pressed?: boolean | undefined
  } = $props()
</script>

<button
  type="button"
  class={className}
  aria-label={label}
  aria-pressed={pressed}
  {disabled}
  onblur={() => hideTooltip()}
  onclick={onClick}
  onfocus={onShowTooltip}
  onmouseleave={() => hideTooltip()}
  onmouseenter={onShowTooltip}
>
  {@render icon()}
</button>
