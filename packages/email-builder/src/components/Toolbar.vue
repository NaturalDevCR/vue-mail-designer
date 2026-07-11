<template>
  <div class="toolbar">
    <!-- Left Section - Document Actions -->
    <div class="toolbar__section toolbar__section--left">
      <div class="toolbar__group">
        <button 
          @click="documentStore.newDocument" 
          class="toolbar__btn"
          title="New Document (Ctrl+N)"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/>
            <polyline points="14,2 14,8 20,8"/>
            <line x1="12" y1="18" x2="12" y2="12"/>
            <line x1="9" y1="15" x2="15" y2="15"/>
          </svg>
          New
        </button>
        
        <button 
          @click="handleImport" 
          class="toolbar__btn"
          title="Import JSON (Ctrl+O)"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7,10 12,15 17,10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          Import
        </button>
        
        <div class="toolbar__dropdown">
          <button 
            @click="toggleExportDropdown" 
            class="toolbar__btn toolbar__btn--dropdown"
            title="Export Document"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17,8 12,3 7,8"/>
              <line x1="12" y1="3" x2="12" y2="15"/>
            </svg>
            Export
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="6,9 12,15 18,9"/>
            </svg>
          </button>
          
          <div v-if="showExportDropdown" class="toolbar__dropdown-menu">
            <button @click="handleExport('json')" class="toolbar__dropdown-item">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                <polyline points="14,2 14,8 20,8"/>
                <line x1="16" y1="13" x2="8" y2="13"/>
                <line x1="16" y1="17" x2="8" y2="17"/>
                <polyline points="10,9 9,9 8,9"/>
              </svg>
              Export JSON
            </button>
            <button @click="handleExport('html')" class="toolbar__dropdown-item">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="16,18 22,12 16,6"/>
                <polyline points="8,6 2,12 8,18"/>
              </svg>
              Export HTML
            </button>
          </div>
        </div>
      </div>
      
      <div class="toolbar__separator"></div>
      
      <!-- Undo/Redo -->
      <div class="toolbar__group">
        <button 
          @click="documentStore.undo" 
          :disabled="!documentStore.canUndo"
          class="toolbar__btn"
          title="Undo (Ctrl+Z)"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="1,4 1,10 7,10"/>
            <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10"/>
          </svg>
        </button>
        
        <button 
          @click="documentStore.redo" 
          :disabled="!documentStore.canRedo"
          class="toolbar__btn"
          title="Redo (Ctrl+Y)"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="23,4 23,10 17,10"/>
            <path d="M20.49 15a9 9 0 1 1-2.13-9.36L23 10"/>
          </svg>
        </button>
      </div>
    </div>
    
    <!-- Center Section - Document Title -->
    <div class="toolbar__section toolbar__section--center">
      <input 
        v-model="documentTitle"
        @blur="updateDocumentTitle"
        @keydown.enter="$event.target.blur()"
        class="toolbar__title-input"
        placeholder="Untitled Email"
      />
    </div>
    
    <!-- Right Section - View Controls -->
    <div class="toolbar__section toolbar__section--right">
      <!-- Zoom Controls -->
      <div class="toolbar__group">
        <button 
          @click="ui.zoomOut" 
          class="toolbar__btn toolbar__btn--small"
          title="Zoom Out (Ctrl+-)"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/>
            <path d="M21 21l-4.35-4.35"/>
            <line x1="8" y1="11" x2="14" y2="11"/>
          </svg>
        </button>
        
        <span class="toolbar__zoom-display">{{ ui.canvasZoomPercent }}</span>
        
        <button 
          @click="ui.zoomIn" 
          class="toolbar__btn toolbar__btn--small"
          title="Zoom In (Ctrl++)"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="11" cy="11" r="8"/>
            <path d="M21 21l-4.35-4.35"/>
            <line x1="11" y1="8" x2="11" y2="14"/>
            <line x1="8" y1="11" x2="14" y2="11"/>
          </svg>
        </button>
        
        <button 
          @click="ui.resetZoom" 
          class="toolbar__btn toolbar__btn--small"
          title="Reset Zoom (Ctrl+0)"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
        </button>
      </div>
      
      <div class="toolbar__separator"></div>
      
      <!-- View Options -->
      <div class="toolbar__group">

        <button 
          @click="ui.togglePreview" 
          :class="['toolbar__btn', 'toolbar__btn--toggle', { active: ui.showPreview }]"
          title="Toggle Preview (Ctrl+P)"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
        </button>
        
        <button 
          @click="ui.toggleTheme" 
          class="toolbar__btn"
          title="Toggle Theme (Ctrl+T)"
        >
          <svg v-if="ui.isDarkTheme" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="5"/>
            <line x1="12" y1="1" x2="12" y2="3"/>
            <line x1="12" y1="21" x2="12" y2="23"/>
            <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
            <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
            <line x1="1" y1="12" x2="3" y2="12"/>
            <line x1="21" y1="12" x2="23" y2="12"/>
            <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
            <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
          </svg>
          <svg v-else width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/>
          </svg>
        </button>
      </div>
      
      <div class="toolbar__separator"></div>
      
      <!-- Panel Toggles -->
      <div class="toolbar__group">
        <button 
          @click="ui.toggleSidebar" 
          :class="['toolbar__btn', 'toolbar__btn--toggle', { active: !ui.sidebarCollapsed }]"
          title="Toggle Sidebar"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
            <line x1="9" y1="3" x2="9" y2="21"/>
          </svg>
        </button>
        
        <button 
          @click="ui.toggleRightPanel" 
          :class="['toolbar__btn', 'toolbar__btn--toggle', { active: !ui.rightPanelCollapsed }]"
          title="Toggle Inspector"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
            <line x1="15" y1="3" x2="15" y2="21"/>
          </svg>
        </button>
      </div>
    </div>
    
    <!-- Hidden file input for import -->
    <input 
      ref="fileInput"
      type="file"
      accept=".json"
      @change="handleFileImport"
      style="display: none;"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useDocumentStore } from '../stores/useDocumentStore';
