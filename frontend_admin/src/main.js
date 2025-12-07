import { createApp } from 'vue';
import { createPinia } from 'pinia';

import App from './App.vue';
import router from './router';

// Import global styles
import 'bootstrap/dist/css/bootstrap.min.css';
import '@fortawesome/fontawesome-free/css/all.min.css';
// Import Vue Good Table CSS
import 'vue-good-table-next/dist/vue-good-table-next.css';
// Import custom global styles
import './assets/main.scss';

// Import Bootstrap JS (bundle includes Popper)
import 'bootstrap/dist/js/bootstrap.bundle.min.js';

const app = createApp(App);

app.use(createPinia());
app.use(router);

app.mount('#app');