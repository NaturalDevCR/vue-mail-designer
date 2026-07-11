<template>
  <div 
    v-if="visible"
    class="rich-text-editor-overlay"
    @click.stop
    @mousedown.stop
    @dragstart.stop.prevent
    @drag.stop.prevent
  >
    <div class="rich-text-editor">
      <!-- Toolbar -->
      <div class="editor-toolbar">
        <div class="toolbar-group">
          <button 
            @click.stop.prevent="editor?.chain().focus().toggleBold().run()"
            @mousedown.stop.prevent
            @dragstart.stop.prevent
            :class="['toolbar-btn', { active: editor?.isActive('bold') }]"
            title="Bold"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M6 4h8a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/>
              <path d="M6 12h9a4 4 0 0 1 4 4 4 4 0 0 1-4 4H6z"/>
            </svg>
          </button>
          
          <button 
            @click.stop.prevent="editor?.chain().focus().toggleItalic().run()"
            @mousedown.stop.prevent
            @dragstart.stop.prevent
            :class="['toolbar-btn', { active: editor?.isActive('italic') }]"
            title="Italic"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="19" y1="4" x2="10" y2="4"/>
              <line x1="14" y1="20" x2="5" y2="20"/>
              <line x1="15" y1="4" x2="9" y2="20"/>
            </svg>
          </button>
          
          <button 
            @click.stop.prevent="editor?.chain().focus().toggleUnderline().run()"
            @mousedown.stop.prevent
            @dragstart.stop.prevent
            :class="['toolbar-btn', { active: editor?.isActive('underline') }]"
            title="Underline"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M6 4v6a6 6 0 0 0 12 0V4"/>
              <line x1="4" y1="20" x2="20" y2="20"/>
            </svg>
          </button>
        </div>
        
        <div class="toolbar-separator"></div>
        
        <div class="toolbar-group">
          <button 
            @click.stop.prevent="editor?.chain().focus().setTextAlign('left').run()"
            @mousedown.stop.prevent
            @dragstart.stop.prevent
            :class="['toolbar-btn', { active: editor?.isActive({ textAlign: 'left' }) }]"
            title="Align Left"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="17" y1="10" x2="3" y2="10"/>
              <line x1="21" y1="6" x2="3" y2="6"/>
              <line x1="21" y1="14" x2="3" y2="14"/>
              <line x1="17" y1="18" x2="3" y2="18"/>
            </svg>
          </button>
          
          <button 
            @click.stop.prevent="editor?.chain().focus().setTextAlign('center').run()"
            @mousedown.stop.prevent
            @dragstart.stop.prevent
            :class="['toolbar-btn', { active: editor?.isActive({ textAlign: 'center' }) }]"
            title="Align Center"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="10" x2="6" y2="10"/>
              <line x1="21" y1="6" x2="3" y2="6"/>
              <line x1="21" y1="14" x2="3" y2="14"/>
              <line x1="18" y1="18" x2="6" y2="18"/>
            </svg>
          </button>
          
          <button 
            @click.stop.prevent="editor?.chain().focus().setTextAlign('right').run()"
            @mousedown.stop.prevent
            @dragstart.stop.prevent
            :class="['toolbar-btn', { active: editor?.isActive({ textAlign: 'right' }) }]"
            title="Align Right"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="21" y1="10" x2="7" y2="10"/>
              <line x1="21" y1="6" x2="3" y2="6"/>
              <line x1="21" y1="14" x2="3" y2="14"/>
              <line x1="21" y1="18" x2="7" y2="18"/>
            </svg>
          </button>
        </div>
        
        <div class="toolbar-separator"></div>
        
        <div class="toolbar-group">
          <button 
            @click.stop.prevent="editor?.chain().focus().toggleBulletList().run()"
            @mousedown.stop.prevent
            @dragstart.stop.prevent
            :class="['toolbar-btn', { active: editor?.isActive('bulletList') }]"
            title="Bullet List"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="8" y1="6" x2="21" y2="6"/>
              <line x1="8" y1="12" x2="21" y2="12"/>
              <line x1="8" y1="18" x2="21" y2="18"/>
              <line x1="3" y1="6" x2="3.01" y2="6"/>
              <line x1="3" y1="12" x2="3.01" y2="12"/>
              <line x1="3" y1="18" x2="3.01" y2="18"/>
            </svg>
          </button>
          
          <button 
            @click.stop.prevent="editor?.chain().focus().toggleOrderedList().run()"
            @mousedown.stop.prevent
            @dragstart.stop.prevent
            :class="['toolbar-btn', { active: editor?.isActive('orderedList') }]"
            title="Numbered List"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="10" y1="6" x2="21" y2="6"/>
              <line x1="10" y1="12" x2="21" y2="12"/>
              <line x1="10" y1="18" x2="21" y2="18"/>
              <path d="M4 6h1v4"/>
              <path d="M4 10h2"/>
              <path d="M6 18H4c0-1 2-2 2-3s-1-1.5-2-1"/>
            </svg>
          </button>
        </div>
        
        <div class="toolbar-actions">
          <button 
            @click.stop.prevent="saveAndClose"
            @mousedown.stop.prevent
            @dragstart.stop.prevent
            class="toolbar-btn toolbar-btn--primary"
            title="Save"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="20,6 9,17 4,12"/>
            </svg>
          </button>
          
          <button 
            @click.stop.prevent="cancel"
            @mousedown.stop.prevent
            @dragstart.stop.prevent
            class="toolbar-btn toolbar-btn--secondary"
            title="Cancel"
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"/>
              <line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      </div>
      
      <!-- Editor Content -->
      <div 
        class="editor-content"
        @mousedown.stop
        @dragstart.stop.prevent
        @drag.stop.prevent
      >
        <EditorContent :editor="editor" />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted, onBeforeUnmount } from 'vue';