import { useUiStore } from '../stores/useUiStore';

// Stores
const documentStore = useDocumentStore();
const ui = useUiStore();

// Refs
const fileInput = ref<HTMLInputElement>();
const showExportDropdown = ref(false);

// Document title
const documentTitle = computed({
  get: () => documentStore.document.meta?.name || 'Untitled Email',
  set: (value: string) => {
    if (documentStore.document.meta) {
      documentStore.document.meta.name = value;
    }
  }
});

/**
 * Update document title and commit to history
 */
function updateDocumentTitle() {
  documentStore.commit();
  if (documentStore.document.meta) {
    documentStore.document.meta.updatedAt = new Date().toISOString();
  }
}

/**
 * Handle import button click
 */
function handleImport() {
  fileInput.value?.click();
}

/**
 * Handle file import from input
 */
function handleFileImport(event: Event) {
  const target = event.target as HTMLInputElement;
  const file = target.files?.[0];
  
  if (!file) return;
  
  const reader = new FileReader();
  reader.onload = (e) => {
    const content = e.target?.result as string;
    if (content) {
      const success = documentStore.importDocument(content);
      if (!success) {
        alert('Failed to import document. Please check the file format.');
      }
    }
  };
  reader.readAsText(file);
  
  // Reset input
  target.value = '';
}

/**
 * Toggle export dropdown
 */
function toggleExportDropdown() {
  showExportDropdown.value = !showExportDropdown.value;
}

/**
 * Handle export action
 */
function handleExport(format: 'json' | 'html') {
  showExportDropdown.value = false;
  
  if (format === 'json') {
    const jsonData = documentStore.exportJson();
    downloadFile(jsonData, `${documentTitle.value}.json`, 'application/json');
  } else {
    documentStore.exportHtml().then(htmlData => {
      downloadFile(htmlData, `${documentTitle.value}.html`, 'text/html');
    });
  }
}

