<template>
  <div id="admin-layout">
    <AdminSidebar />
    <div id="main-content-wrapper">
      <AdminHeader />
      <main id="main-content" class="p-4">
        <RouterView />
      </main>
      <AdminFooter />
    </div>
  </div>
</template>

<script setup>
import { RouterView } from 'vue-router';
import AdminSidebar from '@/components/common/AdminSidebar.vue';
import AdminHeader from '@/components/common/AdminHeader.vue';
import AdminFooter from '../components/common/AdminFooter.vue';
</script>