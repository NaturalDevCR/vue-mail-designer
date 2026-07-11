<template>
  <div :class="['email-builder', ui.themeClass]" @keydown="handleKeydown">
    <!-- Toolbar -->
    <Toolbar class="email-builder__toolbar" />
    
    <!-- Main Content Area -->
    <div class="email-builder__content">
      <!-- Left Sidebar - Palette -->
      <div 
        v-if="!ui.sidebarCollapsed" 
        class="email-builder__sidebar"
        :style="{ width: ui.panelDimensions.sidebarWidth + 'px' }"
      >
        <Palette />
      </div>
      
      <!-- Canvas Area -->
      <div class="email-builder__canvas-area">
        <Canvas />
      </div>
      
      <!-- Right Panel - Inspector -->
      <div 
        v-if="!ui.rightPanelCollapsed" 
        class="email-builder__inspector"
        :style="{ width: ui.panelDimensions.rightPanelWidth + 'px' }"
      >
        <Inspector />
      </div>
    </div>
    
    <!-- Status Bar -->
    <div class="email-builder__status-bar">
      <div class="status-info">
        <span class="status-item">{{ documentStats }}</span>
        <span class="status-item">Zoom: {{ ui.canvasZoomPercent }}</span>

      </div>
      
      <div class="status-actions">

        <button 
          @click="ui.togglePreview" 
          :class="['status-btn', { active: ui.showPreview }]"
          title="Toggle Preview"
        >
          Preview
        </button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue';
import { useDocumentStore } from '../stores/useDocumentStore';
import { useUiStore } from '../stores/useUiStore';
import Toolbar from './Toolbar.vue';
import Palette from './Palette.vue';
import Canvas from './Canvas.vue';
import Inspector from './Inspector.vue';

/**
 * Main EmailBuilder component props
 */
interface Props {
  /** Initial document data */
  initialDocument?: string;
  /** Theme preference */
  theme?: 'light' | 'dark';
  /** Disable certain features */
  readonly?: boolean;
  /** Custom CSS classes */
  class?: string;
}

const props = withDefaults(defineProps<Props>(), {
  theme: 'light',
  readonly: false
});

/**
 * Component emits
 */
interface Emits {
  /** Emitted when document changes */
  documentChange: [document: string];
  /** Emitted when selection changes */
  selectionChange: [selection: { nodeType?: string; id?: string }];
  /** Emitted when export is requested */
  export: [format: 'json' | 'html', data: string];
  /** Emitted when import is completed */
  import: [success: boolean];
}

const emit = defineEmits<Emits>();

// Stores
const documentStore = useDocumentStore();
const ui = useUiStore();

/**
 * Document statistics for status bar
 */
const documentStats = computed(() => {
  const rowCount = documentStore.document.rows.length;
  const columnCount = documentStore.document.rows.reduce(
    (total, row) => total + row.columns.length, 0
  );
  const blockCount = documentStore.document.rows.reduce(
    (total, row) => total + row.columns.reduce(
      (colTotal, col) => colTotal + col.blocks.length, 0
    ), 0
  );
  
  return `${rowCount} rows, ${columnCount} columns, ${blockCount} blocks`;
});

/**
 * Keyboard shortcut handler
 */
function handleKeydown(event: KeyboardEvent) {
  if (props.readonly) return;
  
  const key = event.key.toLowerCase();
  const ctrl = event.ctrlKey || event.metaKey;
  const shift = event.shiftKey;
  
  // Build shortcut string
  let shortcut = '';
  if (ctrl) shortcut += 'ctrl+';
  if (shift) shortcut += 'shift+';
  shortcut += key;
  
  // Handle shortcuts
  switch (shortcut) {
    case 'ctrl+z':
      event.preventDefault();
      documentStore.undo();
      break;
    case 'ctrl+y':
    case 'ctrl+shift+z':
      event.preventDefault();
      documentStore.redo();
      break;
    case 'delete':
    case 'backspace':
      if (documentStore.selection.id) {
        event.preventDefault();
        handleDelete();
      }
      break;
    case 'ctrl+d':
      if (documentStore.selection.id) {
        event.preventDefault();
        handleDuplicate();
      }
      break;
    case 'ctrl+s':
      event.preventDefault();
      handleExport('json');
      break;
    case 'ctrl+e':
      event.preventDefault();
      handleExport('html');
      break;
    case 'ctrl+plus':
    case 'ctrl+=':
      event.preventDefault();
      ui.zoomIn();
      break;
    case 'ctrl+minus':
    case 'ctrl+-':
      event.preventDefault();
      ui.zoomOut();
      break;
    case 'ctrl+0':
      event.preventDefault();
      ui.resetZoom();
      break;

    case 'ctrl+p':
      event.preventDefault();
      ui.togglePreview();
      break;
    case 'ctrl+t':
      event.preventDefault();
      ui.toggleTheme();
      break;
    case 'escape':
      documentStore.clearSelection();
      break;
  }
}