/**
 * Download file helper
 */
function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  
  URL.revokeObjectURL(url);
}

/**
 * Close dropdown when clicking outside
 */
function handleClickOutside(event: MouseEvent) {
  const target = event.target as HTMLElement;
  if (!target.closest('.toolbar__dropdown')) {
    showExportDropdown.value = false;
  }
}

// Lifecycle
onMounted(() => {
  document.addEventListener('click', handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside);
});
</script>

<style scoped>
.toolbar {
  display: flex;
  align-items: center;
  height: 60px;
  padding: 0 16px;
  background-color: var(--panel);
  border-bottom: 1px solid var(--border);
  gap: 16px;
}

.toolbar__section {
  display: flex;
  align-items: center;
  gap: 12px;
}

.toolbar__section--left {
  flex-shrink: 0;
}

.toolbar__section--center {
  flex: 1;
  justify-content: center;
}

.toolbar__section--right {
  flex-shrink: 0;
}

.toolbar__group {
  display: flex;
  align-items: center;
  gap: 4px;
}

.toolbar__btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border: none;
  background: transparent;
  color: var(--fg);
  cursor: pointer;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  transition: all 0.2s ease;
  white-space: nowrap;
}

.toolbar__btn:hover {
  background-color: var(--border);
}

.toolbar__btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.toolbar__btn:disabled:hover {
  background: transparent;
}

.toolbar__btn--small {
  padding: 6px 8px;
  font-size: 12px;
}

.toolbar__btn--toggle.active {
  background-color: var(--accent);
  color: white;
}

.toolbar__btn--dropdown {
  position: relative;
}

.toolbar__dropdown {
  position: relative;
}

.toolbar__dropdown-menu {
  position: absolute;
  top: 100%;
  left: 0;
  min-width: 160px;
  background-color: var(--panel);
  border: 1px solid var(--border);
  border-radius: 6px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  z-index: 1000;
  margin-top: 4px;
}

.toolbar__dropdown-item {
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  padding: 10px 12px;
  border: none;
  background: transparent;
  color: var(--fg);
  cursor: pointer;
  font-size: 13px;
  text-align: left;
  transition: background-color 0.2s ease;
}

.toolbar__dropdown-item:hover {
  background-color: var(--border);
}

.toolbar__dropdown-item:first-child {
  border-radius: 6px 6px 0 0;
}

.toolbar__dropdown-item:last-child {
  border-radius: 0 0 6px 6px;
}

.toolbar__separator {
  width: 1px;
  height: 24px;
  background-color: var(--border);
  margin: 0 8px;
}

.toolbar__title-input {
  padding: 8px 12px;
  border: 1px solid transparent;
  background: transparent;
  color: var(--fg);
  font-size: 14px;
  font-weight: 600;
  text-align: center;
  border-radius: 4px;
  min-width: 200px;
  max-width: 300px;
  transition: all 0.2s ease;
}

.toolbar__title-input:hover {
  border-color: var(--border);
  background-color: var(--bg);
}

.toolbar__title-input:focus {
  outline: none;
  border-color: var(--accent);
  background-color: var(--bg);
}

.toolbar__zoom-display {
  min-width: 40px;
  text-align: center;
  font-size: 12px;
  color: var(--muted);
  font-weight: 500;
}

/* Responsive design */
@media (max-width: 768px) {
  .toolbar {
    padding: 0 8px;
    gap: 8px;
  }
  
  .toolbar__section--center {
    display: none;
  }
  
  .toolbar__btn {
    padding: 6px 8px;
    font-size: 12px;
  }
  
  .toolbar__btn svg {
    width: 14px;
    height: 14px;
  }
  
  .toolbar__separator {
    margin: 0 4px;
  }
}
</style>