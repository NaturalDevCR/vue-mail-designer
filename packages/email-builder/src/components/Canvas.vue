<template>
  <div class="canvas">
    <!-- Canvas Header -->
    <div class="canvas__header">
      <div class="canvas__controls">
        <!-- Device Preview Toggles -->
        <div class="device-controls">
          <button
            v-for="device in devices"
            :key="device.key"
            @click="ui.setPreviewDevice(device.key)"
            :class="['device-btn', { active: ui.previewDevice === device.key }]"
            :title="`Preview as ${device.name}`"
          >
            <component :is="device.icon" />
            <span class="device-label">{{ device.name }}</span>
          </button>
        </div>

        <div class="canvas__actions">
          <button
            @click="ui.togglePreview"
            :class="['canvas__btn', { active: ui.showPreview }]"
            title="Toggle Preview Mode"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          </button>
        </div>
      </div>
    </div>

    <!-- Canvas Content -->
    <div class="canvas__content" ref="canvasContent">
      <div class="canvas__viewport" :style="viewportStyles">
        <!-- Email Document using Vuemail Html as foundation -->
        <Html
          lang="en"
          dir="ltr"
          :class="[
            'email-document',
            {
              'preview-mode': ui.showPreview,
            },
          ]"
          :style="documentStyles"
          @click="handleCanvasClick"
        >
          <Head>
            <meta charset="utf-8" />
            <meta
              name="viewport"
              content="width=device-width, initial-scale=1.0"
            />
            <meta name="x-apple-disable-message-reformatting" />
            <title>
              {{ documentStore.document.meta?.title || "Email Template" }}
            </title>
          </Head>

          <Body :style="bodyStyles">
            <!-- Empty State -->
            <div
              v-if="documentStore.document.rows.length === 0"
              class="empty-state"
              @dragover="handleDragOver"
              @drop="handleDrop"
            >
              <div class="empty-state__content">
                <svg
                  width="64"
                  height="64"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  stroke-width="1"
                >
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
                  <line x1="9" y1="9" x2="15" y2="9" />
                  <line x1="9" y1="15" x2="15" y2="15" />
                </svg>
                <h3>Start Building Your Email</h3>
                <p>
                  Drag elements from the palette to begin creating your email
                  template.
                </p>
                <button @click="addFirstRow" class="empty-state__btn">
                  Add Your First Row
                </button>
              </div>
            </div>

            <!-- Document Rows using Vuemail Container -->
            <Container
              v-else
              :style="containerStyles"
              @dragover="handleDragOver"
              @drop="handleDrop"
            >
              <div ref="rowsContainer" class="rows-container">
                <div
                  v-for="(row, index) in documentStore.document.rows"
                  :key="row.id"
                  :data-swapy-slot="`row-${index}`"
                  class="row-slot"
                >
                  <RowNode
                    :data-swapy-item="row.id"
                    :row="row"
                    :index="index"
                    :selected="isSelected('row', row.id)"
                    @select="selectElement('row', row.id)"
                    @delete="deleteRow(row.id)"
                    @duplicate="duplicateRow(row.id)"
                    @move-up="moveRowUp(index)"
                    @move-down="moveRowDown(index)"
                  />
                </div>
              </div>
            </Container>
          </Body>
        </Html>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useDocumentStore } from "../stores/useDocumentStore";
import { useUiStore } from "../stores/useUiStore";
import { createSwapy } from "swapy";
import RowNode from "./nodes/RowNode.vue";
import { Html, Head, Body, Container } from "@vue-email/components";

// Stores
const documentStore = useDocumentStore();
const ui = useUiStore();

// Refs
const canvasContent = ref<HTMLElement>();
const rowsContainer = ref<HTMLElement>();
let swapy: ReturnType<typeof createSwapy> | null = null;

// Device configurations
const devices = [
  {
    key: "desktop" as const,
    name: "Desktop",
    icon: "DesktopIcon",
  },
  {
    key: "tablet" as const,
    name: "Tablet",
    icon: "TabletIcon",
  },
  {
    key: "mobile" as const,
    name: "Mobile",
    icon: "MobileIcon",
  },
];

/**
 * Viewport styles based on device selection and zoom
 */
const viewportStyles = computed(() => {
  const device = ui.currentDeviceBreakpoint;
  const zoom = ui.canvasZoom / 100;

  return {
    width: device.width,
    maxWidth: device.maxWidth,
    transform: `scale(${zoom})`,
    transformOrigin: "top center",
  };
});

