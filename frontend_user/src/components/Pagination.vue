<template>
  <nav
    v-if="totalPages > 1"
    aria-label="Page navigation"
    class="d-flex justify-content-center mt-4"
  >
    <ul class="pagination">
      <li class="page-item" :class="{ disabled: currentPage === 1 }">
        <a
          class="page-link"
          href="#"
          @click.prevent="changePage(currentPage - 1)"
          aria-label="Previous"
        >
          <span aria-hidden="true">&laquo;</span>
        </a>
      </li>
      <li
        v-for="page in pages"
        :key="page"
        class="page-item"
        :class="{ active: page === currentPage }"
      >
        <a class="page-link" href="#" @click.prevent="changePage(page)">{{
          page
        }}</a>
      </li>
      <li class="page-item" :class="{ disabled: currentPage === totalPages }">
        <a
          class="page-link"
          href="#"
          @click.prevent="changePage(currentPage + 1)"
          aria-label="Next"
        >
          <span aria-hidden="true">&raquo;</span>
        </a>
      </li>
    </ul>
  </nav>
</template>

<script setup>
import { defineProps, defineEmits, computed } from 'vue';

const props = defineProps({
  currentPage: {
    type: Number,
    required: true,
  },
  totalPages: {
    type: Number,
    required: true,
  },
  maxVisiblePages: {
    type: Number,
    default: 5,
  },
});

const emits = defineEmits(['page-changed']);

const pages = computed(() => {
  const start = Math.max(
    1,
    props.currentPage - Math.floor(props.maxVisiblePages / 2)
  );
  const end = Math.min(props.totalPages, start + props.maxVisiblePages - 1);
  
  // Adjust start if end is at the limit
  const adjustedStart = Math.max(1, end - props.maxVisiblePages + 1);

  const range = [];
  for (let i = adjustedStart; i <= end; i++) {
    range.push(i);
  }
  return range;
});

const changePage = (page) => {
  if (page < 1 || page > props.totalPages || page === props.currentPage) {
    return;
  }
  emits('page-changed', page);
};
</script>