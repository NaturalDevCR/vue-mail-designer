import { createDocument } from '../schema'
import type { EmailDocument } from '../schema'
import { buildNewsletter } from './newsletter'
import { buildPromo } from './promo'
import { buildTransactional } from './transactional'
import { buildWelcome } from './welcome'

export type EmailTemplate = {
  id: string
  name: string
  thumbnail?: string
  build: () => EmailDocument
}

export const BUILTIN_TEMPLATES: EmailTemplate[] = [
  { id: 'blank', name: 'En blanco', build: () => createDocument() },
  { id: 'newsletter', name: 'Newsletter', build: buildNewsletter },
  { id: 'promo', name: 'Promoción', build: buildPromo },
  { id: 'transactional', name: 'Transaccional', build: buildTransactional },
  { id: 'welcome', name: 'Bienvenida', build: buildWelcome },
]
