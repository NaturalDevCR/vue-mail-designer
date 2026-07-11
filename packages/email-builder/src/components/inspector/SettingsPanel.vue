<template>
  <div class="settings-panel">
    <div class="settings-section">
      <div class="section-header">
        <h3 class="section-title">Theme</h3>
      </div>

      <div class="setting-group">
        <label class="setting-label">Appearance</label>
        <div class="theme-selector">
          <button
            v-for="theme in themes"
            :key="theme.value"
            @click="ui.setTheme(theme.value)"
            :class="['theme-btn', { active: ui.theme === theme.value }]"
          >
            <component :is="theme.icon" />
            {{ theme.label }}
          </button>
        </div>
      </div>
    </div>

    <div class="settings-section">
      <div class="section-header">
        <h3 class="section-title">Canvas</h3>
      </div>

      <div class="setting-group">
        <label class="setting-label">Display</label>
        <div class="canvas-settings">
          <label class="checkbox-label">
            <input
              v-model="ui.preferences.showRulers"
              type="checkbox"
              class="checkbox-input"
            />
            <span class="checkbox-custom"></span>
            Show rulers
          </label>

          <label class="checkbox-label">
            <input
              v-model="ui.preferences.showGuides"
              type="checkbox"
              class="checkbox-input"
            />
            <span class="checkbox-custom"></span>
            Show guides
          </label>
        </div>
      </div>

      <div class="setting-group">
        <label class="setting-label">Zoom</label>
        <div class="zoom-controls">
          <button
            v-for="zoom in zoomLevels"
            :key="zoom"
            @click="ui.setZoom(zoom)"
            :class="['zoom-btn', { active: ui.preferences.zoom === zoom }]"
          >
            {{ zoom }}%
          </button>
        </div>
      </div>
    </div>

    <div class="settings-section">
      <div class="section-header">
        <h3 class="section-title">Drag & Drop</h3>
      </div>

      <div class="setting-group">
        <label class="setting-label">Behavior</label>
        <div class="dnd-settings">
          <div class="setting-item">
            <label class="checkbox-label">
              <input
                v-model="ui.preferences.showDropZones"
                type="checkbox"
                class="checkbox-input"
              />
              <span class="checkbox-custom"></span>
              Show drop zones
            </label>
          </div>

          <div class="setting-item">
            <label class="checkbox-label">
              <input
                v-model="ui.preferences.autoScroll"
                type="checkbox"
                class="checkbox-input"
              />
              <span class="checkbox-custom"></span>
              Auto-scroll while dragging
            </label>
          </div>
        </div>
      </div>
    </div>

    <div class="settings-section">
      <div class="section-header">
        <h3 class="section-title">History</h3>
      </div>

      <div class="setting-group">
        <label class="setting-label">Undo/Redo</label>
        <div class="history-settings">
          <div class="setting-item">
            <label class="setting-sublabel">Undo Steps</label>
            <input
              v-model.number="ui.preferences.maxUndoSteps"
              type="number"
              min="10"
              max="100"
              class="number-input"
            />
          </div>
        </div>
      </div>
    </div>

    <div class="settings-section">
      <div class="section-header">
        <h3 class="section-title">Export</h3>
      </div>

      <div class="setting-group">
        <label class="setting-label">Default Settings</label>
        <div class="export-settings">
          <label class="checkbox-label">
            <input
              v-model="ui.preferences.exportMinified"
              type="checkbox"
              class="checkbox-input"
            />
            <span class="checkbox-custom"></span>
            Minify HTML by default
          </label>

          <label class="checkbox-label">
            <input
              v-model="ui.preferences.exportInlineStyles"
              type="checkbox"
              class="checkbox-input"
            />
            <span class="checkbox-custom"></span>
            Inline styles by default
          </label>
        </div>
      </div>
    </div>

    <div class="settings-section">
      <div class="section-header">
        <h3 class="section-title">Email Client Compatibility</h3>
      </div>

      <div class="setting-group">
        <label class="setting-label">Target Clients</label>
        <div class="compatibility-settings">
          <div class="client-checkboxes">
            <label
              class="checkbox-label small"
              v-for="client in emailClients"
              :key="client.id"
            >
              <input
                v-model="ui.preferences.targetClients"
                :value="client.id"
                type="checkbox"
                class="checkbox-input"
              />
              <span class="checkbox-custom"></span>
              {{ client.name }}
            </label>
          </div>
        </div>
      </div>
    </div>

    <div class="settings-section">
      <div class="section-header">
        <h3 class="section-title">Keyboard Shortcuts</h3>
      </div>

      <div class="setting-group">
        <label class="setting-label">Quick Actions</label>
        <div class="shortcuts-list">
          <div
            v-for="shortcut in shortcuts"
            :key="shortcut.action"
            class="shortcut-item"
          >
            <span class="shortcut-label">{{ shortcut.label }}</span>
            <div class="shortcut-keys">
              <kbd v-for="key in shortcut.keys" :key="key" class="key">{{
                key
              }}</kbd>
            </div>
          </div>
        </div>
      </div>
    </div>

    <div class="settings-section">
      <div class="section-header">
        <h3 class="section-title">Advanced</h3>
      </div>

      <div class="setting-group">
        <label class="setting-label">Developer Options</label>
        <div class="advanced-settings">
          <label class="checkbox-label">
            <input
              v-model="ui.preferences.debugMode"
              type="checkbox"
              class="checkbox-input"
            />
            <span class="checkbox-custom"></span>
            Debug mode
          </label>

          <label class="checkbox-label">
            <input
              v-model="ui.preferences.showPerformanceMetrics"
              type="checkbox"
              class="checkbox-input"
            />
            <span class="checkbox-custom"></span>
            Show performance metrics
          </label>
        </div>
      </div>

      <div class="setting-group">
        <label class="setting-label">Reset</label>
        <div class="reset-settings">
          <button @click="resetSettings" class="reset-btn">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              stroke-width="2"
            >
              <polyline points="3,6 5,6 21,6" />
              <path
                d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"
              />
            </svg>
            Reset All Settings
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { h } from "vue";
import { useUiStore } from "../../stores/useUiStore";
import { useDocumentStore } from "../../stores/useDocumentStore";

