<template>
  <div class="export-panel">
    <div class="export-section">
      <div class="section-header">
        <h3 class="section-title">Export Options</h3>
      </div>

      <div class="export-actions">
        <button
          @click="exportJson"
          class="export-btn export-btn--primary"
          :disabled="isExporting"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path
              d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
            />
            <polyline points="14,2 14,8 20,8" />
            <line x1="16" y1="13" x2="8" y2="13" />
            <line x1="16" y1="17" x2="8" y2="17" />
            <polyline points="10,9 9,9 8,9" />
          </svg>
          Export JSON
        </button>

        <button
          @click="exportHtml"
          class="export-btn export-btn--secondary"
          :disabled="isExporting"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <polyline points="16,18 22,12 16,6" />
            <polyline points="8,6 2,12 8,18" />
          </svg>
          Export HTML
        </button>

        <button
          @click="copyHtml"
          class="export-btn export-btn--outline"
          :disabled="isExporting"
        >
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
          </svg>
          Copy HTML
        </button>
      </div>
    </div>

    <div class="export-section">
      <div class="section-header">
        <h3 class="section-title">Preview</h3>
      </div>

      <div class="preview-controls">
        <div class="preview-tabs">
          <button
            v-for="tab in previewTabs"
            :key="tab.value"
            @click="activePreviewTab = tab.value"
            :class="['preview-tab', { active: activePreviewTab === tab.value }]"
          >
            <component :is="tab.icon" />
            {{ tab.label }}
          </button>
        </div>
      </div>

      <div class="preview-content">
        <!-- JSON Preview -->
        <div v-if="activePreviewTab === 'json'" class="preview-json">
          <div class="preview-header">
            <span class="preview-title">JSON Document</span>
            <button @click="copyJson" class="copy-btn" title="Copy JSON">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path
                  d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"
                />
              </svg>
            </button>
          </div>
          <pre class="json-content">{{ formattedJson }}</pre>
        </div>

        <!-- HTML Preview -->
        <div v-else-if="activePreviewTab === 'html'" class="preview-html">
          <div class="preview-header">
            <span class="preview-title">HTML Source</span>
            <button @click="copyHtmlSource" class="copy-btn" title="Copy HTML">
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="2"
              >
                <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                <path
                  d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"
                />
              </svg>
            </button>
          </div>
          <pre class="html-content">{{ formattedHtml }}</pre>
        </div>

        <!-- Visual Preview -->
        <div v-else-if="activePreviewTab === 'visual'" class="preview-visual">
          <div class="preview-header">
            <span class="preview-title">Email Preview</span>
            <div class="preview-device-controls">
              <button
                v-for="device in previewDevices"
                :key="device.value"
                @click="previewDevice = device.value"
                :class="[
                  'device-btn',
                  { active: previewDevice === device.value },
                ]"
                :title="device.label"
              >
                <component :is="device.icon" />
              </button>
            </div>
          </div>
          <div class="visual-preview" :class="`preview-${previewDevice}`">
            <iframe
              ref="previewFrame"
              class="preview-iframe"
              :srcdoc="htmlPreviewContent"
              sandbox="allow-same-origin"
            ></iframe>
          </div>
        </div>
      </div>
    </div>

    <div class="export-section">
      <div class="section-header">
        <h3 class="section-title">Export Settings</h3>
      </div>

      <div class="export-settings">
        <div class="setting-group">
          <label class="setting-label">HTML Options</label>
          <div class="setting-items">
            <label class="checkbox-label">
              <input
                v-model="exportSettings.minifyHtml"
                type="checkbox"
                class="checkbox-input"
              />
              <span class="checkbox-custom"></span>
              Minify HTML
            </label>

            <label class="checkbox-label">
              <input
                v-model="exportSettings.inlineStyles"
                type="checkbox"
                class="checkbox-input"
              />
              <span class="checkbox-custom"></span>
              Inline CSS styles
            </label>

            <label class="checkbox-label">
              <input
                v-model="exportSettings.includeMetaTags"
                type="checkbox"
                class="checkbox-input"
              />
              <span class="checkbox-custom"></span>
              Include meta tags
            </label>
          </div>
        </div>

        <div class="setting-group">
          <label class="setting-label">Email Client Compatibility</label>
          <div class="setting-items">
            <label class="checkbox-label">
              <input
                v-model="exportSettings.outlookCompatibility"
                type="checkbox"
                class="checkbox-input"
              />
              <span class="checkbox-custom"></span>
              Outlook compatibility mode
            </label>

            <label class="checkbox-label">
              <input
                v-model="exportSettings.darkModeSupport"
                type="checkbox"
                class="checkbox-input"
              />
              <span class="checkbox-custom"></span>
              Dark mode support
            </label>
          </div>
        </div>
      </div>
    </div>

    <div class="export-section">
      <div class="section-header">
        <h3 class="section-title">Document Info</h3>
      </div>

      <div class="document-stats">
        <div class="stat-item">
          <span class="stat-label">Rows</span>
          <span class="stat-value">{{ documentStats.rows }}</span>
        </div>

        <div class="stat-item">
          <span class="stat-label">Columns</span>
          <span class="stat-value">{{ documentStats.columns }}</span>
        </div>

        <div class="stat-item">
          <span class="stat-label">Blocks</span>
          <span class="stat-value">{{ documentStats.blocks }}</span>
        </div>

        <div class="stat-item">
          <span class="stat-label">Last Modified</span>
          <span class="stat-value">{{ formattedLastModified }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, h } from "vue";