/**
 * Document container styles for Vuemail Html component
 */
const documentStyles = computed(() => {
  return {
    minHeight: "600px",
    backgroundColor: "#ffffff",
    position: "relative" as const,
    fontFamily: "Arial, sans-serif",
  };
});

/**
 * Body styles for Vuemail Body component
 */
const bodyStyles = computed(() => {
  return {
    margin: "0",
    padding: "0",
    backgroundColor: "#ffffff",
    fontFamily: "Arial, sans-serif",
    fontSize: "14px",
    lineHeight: "1.4",
    color: "#333333",
  };
});

/**
 * Container styles for Vuemail Container component
 */
const containerStyles = computed(() => {
  return {
    maxWidth: "600px",
    margin: "0 auto",
    backgroundColor: "#ffffff",
  };
});

/**
 * Check if an element is selected
 */
function isSelected(nodeType: string, id: string): boolean {
  return (
    documentStore.selection.nodeType === nodeType &&
    documentStore.selection.id === id
  );
}

/**
 * Select an element
 */
function selectElement(nodeType: string, id: string) {
  documentStore.select(nodeType as "row" | "column" | "block", id);
}

/**
 * Handle canvas click to clear selection
 */
function handleCanvasClick(event: MouseEvent) {
  if (event.target === event.currentTarget) {
    documentStore.clearSelection();
  }
}

/**
 * Add the first row to an empty document
 */
function addFirstRow() {
  const rowId = documentStore.addRow();
  // Add a default column to the new row
  documentStore.addColumn(rowId, 12);
}

/**
 * Delete a row
 */
function deleteRow(rowId: string) {
  if (ui.preferences.confirmDelete) {
    if (!confirm("Are you sure you want to delete this row?")) {
      return;
    }
  }
  documentStore.removeRow(rowId);
}

/**
 * Duplicate a row
 */
function duplicateRow(rowId: string) {
  documentStore.duplicateRow(rowId);
}

/**
 * Move row up
 */
function moveRowUp(index: number) {
  if (index > 0) {
    documentStore.moveRow(index, index - 1);
  }
}

/**
 * Move row down
 */
function moveRowDown(index: number) {
  if (index < documentStore.document.rows.length - 1) {
    documentStore.moveRow(index, index + 1);
  }
}

/**
 * Handle drag over event
 */
function handleDragOver(event: DragEvent) {
  event.preventDefault();
  if (event.dataTransfer) {
    event.dataTransfer.dropEffect = "copy";
  }
}

/**
 * Handle drop event from Palette
 */
function handleDrop(event: DragEvent) {
  event.preventDefault();
  event.stopPropagation(); // Prevent bubbling

  if (!event.dataTransfer) return;

  try {
    const dragData = JSON.parse(event.dataTransfer.getData("application/json"));

    if (dragData.source === "palette") {
      if (dragData.type === "row") {
        // Add a new row
        const rowId = documentStore.addRow();
        // Add a default column to the new row
        documentStore.addColumn(rowId, 12);
      } else {
        // For blocks, we need to add them to an existing column
        // If no rows exist, create one first
        if (documentStore.document.rows.length === 0) {
          const rowId = documentStore.addRow();
          const columnId = documentStore.addColumn(rowId, 12);
          documentStore.addBlock(columnId, dragData.type);
        } else {
          // Add to the first available column
          const firstRow = documentStore.document.rows[0];
          if (firstRow.columns.length > 0) {
            documentStore.addBlock(firstRow.columns[0].id, dragData.type);
          }
        }
      }
    }
  } catch (error) {
    // Silently handle invalid drag data
  }
}

/**
 * Initialize Swapy for row drag and drop
 */
function initializeSwapy() {
  if (rowsContainer.value && !swapy) {
    swapy = createSwapy(rowsContainer.value, {
      animation: "dynamic",
    });

    // Handle swap events to update document store
    swapy.onSwap(({ data }: { data: { object: Record<string, string> } }) => {
      const newOrder: string[] = [];
      const slotKeys = Object.keys(data.object).sort((a, b) => {
        const aIndex = parseInt(a.replace("row-", ""));
        const bIndex = parseInt(b.replace("row-", ""));
        return aIndex - bIndex;
      });

      slotKeys.forEach((slotKey) => {
        const rowId = data.object[slotKey];
        if (rowId) {
          newOrder.push(rowId);
        }
      });

      // Update document store with new row order
      documentStore.reorderRows(newOrder);
      documentStore.commit();
    });
  }
}

