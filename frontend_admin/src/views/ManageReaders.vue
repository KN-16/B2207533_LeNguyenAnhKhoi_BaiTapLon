<template>
  <div>
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h1 class="h3 mb-0 text-gray-800">Quản lý Đọc giả</h1>
      <button class="btn btn-primary shadow-sm" @click="openModal(null)">
        <i class="fas fa-plus me-2"></i> Thêm Đọc giả
      </button>
    </div>

    <ReadersList ref="listRef" @edit-reader="openModal" />

    <ReaderForm 
      :show="showModal" 
      :reader-to-edit="selectedReader" 
      @close="closeModal" 
      @success="handleSuccess" 
    />
  </div>
</template>

<script setup>
import { ref } from 'vue';
import ReadersList from '@/components/tables/ReadersList.vue';
import ReaderForm from '@/components/forms/ReaderForm.vue';

const showModal = ref(false);
const selectedReader = ref(null);
const listRef = ref(null);

const openModal = (reader) => {
  selectedReader.value = reader;
  showModal.value = true;
};

const closeModal = () => {
  showModal.value = false;
  selectedReader.value = null;
};

const handleSuccess = () => {
  closeModal();
  // Refresh lại bảng sau khi thêm/sửa thành công
  if (listRef.value) {
    listRef.value.loadReaders();
  }
};
</script>