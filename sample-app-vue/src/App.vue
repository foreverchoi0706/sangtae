<script setup lang="ts">
import { ref } from "vue";
import { useAtom } from "./hooks/useAtom";
import { $users, type User } from "./stores/users";
import UserItem from "./components/UserItem.vue";

const [users, setUsers] = useAtom<User[]>($users);
const inputValue = ref("");

// Create - User 추가
const handleAdd = () => {
  if (inputValue.value.trim() === "") return;

  const newUser: User = {
    id:
      users.value.length > 0
        ? Math.max(...users.value.map((u) => u.id)) + 1
        : 1,
    name: inputValue.value.trim(),
  };

  setUsers([...users.value, newUser]);
  inputValue.value = "";
};

// Update - User 이름 수정
const handleEdit = (id: number, newName: string) => {
  if (newName.trim() === "") return;

  setUsers(
    users.value.map((user) =>
      user.id === id ? { ...user, name: newName.trim() } : user
    )
  );
};

// Delete - User 삭제
const handleDelete = (id: number) => {
  setUsers(users.value.filter((user) => user.id !== id));
};
</script>

<template>
  <main>
    <h1>Users List</h1>

    <!-- Create -->
    <div class="user-input">
      <input
        type="text"
        v-model="inputValue"
        @keypress.enter="handleAdd"
        placeholder="사용자 이름을 입력하세요..."
        class="user-input-field"
      />
      <button @click="handleAdd" class="user-add-btn">추가</button>
    </div>

    <!-- Read -->
    <ul class="user-list">
      <li v-if="users.length === 0" class="user-empty">사용자가 없습니다.</li>
      <UserItem
        v-for="user in users"
        :key="user.id"
        :user="user"
        @edit="handleEdit"
        @delete="handleDelete"
      />
    </ul>

    <div v-if="users.length > 0" class="user-stats">
      전체: {{ users.length }}명
    </div>
  </main>
</template>

<style scoped>
main {
  max-width: 600px;
  width: 100%;
  padding: 2rem;
  background: #f5f5f5;
  border-radius: 12px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

h1 {
  text-align: center;
  color: #333;
  margin-bottom: 2rem;
}

/* Create - Input */
.user-input {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

.user-input-field {
  flex: 1;
  max-width: 400px;
  padding: 0.75rem;
  border: 2px solid #ddd;
  border-radius: 6px;
  font-size: 1rem;
  outline: none;
  transition: border-color 0.2s;
}

.user-input-field:focus {
  border-color: #646cff;
}

.user-add-btn {
  padding: 0.75rem 1.5rem;
  background: #646cff;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 1rem;
  cursor: pointer;
  transition: background 0.2s;
}

.user-add-btn:hover {
  background: #535bf2;
}

/* Read - List */
.user-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.user-empty {
  text-align: center;
  padding: 2rem;
  color: #888;
  font-style: italic;
}

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

/* Update - Edit */
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

/* Stats */
.user-stats {
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid #e0e0e0;
  text-align: center;
  color: #666;
  font-size: 0.875rem;
}
</style>
