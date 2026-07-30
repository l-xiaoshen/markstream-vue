import type { RenderOptions } from '@terrastruct/d2'
import { getCompatibleD2 } from '../../optional/legacyState'
import { toSafeSvgMarkup } from '../../sanitizeSvg'

export type D2ThemeId = RenderOptions['themeID']

export interface D2RenderRequest {
  darkThemeId?: D2ThemeId | null
  isDark: boolean
  source: string
  svgClass?: string
  themeId?: D2ThemeId | null
}

export interface D2Renderer<TDiagram> {
  compile: (source: string) => Promise<{
    diagram: TDiagram
    renderOptions: RenderOptions
  }>
  render: (diagram: TDiagram, options: RenderOptions) => Promise<string>
}

export interface D2RenderDependencies<TDiagram = unknown> {
  getRenderer?: () => Promise<D2Renderer<TDiagram> | null>
}

export function resolveD2ThemeId(
  request: Pick<D2RenderRequest, 'darkThemeId' | 'isDark' | 'themeId'>,
): D2ThemeId | null | undefined {
  return request.isDark && request.darkThemeId != null
    ? request.darkThemeId
    : request.themeId
}

export function createD2RenderOptions(
  compileOptions: RenderOptions,
  themeId: D2ThemeId | null | undefined,
): RenderOptions {
  return {
    ...compileOptions,
    ...(themeId == null ? {} : { themeID: themeId }),
  }
}

export function addSvgClass(svgMarkup: string, className: string | undefined): string {
  if (!className)
    return svgMarkup
  return svgMarkup.replace('<svg', `<svg class="${className}"`)
}

async function renderD2SvgWithRenderer<TDiagram>(
  request: D2RenderRequest,
  renderer: D2Renderer<TDiagram>,
): Promise<string> {
  const compileResult = await renderer.compile(request.source)
  const renderOptions = createD2RenderOptions(
    compileResult.renderOptions,
    resolveD2ThemeId(request),
  )
  const renderResult = await renderer.render(compileResult.diagram, renderOptions)
  const safeSvg = toSafeSvgMarkup(renderResult)
  if (!safeSvg)
    throw new Error('D2 rendered empty SVG.')
  return addSvgClass(safeSvg, request.svgClass)
}

export async function renderD2Svg<TDiagram = unknown>(
  request: D2RenderRequest,
  dependencies: D2RenderDependencies<TDiagram> = {},
): Promise<string> {
  if (dependencies.getRenderer) {
    const renderer = await dependencies.getRenderer()
    if (!renderer)
      throw new Error('D2 renderer is not available.')
    return renderD2SvgWithRenderer(request, renderer)
  }

  const D2Renderer = await getCompatibleD2()
  if (!D2Renderer)
    throw new Error('D2 renderer is not available.')
  return renderD2SvgWithRenderer(request, new D2Renderer())
}
