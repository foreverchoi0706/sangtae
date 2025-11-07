<script setup lang="ts">
import { ref, watch } from "vue";
import { useAtom } from "../hooks/useAtom";
import { $gender, type Post } from "../stores/posts";

const props = defineProps<{
  post: Post;
}>();

const emit = defineEmits<{
  edit: [id: number, title: string];
  delete: [id: number];
}>();

const [gender, setGender] = useAtom($gender);
const isEditing = ref(false);
const editValue = ref(props.post.title);

const onSaveClick = () => {
  if (editValue.value.trim() !== "") {
    emit("edit", props.post.id, editValue.value.trim());
    isEditing.value = false;
  }
};

const onCancelClick = () => {
  editValue.value = props.post.title;
  isEditing.value = false;
};

const handleKeyPress = (e: KeyboardEvent) => {
  if (e.key === "Enter") onSaveClick();
  if (e.key === "Escape") onCancelClick();
};

watch(
  () => props.post.title,
  (newTitle) => {
    if (!isEditing.value) {
      editValue.value = newTitle;
    }
  }
);
</script>

<template>
  <li class="post-item">
    <div v-if="isEditing" class="post-edit">
      <input
        type="text"
        v-model="editValue"
        @keypress="handleKeyPress"
        class="post-edit-input"
        autofocus
      />
      <button @click="onSaveClick" class="post-save-btn">저장</button>
      <button @click="onCancelClick" class="post-cancel-btn">취소</button>
    </div>
    <template v-else>
      <span class="post-name" @click="setGender(gender === 'M' ? 'F' : 'M')">
        {{ gender }}:{{ post.title }}
      </span>
      <div class="post-actions">
        <button @click="isEditing = true" class="post-edit-btn">수정</button>
        <button @click="emit('delete', post.id)" class="post-delete-btn">
          삭제
        </button>
      </div>
    </template>
  </li>
</template>

<style scoped>
.post-item {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.75rem;
  margin-bottom: 0.5rem;
  width: 100%;
  max-width: 100%;
  background: white;
  border-radius: 8px;
  border: 1px solid #e0e0e0;
  transition: all 0.2s;
  flex-wrap: wrap;
}

.post-item:hover {
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.post-name {
  flex: 1;
  text-align: center;
  font-size: 0.9rem;
  color: #333;
  cursor: pointer;
  user-select: none;
  word-break: break-word;
  overflow-wrap: break-word;
}

.post-actions {
  display: flex;
  gap: 0.5rem;
  width: 100%;
  justify-content: center;
}

.post-edit-btn,
.post-delete-btn {
  padding: 0.4rem 0.75rem;
  border: none;
  border-radius: 4px;
  font-size: 0.8rem;
  cursor: pointer;
  transition: all 0.2s;
  white-space: nowrap;
}

.post-edit-btn {
  background: #f0f0f0;
  color: #333;
}

.post-edit-btn:hover {
  background: #e0e0e0;
}

.post-delete-btn {
  background: #ff4444;
  color: white;
}

.post-delete-btn:hover {
  background: #cc0000;
}

.post-edit {
  flex: 1;
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  align-items: center;
  flex-wrap: wrap;
  width: 100%;
}

.post-edit-input {
  flex: 1;
  max-width: 100%;
  padding: 0.4rem;
  border: 2px solid #646cff;
  border-radius: 4px;
  font-size: 0.9rem;
  outline: none;
  text-align: center;
  width: 100%;
  margin-bottom: 0.5rem;
}

.post-save-btn,
.post-cancel-btn {
  padding: 0.4rem 0.75rem;
  border: none;
  border-radius: 4px;
  font-size: 0.8rem;
  cursor: pointer;
  white-space: nowrap;
}

.post-save-btn {
  background: #646cff;
  color: white;
}

.post-save-btn:hover {
  background: #535bf2;
}

.post-cancel-btn {
  background: #e0e0e0;
  color: #333;
}

.post-cancel-btn:hover {
  background: #d0d0d0;
}
</style>
