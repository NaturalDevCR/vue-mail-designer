import type { InjectionKey } from 'vue'
import { inject } from 'vue'
import type { ImageResult } from './imageSearch'
import type { EmailTemplate } from './templates'

export type MergeTagDef = { name: string; value: string }

export type BuilderOptions = {
  mergeTags: MergeTagDef[]
  uploadImage?: (file: File) => Promise<string>
  templates?: EmailTemplate[]
  imageSearch?: (query: string) => Promise<ImageResult[]>
}

export const BUILDER_OPTIONS_KEY: InjectionKey<BuilderOptions> = Symbol('vmd-options')

export function useBuilderOptions(): BuilderOptions {
  return inject(BUILDER_OPTIONS_KEY, { mergeTags: [] })
}