import { useDocumentStore } from "../../stores/useDocumentStore";
// Removed unused useUiStore import

// Stores
const documentStore = useDocumentStore();

// State
const isExporting = ref(false);
const activePreviewTab = ref("visual");
const previewDevice = ref("desktop");
const previewFrame = ref<HTMLIFrameElement | null>(null);
const htmlPreviewContent = ref("<p>Loading preview...</p>");

// Export settings
const exportSettings = ref({
  minifyHtml: true,
  inlineStyles: true,
  includeMetaTags: true,
  outlookCompatibility: true,
  darkModeSupport: false,
});

// Icon components as render functions (no runtime compilation needed)
const EyeIcon = {
  render() {
    return h(
      "svg",
      {
        width: "14",
        height: "14",
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        "stroke-width": "2",
      },
      [
        h("path", { d: "M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" }),
        h("circle", { cx: "12", cy: "12", r: "3" }),
      ]
    );
  },
};

const CodeIcon = {
  render() {
    return h(
      "svg",
      {
        width: "14",
        height: "14",
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        "stroke-width": "2",
      },
      [
        h("polyline", { points: "16,18 22,12 16,6" }),
        h("polyline", { points: "8,6 2,12 8,18" }),
      ]
    );
  },
};

const FileIcon = {
  render() {
    return h(
      "svg",
      {
        width: "14",
        height: "14",
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        "stroke-width": "2",
      },
      [
        h("path", {
          d: "M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z",
        }),
        h("polyline", { points: "14,2 14,8 20,8" }),
      ]
    );
  },
};

const MonitorIcon = {
  render() {
    return h(
      "svg",
      {
        width: "14",
        height: "14",
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        "stroke-width": "2",
      },
      [
        h("rect", {
          x: "2",
          y: "3",
          width: "20",
          height: "14",
          rx: "2",
          ry: "2",
        }),
        h("line", { x1: "8", y1: "21", x2: "16", y2: "21" }),
        h("line", { x1: "12", y1: "17", x2: "12", y2: "21" }),
      ]
    );
  },
};

const TabletIcon = {
  render() {
    return h(
      "svg",
      {
        width: "14",
        height: "14",
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        "stroke-width": "2",
      },
      [
        h("rect", {
          x: "4",
          y: "2",
          width: "16",
          height: "20",
          rx: "2",
          ry: "2",
        }),
        h("line", { x1: "12", y1: "18", x2: "12.01", y2: "18" }),
      ]
    );
  },
};

const SmartphoneIcon = {
  render() {
    return h(
      "svg",
      {
        width: "14",
        height: "14",
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        "stroke-width": "2",
      },
      [
        h("rect", {
          x: "5",
          y: "2",
          width: "14",
          height: "20",
          rx: "2",
          ry: "2",
        }),
        h("line", { x1: "12", y1: "18", x2: "12.01", y2: "18" }),
      ]
    );
  },
};

// Preview tabs
const previewTabs = [
  { value: "visual", label: "Visual", icon: EyeIcon },
  { value: "html", label: "HTML", icon: CodeIcon },
  { value: "json", label: "JSON", icon: FileIcon },
];

// Preview devices
const previewDevices = [
  { value: "desktop", label: "Desktop", icon: MonitorIcon },
  { value: "tablet", label: "Tablet", icon: TabletIcon },
  { value: "mobile", label: "Mobile", icon: SmartphoneIcon },
];

/**
 * Computed properties
 */
const formattedJson = computed(() => {
  try {
    return JSON.stringify(documentStore.document, null, 2);
  } catch (error) {
    return "Error formatting JSON";
  }
});

