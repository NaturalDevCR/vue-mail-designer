export * from './schema'
export { useDocumentStore, type Selection } from './store/document'
export { BUILDER_PINIA_KEY, useBuilderPinia } from './store/keys'
export { renderHtml, escapeHtml, SOCIAL_BRANDS, defaultSocialIconUrl } from './render/html'
export { default as EmailBuilder } from './components/EmailBuilder.vue'
export { useUiStore } from './store/ui'
export {
  type AiLanguage,
  type AiOptions,
  type BuilderOptions,
  type SocialIconUrlBuilder,
  type MergeTagDef,
  type MergeTagGroup,
  type MergeTagItem,
  type SpecialLink,
  type ToolConfig,
  type TimerImageUrlBuilder,
  type Appearance,
  type ThemeAppearance,
  type CustomBlockDef,
  type CustomField,
  DEFAULT_SPECIAL_LINKS,
  flattenMergeTags,
  isMergeTagGroup,
  BUILDER_OPTIONS_KEY,
  useBuilderOptions,
} from './options'
export type { LocaleDict } from './i18n/keys'
export { BUILTIN_TEMPLATES, type EmailTemplate } from './templates'
export { openverseSearch, type ImageResult } from './imageSearch'
export { unlayerToDocument, parseShorthandPadding } from './import/unlayer'
export { unlayerSlugFromUrl, defaultUnlayerFetch, type UnlayerFetch } from './import/unlayerUrl'
export { DEFAULT_FONTS, type FontDef } from './fonts'
export type { MediaItem, MediaListPage, MediaLibraryOptions } from './mediaLibrary'
export type {
  AutosaveErrorPayload,
  AutosaveMode,
  AutosaveOptions,
  AutosaveRestoredPayload,
  AutosaveSavedPayload,
  AutosaveStatus,
  AutosaveStatusPayload,
  AutosaveStorage,
} from './autosave/types'
