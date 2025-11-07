<script setup lang="ts">
import { ref, watch } from "vue";
import { useAtom } from "./hooks/useAtom";
import { $posts, $a, $b, $c, type Post } from "./stores/posts";
import PostItem from "./components/PostItem.vue";
import logo from "./assets/vue.svg";

const isLoading = ref(true);
const [posts, setPosts] = useAtom($posts);
const [a, setA] = useAtom($a);
const [b, setB] = useAtom($b);
const [c, setC] = useAtom($c);
const inputValue = ref<Post["title"]>("");
const listRef = ref<HTMLUListElement | null>(null);

// posts가 업데이트되면 로딩 완료
watch(
  () => posts.value,
  (newValue) => {
    if (newValue !== undefined && Array.isArray(newValue)) {
      isLoading.value = false;
    }
  },
  { immediate: true }
);

const onAddClick = () => {
  if (inputValue.value.trim() === "" || !posts.value) return;

  const newPost: Post = {
    id:
      posts.value.length > 0
        ? Math.max(...posts.value.map((p) => p.id)) + 1
        : 1,
    title: inputValue.value.trim(),
    body: "body",
    userId: 1,
  };

  setPosts([newPost, ...posts.value]);
  inputValue.value = "";

  if (listRef.value) {
    listRef.value.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }
};

const onEditClick = (id: number, newTitle: string) => {
  if (newTitle.trim() === "" || !posts.value) return;

  setPosts(
    posts.value.map((post) =>
      post.id === id ? { ...post, title: newTitle.trim() } : post
    )
  );
};

const onDeleteClick = (id: number) => {
  if (!posts.value) return;
  setPosts(posts.value.filter((post) => post.id !== id));
};

const onSetAClick = () => {
  setA((a.value = a.value + "AAAA"));
};

const onSetBClick = () => {
  setB((b.value = b.value + "BBBB"));
};

const onSetCClick = () => {
  setC((c.value = c.value + "CCCC"));
};
</script>

<template>
  <main>
    <header class="header">
      <img :src="logo" alt="logo" class="logo" />
      <h1>SAMPLE APP VUE</h1>
    </header>
    <div>{{ a }}</div>
    <div>{{ b }}</div>
    <div>{{ c }}</div>
    <button @click="onSetAClick">setA</button>
    <button @click="onSetBClick">setB</button>
    <button @click="onSetCClick">setC</button>
    <div v-if="isLoading" class="loading">LOADING...</div>
    <template v-else>
      <div class="post-input">
        <input
          type="text"
          v-model="inputValue"
          @keydown.enter="onAddClick"
          placeholder="사용자 이름을 입력하세요..."
          class="post-input-field"
        />
        <button @click="onAddClick" class="post-add-btn">추가</button>
      </div>
      <ul class="post-list" ref="listRef">
        <PostItem
          v-for="post in posts"
          :key="post.id"
          :post="post"
          @edit="onEditClick"
          @delete="onDeleteClick"
        />
      </ul>
      <div v-if="posts && posts.length > 0" class="post-stats">
        전체: {{ posts.length }}개
      </div>
    </template>
  </main>
</template>

<style scoped>
main {
  max-width: 600px;
  width: 100%;
  padding: 1rem;
  border-radius: 8px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  display: flex;
  flex-direction: column;
  max-height: calc(100vh - 1rem);
  overflow: hidden;
}

.header {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.logo {
  width: 60px;
  height: 60px;
  object-fit: contain;
}

h1 {
  text-align: center;
  color: #333;
}

.loading {
  text-align: center;
  color: #333;
  font-size: 1.2rem;
  font-weight: bold;
}

.post-input {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  margin-bottom: 1rem;
}

.post-input-field {
  width: 100%;
  max-width: 100%;
  padding: 0.6rem;
  border: 2px solid #ddd;
  border-radius: 6px;
  font-size: 0.9rem;
  outline: none;
  transition: border-color 0.2s;
}

.post-input-field:focus {
  border-color: #646cff;
}

.post-add-btn {
  width: 100%;
  max-width: 100%;
  padding: 0.6rem 1rem;
  background: #646cff;
  color: white;
  border: none;
  border-radius: 6px;
  font-size: 0.9rem;
  cursor: pointer;
  transition: background 0.2s;
}

.post-add-btn:hover {
  background: #535bf2;
}

.post-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  max-height: calc(100vh - 280px);
  overflow-y: auto;
  overflow-x: hidden;
  flex: 1;
  -webkit-overflow-scrolling: touch;
}

.post-empty {
  text-align: center;
  padding: 2rem;
  color: #888;
  font-style: italic;
}

.post-stats {
  margin-top: 1rem;
  padding-top: 0.75rem;
  border-top: 1px solid #e0e0e0;
  text-align: center;
  color: #666;
  font-size: 0.8rem;
  flex-shrink: 0;
}
</style>
