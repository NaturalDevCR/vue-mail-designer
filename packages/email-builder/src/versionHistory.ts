import { z } from 'zod'
import { zEmailDocument } from './schema'

export type VersionHistoryOptions = {
  key: string
  storage?: Storage
}

const versionSnapshot = z.object({
  id: z.string().min(1),
  name: z.string().trim().min(1),
  at: z.number().int().min(0).max(8_640_000_000_000_000),
  doc: zEmailDocument,
})

const persistedHistory = z.object({
  version: z.literal(1),
  versions: z.array(versionSnapshot).refine((versions) => new Set(versions.map(({ id }) => id)).size === versions.length),
})

export type VersionSnapshot = z.infer<typeof versionSnapshot>

export function readVersionHistory({ key, storage = window.localStorage }: VersionHistoryOptions): VersionSnapshot[] {
  const raw = storage.getItem(key)
  return raw === null ? [] : persistedHistory.parse(JSON.parse(raw)).versions
}

export function writeVersionHistory({ key, storage = window.localStorage }: VersionHistoryOptions, versions: VersionSnapshot[]) {
  const history = persistedHistory.parse({ version: 1, versions })
  storage.setItem(key, JSON.stringify(history))
}
