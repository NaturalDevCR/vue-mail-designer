import { createPinia, setActivePinia } from 'pinia'
import { beforeEach, describe, expect, it } from 'vitest'
import { useDocumentStore } from '../src/store/document'

describe('versiones', () => {
  beforeEach(() => setActivePinia(createPinia()))

  it('guarda, carga y borra versiones nombradas', () => {
    const store = useDocumentStore()
    store.addRow([100])
    store.saveVersion('con una fila')
    expect(store.versions).toHaveLength(1)
    const id = store.versions[0].id

    // mutar y volver a la versión guardada
    store.addRow([50, 50])
    expect(store.doc.rows).toHaveLength(2)
    store.loadVersion(id)
    expect(store.doc.rows).toHaveLength(1)

    store.deleteVersion(id)
    expect(store.versions).toHaveLength(0)
  })

  it('la versión es un snapshot independiente', () => {
    const store = useDocumentStore()
    store.addRow([100])
    store.saveVersion('v1')
    store.updateSettings({ backgroundColor: '#000000' })
    expect(store.versions[0].doc.settings.backgroundColor).not.toBe('#000000')
  })
})
