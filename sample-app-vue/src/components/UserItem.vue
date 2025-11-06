<script setup lang="ts">
import { ref, watch } from "vue";
import type { User } from "../stores/users";

const props = defineProps<{
  user: User;
}>();

const emit = defineEmits<{
  edit: [id: number, name: string];
  delete: [id: number];
}>();

const isEditing = ref(false);
const editValue = ref(props.user.name);

const onSaveClick = () => {
  if (editValue.value.trim() !== "") {
    emit("edit", props.user.id, editValue.value.trim());
    isEditing.value = false;
  }
};

const onCancelClick = () => {
  editValue.value = props.user.name;
  isEditing.value = false;
};

const handleKeyPress = (e: KeyboardEvent) => {
  if (e.key === "Enter") onSaveClick();
  if (e.key === "Escape") onCancelClick();
};

watch(
  () => props.user.name,
  (newName) => {
    if (!isEditing.value) {
      editValue.value = newName;
    }
  }
);
</script>

<template>
  <li class="user-item">
    <div v-if="isEditing" class="user-edit">
      <input
        type="text"
        v-model="editValue"
        @keypress="handleKeyPress"
        class="user-edit-input"
        autofocus
      />
      <button @click="onSaveClick" class="user-save-btn">저장</button>
      <button @click="onCancelClick" class="user-cancel-btn">취소</button>
    </div>
    <template v-else>
      <span class="user-name" @dblclick="isEditing = true">{{
        user.name
      }}</span>
      <div class="user-actions">
        <button @click="isEditing = true" class="user-edit-btn">수정</button>
        <button @click="emit('delete', user.id)" class="user-delete-btn">
          삭제
        </button>
      </div>
    </template>
  </li>
</template>

<style scoped>
.user-item {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.75rem;
  padding: 1rem;
  margin-bottom: 0.5rem;
  width: 100%;
  max-width: 500px;
  background: white;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  transition: all 0.2s;
}

.user-item:hover {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.user-name {
  flex: 1;
  text-align: center;
  font-size: 1rem;
  color: #333;
  cursor: pointer;
  user-select: none;
}

.user-actions {
  display: flex;
  gap: 0.5rem;
}

.user-edit-btn,
.user-delete-btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  font-size: 0.875rem;
  cursor: pointer;
  transition: opacity 0.2s;
}

.user-edit-btn {
  background: #f0f0f0;
  color: #333;
}

.user-edit-btn:hover {
  background: #e0e0e0;
}

.user-delete-btn {
  background: #ff4444;
  color: white;
}

.user-delete-btn:hover {
  background: #cc0000;
}

.user-edit {
  flex: 1;
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  align-items: center;
}

.user-edit-input {
  flex: 1;
  max-width: 300px;
  padding: 0.5rem;
  border: 2px solid #646cff;
  border-radius: 4px;
  font-size: 1rem;
  outline: none;
  text-align: center;
}

.user-save-btn,
.user-cancel-btn {
  padding: 0.5rem 1rem;
  border: none;
  border-radius: 4px;
  font-size: 0.875rem;
  cursor: pointer;
}

.user-save-btn {
  background: #646cff;
  color: white;
}

.user-save-btn:hover {
  background: #535bf2;
}

.user-cancel-btn {
  background: #e0e0e0;
  color: #333;
}

.user-cancel-btn:hover {
  background: #d0d0d0;
}
</style>
