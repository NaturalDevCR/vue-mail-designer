/**
 * UI store for managing user interface state and preferences
 * Handles theme, panel visibility, and user preferences
 */

import { defineStore } from 'pinia';
import { ref, computed } from 'vue';

export type Theme = 'light' | 'dark';
export type RightPanelTab = 'properties' | 'settings' | 'export';

export const useUiStore = defineStore('ui', () => {
  // State
  const theme = ref<Theme>('light');
  const rightPanelTab = ref<RightPanelTab>('properties');
  const showRulers = ref<boolean>(false);
  const sidebarCollapsed = ref<boolean>(false);
  const rightPanelCollapsed = ref<boolean>(false);
  const canvasZoom = ref<number>(100);
  const showPreview = ref<boolean>(false);
  const previewDevice = ref<'desktop' | 'tablet' | 'mobile'>('desktop');
  
  // Preferences that should be persisted
  const preferences = ref({
    autoSave: true,
    showTooltips: true,
    confirmDelete: true,
    defaultBlockStyles: true,
    compactMode: false,
    language: 'en'
  });

  // Computed
  const themeClass = computed(() => `theme--${theme.value}`);
  const isDarkTheme = computed(() => theme.value === 'dark');
  const isLightTheme = computed(() => theme.value === 'light');
  const canvasZoomPercent = computed(() => `${canvasZoom.value}%`);

  
  // Device breakpoints for preview
  const deviceBreakpoints = computed(() => ({
    desktop: { width: '100%', maxWidth: '1200px' },
    tablet: { width: '768px', maxWidth: '768px' },
    mobile: { width: '375px', maxWidth: '375px' }
  }));
  
  const currentDeviceBreakpoint = computed(() => 
    deviceBreakpoints.value[previewDevice.value]
  );

  // Actions
  function toggleTheme(): void {
    theme.value = theme.value === 'light' ? 'dark' : 'light';
  }

  function setTheme(newTheme: Theme): void {
    theme.value = newTheme;
  }

  function setRightPanelTab(tab: RightPanelTab): void {
    rightPanelTab.value = tab;
    // Auto-expand panel when switching tabs
    if (rightPanelCollapsed.value) {
      rightPanelCollapsed.value = false;
    }
  }

  function toggleRulers(): void {
    showRulers.value = !showRulers.value;
  }

  function setRulersVisibility(visible: boolean): void {
    showRulers.value = visible;
  }



  function toggleSidebar(): void {
    sidebarCollapsed.value = !sidebarCollapsed.value;
  }

  function setSidebarCollapsed(collapsed: boolean): void {
    sidebarCollapsed.value = collapsed;
  }

  function toggleRightPanel(): void {
    rightPanelCollapsed.value = !rightPanelCollapsed.value;
  }

  function setRightPanelCollapsed(collapsed: boolean): void {
    rightPanelCollapsed.value = collapsed;
  }

  function setCanvasZoom(zoom: number): void {
    if (zoom >= 25 && zoom <= 200) {
      canvasZoom.value = zoom;
    }
  }

  function zoomIn(): void {
    const newZoom = Math.min(canvasZoom.value + 25, 200);
    setCanvasZoom(newZoom);
  }

  function zoomOut(): void {
    const newZoom = Math.max(canvasZoom.value - 25, 25);
    setCanvasZoom(newZoom);
  }

  function resetZoom(): void {
    setCanvasZoom(100);
  }

  function togglePreview(): void {
    showPreview.value = !showPreview.value;
  }

  function setPreviewMode(preview: boolean): void {
    showPreview.value = preview;
  }

  function setPreviewDevice(device: 'desktop' | 'tablet' | 'mobile'): void {
    previewDevice.value = device;
  }

  function updatePreference<K extends keyof typeof preferences.value>(
    key: K, 
    value: typeof preferences.value[K]
  ): void {
    preferences.value[key] = value;
  }

  function resetPreferences(): void {
    preferences.value = {
      autoSave: true,
      showTooltips: true,
      confirmDelete: true,
      defaultBlockStyles: true,
      compactMode: false,
      language: 'en'
    };
  }

  function resetUI(): void {
    theme.value = 'light';
    rightPanelTab.value = 'properties';
    showRulers.value = false;
    sidebarCollapsed.value = false;
    rightPanelCollapsed.value = false;
    canvasZoom.value = 100;
    showPreview.value = false;
    previewDevice.value = 'desktop';
  }

  // Keyboard shortcuts state
  const keyboardShortcuts = ref({
    'ctrl+z': 'undo',
    'ctrl+y': 'redo',
    'ctrl+shift+z': 'redo',
    'delete': 'delete',
    'backspace': 'delete',
    'ctrl+d': 'duplicate',
    'ctrl+s': 'save',
    'ctrl+o': 'open',
    'ctrl+n': 'new',
    'ctrl+e': 'export',
    'ctrl+i': 'import',
    'ctrl+plus': 'zoomIn',
    'ctrl+minus': 'zoomOut',
    'ctrl+0': 'resetZoom',

    'ctrl+r': 'toggleRulers',
    'ctrl+p': 'togglePreview',
    'ctrl+t': 'toggleTheme',
    'f11': 'fullscreen',
    'escape': 'clearSelection'
  });

  function getShortcutForAction(action: string): string | undefined {
    const keys = Object.keys(keyboardShortcuts.value);
    const entries = keys.map(key => [key, keyboardShortcuts.value[key as keyof typeof keyboardShortcuts.value]]);
    const entry = entries.find(([, actionName]) => actionName === action);
    return entry ? entry[0] : undefined;
  }

  function updateShortcut(shortcut: string, action: string): void {
    keyboardShortcuts.value[shortcut as keyof typeof keyboardShortcuts.value] = action;
  }

  // Panel dimensions
  const panelDimensions = ref({
    sidebarWidth: 280,
    rightPanelWidth: 320,
    toolbarHeight: 60,
    statusBarHeight: 30
  });

  function setPanelDimension(
    panel: keyof typeof panelDimensions.value, 
    size: number
  ): void {
    if (size >= 200 && size <= 500) {
      panelDimensions.value[panel] = size;
    }
  }

  // Initialize UI with light theme as default
  function initializeTheme(): void {
    // Always start with light theme as default
    // Users can manually switch to dark mode if desired
    theme.value = 'light';
  }

  // Responsive breakpoints detection
  const screenSize = ref<'mobile' | 'tablet' | 'desktop'>('desktop');
  
  function updateScreenSize(): void {
    if (typeof window !== 'undefined') {
      const width = window.innerWidth;
      if (width < 768) {
        screenSize.value = 'mobile';
      } else if (width < 1024) {
        screenSize.value = 'tablet';
      } else {
        screenSize.value = 'desktop';
      }
    }
  }

  // Auto-collapse panels on mobile
  function handleResponsiveLayout(): void {
    if (screenSize.value === 'mobile') {
      sidebarCollapsed.value = true;
      rightPanelCollapsed.value = true;
    }
  }

  return {
    // State
    theme,
    rightPanelTab,
    showRulers,
    sidebarCollapsed,
    rightPanelCollapsed,
    canvasZoom,
    showPreview,
    previewDevice,
    preferences,
    keyboardShortcuts,
    panelDimensions,
    screenSize,
    
    // Computed
    themeClass,
    isDarkTheme,
    isLightTheme,
    canvasZoomPercent,
    deviceBreakpoints,
    currentDeviceBreakpoint,
    
    // Actions
    toggleTheme,
    setTheme,
    setRightPanelTab,
    toggleRulers,
    setRulersVisibility,
    toggleSidebar,
    setSidebarCollapsed,
    toggleRightPanel,
    setRightPanelCollapsed,
    setCanvasZoom,
    zoomIn,
    zoomOut,
    resetZoom,
    togglePreview,
    setPreviewMode,
    setPreviewDevice,
    updatePreference,
    resetPreferences,
    resetUI,
    getShortcutForAction,
    updateShortcut,
    setPanelDimension,
    initializeTheme,
    updateScreenSize,
    handleResponsiveLayout
  };
});