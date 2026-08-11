import { DOMWrapper, enableAutoUnmount } from '@vue/test-utils'
import { afterEach } from 'vitest'

enableAutoUnmount(afterEach)

export function findInBody(selector: string): DOMWrapper<Element> {
  const element = document.body.querySelector(selector)
  if (!element) throw new Error(`Expected to find ${selector} under document.body`)
  return new DOMWrapper(element)
}

export function findAllInBody(selector: string): DOMWrapper<Element>[] {
  return Array.from(document.body.querySelectorAll(selector), (element) => new DOMWrapper(element))
}

export function hasInBody(selector: string): boolean {
  return document.body.querySelector(selector) !== null
}
