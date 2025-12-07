<template>
  <div>
    <div class="d-flex justify-content-between align-items-center mb-4">
      <h1>Quản lý sách</h1>
      <button class="btn btn-primary" @click="openBookModal(null)">
        <i class="fas fa-plus me-2"></i>Thêm sách mới
      </button>
    </div>

    <BooksList ref="booksListRef" @edit-book="openBookModal" />

    <BookForm
      :show="showModal"
      :book-to-edit="selectedBook"
      @close="closeBookModal"
      @success="handleFormSuccess"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue';
import BooksList from '@/components/tables/BooksList.vue';
import BookForm from '@/components/forms/BookForm.vue';

const showModal = ref(false);
const selectedBook = ref(null);
const booksListRef = ref(null); // Ref to the BooksList component


const openBookModal = (book) => {
  selectedBook.value = book;
  showModal.value = true;
};

const closeBookModal = () => {
  showModal.value = false;
  selectedBook.value = null;
};

const handleFormSuccess = () => {
  closeBookModal();
  // Call the refresh method on the child component
  if (booksListRef.value) {
    booksListRef.value.loadItems();
  }
};
</script>