/**
 * Handle delete action based on selection
 */
function handleDelete() {
  const { nodeType, id } = documentStore.selection;
  if (!nodeType || !id) return;
  
  switch (nodeType) {
    case 'row':
      documentStore.removeRow(id);
      break;
    case 'column':
      documentStore.removeColumn(id);
      break;
    case 'block':
      documentStore.removeBlock(id);
      break;
  }
}

/**
 * Handle duplicate action based on selection
 */
function handleDuplicate() {
  const { nodeType, id } = documentStore.selection;
  if (!nodeType || !id) return;
  
  switch (nodeType) {
    case 'row':
      documentStore.duplicateRow(id);
      break;
    case 'column':
      documentStore.duplicateColumn(id);
      break;
    case 'block':
      documentStore.duplicateBlock(id);
      break;
  }
}

/**
 * Handle export action
 */
function handleExport(format: 'json' | 'html') {
  if (format === 'json') {
    const jsonData = documentStore.exportJson();
    emit('export', 'json', jsonData);
  } else {
    documentStore.exportHtml().then(htmlData => {
      emit('export', 'html', htmlData);
    });
  }
}

/**
 * Initialize component
 */
function initialize() {
  // Set initial theme
  if (props.theme) {
    ui.setTheme(props.theme);
  }
  
  // Load initial document
  if (props.initialDocument) {
    const success = documentStore.importDocument(props.initialDocument);
    emit('import', success);
  }
  
  // Initialize UI based on system preferences
  ui.initializeTheme();
  ui.updateScreenSize();
  ui.handleResponsiveLayout();
}

/**
 * Handle window resize for responsive layout
 */
function handleResize() {
  ui.updateScreenSize();
  ui.handleResponsiveLayout();
}

// Lifecycle
onMounted(() => {
  initialize();
  window.addEventListener('resize', handleResize);
  
  // Watch for document changes
  documentStore.$subscribe((_mutation, _state) => {
    emit('documentChange', documentStore.exportJson());
  });
  
  // Watch for selection changes
  documentStore.$subscribe((mutation, state) => {
    emit('selectionChange', {
      nodeType: state.selection.nodeType,
      id: state.selection.id
    });
  });
});

onUnmounted(() => {
  window.removeEventListener('resize', handleResize);
});

// Expose public methods
defineExpose({
  exportJson: () => documentStore.exportJson(),
  exportHtml: () => documentStore.exportHtml(),
  importDocument: (data: string) => documentStore.importDocument(data),
  newDocument: () => documentStore.newDocument(),
  undo: () => documentStore.undo(),
  redo: () => documentStore.redo(),
  getSelection: () => documentStore.selection,
  clearSelection: () => documentStore.clearSelection()
});
</script>

<style scoped>
.email-builder {
  display: flex;
  flex-direction: column;
  height: 100vh;
  width: 100%;
  background-color: var(--bg);
  color: var(--fg);
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  font-size: 14px;
  line-height: 1.5;
  overflow: hidden;
}

.email-builder__toolbar {
  flex-shrink: 0;
  border-bottom: 1px solid var(--border);
}

.email-builder__content {
  display: flex;
  flex: 1;
  min-height: 0;
}

.email-builder__sidebar {
  flex-shrink: 0;
  background-color: var(--panel);
  border-right: 1px solid var(--border);
  overflow-y: auto;
}

.email-builder__canvas-area {
  flex: 1;
  min-width: 0;
  background-color: var(--bg);
  overflow: hidden;
}

.email-builder__inspector {
  flex-shrink: 0;
  background-color: var(--panel);
  border-left: 1px solid var(--border);
  overflow-y: auto;
}

.email-builder__status-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  height: 30px;
  padding: 0 12px;
  background-color: var(--panel);
  border-top: 1px solid var(--border);
  font-size: 12px;
  flex-shrink: 0;
}

.status-info {
  display: flex;
  gap: 16px;
}

.status-item {
  color: var(--muted);
}

.status-actions {
  display: flex;
  gap: 8px;
}

.status-btn {
  padding: 4px 8px;
  border: none;
  background: transparent;
  color: var(--muted);
  cursor: pointer;
  border-radius: 3px;
  font-size: 11px;
  transition: all 0.2s ease;
}

.status-btn:hover {
  background-color: var(--border);
  color: var(--fg);
}

.status-btn.active {
  background-color: var(--accent);
  color: white;
}

/* Responsive design */
@media (max-width: 768px) {
  .email-builder__sidebar,
  .email-builder__inspector {
    position: absolute;
    top: 60px;
    bottom: 30px;
    z-index: 100;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
  
  .email-builder__sidebar {
    left: 0;
  }
  
  .email-builder__inspector {
    right: 0;
  }
}
</style>