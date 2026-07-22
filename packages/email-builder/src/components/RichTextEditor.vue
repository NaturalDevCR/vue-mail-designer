<template>
  <div class="vmd-rte" @click.stop>
    <div class="vmd-rte-toolbar">
      <button type="button" class="vmd-mini-btn" :class="{ 'vmd-active': editor?.isActive('bold') }" :title="t('rte.bold')" @click="editor?.chain().focus().toggleBold().run()"><b>B</b></button>
      <button type="button" class="vmd-mini-btn" :class="{ 'vmd-active': editor?.isActive('italic') }" :title="t('rte.italic')" @click="editor?.chain().focus().toggleItalic().run()"><i>I</i></button>
      <button type="button" class="vmd-mini-btn" :class="{ 'vmd-active': editor?.isActive('underline') }" :title="t('rte.underline')" @click="editor?.chain().focus().toggleUnderline().run()"><u>U</u></button>
      <button type="button" class="vmd-mini-btn" :class="{ 'vmd-active': editor?.isActive('strike') }" :title="t('rte.strike')" @click="editor?.chain().focus().toggleStrike().run()"><s>S</s></button>
      <span class="vmd-rte-sep" />
      <button type="button" class="vmd-mini-btn" :class="{ 'vmd-active': editor?.isActive('bulletList') }" :title="t('rte.bulletList')" @click="editor?.chain().focus().toggleBulletList().run()"><span class="vmd-ico" v-html="ICONS.listBullet" /></button>
      <button type="button" class="vmd-mini-btn" :class="{ 'vmd-active': editor?.isActive('orderedList') }" :title="t('rte.orderedList')" @click="editor?.chain().focus().toggleOrderedList().run()"><span class="vmd-ico" v-html="ICONS.listOrdered" /></button>
      <span class="vmd-rte-sep" />
      <button type="button" class="vmd-mini-btn" :class="{ 'vmd-active': editor?.isActive({ textAlign: 'left' }) }" :title="t('rte.alignLeft')" @click="editor?.chain().focus().setTextAlign('left').run()"><span class="vmd-ico" v-html="ICONS.alignLeft" /></button>
      <button type="button" class="vmd-mini-btn" :class="{ 'vmd-active': editor?.isActive({ textAlign: 'center' }) }" :title="t('rte.alignCenter')" @click="editor?.chain().focus().setTextAlign('center').run()"><span class="vmd-ico" v-html="ICONS.alignCenter" /></button>
      <button type="button" class="vmd-mini-btn" :class="{ 'vmd-active': editor?.isActive({ textAlign: 'right' }) }" :title="t('rte.alignRight')" @click="editor?.chain().focus().setTextAlign('right').run()"><span class="vmd-ico" v-html="ICONS.alignRight" /></button>
      <span class="vmd-rte-sep" />
      <label class="vmd-mini-btn vmd-rte-color" :title="t('rte.color')">
        A
        <input type="color" :value="currentColor" @input="onColor" />
      </label>
      <select class="vmd-rte-size" :title="t('rte.fontSize')" :value="currentFontSize" @change="onFontSize">
        <option value="">{{ t('rte.fontSize') }}</option>
        <option v-for="s in FONT_SIZES" :key="s" :value="s + 'px'">{{ s }}</option>
      </select>
      <span class="vmd-rte-sep" />
      <button type="button" class="vmd-mini-btn" :title="t('rte.link')" @click="setLink"><span class="vmd-ico" v-html="ICONS.link" /></button>
      <button type="button" class="vmd-mini-btn" :title="t('rte.clear')" @click="clearFormat"><span class="vmd-ico" v-html="ICONS.clearFormat" /></button>
      <select v-if="flatTags.length" class="vmd-rte-tags" @change="onTagPick">
        <option value="">{{ t('rte.variable') }}</option>
        <template v-for="(item, i) in options.mergeTags" :key="i">
          <optgroup v-if="isMergeTagGroup(item)" :label="item.name">
            <option v-for="tag in item.tags" :key="tag.value" :value="tag.value">{{ tag.name }}</option>
          </optgroup>
          <option v-else :value="item.value">{{ item.name }}</option>
        </template>
      </select>
      <select v-if="specialLinks.length" class="vmd-rte-tags" @change="onSpecialLink">
        <option value="">{{ t('rte.specialLink') }}</option>
        <option v-for="(l, i) in specialLinks" :key="i" :value="i">{{ l.name }}</option>
      </select>
    </div>
    <EditorContent :editor="editor" />
  </div>
</template>

<script setup lang="ts">
import Link from '@tiptap/extension-link'
import TextAlign from '@tiptap/extension-text-align'
import Underline from '@tiptap/extension-underline'
import StarterKit from '@tiptap/starter-kit'
import { EditorContent, useEditor } from '@tiptap/vue-3'
import { computed, watch } from 'vue'
import { MergeTag, insertMergeTag } from '../editor/mergeTag'
import { InlineStyle } from '../editor/inlineStyle'
import { useI18n } from '../i18n/useI18n'
import { ICONS } from './icons'
import { DEFAULT_SPECIAL_LINKS, flattenMergeTags, isMergeTagGroup, useBuilderOptions } from '../options'

const FONT_SIZES = [12, 14, 16, 18, 20, 24, 28, 32, 40]

const props = defineProps<{ modelValue: string }>()
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()
const options = useBuilderOptions()
const { t } = useI18n()
const flatTags = computed(() => flattenMergeTags(options.mergeTags))
const specialLinks = computed(() => options.specialLinks ?? DEFAULT_SPECIAL_LINKS)

const editor = useEditor({
  extensions: [
    StarterKit.configure({ heading: false }),
    Underline,
    Link.configure({ openOnClick: false }),
    TextAlign.configure({ types: ['paragraph'] }),
    InlineStyle,
    MergeTag,
  ],
  content: props.modelValue,
  onUpdate({ editor }) {
    emit('update:modelValue', editor.getHTML())
  },
})

watch(
  () => props.modelValue,
  (value) => {
    if (editor.value && editor.value.getHTML() !== value) {
      editor.value.commands.setContent(value, false)
    }
  },
)

const currentColor = computed(() => (editor.value?.getAttributes('inlineStyle').color as string) || '#000000')
const currentFontSize = computed(() => (editor.value?.getAttributes('inlineStyle').fontSize as string) || '')

function onColor(e: Event) {
  const color = (e.target as HTMLInputElement).value
  editor.value?.chain().focus().setInlineColor(color).run()
}
function onFontSize(e: Event) {
  const size = (e.target as HTMLSelectElement).value
  if (size) editor.value?.chain().focus().setInlineFontSize(size).run()
}
function clearFormat() {
  editor.value?.chain().focus().unsetAllMarks().clearNodes().run()
}

function setLink() {
  if (!editor.value) return
  const prev = editor.value.getAttributes('link').href as string | undefined
  const url = window.prompt(t('rte.linkPrompt'), prev ?? 'https://')
  if (url === null) return
  if (url === '') editor.value.chain().focus().unsetLink().run()
  else editor.value.chain().focus().setLink({ href: url }).run()
}

function onTagPick(e: Event) {
  const select = e.target as HTMLSelectElement
  const tag = flatTags.value.find((tg) => tg.value === select.value)
  if (tag && editor.value) insertMergeTag(editor.value, tag)
  select.value = ''
}

function onSpecialLink(e: Event) {
  const select = e.target as HTMLSelectElement
  const link = specialLinks.value[Number(select.value)]
  if (link && editor.value) editor.value.chain().focus().setLink({ href: link.href }).run()
  select.value = ''
}
</script>