import { Editor, EditorContent } from '@tiptap/vue-3';
import StarterKit from '@tiptap/starter-kit';
import { TextAlign } from '@tiptap/extension-text-align';
import { Underline } from '@tiptap/extension-underline';

/**
 * Component props
 */
interface Props {
  visible: boolean;
  content: string;
  position?: { x: number; y: number };
}

const props = withDefaults(defineProps<Props>(), {
  position: () => ({ x: 0, y: 0 })
});

/**
 * Component emits
 */
interface Emits {
  save: [content: string];
  cancel: [];
  close: [];
}

const emit = defineEmits<Emits>();

// Editor instance
const editor = ref<Editor>();

/**
 * Initialize TipTap editor
 */
function initializeEditor() {
  editor.value = new Editor({
    extensions: [
      StarterKit.configure({
        // Disable default heading levels for email compatibility
        heading: false,
        // Configure other extensions for email compatibility
        codeBlock: false,
        blockquote: false,
      }),
      TextAlign.configure({
        types: ['heading', 'paragraph'],
        alignments: ['left', 'center', 'right'],
        defaultAlignment: 'left',
      }),
      Underline,
    ],
    content: props.content,
    editorProps: {
      attributes: {
        class: 'prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none',
      },
    },
    onUpdate: ({ editor: _editor }) => {
      // Optional: emit content changes in real-time
      // emit('update', _editor.getHTML());
    },
  });
}

/**
 * Save content and close editor
 */
function saveAndClose() {
  if (editor.value) {
    const content = editor.value.getHTML();
    emit('save', content);
    emit('close');
  }
}

/**
 * Cancel editing and close editor
 */
function cancel() {
  emit('cancel');
  emit('close');
}

/**
 * Handle escape key to close editor
 */
function handleKeydown(event: KeyboardEvent) {
  if (event.key === 'Escape') {
    cancel();
  } else if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
    saveAndClose();
  }
}

// Watch for content changes
watch(() => props.content, (newContent) => {
  if (editor.value && newContent !== editor.value.getHTML()) {
    editor.value.commands.setContent(newContent);
  }
});

// Watch for visibility changes
watch(() => props.visible, (visible) => {
  if (visible) {
    document.addEventListener('keydown', handleKeydown);
    // Focus editor after a short delay to ensure it's rendered
    setTimeout(() => {
      editor.value?.commands.focus();
    }, 100);
  } else {
    document.removeEventListener('keydown', handleKeydown);
  }
});

// Lifecycle hooks
onMounted(() => {
  initializeEditor();
});

onBeforeUnmount(() => {
  document.removeEventListener('keydown', handleKeydown);
  editor.value?.destroy();
});
</script>

<style scoped>
.rich-text-editor-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  backdrop-filter: blur(2px);
}

.rich-text-editor {
  background: var(--panel);
  border: 1px solid var(--border);
  border-radius: 8px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  width: 90vw;
  max-width: 600px;
  max-height: 80vh;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.editor-toolbar {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border);
  background: var(--panel);
  flex-wrap: wrap;
}

.toolbar-group {
  display: flex;
  gap: 2px;
}

.toolbar-separator {
  width: 1px;
  height: 20px;
  background: var(--border);
  margin: 0 4px;
}

.toolbar-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: 1px solid transparent;
  background: transparent;
  color: var(--muted);
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s ease;
}

.toolbar-btn:hover {
  background-color: var(--border);
  color: var(--fg);
}

.toolbar-btn.active {
  background-color: var(--accent);
  color: white;
  border-color: var(--accent);
}

.toolbar-btn--primary {
  background-color: var(--accent);
  color: white;
  border-color: var(--accent);
}

.toolbar-btn--primary:hover {
  background-color: var(--accent);
  opacity: 0.9;
}

.toolbar-btn--secondary {
  border-color: var(--border);
}

.toolbar-actions {
  margin-left: auto;
  display: flex;
  gap: 8px;
}

.editor-content {
  flex: 1;
  overflow-y: auto;
  padding: 16px;
  min-height: 200px;
  max-height: 400px;
}

/* TipTap editor styles */
:deep(.ProseMirror) {
  outline: none;
  font-family: inherit;
  font-size: 14px;
  line-height: 1.5;
  color: var(--fg);
}

:deep(.ProseMirror p) {
  margin: 0 0 8px 0;
}

:deep(.ProseMirror p:last-child) {
  margin-bottom: 0;
}

:deep(.ProseMirror ul, .ProseMirror ol) {
  margin: 8px 0;
  padding-left: 20px;
}

:deep(.ProseMirror li) {
  margin: 4px 0;
}

:deep(.ProseMirror strong) {
  font-weight: 600;
}

:deep(.ProseMirror em) {
  font-style: italic;
}

:deep(.ProseMirror u) {
  text-decoration: underline;
}

/* Responsive design */
@media (max-width: 768px) {
  .rich-text-editor {
    width: 95vw;
    max-height: 90vh;
  }
  
  .editor-toolbar {
    padding: 8px 12px;
    gap: 4px;
  }
  
  .toolbar-btn {
    width: 28px;
    height: 28px;
  }
  
  .editor-content {
    padding: 12px;
  }
}
</style>