// Stores
const ui = useUiStore();
const documentStore = useDocumentStore();

// Theme icons as render function components (no runtime compilation needed)
const LightIcon = {
  render() {
    return h(
      "svg",
      {
        width: "16",
        height: "16",
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        "stroke-width": "2",
      },
      [
        h("circle", { cx: "12", cy: "12", r: "5" }),
        h("line", { x1: "12", y1: "1", x2: "12", y2: "3" }),
        h("line", { x1: "12", y1: "21", x2: "12", y2: "23" }),
        h("line", { x1: "4.22", y1: "4.22", x2: "5.64", y2: "5.64" }),
        h("line", { x1: "18.36", y1: "18.36", x2: "19.78", y2: "19.78" }),
        h("line", { x1: "1", y1: "12", x2: "3", y2: "12" }),
        h("line", { x1: "21", y1: "12", x2: "23", y2: "12" }),
        h("line", { x1: "4.22", y1: "19.78", x2: "5.64", y2: "18.36" }),
        h("line", { x1: "18.36", y1: "5.64", x2: "19.78", y2: "4.22" }),
      ]
    );
  },
};

const DarkIcon = {
  render() {
    return h(
      "svg",
      {
        width: "16",
        height: "16",
        viewBox: "0 0 24 24",
        fill: "none",
        stroke: "currentColor",
        "stroke-width": "2",
      },
      [h("path", { d: "M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" })]
    );
  },
};