// Device preview icons (currently unused but kept for future implementation)
// const DesktopIcon = `<svg>...</svg>`;
// const TabletIcon = `<svg>...</svg>`;
// const MobileIcon = `<svg>...</svg>`;

// Lifecycle
onMounted(() => {
  // Initialize Swapy after component is mounted
  setTimeout(() => {
    initializeSwapy();
  }, 100);
});

onUnmounted(() => {
  // Cleanup Swapy instance
  if (swapy) {
    swapy.destroy();
    swapy = null;
  }
});
</script>

<style scoped>
/* Canvas Styles */
.canvas {
  display: flex;
  flex-direction: column;
  height: 100%;
  background-color: var(--bg);
}

.canvas__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  border-bottom: 1px solid var(--border);
  background-color: var(--panel);
}

.canvas__controls {
  display: flex;
  align-items: center;
  gap: 16px;
  width: 100%;
  justify-content: space-between;
}

.device-controls {
  display: flex;
  gap: 4px;
  padding: 4px;
  background-color: var(--border);
  border-radius: 8px;
}

.device-btn {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border: none;
  background: transparent;
  color: var(--muted);
  cursor: pointer;
  border-radius: 6px;
  font-size: 12px;
  font-weight: 500;
  transition: all 0.2s ease;
}

.device-btn:hover {
  background-color: var(--panel);
  color: var(--fg);
}

.device-btn.active {
  background-color: var(--panel);
  color: var(--accent);
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.device-label {
  display: none;
}

@media (min-width: 768px) {
  .device-label {
    display: inline;
  }
}

.canvas__actions {
  display: flex;
  gap: 4px;
}

.canvas__btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border: none;
  background: transparent;
  color: var(--muted);
  cursor: pointer;
  border-radius: 6px;
  transition: all 0.2s ease;
}

.canvas__btn:hover {
  background-color: var(--border);
  color: var(--fg);
}

.canvas__btn.active {
  background-color: var(--accent);
  color: white;
}

.canvas__content {
  flex: 1;
  overflow: auto;
  padding: 60px 20px 20px 20px;
  background-color: var(--panel);
}

.canvas__viewport {
  margin: 0 auto;
  transition: all 0.3s ease;
  background-color: white;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  border-radius: 8px;
  overflow: visible;
}

.email-document {
  position: relative;
  background-color: #ffffff;
  min-height: 400px;
  transition: all 0.2s ease;
}

.email-document.preview-mode {
  pointer-events: none;
}

.email-document.preview-mode * {
  user-select: none;
}

.rows-container {
  min-height: 100%;
}

.row-slot {
  min-height: 60px;
  margin-bottom: 8px;
}

.row-slot:last-child {
  margin-bottom: 0;
}

/* Empty State */
.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  min-height: 400px;
  padding: 40px;
}

.empty-state__content {
  text-align: center;
  max-width: 300px;
}

.empty-state__content svg {
  margin-bottom: 16px;
  color: var(--muted);
}

.empty-state__content h3 {
  margin: 0 0 8px 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--fg);
}

.empty-state__content p {
  margin: 0 0 20px 0;
  color: var(--muted);
  line-height: 1.5;
}

.empty-state__btn {
  padding: 8px 16px;
  border: none;
  background-color: var(--accent);
  color: white;
  border-radius: 6px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.empty-state__btn:hover {
  background-color: var(--accent);
  opacity: 0.9;
}

/* Drop Zone */
.drop-zone-indicator {
  position: absolute;
  pointer-events: none;
  z-index: 1000;
}

.drop-zone-line {
  width: 100%;
  height: 2px;
  background-color: var(--accent);
  border-radius: 1px;
}

.drop-zone-text {
  position: absolute;
  top: -20px;
  left: 0;
  background-color: var(--accent);
  color: white;
  padding: 2px 8px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: 500;
  white-space: nowrap;
}

/* Dragging States */
:global(.dragging) .canvas {
  cursor: grabbing;
}

/* Drag and Drop Styles - Swapy */
/* Swapy handles its own drag styling */
</style>
