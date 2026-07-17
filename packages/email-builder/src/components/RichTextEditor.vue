<template>
  <div class="vmd-rte" @click.stop>
    <div class="vmd-rte-toolbar">
      <button type="button" class="vmd-mini-btn" :class="{ 'vmd-active': editor?.isActive('bold') }" @click="editor?.chain().focus().toggleBold().run()"><b>B</b></button>
      <button type="button" class="vmd-mini-btn" :class="{ 'vmd-active': editor?.isActive('italic') }" @click="editor?.chain().focus().toggleItalic().run()"><i>I</i></button>
      <button type="button" class="vmd-mini-btn" :class="{ 'vmd-active': editor?.isActive('underline') }" @click="editor?.chain().focus().toggleUnderline().run()"><u>U</u></button>
      <button type="button" class="vmd-mini-btn" @click="editor?.chain().focus().setTextAlign('left').run()">⇤</button>
      <button type="button" class="vmd-mini-btn" @click="editor?.chain().focus().setTextAlign('center').run()">↔</button>
      <button type="button" class="vmd-mini-btn" @click="editor?.chain().focus().setTextAlign('right').run()">⇥</button>
      <button type="button" class="vmd-mini-btn" @click="setLink">🔗</button>
      <select v-if="options.mergeTags.length" class="vmd-rte-tags" @change="onTagPick">
        <option value="">Variable…</option>
        <option v-for="t in options.mergeTags" :key="t.value" :value="t.value">{{ t.name }}</option>
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
import { watch } from 'vue'
import { MergeTag, insertMergeTag } from '../editor/mergeTag'
import { useBuilderOptions } from '../options'

const props = defineProps<{ modelValue: string }>()
const emit = defineEmits<{ 'update:modelValue': [value: string] }>()
const options = useBuilderOptions()

const editor = useEditor({
  extensions: [
    StarterKit.configure({ heading: false }),
    Underline,
    Link.configure({ openOnClick: false }),
    TextAlign.configure({ types: ['paragraph'] }),
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

function setLink() {
  if (!editor.value) return
  const prev = editor.value.getAttributes('link').href as string | undefined
  const url = window.prompt('URL del enlace', prev ?? 'https://')
  if (url === null) return
  if (url === '') editor.value.chain().focus().unsetLink().run()
  else editor.value.chain().focus().setLink({ href: url }).run()
}

function onTagPick(e: Event) {
  const select = e.target as HTMLSelectElement
  const tag = options.mergeTags.find((t) => t.value === select.value)
  if (tag && editor.value) insertMergeTag(editor.value, tag)
  select.value = ''
}
</script>
