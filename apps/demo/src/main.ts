import { createApp } from 'vue';
import { createPinia } from 'pinia';
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate';
import App from './App.vue';

/**
 * Initialize Vue application with Pinia store
 */
const app = createApp(App);

/**
 * Configure Pinia with persistence plugin
 */
const pinia = createPinia();
pinia.use(piniaPluginPersistedstate);

app.use(pinia);
app.mount('#app');