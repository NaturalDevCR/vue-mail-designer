<template>
  <div class="quilly-text-editor">
    <div class="editor-container">
      <QuillyEditor
        ref="editor"
        v-model="content"
        :options="editorOptions"
        @update:modelValue="handleContentChange"
        @ready="handleEditorReady"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue';
import Quill from 'quill';
import { QuillyEditor } from 'vue-quilly';
import 'quill/dist/quill.snow.css';

/**
 * Component props
 */
interface Props {
  modelValue: string;
  placeholder?: string;
  readonly?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  placeholder: 'Enter your text here...',
  readonly: false
});

/**
 * Component emits
 */
interface Emits {
  'update:modelValue': [value: string];
}

const emit = defineEmits<Emits>();

// Refs
const editor = ref<InstanceType<typeof QuillyEditor>>();
const content = ref(props.modelValue);
let quill: Quill | null = null;

/**
 * Quill editor options
 */
const editorOptions = computed(() => ({
  theme: 'snow',
  modules: {
    toolbar: [
      ['bold', 'italic', 'underline'],
      [{ 'align': [] }],
      [{ 'list': 'ordered'}, { 'list': 'bullet' }],
      ['link'],
      ['clean']
    ]
  },
  placeholder: props.placeholder,
  readOnly: props.readonly
}));

/**
 * Handle content changes
 */
function handleContentChange(value: string) {
  emit('update:modelValue', value);
}

/**
 * Handle editor ready event
 */
function handleEditorReady(quilInstance: Quill) {
  quill = quilInstance;
}

/**
 * Focus the editor
 */
function focus() {
  if (quill) {
    quill.focus();
  }
}

/**
 * Get clean HTML output
 */
function getSemanticHTML(): string {
  if (quill) {
    return quill.getSemanticHTML();
  }
  return content.value;
}

// Watch for prop changes
watch(() => props.modelValue, (newValue) => {
  if (newValue !== content.value) {
    content.value = newValue;
  }
});

// Initialize editor
onMounted(() => {
  if (editor.value) {
    quill = editor.value.initialize(Quill);
  }
});

// Expose methods
defineExpose({
  focus,
  getSemanticHTML
});
</script>

<style scoped>
.quilly-text-editor {
  border: 1px solid var(--border);
  border-radius: 6px;
  overflow: hidden;
  background: var(--panel);
}

.editor-container {
  min-height: 120px;
}

/* Override Quill styles to match theme */
:deep(.ql-toolbar) {
  border: none;
  border-bottom: 1px solid var(--border);
  background: var(--panel);
  padding: 8px 12px;
}

:deep(.ql-container) {
  border: none;
  font-family: inherit;
  font-size: 14px;
  line-height: 1.5;
}

:deep(.ql-editor) {
  padding: 12px;
  color: var(--fg);
  background: var(--panel);
  min-height: 80px;
}

:deep(.ql-editor.ql-blank::before) {
  color: var(--muted);
  font-style: normal;
}

:deep(.ql-toolbar .ql-stroke) {
  stroke: var(--fg);
}

:deep(.ql-toolbar .ql-fill) {
  fill: var(--fg);
}

:deep(.ql-toolbar button:hover) {
  background: var(--border);
}

:deep(.ql-toolbar button.ql-active) {
  background: var(--accent);
  color: white;
}

:deep(.ql-toolbar button.ql-active .ql-stroke) {
  stroke: white;
}

:deep(.ql-toolbar button.ql-active .ql-fill) {
  fill: white;
}
</style>