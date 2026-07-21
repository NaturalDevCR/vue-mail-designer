import type { InjectionKey } from 'vue'
import { inject } from 'vue'
import type { ImageResult } from './imageSearch'
import type { FontDef } from './fonts'
import type { UnlayerFetch } from './import/unlayerUrl'
import type { BlockType } from './schema'
import type { EmailTemplate } from './templates'

export type MergeTagDef = { name: string; value: string }
export type MergeTagGroup = { name: string; tags: MergeTagDef[] }
export type MergeTagItem = MergeTagDef | MergeTagGroup

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

export type BuilderOptions = {
  mergeTags: MergeTagItem[]
  uploadImage?: (file: File) => Promise<string>
  templates?: EmailTemplate[]
  imageSearch?: (query: string) => Promise<ImageResult[]>
  unlayerFetch?: UnlayerFetch
  tools?: Partial<Record<BlockType, ToolConfig>>
  fonts?: FontDef[]
  specialLinks?: SpecialLink[]
  customBlocks?: CustomBlockDef[]
}

export const BUILDER_OPTIONS_KEY: InjectionKey<BuilderOptions> = Symbol('vmd-options')

export function useBuilderOptions(): BuilderOptions {
  return inject(BUILDER_OPTIONS_KEY, { mergeTags: [] })
}
