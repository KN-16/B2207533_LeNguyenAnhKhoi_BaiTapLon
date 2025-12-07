<template>
  <div id="main-content-wrapper" class="d-flex flex-column min-vh-100">
    
    <AppHeader />
    
    <main id="main-content" class="flex-grow-1 container py-4">
      <RouterView />
    </main>
    
    <AppFooter />
    
  </div>
</template>

<script setup>
import { RouterView } from 'vue-router';
import AppHeader from '@/components/AppHeader.vue'; // Check lại đường dẫn import
import AppFooter from '@/components/AppFooter.vue'; // Check lại đường dẫn import
</script>

<style scoped>
/* Không cần CSS thêm nếu đã dùng Bootstrap utility classes ở trên */
</style>