const formattedHtml = computed(() => {
  try {
    const html = documentStore.exportHtml();
    return formatHtml(html);
  } catch (error) {
    return "Error generating HTML";
  }
});

// Generate HTML preview asynchronously
async function generateHtmlPreview() {
  try {
    const html = await documentStore.exportHtml();
    htmlPreviewContent.value = html;
  } catch (error) {
    // Error generating HTML preview
    htmlPreviewContent.value = "<p>Error generating preview</p>";
  }
}

// Watch for document changes to regenerate preview
watch(
  () => documentStore.document,
  () => {
    if (activePreviewTab.value === "visual") {
      generateHtmlPreview();
    }
  },
  { deep: true }
);

// Watch for preview tab changes
watch(activePreviewTab, (newTab) => {
  if (newTab === "visual") {
    generateHtmlPreview();
  }
});

// Generate initial preview on mount
onMounted(() => {
  generateHtmlPreview();
});

const documentStats = computed(() => {
  const doc = documentStore.document;
  let columns = 0;
  let blocks = 0;

  doc.rows.forEach((row) => {
    columns += row.columns.length;
    row.columns.forEach((column) => {
      blocks += column.blocks.length;
    });
  });

  return {
    rows: doc.rows.length,
    columns,
    blocks,
  };
});

const formattedLastModified = computed(() => {
  const lastModified = documentStore.document.meta?.lastModified;
  if (!lastModified) return "Never";

  const date = new Date(lastModified);
  return date.toLocaleString();
});

/**
 * Export functions
 */
async function exportJson() {
  try {
    isExporting.value = true;
    const json = documentStore.exportJson();
    downloadFile(json, "email-template.json", "application/json");
  } catch (error) {
    // Export JSON failed
    alert("Failed to export JSON");
  } finally {
    isExporting.value = false;
  }
}

async function exportHtml() {
  try {
    isExporting.value = true;
    const html = documentStore.exportHtml();
    downloadFile(html, "email-template.html", "text/html");
  } catch (error) {
    // Export HTML failed
    alert("Failed to export HTML");
  } finally {
    isExporting.value = false;
  }
}

async function copyJson() {
  try {
    const json = documentStore.exportJson();
    await navigator.clipboard.writeText(json);
    showCopyFeedback("JSON copied to clipboard!");
  } catch (error) {
    // Copy JSON failed
    alert("Failed to copy JSON");
  }
}

async function copyHtml() {
  try {
    const html = documentStore.exportHtml();
    await navigator.clipboard.writeText(html);
    showCopyFeedback("HTML copied to clipboard!");
  } catch (error) {
    // Copy HTML failed
    alert("Failed to copy HTML");
  }
}

async function copyHtmlSource() {
  await copyHtml();
}

/**
 * Utility functions
 */
function downloadFile(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
}

function formatHtml(html: string): string {
  // Simple HTML formatting for display
  return html
    .replace(/></g, ">\n<")
    .replace(/\n\s*\n/g, "\n")
    .split("\n")
    .map((line, _index) => {
      const indent = "  ".repeat(
        Math.max(
          0,
          (line.match(/</g) || []).length - (line.match(/\//g) || []).length
        )
      );
      return indent + line.trim();
    })
    .join("\n");
}

function showCopyFeedback(message: string) {
  // Simple feedback - in a real app you might use a toast notification
  const originalTitle = document.title;
  document.title = message;
  setTimeout(() => {
    document.title = originalTitle;
  }, 2000);
}

// Watch for document changes to update preview
watch(
  () => documentStore.document,
  () => {
    // Refresh iframe if in visual preview mode
    if (activePreviewTab.value === "visual" && previewFrame.value) {
      // Force iframe refresh
      const iframe = previewFrame.value;
      iframe.srcdoc = htmlPreviewContent.value;
    }
  },
  { deep: true }
);
</script>

<style scoped>
.export-panel {
  height: 100%;
  overflow-y: auto;
  padding: 16px;
}

.export-section {
  margin-bottom: 24px;
}

.export-section:last-child {
  margin-bottom: 0;
}

.section-header {
  margin-bottom: 12px;
  padding-bottom: 8px;
  border-bottom: 1px solid var(--border);
}

.section-title {
  font-size: 14px;
  font-weight: 600;
  margin: 0;
  color: var(--fg);
}

.export-actions {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.export-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 16px;
  border: 1px solid var(--border);
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.2s ease;
  font-size: 13px;
  font-weight: 500;
}

.export-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.export-btn--primary {
  background: var(--accent);
  color: white;
  border-color: var(--accent);
}

.export-btn--primary:hover:not(:disabled) {
  background: var(--accent-hover);
}

.export-btn--secondary {
  background: var(--panel);
  color: var(--fg);
}

.export-btn--secondary:hover:not(:disabled) {
  background: var(--border);
}

.export-btn--outline {
  background: transparent;
  color: var(--fg);
}

.export-btn--outline:hover:not(:disabled) {
  background: var(--border);
}

.preview-controls {
  margin-bottom: 12px;
}

.preview-tabs {
  display: flex;
  border-bottom: 1px solid var(--border);
}

.preview-tab {
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 8px 12px;
  border: none;
  background: transparent;
  color: var(--muted);
  cursor: pointer;
  border-bottom: 2px solid transparent;
  transition: all 0.2s ease;
  font-size: 12px;
}

.preview-tab:hover {
  color: var(--fg);
  background: var(--border);
}

.preview-tab.active {
  color: var(--accent);
  border-bottom-color: var(--accent);
}

.preview-content {
  min-height: 200px;
}

.preview-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
  padding: 6px 0;
}

.preview-title {
  font-size: 12px;
  font-weight: 500;
  color: var(--muted);
  text-transform: uppercase;
}

.copy-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 24px;
  height: 24px;
  border: 1px solid var(--border);
  background: transparent;
  color: var(--muted);
  cursor: pointer;
  border-radius: 3px;
  transition: all 0.2s ease;
}

