import type { InjectionKey } from 'vue'
import { inject } from 'vue'
import type { ImageResult } from './imageSearch'
import type { FontDef } from './fonts'
import type { UnlayerFetch } from './import/unlayerUrl'
import type { BlockType } from './schema'
import type { EmailTemplate } from './templates'

export type MergeTagDef = { name: string; value: string }

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
  mergeTags: MergeTagDef[]
  uploadImage?: (file: File) => Promise<string>
  templates?: EmailTemplate[]
  imageSearch?: (query: string) => Promise<ImageResult[]>
  unlayerFetch?: UnlayerFetch
  tools?: Partial<Record<BlockType, ToolConfig>>
  fonts?: FontDef[]
}

export const BUILDER_OPTIONS_KEY: InjectionKey<BuilderOptions> = Symbol('vmd-options')

export function useBuilderOptions(): BuilderOptions {
  return inject(BUILDER_OPTIONS_KEY, { mergeTags: [] })
}
