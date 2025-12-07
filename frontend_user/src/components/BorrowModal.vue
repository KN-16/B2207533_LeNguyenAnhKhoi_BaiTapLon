<template>
  <div
    class="modal fade"
    ref="modalRef"
    tabindex="-1"
    aria-labelledby="borrowModalLabel"
    aria-hidden="true"
  >
    <div class="modal-dialog">
      <div class="modal-content">
        <div class="modal-header">
          <h5 class="modal-title" id="borrowModalLabel">
            Borrow Book: {{ bookTitle }}
          </h5>
          <button
            type="button"
            class="btn-close"
            data-bs-dismiss="modal"
            aria-label="Close"
          ></button>
        </div>
        <div class="modal-body">
          <div v-if="errorMessage" class="alert alert-danger">
            {{ errorMessage }}
          </div>
          <p>Please select your intended return date.</p>
          <form @submit.prevent="submitBorrow">
            <div class="mb-3">
              <label for="dueDate" class="form-label"
                >Intended Return Date (NgayTraDuKien)</label
              >
              <input
                type="date"
                class="form-control"
                id="dueDate"
                v-model="dueDate"
                :min="minDate"
                required
              />
            </div>
            <div class="d-grid">
              <button
                type="submit"
                class="btn btn-primary"
                :disabled="loading"
              >
                <span
                  v-if="loading"
                  class="spinner-border spinner-border-sm me-2"
                  role="status"
                  aria-hidden="true"
                ></span>
                Confirm Borrow
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, defineProps, defineEmits, watch } from 'vue';
import { Modal } from 'bootstrap';
import borrowService from '@/services/borrowService';

const props = defineProps({
  bookId: {
    type: String,
    required: true,
  },
  bookTitle: {
    type: String,
    default: '',
  },
  show: {
    type: Boolean,
    default: false,
  },
});

const emits = defineEmits(['close', 'borrow-success']);

const modalRef = ref(null);
let modalInstance = null;
const loading = ref(false);
const errorMessage = ref('');

// Set default due date to 14 days from now
const getDefaultDueDate = () => {
  const date = new Date();
  date.setDate(date.getDate() + 14);
  return date.toISOString().split('T')[0];
};
const minDate = new Date().toISOString().split('T')[0];
const dueDate = ref(getDefaultDueDate());

onMounted(() => {
  if (modalRef.value) {
    modalInstance = new Modal(modalRef.value);
    modalRef.value.addEventListener('hidden.bs.modal', () => {
      emits('close');
    });
  }
});

watch(
  () => props.show,
  (newVal) => {
    if (newVal) {
      errorMessage.value = '';
      dueDate.value = getDefaultDueDate();
      modalInstance?.show();
    } else {
      modalInstance?.hide();
    }
  }
);

const submitBorrow = async () => {
  loading.value = true;
  errorMessage.value = '';
  try {
    await borrowService.borrowBook(props.bookId, dueDate.value);
    emits('borrow-success');
    modalInstance?.hide();
  } catch (error) {
    errorMessage.value =
      error.response?.data?.message || 'Failed to borrow book. Please try again.';
  } finally {
    loading.value = false;
  }
};
</script>