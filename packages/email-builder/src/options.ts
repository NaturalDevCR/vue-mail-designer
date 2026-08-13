import type { InjectionKey } from 'vue'
import { inject } from 'vue'
import type { ImageResult } from './imageSearch'
import type { FontDef } from './fonts'
import type { UnlayerFetch } from './import/unlayerUrl'
import type { MediaLibraryOptions } from './mediaLibrary'
import type { BlockType, SocialNetworkKind, TimerBlock } from './schema'
import type { EmailTemplate } from './templates'

export type MergeTagDef = { name: string; value: string }
export type MergeTagGroup = { name: string; tags: MergeTagDef[] }
export type MergeTagItem = MergeTagDef | MergeTagGroup
export type AiLanguage = { code: string; label: string }
export type AiOptions = { enabled: boolean; languages?: AiLanguage[] }

export type AiTemplateMode = 'create' | 'edit'
export type AiTemplateContext =
  | Record<string, unknown>
  | (() => Record<string, unknown> | Promise<Record<string, unknown>>)
export type AiTemplateCustomBlock = Pick<CustomBlockDef, 'type' | 'label' | 'defaultData' | 'fields'>
export type AiTemplateJsonSchema = Record<string, unknown>
export type AiTemplateRequest = {
  mode: AiTemplateMode
  prompt: string
  count: 1 | 2 | 3
  currentDesign?: import('./schema').EmailDocument
  context: Record<string, unknown>
  designer: {
    schemaVersion: 1
    supportedBlocks: import('./schema').BlockType[]
    customBlocks: AiTemplateCustomBlock[]
    mergeTags: MergeTagItem[]
    outputSchema: AiTemplateJsonSchema
  }
}
export type AiTemplateProposal = {
  title: string
  description?: string
  design: import('./schema').EmailDocument
}
export type AiTemplateErrorOperation = 'context' | 'generate' | 'validate'
export type AiTemplateErrorPayload = { operation: AiTemplateErrorOperation; error: unknown }
export type AiTemplateOptions = {
  enabled: boolean
  context?: AiTemplateContext
  generate: (request: AiTemplateRequest) => Promise<AiTemplateProposal[]>
}
export type TimerImageUrlBuilder = (block: TimerBlock) => string | undefined
export type SocialIconUrlBuilder = (kind: SocialNetworkKind) => string | undefined

/** Enlace especial insertable en el editor (ej. cancelar suscripción). */
export type SpecialLink = { name: string; href: string }

export const DEFAULT_SPECIAL_LINKS: SpecialLink[] = [
  { name: 'Cancelar suscripción', href: '{{unsubscribe_url}}' },
  { name: 'Ver en el navegador', href: '{{view_in_browser_url}}' },
]

export function isMergeTagGroup(item: MergeTagItem): item is MergeTagGroup {
  return 'tags' in item && Array.isArray((item as MergeTagGroup).tags)
}

/** Aplana grupos y tags sueltos a una lista plana de MergeTagDef. */
export function flattenMergeTags(items: MergeTagItem[]): MergeTagDef[] {
  return items.flatMap((i) => (isMergeTagGroup(i) ? i.tags : [i]))
}

/** Campo editable de un bloque personalizado (aparece en el inspector). */
export type CustomField = { key: string; label: string; type: 'text' | 'number' | 'color' | 'textarea' }

/** Definición de un bloque personalizado registrado por el integrador. */
export type CustomBlockDef = {
  type: string
  label: string
  icon?: string
  defaultData: Record<string, unknown>
  fields: CustomField[]
  render: (data: Record<string, unknown>) => string
}

/** Config por herramienta (bloque de la paleta). */
export type ToolConfig = { enabled?: boolean; position?: number; usageLimit?: number }

/** Colores del builder; cada campo presente sobreescribe su variable CSS. */
export type Appearance = {
  accent?: string
  panel?: string
  border?: string
  background?: string
  foreground?: string
  muted?: string
}

export type ThemeAppearance = {
  light?: Appearance
  dark?: Appearance
}

export function isThemeAppearance(value: Appearance | ThemeAppearance): value is ThemeAppearance {
  return 'light' in value || 'dark' in value
}

export type BuilderOptions = {
  mergeTags: MergeTagItem[]
  ai?: AiOptions
  aiTemplates?: AiTemplateOptions
  uploadImage?: (file: File) => Promise<string>
  templates?: EmailTemplate[]
  imageSearch?: (query: string) => Promise<ImageResult[]>
  timerImageUrlBuilder?: TimerImageUrlBuilder
  socialIconUrlBuilder?: SocialIconUrlBuilder
  unlayerFetch?: UnlayerFetch
  tools?: Partial<Record<BlockType, ToolConfig>>
  fonts?: FontDef[]
  specialLinks?: SpecialLink[]
  customBlocks?: CustomBlockDef[]
  mediaLibrary?: MediaLibraryOptions
}

export const BUILDER_OPTIONS_KEY: InjectionKey<BuilderOptions> = Symbol('vmd-options')

export function useBuilderOptions(): BuilderOptions {
  return inject(BUILDER_OPTIONS_KEY, { mergeTags: [] })
}