const AutoIcon = {
  render() {
    return h(
      "svg",
      {
        width: "16",
        height: "16",
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

// Theme options
const themes = [
  { value: "light", label: "Light", icon: LightIcon },
  { value: "dark", label: "Dark", icon: DarkIcon },
  { value: "auto", label: "Auto", icon: AutoIcon },
];

// Zoom levels
const zoomLevels = [50, 75, 100, 125, 150, 200];

// Email clients for compatibility testing
const emailClients = [
  { id: "outlook-desktop", name: "Outlook Desktop" },
  { id: "outlook-web", name: "Outlook Web" },
  { id: "gmail", name: "Gmail" },
  { id: "apple-mail", name: "Apple Mail" },
  { id: "yahoo", name: "Yahoo Mail" },
  { id: "thunderbird", name: "Thunderbird" },
];

// Keyboard shortcuts
const shortcuts = [
  { action: "undo", label: "Undo", keys: ["Ctrl", "Z"] },
  { action: "redo", label: "Redo", keys: ["Ctrl", "Y"] },
  { action: "copy", label: "Copy", keys: ["Ctrl", "C"] },
  { action: "paste", label: "Paste", keys: ["Ctrl", "V"] },
  { action: "delete", label: "Delete", keys: ["Del"] },
  { action: "duplicate", label: "Duplicate", keys: ["Ctrl", "D"] },
  { action: "selectAll", label: "Select All", keys: ["Ctrl", "A"] },
  { action: "save", label: "Export JSON", keys: ["Ctrl", "S"] },
  { action: "preview", label: "Toggle Preview", keys: ["Ctrl", "P"] },
  { action: "zoom-in", label: "Zoom In", keys: ["Ctrl", "+"] },
  { action: "zoom-out", label: "Zoom Out", keys: ["Ctrl", "-"] },
  { action: "zoom-fit", label: "Fit to Screen", keys: ["Ctrl", "0"] },
];

/**
 * Reset all settings to defaults
 */
function resetSettings() {
  if (
    confirm(
      "Are you sure you want to reset all settings? This action cannot be undone."
    )
  ) {
    // Clear document
    documentStore.newDocument();

    // Clear UI settings
    ui.resetPreferences();

    // Clear localStorage
    localStorage.clear();

    // Reload page to ensure clean state
    window.location.reload();
  }
}
</script>

<style scoped>
.settings-panel {
  height: 100%;
  overflow-y: auto;
  padding: 16px;
}

.settings-section {
  margin-bottom: 24px;
}

.settings-section:last-child {
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

.setting-group {
  margin-bottom: 16px;
}

.setting-group:last-child {
  margin-bottom: 0;
}

.setting-label {
  display: block;
  font-size: 12px;
  font-weight: 500;
  color: var(--muted);
  text-transform: uppercase;
  letter-spacing: 0.3px;
  margin-bottom: 8px;
}

.setting-sublabel {
  display: block;
  font-size: 11px;
  font-weight: 500;
  color: var(--muted);
  margin-bottom: 6px;
}

.theme-selector {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.theme-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border: 1px solid var(--border);
  background: transparent;
  color: var(--fg);
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s ease;
  font-size: 13px;
}

.theme-btn:hover {
  background-color: var(--border);
}

.theme-btn.active {
  background-color: var(--accent);
  color: white;
  border-color: var(--accent);
}

.canvas-settings,
.history-settings,
.dnd-settings,
.export-settings,
.compatibility-settings {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.setting-item {
  display: flex;
  align-items: center;
  gap: 8px;
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

.checkbox-label.small {
  font-size: 12px;
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

.number-input {
  width: 80px;
  padding: 4px 8px;
  border: 1px solid var(--border);
  border-radius: 3px;
  background-color: var(--bg);
  color: var(--fg);
  font-size: 12px;
}

.number-input:focus {
  outline: none;
  border-color: var(--accent);
}

.zoom-controls {
  display: flex;
  gap: 4px;
  flex-wrap: wrap;
}

.zoom-btn {
  padding: 6px 12px;
  border: 1px solid var(--border);
  background: transparent;
  color: var(--fg);
  cursor: pointer;
  border-radius: 3px;
  transition: all 0.2s ease;
  font-size: 12px;
}

.zoom-btn:hover {
  background-color: var(--border);
}

.zoom-btn.active {
  background-color: var(--accent);
  color: white;
  border-color: var(--accent);
}

.client-checkboxes {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  gap: 6px;
}

.shortcuts-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.shortcut-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 6px 0;
}

.shortcut-label {
  font-size: 12px;
  color: var(--fg);
}

.shortcut-keys {
  display: flex;
  gap: 2px;
}

.key {
  padding: 2px 6px;
  background: var(--border);
  border: 1px solid var(--muted);
  border-radius: 3px;
  font-size: 10px;
  font-family: monospace;
  color: var(--fg);
}

.advanced-settings {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.reset-settings {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.reset-btn {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border: 1px solid #dc2626;
  background: transparent;
  color: #dc2626;
  cursor: pointer;
  border-radius: 4px;
  transition: all 0.2s ease;
  font-size: 13px;
}

.reset-btn:hover {
  background-color: #dc2626;
  color: white;
}

/* Responsive design */
@media (max-width: 768px) {
  .settings-panel {
    padding: 12px;
  }

  .zoom-controls {
    justify-content: center;
  }

  .client-checkboxes {
    grid-template-columns: 1fr;
  }

  .shortcut-item {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
}
</style>
