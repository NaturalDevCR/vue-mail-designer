/**
 * Vue Mail Designer - Email Builder Library
 * Main entry point for the email builder package
 */

// Import styles
import './style.css';

// Export main component
export { default as EmailBuilder } from './components/EmailBuilder.vue';

// Export stores
export { useDocumentStore } from './stores/useDocumentStore';
export { useUiStore } from './stores/useUiStore';

// Export types
export * from './schema/document';

// Export utilities
export * from './utils/ids';
export * from './utils/deep';

// Export exporters
export * from './exporters/toVuemail';
export * from './exporters/toHtml';