.copy-btn:hover {
  background: var(--border);
  color: var(--fg);
}

.json-content,
.html-content {
  background: var(--bg);
  border: 1px solid var(--border);
  border-radius: 4px;
  padding: 12px;
  font-family: "Monaco", "Menlo", "Ubuntu Mono", monospace;
  font-size: 11px;
  line-height: 1.4;
  color: var(--fg);
  overflow-x: auto;
  max-height: 300px;
  overflow-y: auto;
  white-space: pre;
}

.preview-device-controls {
  display: flex;
  gap: 4px;
}

.device-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: 1px solid var(--border);
  background: transparent;
  color: var(--muted);
  cursor: pointer;
  border-radius: 3px;
  transition: all 0.2s ease;
}

.device-btn:hover {
  background: var(--border);
  color: var(--fg);
}

.device-btn.active {
  background: var(--accent);
  color: white;
  border-color: var(--accent);
}

.visual-preview {
  border: 1px solid var(--border);
  border-radius: 4px;
  overflow: hidden;
  background: white;
}

.preview-iframe {
  width: 100%;
  height: 400px;
  border: none;
  display: block;
}

.preview-desktop .preview-iframe {
  height: 400px;
}

.preview-tablet .preview-iframe {
  height: 350px;
  max-width: 768px;
  margin: 0 auto;
}

.preview-mobile .preview-iframe {
  height: 300px;
  max-width: 375px;
  margin: 0 auto;
}

.export-settings {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.setting-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.setting-label {
  font-size: 12px;
  font-weight: 500;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.3px;
}

.setting-items {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.checkbox-label {
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-size: 13px;
  color: var(--fg);
  user-select: none;
}

.checkbox-input {
  position: absolute;
  opacity: 0;
  pointer-events: none;
}

.checkbox-custom {
  width: 16px;
  height: 16px;
  border: 1px solid var(--border);
  border-radius: 3px;
  background: var(--bg);
  position: relative;
  transition: all 0.2s ease;
}

.checkbox-input:checked + .checkbox-custom {
  background: var(--accent);
  border-color: var(--accent);
}

.checkbox-input:checked + .checkbox-custom::after {
  content: "";
  position: absolute;
  top: 2px;
  left: 5px;
  width: 4px;
  height: 8px;
  border: solid white;
  border-width: 0 2px 2px 0;
  transform: rotate(45deg);
}

.document-stats {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 12px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 8px;
  background: var(--border);
  border-radius: 4px;
}

.stat-label {
  font-size: 10px;
  color: var(--muted);
  text-transform: uppercase;
  font-weight: 500;
}

.stat-value {
  font-size: 14px;
  color: var(--fg);
  font-weight: 600;
}

/* Responsive design */
@media (max-width: 768px) {
  .export-panel {
    padding: 12px;
  }

  .preview-tabs {
    flex-wrap: wrap;
  }

  .preview-device-controls {
    flex-wrap: wrap;
  }

  .document-stats {
    grid-template-columns: 1fr;
    gap: 8px;
  }

  .json-content,
  .html-content {
    font-size: 10px;
    max-height: 200px;
  }

  .preview-iframe {
    height: 250px;
  }
}
</style>
