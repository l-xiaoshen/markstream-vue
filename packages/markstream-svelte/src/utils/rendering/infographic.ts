import type {
  InfographicConstructor,
  InfographicInstance,
} from '../../optional/infographic'

export interface InfographicRenderRequest {
  container: HTMLElement
  renderer: InfographicConstructor
  source: string
}

export function getInfographicErrorMessage(error: unknown): string {
  const errors = Array.isArray(error) ? error : [error]
  return errors
    .map((item) => {
      if (item instanceof Error)
        return item.message
      if (typeof item === 'string')
        return item
      if (item && typeof item === 'object' && 'message' in item)
        return String(item.message ?? '')
      return String(item ?? '')
    })
    .filter(Boolean)
    .join('; ')
}

export function renderInfographicSource({
  container,
  renderer: InfographicRenderer,
  source,
}: InfographicRenderRequest): InfographicInstance {
  container.replaceChildren()
  const instance = new InfographicRenderer({
    container,
    width: '100%',
    height: '100%',
  })
  let renderError = ''
  instance.on('error', (error: unknown) => {
    renderError = getInfographicErrorMessage(error)
  })
  try {
    instance.render(source)
    if (renderError)
      throw new Error(renderError)
    return instance
  }
  catch (error) {
    try {
      instance.destroy()
    }
    catch {
      // Preserve the original render error.
    }
    throw error
  }
}
