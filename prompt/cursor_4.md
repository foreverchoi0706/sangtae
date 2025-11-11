# Enhance sample app with new features

_Exported on 2025. 11. 9. at 20시 11분 50초 GMT+9 from Cursor (2.0.69)_

---

**User**

@sample-app-react 예제를

@JF002 - Minimal Global State Managment Library 구현.md (1-97) 에 서 요구하는 사항을 쉽게 시연할수 있는 기능들을 추가,수정해줘

---

**Cursor**

```typescript
import { createAtom, createDerivedAtom } from "sangtae-js";

export const $counter = createAtom<number>(0);
export const $step = createAtom<number>(1);
export const $nickname = createAtom<string>("");

export interface CounterSummary {
  counter: number;
  step: number;
  next: number;
  greeting: string;
}

export const $summary = createDerivedAtom<CounterSummary>((get) => {
  const counter = get($counter);
  const step = get($step);
  const nickname = get($nickname).trim();

  return {
    counter,
    step,
    next: counter + step,
    greeting: nickname
      ? `${nickname}님, 다음 값은 ${counter + step}`
      : "이름을 입력해보세요.",
  };
});

export const $doubleCounter = createDerivedAtom<number>(
  (get) => get($counter) * 2
);

export const $counterHistory = createAtom<string[]>([]);
```

```typescript
import { useRef } from "react";

const useRenderCount = () => {
  const renderCountRef = useRef(0);
  renderCountRef.current += 1;
  return renderCountRef.current;
};

export default useRenderCount;
```

```typescriptreact
import { useEffect, useState } from "react";
import useAtom from "@/hooks/useAtom";
import useRenderCount from "@/hooks/useRenderCount";
import {
  $counter,
  $counterHistory,
  $doubleCounter,
  $nickname,
  $step,
  $summary,
} from "@/stores/demo";
import { get, set as setAtom, subscribe } from "sangtae-js";

const STEP_OPTIONS = [1, 5, 10] as const;

const RenderBadge = () => {
  const renders = useRenderCount();
  return <span className="render-badge">렌더링 {renders}회</span>;
};

const CounterValueCard = () => {
  const [counter] = useAtom($counter);

  return (
    <article className="atom-card">
      <header className="atom-card__header">
        <h3>Atom 값</h3>
        <RenderBadge />
      </header>
      <p className="atom-card__value">{counter}</p>
      <p className="atom-card__hint">
        `createAtom`으로 생성한 전역 값을 `useAtom`으로 구독합니다.
      </p>
    </article>
  );
};

const CounterControlsCard = () => {
  const [counter, setCounter] = useAtom($counter);
  const [step] = useAtom($step);

  const onIncrease = () => setCounter(counter + step);
  const onDecrease = () => setCounter(counter - step);
  const onReset = () => setAtom($counter, 0);
  const onSetSameValue = () => {
    const current = get($counter);
    setAtom($counter, current);
  };

  return (
    <article className="atom-card">
      <header className="atom-card__header">
        <h3>Atom 업데이트</h3>
        <RenderBadge />
      </header>
      <p className="atom-card__value atom-card__value--small">
        현재 값: <strong>{counter}</strong> / 스텝: <strong>{step}</strong>
      </p>
      <div className="atom-card__actions">
        <button onClick={onDecrease}>- 스텝</button>
        <button onClick={onIncrease}>+ 스텝</button>
        <button onClick={onReset}>0으로 초기화</button>
        <button onClick={onSetSameValue}>같은 값으로 set</button>
      </div>
      <p className="atom-card__hint">
        `set` 호출 시 값이 변하지 않으면 구독 중인 컴포넌트가 다시 렌더링되지
        않습니다.
      </p>
    </article>
  );
};

const StepSelectorCard = () => {
  const [step, setStep] = useAtom($step);

  return (
    <article className="atom-card">
      <header className="atom-card__header">
        <h3>스텝 Atom</h3>
        <RenderBadge />
      </header>
      <div className="atom-card__options">
        {STEP_OPTIONS.map((option) => (
          <label key={option}>
            <input
              type="radio"
              name="step"
              value={option}
              checked={step === option}
              onChange={() => setStep(option)}
            />
            {option}
          </label>
        ))}
      </div>
      <p className="atom-card__hint">
        별도의 Atom으로 관리된 값이 변경되면 해당 Atom을 구독 중인 컴포넌트만
        렌더링됩니다.
      </p>
    </article>
  );
};

const NicknameCard = () => {
  const [nickname, setNickname] = useAtom($nickname);

  return (
    <article className="atom-card">
      <header className="atom-card__header">
        <h3>입력 Atom</h3>
        <RenderBadge />
      </header>
      <input
        className="atom-card__input"
        value={nickname}
        placeholder="닉네임을 입력하세요"
        onChange={({ target }) => setNickname(target.value)}
      />
      <p className="atom-card__hint">
        하나의 Atom을 여러 컴포넌트에서 공유할 수 있으며, 입력값과 파생 상태가
        연결됩니다.
      </p>
    </article>
  );
};

const DerivedCounterCard = () => {
  const [doubleCount] = useAtom($doubleCounter);

  return (
    <article className="atom-card">
      <header className="atom-card__header">
        <h3>파생 Atom</h3>
        <RenderBadge />
      </header>
      <p className="atom-card__value">{doubleCount}</p>
      <p className="atom-card__hint">
        `createDerivedAtom`으로 기본 Atom을 조합하여 만든 값입니다.
      </p>
    </article>
  );
};

const SummaryCard = () => {
  const [summary] = useAtom($summary);

  const onLogSnapshot = () => {
    const snapshot = get($summary);
    console.table(snapshot);
  };

  return (
    <article className="atom-card">
      <header className="atom-card__header">
        <h3>Atom 요약</h3>
        <RenderBadge />
      </header>
      <dl className="atom-card__list">
        <div>
          <dt>현재 값</dt>
          <dd>{summary.counter}</dd>
        </div>
        <div>
          <dt>스텝</dt>
          <dd>{summary.step}</dd>
        </div>
        <div>
          <dt>다음 값</dt>
          <dd>{summary.next}</dd>
        </div>
        <div>
          <dt>메시지</dt>
          <dd>{summary.greeting}</dd>
        </div>
      </dl>
      <button onClick={onLogSnapshot} className="atom-card__log-btn">
        현재 상태 콘솔로 확인
      </button>
      <p className="atom-card__hint">
        `get`을 호출하면 React 컴포넌트 밖에서도 atom 스냅샷을 읽을 수 있습니다.
      </p>
    </article>
  );
};

const CounterHistoryCard = () => {
  const [history] = useAtom($counterHistory);
  const [isSubscribed, setIsSubscribed] = useState(true);

  useEffect(() => {
    if (!isSubscribed) {
      return;
    }

    const unsubscribe = subscribe($counter, (value) => {
      const summary = get($summary);
      const timestamp = new Date().toLocaleTimeString();
      const entry = `${timestamp} → ${value} (다음: ${summary.next})`;
      const current = get($counterHistory);
      const nextHistory = [entry, ...current].slice(0, 8);
      setAtom($counterHistory, nextHistory);
    });

    return () => unsubscribe();
  }, [isSubscribed]);

  const onToggleSubscribe = () => {
    if (isSubscribed) {
      setAtom($counterHistory, []);
    }
    setIsSubscribed((prev) => !prev);
  };

  return (
    <article className="atom-card atom-card--wide">
      <header className="atom-card__header">
        <h3>수동 구독자</h3>
        <RenderBadge />
      </header>
      <div className="atom-card__actions">
        <button onClick={onToggleSubscribe}>
          {isSubscribed ? "구독 해제" : "다시 구독"}
        </button>
      </div>
      <p className="atom-card__hint">
        `subscribe`로 직접 구독을 생성하고 해제할 수 있습니다. 구독이 제거되면
        내부 listener Set이 비워집니다.
      </p>
      {isSubscribed ? (
        <ul className="history-list">
          {history.length === 0 && (
            <li className="history-list__empty">아직 변경 이력이 없습니다.</li>
          )}
          {history.map((entry, index) => (
            <li key={`${entry}-${index}`}>{entry}</li>
          ))}
        </ul>
      ) : (
        <div className="history-list__empty">
          구독이 해제되어 변경 이력을 수집하지 않습니다.
        </div>
      )}
    </article>
  );
};

const DemoPage = () => {
  return (
    <div className="demo-page">
      <section className="demo-section">
        <header className="demo-section__header">
          <h2>Minimal Global State 데모</h2>
          <p>
            Atom 생성부터 파생 값, 수동 구독까지 라이브러리의 핵심 기능을 한
            페이지에서 확인할 수 있습니다.
          </p>
        </header>
        <div className="demo-grid">
          <CounterValueCard />
          <CounterControlsCard />
          <StepSelectorCard />
          <NicknameCard />
          <DerivedCounterCard />
          <SummaryCard />
        </div>
      </section>
      <section className="demo-section">
        <header className="demo-section__header">
          <h2>구독자 동작 확인</h2>
          <p>
            동일한 값으로 `set`하면 구독자가 호출되지 않으며, 필요 시 구독을 직접
            관리하여 GC-friendly하게 동작합니다.
          </p>
        </header>
        <CounterHistoryCard />
      </section>
    </div>
  );
};

export default DemoPage;


```

```typescriptreact
import { useRef, useState, type FC } from "react";
import { Link } from "react-router-dom";
import useAtom from "@/hooks/useAtom";
import { $posts } from "@/stores";
import { type Post } from "@/apis";

const PostItem: FC<{
  post: Post;
  onEdit: (id: number, title: string) => void;
  onDelete: (id: number) => void;
}> = ({ post, onEdit, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(post.title);

  const onSave = () => {
    if (draft.trim() === "") return;
    onEdit(post.id, draft.trim());
    setIsEditing(false);
  };

  const onCancel = () => {
    setDraft(post.title);
    setIsEditing(false);
  };

  return (
    <li className="post-item">
      {isEditing ? (
        <div className="post-edit">
          <input
            type="text"
            value={draft}
            onChange={({ target }) => setDraft(target.value)}
            onKeyDown={({ key }) => {
              if (key === "Enter") onSave();
              if (key === "Escape") onCancel();
            }}
            className="post-edit-input"
            autoFocus
          />
          <button onClick={onSave} className="post-save-btn">
            저장
          </button>
          <button onClick={onCancel} className="post-cancel-btn">
            취소
          </button>
        </div>
      ) : (
        <>
          <Link to={`/posts/${post.id}`} className="post-name">
            {post.title}
          </Link>
          <div className="post-actions">
            <button onClick={() => setIsEditing(true)} className="post-edit-btn">
              수정
            </button>
            <button onClick={() => onDelete(post.id)} className="post-delete-btn">
              삭제
            </button>
          </div>
        </>
      )}
    </li>
  );
};

const PostsPage = () => {
  const [posts, setPosts] = useAtom($posts);
  const [inputValue, setInputValue] = useState("");
  const listRef = useRef<HTMLUListElement>(null);

  const onAdd = () => {
    if (inputValue.trim() === "") return;
    const newPost: Post = {
      id: posts.length > 0 ? Math.max(...posts.map((p) => p.id)) + 1 : 1,
      title: inputValue.trim(),
      body: "body",
      userId: 1,
    };
    setPosts([newPost, ...posts]);
    setInputValue("");
    listRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  const onEdit = (id: number, title: string) => {
    if (title.trim() === "") return;
    setPosts(
      posts.map((post) => (post.id === id ? { ...post, title: title.trim() } : post))
    );
  };

  const onDelete = (id: number) => {
    setPosts(posts.filter((post) => post.id !== id));
  };

  return (
    <section className="posts-section">
      <header className="posts-section__header">
        <h2>포스트 목록</h2>
        <p>
          `createAsyncAtom`으로 만든 데이터를 `Suspense`와 함께 사용하는 예시입니다.
          입력, 수정, 삭제는 `set`으로 상태를 직접 갱신합니다.
        </p>
      </header>
      <div className="post-input">
        <input
          type="text"
          value={inputValue}
          onChange={({ target }) => setInputValue(target.value)}
          onKeyDown={({ key }) => key === "Enter" && onAdd()}
          placeholder="포스트 제목을 입력하세요..."
          className="post-input-field"
        />
        <button onClick={onAdd} className="post-add-btn">
          추가
        </button>
      </div>
      <ul className="post-list" ref={listRef}>
        {posts.map((post) => (
          <PostItem key={post.id} post={post} onEdit={onEdit} onDelete={onDelete} />
        ))}
      </ul>
      {posts.length > 0 && (
        <div className="post-stats">전체: {posts.length}개</div>
      )}
    </section>
  );
};

export default PostsPage;


```

```typescriptreact
import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { createAsyncAtom } from "sangtae-js";
import useAtom from "@/hooks/useAtom";
import { getPost, type Post } from "@/apis";

const PostDetailPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const postAtom = useMemo(
    () => createAsyncAtom<Post>(getPost(Number(id))),
    [id]
  );

  const [post] = useAtom(postAtom);

  if (!post) {
    return (
      <div className="post-detail">
        <h2>포스트를 찾을 수 없습니다</h2>
        <button onClick={() => navigate("/posts")} className="post-back-btn">
          목록으로 돌아가기
        </button>
      </div>
    );
  }

  return (
    <div className="post-detail">
      <button onClick={() => navigate("/posts")} className="post-back-btn">
        ← 목록으로 돌아가기
      </button>
      <div className="post-detail-content">
        <h2>{post.title}</h2>
        <div className="post-detail-meta">
          <span>게시글 ID: {post.id}</span>
          <span>사용자 ID: {post.userId}</span>
        </div>
        <div className="post-detail-body">
          <h3>내용</h3>
          <p>{post.body}</p>
        </div>
      </div>
    </div>
  );
};

export default PostDetailPage;


```

```typescriptreact
*** Begin Patch
*** Update File: src/App.tsx
-import { Suspense, useRef, useState, useMemo, type FC } from "react";
-import { Routes, Route, Link, useParams, useNavigate } from "react-router-dom";
+import { Suspense } from "react";
+import { Routes, Route, Link, NavLink } from "react-router-dom";
 import "@/App.css";
-import useAtom from "@/hooks/useAtom";
 import logo from "@/assets/react.svg";
-import { createAsyncAtom, createAtom } from "sangtae-js";
-import { type Post, getPost } from "./apis";
-import { $posts } from "./stores";
-
-const UserItem: FC<{
-  post: Post;
-  onEdit: (id: number, postTitle: Post["title"]) => void;
-  onDelete: (id: number) => void;
-}> = ({ post, onEdit, onDelete }) => {
-  const [isEditing, setIsEditing] = useState<boolean>(false);
-  const [editValue, setEditValue] = useState<Post["title"]>(post.title);
-
-  const onSaveClick = () => {
-    if (editValue.trim() !== "") {
-      onEdit(post.id, editValue.trim());
-      setIsEditing(false);
-    }
-  };
-
-  const onCancelClick = () => {
-    setEditValue(post.title);
-    setIsEditing(false);
-  };
-
-  return (
-    <li className="post-item">
-      {isEditing ? (
-        <div className="post-edit">
-          <input
-            type="text"
-            value={editValue}
-            onChange={({ target }) => setEditValue(target.value)}
-            onKeyDown={({ key }) => {
-              if (key === "Enter") onSaveClick();
-              if (key === "Escape") onCancelClick();
-            }}
-            className="post-edit-input"
-            autoFocus
-          />
-          <button onClick={onSaveClick} className="post-save-btn">
-            저장
-          </button>
-          <button onClick={onCancelClick} className="post-cancel-btn">
-            취소
-          </button>
-        </div>
-      ) : (
-        <>
-          <Link to={`/post/${post.id}`} className="post-name">
-            {post.title}
-          </Link>
-          <div className="post-actions">
-            <button
-              onClick={() => setIsEditing(true)}
-              className="post-edit-btn"
-            >
-              수정
-            </button>
-            <button
-              onClick={() => onDelete(post.id)}
-              className="post-delete-btn"
-            >
-              삭제
-            </button>
-          </div>
-        </>
-      )}
-    </li>
-  );
-};
-
-const HomePage = () => {
-  console.log("USER LIST RENDER");
-  const [posts, setPosts] = useAtom($posts);
-  const [inputValue, setInputValue] = useState<Post["title"]>("");
-  const listRef = useRef<HTMLUListElement>(null);
-
-  const onAddClick = () => {
-    if (inputValue.trim() === "") return;
-
-    const newPost = {
-      id: posts.length > 0 ? Math.max(...posts.map((p) => p.id)) + 1 : 1,
-      title: inputValue.trim(),
-      body: "body",
-      userId: 1,
-    };
-
-    setPosts([newPost, ...posts]);
-    setInputValue("");
-    listRef.current?.scrollTo({
-      top: 0,
-      behavior: "smooth",
-    });
-  };
-
-  const onEditClick = (id: number, newName: string) => {
-    if (newName.trim() === "") return;
-
-    setPosts(
-      posts.map((post) =>
-        post.id === id ? { ...post, title: newName.trim() } : post
-      )
-    );
-  };
-
-  const onDeleteClick = (id: number) => {
-    setPosts(posts.filter((post) => post.id !== id));
-  };
-
-  return (
-    <>
-      <div className="post-input">
-        <input
-          type="text"
-          value={inputValue}
-          onChange={({ target }) => setInputValue(target.value)}
-          onKeyDown={({ key }) => key === "Enter" && onAddClick()}
-          placeholder="사용자 이름을 입력하세요..."
-          className="post-input-field"
-        />
-        <button onClick={onAddClick} className="post-add-btn">
-          추가
-        </button>
-      </div>
-      <ul className="post-list" ref={listRef}>
-        {posts.map((post) => (
-          <UserItem
-            key={post.id}
-            post={post}
-            onEdit={onEditClick}
-            onDelete={onDeleteClick}
-          />
-        ))}
-      </ul>
-      {posts.length > 0 && (
-        <div className="post-stats">전체: {posts.length}개</div>
-      )}
-    </>
-  );
-};
-
-const PostPage = () => {
-  console.log("POST PAGE RENDER");
-  const navigate = useNavigate();
-  const { id } = useParams<{ id: string }>();
-  const postAtom = useMemo(
-    () => createAsyncAtom<Post>(getPost(Number(id!))),
-    [id]
-  );
-  const [post] = useAtom(postAtom);
-
-  console.log(post);
-
-  if (!post) {
-    return (
-      <div className="post-detail">
-        <h2>포스트를 찾을 수 없습니다</h2>
-        <button onClick={() => navigate("/")} className="post-back-btn">
-          목록으로 돌아가기
-        </button>
-      </div>
-    );
-  }
-
-  return (
-    <div className="post-detail">
-      <button onClick={() => navigate("/")} className="post-back-btn">
-        ← 목록으로 돌아가기
-      </button>
-      <div className="post-detail-content">
-        <h2>{post.title}</h2>
-        <div className="post-detail-meta">
-          <span>게시글 ID: {post.id}</span>
-          <span>사용자 ID: {post.userId}</span>
-        </div>
-        <div className="post-detail-body">
-          <h3>내용</h3>
-          <p>{post.body}</p>
-        </div>
-      </div>
-    </div>
-  );
-};
+import DemoPage from "@/pages/DemoPage";
+import PostsPage from "@/pages/PostsPage";
+import PostDetailPage from "@/pages/PostDetailPage";
+
+const navLinkClass = ({ isActive }: { isActive: boolean }) =>
+  `header-nav__link${isActive ? " header-nav__link--active" : ""}`;

 const App = () => {
   return (
     <main>
       <header className="header">
         <Link to="/" className="header-link">
           <img src={logo} alt="logo" className="logo" />
           <h1>SAMPLE APP REACT</h1>
         </Link>
+        <nav className="header-nav">
+          <NavLink to="/" end className={navLinkClass}>
+            데모
+          </NavLink>
+          <NavLink to="/posts" className={navLinkClass}>
+            포스트 목록
+          </NavLink>
+        </nav>
       </header>
-      <Routes>
-        <Route
-          path="/"
-          element={
-            <Suspense fallback={<div className="loading">LOADING...</div>}>
-              <HomePage />
-            </Suspense>
-          }
-        />
-        <Route
-          path="/post/:id"
-          element={
-            <Suspense fallback={<div className="loading">LOADING...</div>}>
-              <PostPage />
-            </Suspense>
-          }
-        />
-      </Routes>
+      <Suspense fallback={<div className="loading">LOADING...</div>}>
+        <Routes>
+          <Route path="/" element={<DemoPage />} />
+          <Route path="/posts" element={<PostsPage />} />
+          <Route path="/posts/:id" element={<PostDetailPage />} />
+        </Routes>
+      </Suspense>
     </main>
   );
 };

 export default App;
*** End Patch
```

```typescriptreact
*** Begin Patch
*** Update File: src/App.tsx
@@
-import { Suspense, useRef, useState, useMemo, type FC } from "react";
-import { Routes, Route, Link, useParams, useNavigate } from "react-router-dom";
-import "@/App.css";
-import useAtom from "@/hooks/useAtom";
-import logo from "@/assets/react.svg";
-import { createAsyncAtom, createAtom } from "sangtae-js";
-import { type Post, getPost } from "./apis";
-import { $posts } from "./stores";
-
-const UserItem: FC<{
-  post: Post;
-  onEdit: (id: number, postTitle: Post["title"]) => void;
-  onDelete: (id: number) => void;
-}> = ({ post, onEdit, onDelete }) => {
-  const [isEditing, setIsEditing] = useState<boolean>(false);
-  const [editValue, setEditValue] = useState<Post["title"]>(post.title);
-
-  const onSaveClick = () => {
-    if (editValue.trim() !== "") {
-      onEdit(post.id, editValue.trim());
-      setIsEditing(false);
-    }
-  };
-
-  const onCancelClick = () => {
-    setEditValue(post.title);
-    setIsEditing(false);
-  };
-
-  return (
-    <li className="post-item">
-      {isEditing ? (
-        <div className="post-edit">
-          <input
-            type="text"
-            value={editValue}
-            onChange={({ target }) => setEditValue(target.value)}
-            onKeyDown={({ key }) => {
-              if (key === "Enter") onSaveClick();
-              if (key === "Escape") onCancelClick();
-            }}
-            className="post-edit-input"
-            autoFocus
-          />
-          <button onClick={onSaveClick} className="post-save-btn">
-            저장
-          </button>
-          <button onClick={onCancelClick} className="post-cancel-btn">
-            취소
-          </button>
-        </div>
-      ) : (
-        <>
-          <Link to={`/post/${post.id}`} className="post-name">
-            {post.title}
-          </Link>
-          <div className="post-actions">
-            <button
-              onClick={() => setIsEditing(true)}
-              className="post-edit-btn"
-            >
-              수정
-            </button>
-            <button
-              onClick={() => onDelete(post.id)}
-              className="post-delete-btn"
-            >
-              삭제
-            </button>
-          </div>
-        </>
-      )}
-    </li>
-  );
-};
-
-const HomePage = () => {
-  console.log("USER LIST RENDER");
-  const [posts, setPosts] = useAtom($posts);
-  const [inputValue, setInputValue] = useState<Post["title"]>("");
-  const listRef = useRef<HTMLUListElement>(null);
-
-  const onAddClick = () => {
-    if (inputValue.trim() === "") return;
-
-    const newPost = {
-      id: posts.length > 0 ? Math.max(...posts.map((p) => p.id)) + 1 : 1,
-      title: inputValue.trim(),
-      body: "body",
-      userId: 1,
-    };
-
-    setPosts([newPost, ...posts]);
-    setInputValue("");
-    listRef.current?.scrollTo({
-      top: 0,
-      behavior: "smooth",
-    });
-  };
-
-  const onEditClick = (id: number, newName: string) => {
-    if (newName.trim() === "") return;
-
-    setPosts(
-      posts.map((post) =>
-        post.id === id ? { ...post, title: newName.trim() } : post
-      )
-    );
-  };
-
-  const onDeleteClick = (id: number) => {
-    setPosts(posts.filter((post) => post.id !== id));
-  };
-
-  return (
-    <>
-      <div className="post-input">
-        <input
-          type="text"
-          value={inputValue}
-          onChange={({ target }) => setInputValue(target.value)}
-          onKeyDown={({ key }) => key === "Enter" && onAddClick()}
-          placeholder="사용자 이름을 입력하세요..."
-          className="post-input-field"
-        />
-        <button onClick={onAddClick} className="post-add-btn">
-          추가
-        </button>
-      </div>
-      <ul className="post-list" ref={listRef}>
-        {posts.map((post) => (
-          <UserItem
-            key={post.id}
-            post={post}
-            onEdit={onEditClick}
-            onDelete={onDeleteClick}
-          />
-        ))}
-      </ul>
-      {posts.length > 0 && (
-        <div className="post-stats">전체: {posts.length}개</div>
-      )}
-    </>
-  );
-};
-
-const PostPage = () => {
-  console.log("POST PAGE RENDER");
-  const navigate = useNavigate();
-  const { id } = useParams<{ id: string }>();
-  const postAtom = useMemo(
-    () => createAsyncAtom<Post>(getPost(Number(id!))),
-    [id]
-  );
-  const [post] = useAtom(postAtom);
-
-  console.log(post);
-
-  if (!post) {
-    return (
-      <div className="post-detail">
-        <h2>포스트를 찾을 수 없습니다</h2>
-        <button onClick={() => navigate("/")} className="post-back-btn">
-          목록으로 돌아가기
-        </button>
-      </div>
-    );
-  }
-
-  return (
-    <div className="post-detail">
-      <button onClick={() => navigate("/")} className="post-back-btn">
-        ← 목록으로 돌아가기
-      </button>
-      <div className="post-detail-content">
-        <h2>{post.title}</h2>
-        <div className="post-detail-meta">
-          <span>게시글 ID: {post.id}</span>
-          <span>사용자 ID: {post.userId}</span>
-        </div>
-        <div className="post-detail-body">
-          <h3>내용</h3>
-          <p>{post.body}</p>
-        </div>
-      </div>
-    </div>
-  );
-};
-
-const App = () => {
-  return (
-    <main>
-      <header className="header">
-        <Link to="/" className="header-link">
-          <img src={logo} alt="logo" className="logo" />
-          <h1>SAMPLE APP REACT</h1>
-        </Link>
-      </header>
-      <Routes>
-        <Route
-          path="/"
-          element={
-            <Suspense fallback={<div className="loading">LOADING...</div>}>
-              <HomePage />
-            </Suspense>
-          }
-        />
-        <Route
-          path="/post/:id"
-          element={
-            <Suspense fallback={<div className="loading">LOADING...</div>}>
-              <PostPage />
-            </Suspense>
-          }
-        />
-      </Routes>
-    </main>
-  );
-};
-
-export default App;
+import { Suspense } from "react";
+import { Routes, Route, Link, NavLink } from "react-router-dom";
+import "@/App.css";
+import logo from "@/assets/react.svg";
+import DemoPage from "@/pages/DemoPage";
+import PostsPage from "@/pages/PostsPage";
+import PostDetailPage from "@/pages/PostDetailPage";
+
+const navLinkClass = ({ isActive }: { isActive: boolean }) =>
+  `header-nav__link${isActive ? " header-nav__link--active" : ""}`;
+
+const App = () => {
+  return (
+    <main>
+      <header className="header">
+        <Link to="/" className="header-link">
+          <img src={logo} alt="logo" className="logo" />
+          <h1>SAMPLE APP REACT</h1>
+        </Link>
+        <nav className="header-nav">
+          <NavLink to="/" end className={navLinkClass}>
+            데모
+          </NavLink>
+          <NavLink to="/posts" className={navLinkClass}>
+            포스트 목록
+          </NavLink>
+        </nav>
+      </header>
+      <Suspense fallback={<div className="loading">LOADING...</div>}>
+        <Routes>
+          <Route path="/" element={<DemoPage />} />
+          <Route path="/posts" element={<PostsPage />} />
+          <Route path="/posts/:id" element={<PostDetailPage />} />
+        </Routes>
+      </Suspense>
+    </main>
+  );
+};
+
+export default App;
*** End Patch
```

```typescriptreact
*** Begin Patch
*** Update File: src/App.tsx
*** End Patch
```

```typescriptreact
import { Suspense } from "react";
import { Routes, Route, Link, NavLink } from "react-router-dom";
import "@/App.css";
import logo from "@/assets/react.svg";
import DemoPage from "@/pages/DemoPage";
import PostsPage from "@/pages/PostsPage";
import PostDetailPage from "@/pages/PostDetailPage";

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `header-nav__link${isActive ? " header-nav__link--active" : ""}`;

const App = () => {
  return (
    <main>
      <header className="header">
        <Link to="/" className="header-link">
          <img src={logo} alt="logo" className="logo" />
          <h1>SAMPLE APP REACT</h1>
        </Link>
        <nav className="header-nav">
          <NavLink to="/" end className={navLinkClass}>
            데모
          </NavLink>
          <NavLink to="/posts" className={navLinkClass}>
            포스트 목록
          </NavLink>
        </nav>
      </header>
      <Suspense fallback={<div className="loading">LOADING...</div>}>
        <Routes>
          <Route path="/" element={<DemoPage />} />
          <Route path="/posts" element={<PostsPage />} />
          <Route path="/posts/:id" element={<PostDetailPage />} />
        </Routes>
      </Suspense>
    </main>
  );
};

export default App;


```

```typescriptreact
import { Suspense } from "react";
import { Routes, Route, Link, NavLink } from "react-router-dom";
import "@/App.css";
import logo from "@/assets/react.svg";
import DemoPage from "@/pages/DemoPage";
import PostsPage from "@/pages/PostsPage";
import PostDetailPage from "@/pages/PostDetailPage";

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `header-nav__link${isActive ? " header-nav__link--active" : ""}`;

const App = () => {
  return (
    <main>
      <header className="header">
        <Link to="/" className="header-link">
          <img src={logo} alt="logo" className="logo" />
          <h1>SAMPLE APP REACT</h1>
        </Link>
        <nav className="header-nav">
          <NavLink to="/" end className={navLinkClass}>
            데모
          </NavLink>
          <NavLink to="/posts" className={navLinkClass}>
            포스트 목록
          </NavLink>
        </nav>
      </header>
      <Suspense fallback={<div className="loading">LOADING...</div>}>
        <Routes>
          <Route path="/" element={<DemoPage />} />
          <Route path="/posts" element={<PostsPage />} />
          <Route path="/posts/:id" element={<PostDetailPage />} />
        </Routes>
      </Suspense>
    </main>
  );
};

export default App;

import { Suspense } from "react";
import { Routes, Route, Link, NavLink } from "react-router-dom";
import "@/App.css";
import logo from "@/assets/react.svg";
import DemoPage from "@/pages/DemoPage";
import PostsPage from "@/pages/PostsPage";
import PostDetailPage from "@/pages/PostDetailPage";

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `header-nav__link${isActive ? " header-nav__link--active" : ""}`;

const App = () => {
  return (
    <main>
      <header className="header">
        <Link to="/" className="header-link">
          <img src={logo} alt="logo" className="logo" />
          <h1>SAMPLE APP REACT</h1>
        </Link>
        <nav className="header-nav">
          <NavLink to="/" end className={navLinkClass}>
            데모
          </NavLink>
          <NavLink to="/posts" className={navLinkClass}>
            포스트 목록
          </NavLink>
        </nav>
      </header>
      <Suspense fallback={<div className="loading">LOADING...</div>}>
        <Routes>
          <Route path="/" element={<DemoPage />} />
          <Route path="/posts" element={<PostsPage />} />
          <Route path="/posts/:id" element={<PostDetailPage />} />
        </Routes>
      </Suspense>
    </main>
  );
};

export default App;



```

```typescriptreact
import { Suspense } from "react";
import { Routes, Route, Link, NavLink } from "react-router-dom";
import "@/App.css";
import logo from "@/assets/react.svg";
import DemoPage from "@/pages/DemoPage";
import PostsPage from "@/pages/PostsPage";
import PostDetailPage from "@/pages/PostDetailPage";

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `header-nav__link${isActive ? " header-nav__link--active" : ""}`;

const App = () => {
  return (
    <main>
      <header className="header">
        <Link to="/" className="header-link">
          <img src={logo} alt="logo" className="logo" />
          <h1>SAMPLE APP REACT</h1>
        </Link>
        <nav className="header-nav">
          <NavLink to="/" end className={navLinkClass}>
            데모
          </NavLink>
          <NavLink to="/posts" className={navLinkClass}>
            포스트 목록
          </NavLink>
        </nav>
      </header>
      <Suspense fallback={<div className="loading">LOADING...</div>}>
        <Routes>
          <Route path="/" element={<DemoPage />} />
          <Route path="/posts" element={<PostsPage />} />
          <Route path="/posts/:id" element={<PostDetailPage />} />
        </Routes>
      </Suspense>
    </main>
  );
};

export default App;


```

```typescript
import { createAtom, createDerivedAtom } from "sangtae-js";

export const $counter = createAtom<number>(0);
export const $step = createAtom<number>(1);
export const $nickname = createAtom<string>("");

export interface CounterSummary {
  counter: number;
  step: number;
  next: number;
  greeting: string;
}

export const $summary = createDerivedAtom<CounterSummary>((get) => {
  const counter = get($counter);
  const step = get($step);
  const nickname = get($nickname).trim();

  return {
    counter,
    step,
    next: counter + step,
    greeting: nickname
      ? `${nickname}님, 다음 값은 ${counter + step}`
      : "이름을 입력해보세요.",
  };
});

export const $doubleCounter = createDerivedAtom<number>(
  (read) => read($counter) * 2
);

export const $counterHistory = createAtom<string[]>([]);
```

```typescript
import { useRef } from "react";

const useRenderCount = () => {
  const renderCountRef = useRef(0);
  renderCountRef.current += 1;
  return renderCountRef.current;
};

export default useRenderCount;
```

```typescriptreact
import { useEffect, useState } from "react";
import useAtom from "@/hooks/useAtom";
import useRenderCount from "@/hooks/useRenderCount";
import {
  $counter,
  $counterHistory,
  $doubleCounter,
  $nickname,
  $step,
  $summary,
} from "@/stores/demo";
import { get, set as setAtom, subscribe } from "sangtae-js";

const STEP_OPTIONS = [1, 5, 10] as const;

const RenderBadge = () => {
  const renders = useRenderCount();
  return <span className="render-badge">렌더링 {renders}회</span>;
};

const CounterValueCard = () => {
  const [counter] = useAtom($counter);

  return (
    <article className="atom-card">
      <header className="atom-card__header">
        <h3>Atom 값</h3>
        <RenderBadge />
      </header>
      <p className="atom-card__value">{counter}</p>
      <p className="atom-card__hint">
        `createAtom`으로 생성한 전역 값을 `useAtom`으로 구독합니다.
      </p>
    </article>
  );
};

const CounterControlsCard = () => {
  const [counter, setCounter] = useAtom($counter);
  const [step] = useAtom($step);

  const onIncrease = () => setCounter(counter + step);
  const onDecrease = () => setCounter(counter - step);
  const onReset = () => setAtom($counter, 0);
  const onSetSameValue = () => {
    const current = get($counter);
    setAtom($counter, current);
  };

  return (
    <article className="atom-card">
      <header className="atom-card__header">
        <h3>Atom 업데이트</h3>
        <RenderBadge />
      </header>
      <p className="atom-card__value atom-card__value--small">
        현재 값: <strong>{counter}</strong> / 스텝: <strong>{step}</strong>
      </p>
      <div className="atom-card__actions">
        <button onClick={onDecrease}>- 스텝</button>
        <button onClick={onIncrease}>+ 스텝</button>
        <button onClick={onReset}>0으로 초기화</button>
        <button onClick={onSetSameValue}>같은 값으로 set</button>
      </div>
      <p className="atom-card__hint">
        `set` 호출 시 값이 변하지 않으면 구독 중인 컴포넌트가 다시 렌더링되지
        않습니다.
      </p>
    </article>
  );
};

const StepSelectorCard = () => {
  const [step, setStep] = useAtom($step);

  return (
    <article className="atom-card">
      <header className="atom-card__header">
        <h3>스텝 Atom</h3>
        <RenderBadge />
      </header>
      <div className="atom-card__options">
        {STEP_OPTIONS.map((option) => (
          <label key={option}>
            <input
              type="radio"
              name="step"
              value={option}
              checked={step === option}
              onChange={() => setStep(option)}
            />
            {option}
          </label>
        ))}
      </div>
      <p className="atom-card__hint">
        별도의 Atom으로 관리된 값이 변경되면 해당 Atom을 구독 중인 컴포넌트만
        렌더링됩니다.
      </p>
    </article>
  );
};

const NicknameCard = () => {
  const [nickname, setNickname] = useAtom($nickname);

  return (
    <article className="atom-card">
      <header className="atom-card__header">
        <h3>입력 Atom</h3>
        <RenderBadge />
      </header>
      <input
        className="atom-card__input"
        value={nickname}
        placeholder="닉네임을 입력하세요"
        onChange={({ target }) => setNickname(target.value)}
      />
      <p className="atom-card__hint">
        하나의 Atom을 여러 컴포넌트에서 공유할 수 있으며, 입력값과 파생 상태가
        연결됩니다.
      </p>
    </article>
  );
};

const DerivedCounterCard = () => {
  const [doubleCount] = useAtom($doubleCounter);

  return (
    <article className="atom-card">
      <header className="atom-card__header">
        <h3>파생 Atom</h3>
        <RenderBadge />
      </header>
      <p className="atom-card__value">{doubleCount}</p>
      <p className="atom-card__hint">
        `createDerivedAtom`으로 기본 Atom을 조합하여 만든 값입니다.
      </p>
    </article>
  );
};

const SummaryCard = () => {
  const [summary] = useAtom($summary);

  const onLogSnapshot = () => {
    const snapshot = get($summary);
    console.table(snapshot);
  };

  return (
    <article className="atom-card">
      <header className="atom-card__header">
        <h3>Atom 요약</h3>
        <RenderBadge />
      </header>
      <dl className="atom-card__list">
        <div>
          <dt>현재 값</dt>
          <dd>{summary.counter}</dd>
        </div>
        <div>
          <dt>스텝</dt>
          <dd>{summary.step}</dd>
        </div>
        <div>
          <dt>다음 값</dt>
          <dd>{summary.next}</dd>
        </div>
        <div>
          <dt>메시지</dt>
          <dd>{summary.greeting}</dd>
        </div>
      </dl>
      <button onClick={onLogSnapshot} className="atom-card__log-btn">
        현재 상태 콘솔로 확인
      </button>
      <p className="atom-card__hint">
        `get`을 호출하면 React 컴포넌트 밖에서도 atom 스냅샷을 읽을 수 있습니다.
      </p>
    </article>
  );
};

const CounterHistoryCard = () => {
  const [history] = useAtom($counterHistory);
  const [isSubscribed, setIsSubscribed] = useState(true);

  useEffect(() => {
    if (!isSubscribed) {
      return;
    }

    const unsubscribe = subscribe($counter, (value) => {
      const summary = get($summary);
      const timestamp = new Date().toLocaleTimeString();
      const entry = `${timestamp} → ${value} (다음: ${summary.next})`;
      const current = get($counterHistory);
      const nextHistory = [entry, ...current].slice(0, 8);
      setAtom($counterHistory, nextHistory);
    });

    return () => unsubscribe();
  }, [isSubscribed]);

  const onToggleSubscribe = () => {
    if (isSubscribed) {
      setAtom($counterHistory, []);
    }
    setIsSubscribed((prev) => !prev);
  };

  return (
    <article className="atom-card atom-card--wide">
      <header className="atom-card__header">
        <h3>수동 구독자</h3>
        <RenderBadge />
      </header>
      <div className="atom-card__actions">
        <button onClick={onToggleSubscribe}>
          {isSubscribed ? "구독 해제" : "다시 구독"}
        </button>
      </div>
      <p className="atom-card__hint">
        `subscribe`로 직접 구독을 생성하고 해제할 수 있습니다. 구독이 제거되면
        내부 listener Set이 비워집니다.
      </p>
      {isSubscribed ? (
        <ul className="history-list">
          {history.length === 0 && (
            <li className="history-list__empty">아직 변경 이력이 없습니다.</li>
          )}
          {history.map((entry, index) => (
            <li key={`${entry}-${index}`}>{entry}</li>
          ))}
        </ul>
      ) : (
        <div className="history-list__empty">
          구독이 해제되어 변경 이력을 수집하지 않습니다.
        </div>
      )}
    </article>
  );
};

const DemoPage = () => {
  return (
    <div className="demo-page">
      <section className="demo-section">
        <header className="demo-section__header">
          <h2>Minimal Global State 데모</h2>
          <p>
            Atom 생성부터 파생 값, 수동 구독까지 라이브러리의 핵심 기능을 한
            페이지에서 확인할 수 있습니다.
          </p>
        </header>
        <div className="demo-grid">
          <CounterValueCard />
          <CounterControlsCard />
          <StepSelectorCard />
          <NicknameCard />
          <DerivedCounterCard />
          <SummaryCard />
        </div>
      </section>
      <section className="demo-section">
        <header className="demo-section__header">
          <h2>구독자 동작 확인</h2>
          <p>
            동일한 값으로 `set`하면 구독자가 호출되지 않으며, 필요 시 구독을 직접
            관리하여 GC-friendly하게 동작합니다.
          </p>
        </header>
        <CounterHistoryCard />
      </section>
    </div>
  );
};

export default DemoPage;


```

```typescriptreact
import { useRef, useState, type FC } from "react";
import { Link } from "react-router-dom";
import useAtom from "@/hooks/useAtom";
import { $posts } from "@/stores";
import { type Post } from "@/apis";

const PostItem: FC<{
  post: Post;
  onEdit: (id: number, title: string) => void;
  onDelete: (id: number) => void;
}> = ({ post, onEdit, onDelete }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [draft, setDraft] = useState(post.title);

  const onSave = () => {
    if (draft.trim() === "") return;
    onEdit(post.id, draft.trim());
    setIsEditing(false);
  };

  const onCancel = () => {
    setDraft(post.title);
    setIsEditing(false);
  };

  return (
    <li className="post-item">
      {isEditing ? (
        <div className="post-edit">
          <input
            type="text"
            value={draft}
            onChange={({ target }) => setDraft(target.value)}
            onKeyDown={({ key }) => {
              if (key === "Enter") onSave();
              if (key === "Escape") onCancel();
            }}
            className="post-edit-input"
            autoFocus
          />
          <button onClick={onSave} className="post-save-btn">
            저장
          </button>
          <button onClick={onCancel} className="post-cancel-btn">
            취소
          </button>
        </div>
      ) : (
        <>
          <Link to={`/posts/${post.id}`} className="post-name">
            {post.title}
          </Link>
          <div className="post-actions">
            <button onClick={() => setIsEditing(true)} className="post-edit-btn">
              수정
            </button>
            <button onClick={() => onDelete(post.id)} className="post-delete-btn">
              삭제
            </button>
          </div>
        </>
      )}
    </li>
  );
};

const PostsPage = () => {
  const [posts, setPosts] = useAtom($posts);
  const [inputValue, setInputValue] = useState("");
  const listRef = useRef<HTMLUListElement>(null);

  const onAdd = () => {
    if (inputValue.trim() === "") return;
    const newPost: Post = {
      id: posts.length > 0 ? Math.max(...posts.map((p) => p.id)) + 1 : 1,
      title: inputValue.trim(),
      body: "body",
      userId: 1,
    };
    setPosts([newPost, ...posts]);
    setInputValue("");
    listRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  const onEdit = (id: number, title: string) => {
    if (title.trim() === "") return;
    setPosts(
      posts.map((post) => (post.id === id ? { ...post, title: title.trim() } : post))
    );
  };

  const onDelete = (id: number) => {
    setPosts(posts.filter((post) => post.id !== id));
  };

  return (
    <section className="posts-section">
      <header className="posts-section__header">
        <h2>포스트 목록</h2>
        <p>
          `createAsyncAtom`으로 만든 데이터를 `Suspense`와 함께 사용하는 예시입니다.
          입력, 수정, 삭제는 `set`으로 상태를 직접 갱신합니다.
        </p>
      </header>
      <div className="post-input">
        <input
          type="text"
          value={inputValue}
          onChange={({ target }) => setInputValue(target.value)}
          onKeyDown={({ key }) => key === "Enter" && onAdd()}
          placeholder="포스트 제목을 입력하세요..."
          className="post-input-field"
        />
        <button onClick={onAdd} className="post-add-btn">
          추가
        </button>
      </div>
      <ul className="post-list" ref={listRef}>
        {posts.map((post) => (
          <PostItem key={post.id} post={post} onEdit={onEdit} onDelete={onDelete} />
        ))}
      </ul>
      {posts.length > 0 && (
        <div className="post-stats">전체: {posts.length}개</div>
      )}
    </section>
  );
};

export default PostsPage;


```

```typescriptreact
import { useMemo } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { createAsyncAtom } from "sangtae-js";
import useAtom from "@/hooks/useAtom";
import { getPost, type Post } from "@/apis";

const PostDetailPage = () => {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();

  const postAtom = useMemo(
    () => createAsyncAtom<Post>(getPost(Number(id))),
    [id]
  );

  const [post] = useAtom(postAtom);

  if (!post) {
    return (
      <div className="post-detail">
        <h2>포스트를 찾을 수 없습니다</h2>
        <button onClick={() => navigate("/posts")} className="post-back-btn">
          목록으로 돌아가기
        </button>
      </div>
    );
  }

  return (
    <div className="post-detail">
      <button onClick={() => navigate("/posts")} className="post-back-btn">
        ← 목록으로 돌아가기
      </button>
      <div className="post-detail-content">
        <h2>{post.title}</h2>
        <div className="post-detail-meta">
          <span>게시글 ID: {post.id}</span>
          <span>사용자 ID: {post.userId}</span>
        </div>
        <div className="post-detail-body">
          <h3>내용</h3>
          <p>{post.body}</p>
        </div>
      </div>
    </div>
  );
};

export default PostDetailPage;


```

```css
#root {
  min-height: 100vh;
  padding: 2rem;
  background: linear-gradient(135deg, #eef2ff 0%, #f7f9fc 100%);
  display: flex;
  justify-content: center;
  align-items: stretch;
  box-sizing: border-box;
}

main {
  width: clamp(320px, 90vw, 960px);
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 12px 32px rgba(30, 41, 59, 0.12);
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  overflow: hidden;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

.header-link {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  text-decoration: none;
  color: #1f2937;
  transition: opacity 0.2s;
}

.header-link:hover {
  opacity: 0.85;
}

.logo {
  width: 52px;
  height: 52px;
}

.header h1 {
  font-size: 1.35rem;
  margin: 0;
}

.header-nav {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.header-nav__link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  padding: 0.45rem 0.9rem;
  border-radius: 999px;
  background: #eef2ff;
  color: #4338ca;
  text-decoration: none;
  font-size: 0.85rem;
  font-weight: 600;
  transition: background 0.2s, color 0.2s, transform 0.2s;
}

.header-nav__link:hover {
  transform: translateY(-1px);
}

.header-nav__link--active {
  background: #646cff;
  color: #ffffff;
  box-shadow: 0 8px 16px rgba(100, 108, 255, 0.35);
}

.loading {
  text-align: center;
  font-weight: 600;
  font-size: 1.1rem;
  color: #4b5563;
  padding: 2rem 0;
}

.demo-page {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  overflow-y: auto;
  padding-right: 0.5rem;
}

.demo-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.demo-section__header h2 {
  margin: 0;
  font-size: 1.35rem;
  color: #1f2937;
}

.demo-section__header p {
  margin: 0.5rem 0 0;
  color: #6b7280;
  font-size: 0.95rem;
}

.demo-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1rem;
}

.atom-card {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  padding: 1rem;
  min-height: 160px;
  transition: transform 0.2s, box-shadow 0.2s;
}

.atom-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 18px rgba(148, 163, 184, 0.2);
}

.atom-card__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
}

.atom-card__header h3 {
  margin: 0;
  font-size: 1rem;
  color: #1f2937;
}

.render-badge {
  font-size: 0.75rem;
  background: #ede9fe;
  color: #5b21b6;
  padding: 0.25rem 0.55rem;
  border-radius: 999px;
  font-weight: 600;
}

.atom-card__value {
  margin: 0;
  font-size: 2.4rem;
  font-weight: 700;
  color: #111827;
}

.atom-card__value--small {
  font-size: 1rem;
  color: #1f2937;
}

.atom-card__hint {
  margin: 0;
  font-size: 0.8rem;
  line-height: 1.4;
  color: #6b7280;
}

.atom-card__actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.atom-card__actions button,
.atom-card__log-btn {
  padding: 0.45rem 0.9rem;
  border-radius: 8px;
  border: none;
  background: #e0e7ff;
  color: #3730a3;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s, transform 0.2s;
}

.atom-card__actions button:hover,
.atom-card__log-btn:hover {
  background: #c7d2fe;
  transform: translateY(-1px);
}

.atom-card__options {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.atom-card__options label {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.9rem;
  color: #374151;
}

.atom-card__input {
  width: 100%;
  padding: 0.55rem 0.75rem;
  border: 1.5px solid #d1d5db;
  border-radius: 8px;
  font-size: 0.95rem;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.atom-card__input:focus {
  border-color: #6366f1;
  box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.15);
  outline: none;
}

.atom-card__list {
  display: grid;
  gap: 0.45rem;
}

.atom-card__list dt {
  font-size: 0.8rem;
  font-weight: 600;
  color: #6b7280;
}

.atom-card__list dd {
  margin: 0;
  font-size: 0.95rem;
  color: #1f2937;
}

.atom-card--wide {
  grid-column: 1 / -1;
}

.history-list {
  margin: 0;
  padding-left: 1rem;
  max-height: 220px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  color: #374151;
  font-size: 0.85rem;
}

.history-list__empty {
  padding: 0.75rem;
  border-radius: 10px;
  background: #f3f4f6;
  color: #6b7280;
  text-align: center;
}

.posts-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  flex: 1;
}

.posts-section__header h2 {
  margin: 0;
  font-size: 1.3rem;
  color: #1f2937;
}

.posts-section__header p {
  margin: 0.5rem 0 0;
  color: #6b7280;
  font-size: 0.9rem;
  line-height: 1.5;
}

.post-input {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.post-input-field {
  width: 100%;
  padding: 0.6rem 0.75rem;
  border-radius: 8px;
  border: 1.5px solid #d1d5db;
  font-size: 0.95rem;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.post-input-field:focus {
  border-color: #6366f1;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
  outline: none;
}

.post-add-btn {
  padding: 0.6rem 0.75rem;
  border-radius: 8px;
  border: none;
  background: #6366f1;
  color: #ffffff;
  font-size: 0.95rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s, transform 0.2s;
}

.post-add-btn:hover {
  background: #4f46e5;
  transform: translateY(-1px);
}

.post-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  max-height: 400px;
  overflow-y: auto;
  padding-right: 0.3rem;
}

.post-item {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
  padding: 0.85rem;
  border-radius: 12px;
  border: 1px solid #e5e7eb;
  background: #ffffff;
  box-shadow: 0 8px 16px rgba(148, 163, 184, 0.12);
  transition: transform 0.2s, box-shadow 0.2s;
}

.post-item:hover {
  transform: translateY(-2px);
  box-shadow: 0 12px 22px rgba(148, 163, 184, 0.18);
}

.post-name {
  text-decoration: none;
  color: #1f2937;
  font-weight: 600;
  font-size: 0.95rem;
  text-align: center;
}

.post-name:hover {
  color: #6366f1;
}

.post-actions {
  display: flex;
  justify-content: center;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.post-edit-btn,
.post-delete-btn,
.post-save-btn,
.post-cancel-btn {
  padding: 0.45rem 0.75rem;
  border-radius: 8px;
  border: none;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s, transform 0.2s;
}

.post-edit-btn {
  background: #f3f4f6;
  color: #1f2937;
}

.post-edit-btn:hover {
  background: #e5e7eb;
  transform: translateY(-1px);
}

.post-delete-btn {
  background: #fca5a5;
  color: #991b1b;
}

.post-delete-btn:hover {
  background: #f87171;
  transform: translateY(-1px);
}

.post-edit {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.post-edit-input {
  width: 100%;
  padding: 0.55rem;
  border-radius: 8px;
  border: 1.5px solid #6366f1;
  text-align: center;
  font-size: 0.9rem;
}

.post-edit-input:focus {
  outline: none;
  box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.15);
}

.post-save-btn {
  background: #6366f1;
  color: #ffffff;
}

.post-save-btn:hover {
  background: #4f46e5;
  transform: translateY(-1px);
}

.post-cancel-btn {
  background: #f3f4f6;
  color: #1f2937;
}

.post-cancel-btn:hover {
  background: #e5e7eb;
  transform: translateY(-1px);
}

.post-stats {
  margin-top: 1rem;
  padding-top: 0.75rem;
  border-top: 1px solid #e5e7eb;
  text-align: center;
  font-size: 0.85rem;
  color: #6b7280;
}

.post-detail {
  display: flex;
  flex-direction: column;
  gap: 1rem;
  padding: 0.5rem;
  max-height: 520px;
  overflow-y: auto;
}

.post-back-btn {
  align-self: flex-start;
  padding: 0.55rem 1rem;
  border-radius: 999px;
  border: none;
  background: #6366f1;
  color: #ffffff;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s, transform 0.2s;
}

.post-back-btn:hover {
  background: #4f46e5;
  transform: translateY(-1px);
}

.post-detail-content {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.post-detail-content h2 {
  margin: 0;
  padding-bottom: 0.5rem;
  border-bottom: 2px solid #e5e7eb;
  color: #1f2937;
}

.post-detail-meta {
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  font-size: 0.9rem;
  color: #4b5563;
}

.post-detail-body {
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 1rem;
}

.post-detail-body h3 {
  margin: 0 0 0.5rem;
  color: #1f2937;
  font-size: 1rem;
}

.post-detail-body p {
  margin: 0;
  line-height: 1.6;
  color: #4b5563;
}

@media (max-width: 640px) {
  #root {
    padding: 1rem;
  }

  main {
    padding: 1rem;
  }

  .demo-grid {
    grid-template-columns: 1fr;
  }

  .post-list {
    max-height: 320px;
  }
}
```

````markdown
# Minimal Global State Sample App

이 프로젝트는 `sangtae-js` Minimal Global State 라이브러리의 필수 기능을 한눈에 시연할 수 있도록 구성된 React + Vite 예제 앱이다. 데모 페이지에서는 `createAtom`, `set`, `get`, `subscribe`, `useAtom`, `createDerivedAtom` 등의 핵심 API를 인터랙티브하게 체험할 수 있고, 포스트 페이지에서는 `createAsyncAtom`과 `Suspense`를 활용한 비동기 데이터 흐름을 확인할 수 있다.

## 실행 방법

```bash
npm install
npm run dev
```
````

이후 브라우저에서 `http://localhost:5173`에 접속하면 된다.

## 화면 구성

### 1. 데모 (`/`)

- **Atom 값/업데이트 카드**  
  `createAtom`으로 만든 카운터 상태를 여러 컴포넌트에서 `useAtom`으로 구독한다.  
  `같은 값으로 set` 버튼을 눌러도 렌더 배지가 증가하지 않는 것을 통해, 값이 변하지 않으면 구독자가 알림을 받지 않는다는 사실을 확인할 수 있다.

- **스텝 Atom & 파생 Atom**  
  별도의 `step` Atom과 `createDerivedAtom`으로 만든 두 배 카운터 값을 별도 카드로 분리했다. 특정 Atom을 구독하는 컴포넌트만 다시 렌더링되는 모습을 렌더 배지에서 확인할 수 있다.

- **요약 카드**  
  `get`을 통해 React 컴포넌트 밖에서도 스냅샷을 읽어올 수 있음을 보여주기 위해 "현재 상태 콘솔로 확인" 버튼을 제공한다. 콘솔에서 `createDerivedAtom`이 결괏값을 어떻게 묶어주는지 확인하면 된다.

- **수동 구독 카드**  
  `subscribe`를 사용해 카운터 변경 이력을 쌓는다. "구독 해제" 버튼을 누르면 내부 listener Set이 정리되고, 다시 구독을 시작하면 최초 값부터 다시 누적되는 모습을 볼 수 있다.

### 2. 포스트 목록 (`/posts`)

- `createAsyncAtom`으로 JSONPlaceholder에서 불러온 포스트 목록을 `Suspense`에 연결했다.
- 추가/수정/삭제 동작은 `set` API를 이용해 Atom 값을 직접 갱신한다.
- 각 항목을 클릭하면 `/posts/:id` 상세 페이지로 이동하며, 상세 페이지 역시 `createAsyncAtom`과 `useAtom`을 통해 데이터를 구독한다.

## 확인 팁

- 데모 페이지에서는 React DevTools의 "Highlight updates" 옵션을 켜면 구독 중인 컴포넌트만 다시 렌더링되는 모습을 더 직관적으로 볼 수 있다.
- 수동 구독 카드에서 구독을 해제하면 리스트가 초기화되며, 다시 구독을 누르면 `subscribe` 등록 시 바로 현재 값이 한 번 실행된다는 것을 확인할 수 있다.
- README와 함께 `Design.md`(별도 문서)를 참고하면 라이브러리 설계 의도와 API 사용 패턴을 더 쉽게 설명할 수 있다.

````

---

**User**

그럼 기존의 포스트 목록은 필요없을 것같아 제거해줄래?

---

**Cursor**

```typescriptreact
import { Suspense } from "react";
import { Routes, Route, Link } from "react-router-dom";
import "@/App.css";
import logo from "@/assets/react.svg";
import DemoPage from "@/pages/DemoPage";

const App = () => {
  return (
    <main>
      <header className="header">
        <Link to="/" className="header-link">
          <img src={logo} alt="logo" className="logo" />
          <h1>SAMPLE APP REACT</h1>
        </Link>
      </header>
      <Suspense fallback={<div className="loading">LOADING...</div>}>
        <Routes>
          <Route path="/" element={<DemoPage />} />
        </Routes>
      </Suspense>
    </main>
  );
};

export default App;



````

````markdown
# Minimal Global State Sample App

이 프로젝트는 `sangtae-js` Minimal Global State 라이브러리의 필수 기능을 한눈에 시연할 수 있도록 구성된 React + Vite 예제 앱이다. 단일 데모 페이지에서 `createAtom`, `set`, `get`, `subscribe`, `useAtom`, `createDerivedAtom` 등의 핵심 API를 인터랙티브하게 체험할 수 있다.

## 실행 방법

```bash
npm install
npm run dev
```
````

이후 브라우저에서 `http://localhost:5173`에 접속하면 된다.

## 화면 구성

### 데모 (`/`)

- **Atom 값/업데이트 카드**  
  `createAtom`으로 만든 카운터 상태를 여러 컴포넌트에서 `useAtom`으로 구독한다.  
  `같은 값으로 set` 버튼을 눌러도 렌더 배지가 증가하지 않는 것을 통해, 값이 변하지 않으면 구독자가 알림을 받지 않는다는 사실을 확인할 수 있다.

- **스텝 Atom & 파생 Atom**  
  별도의 `step` Atom과 `createDerivedAtom`으로 만든 두 배 카운터 값을 별도 카드로 분리했다. 특정 Atom을 구독하는 컴포넌트만 다시 렌더링되는 모습을 렌더 배지에서 확인할 수 있다.

- **요약 카드**  
  `get`을 통해 React 컴포넌트 밖에서도 스냅샷을 읽어올 수 있음을 보여주기 위해 "현재 상태 콘솔로 확인" 버튼을 제공한다. 콘솔에서 `createDerivedAtom`이 결괏값을 어떻게 묶어주는지 확인하면 된다.

- **수동 구독 카드**  
  `subscribe`를 사용해 카운터 변경 이력을 쌓는다. "구독 해제" 버튼을 누르면 내부 listener Set이 정리되고, 다시 구독을 시작하면 최초 값부터 다시 누적되는 모습을 볼 수 있다.

## 확인 팁

- 데모 페이지에서는 React DevTools의 "Highlight updates" 옵션을 켜면 구독 중인 컴포넌트만 다시 렌더링되는 모습을 더 직관적으로 볼 수 있다.
- 수동 구독 카드에서 구독을 해제하면 리스트가 초기화되며, 다시 구독을 누르면 `subscribe` 등록 시 바로 현재 값이 한 번 실행된다는 것을 확인할 수 있다.
- README와 함께 `Design.md`(별도 문서)를 참고하면 라이브러리 설계 의도와 API 사용 패턴을 더 쉽게 설명할 수 있다.

````

```css
#root {
  min-height: 100vh;
  padding: 2rem;
  background: linear-gradient(135deg, #eef2ff 0%, #f7f9fc 100%);
  display: flex;
  justify-content: center;
  align-items: stretch;
  box-sizing: border-box;
}

main {
  width: clamp(320px, 90vw, 960px);
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 12px 32px rgba(30, 41, 59, 0.12);
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  overflow: hidden;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

.header-link {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  text-decoration: none;
  color: #1f2937;
  transition: opacity 0.2s;
}

.header-link:hover {
  opacity: 0.85;
}

.logo {
  width: 52px;
  height: 52px;
}

.header h1 {
  font-size: 1.35rem;
  margin: 0;
}

.loading {
  text-align: center;
  font-weight: 600;
  font-size: 1.1rem;
  color: #4b5563;
  padding: 2rem 0;
}

.demo-page {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  overflow-y: auto;
  padding-right: 0.5rem;
}

.demo-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.demo-section__header h2 {
  margin: 0;
  font-size: 1.35rem;
  color: #1f2937;
}

.demo-section__header p {
  margin: 0.5rem 0 0;
  color: #6b7280;
  font-size: 0.95rem;
}

.demo-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1rem;
}

.atom-card {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  padding: 1rem;
  min-height: 160px;
  transition: transform 0.2s, box-shadow 0.2s;
}

.atom-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 18px rgba(148, 163, 184, 0.2);
}

.atom-card__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
}

.atom-card__header h3 {
  margin: 0;
  font-size: 1rem;
  color: #1f2937;
}

.render-badge {
  font-size: 0.75rem;
  background: #ede9fe;
  color: #5b21b6;
  padding: 0.25rem 0.55rem;
  border-radius: 999px;
  font-weight: 600;
}

.atom-card__value {
  margin: 0;
  font-size: 2.4rem;
  font-weight: 700;
  color: #111827;
}

.atom-card__value--small {
  font-size: 1rem;
  color: #1f2937;
}

.atom-card__hint {
  margin: 0;
  font-size: 0.8rem;
  line-height: 1.4;
  color: #6b7280;
}

.atom-card__actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.atom-card__actions button,
.atom-card__log-btn {
  padding: 0.45rem 0.9rem;
  border-radius: 8px;
  border: none;
  background: #e0e7ff;
  color: #3730a3;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s, transform 0.2s;
}

.atom-card__actions button:hover,
.atom-card__log-btn:hover {
  background: #c7d2fe;
  transform: translateY(-1px);
}

.atom-card__options {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.atom-card__options label {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.9rem;
  color: #374151;
}

.atom-card__input {
  width: 100%;
  padding: 0.55rem 0.75rem;
  border: 1.5px solid #d1d5db;
  border-radius: 8px;
  font-size: 0.95rem;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.atom-card__input:focus {
  border-color: #6366f1;
  box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.15);
  outline: none;
}

.atom-card__list {
  display: grid;
  gap: 0.45rem;
}

.atom-card__list dt {
  font-size: 0.8rem;
  font-weight: 600;
  color: #6b7280;
}

.atom-card__list dd {
  margin: 0;
  font-size: 0.95rem;
  color: #1f2937;
}

.atom-card--wide {
  grid-column: 1 / -1;
}

.history-list {
  margin: 0;
  padding-left: 1rem;
  max-height: 220px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  color: #374151;
  font-size: 0.85rem;
}

.history-list__empty {
  padding: 0.75rem;
  border-radius: 10px;
  background: #f3f4f6;
  color: #6b7280;
  text-align: center;
}

@media (max-width: 640px) {
  #root {
    padding: 1rem;
  }

  main {
    padding: 1rem;
  }

  .demo-grid {
    grid-template-columns: 1fr;
  }

  .post-list {
    max-height: 320px;
  }
}

````

```typescript
export * from "./demo";
```

- 포스트 목록/상세 페이지랑 관련된 라우트, 컴포넌트, 스토어 전부 지웠고 이제 데모 페이지만 렌더링돼.
- 헤더 네비게이션이 사라졌으니까 `App.tsx`는 메인 링크만 유지하도록 정리했어.
- README랑 스타일도 데모 전용으로 정리했고, 쓰이지 않는 `@/apis` 코드도 제거했어.

```7:27:sample-app-react/src/App.tsx
      <header className="header">
        <Link to="/" className="header-link">
          <img src={logo} alt="logo" className="logo" />
          <h1>SAMPLE APP REACT</h1>
        </Link>
      </header>
      <Suspense fallback={<div className="loading">LOADING...</div>}>
        <Routes>
          <Route path="/" element={<DemoPage />} />
        </Routes>
      </Suspense>
```

- `npm run dev` 한 번 돌려서 데모 페이지만 잘 뜨는지 확인해 줘.

```typescriptreact
      <header className="header">
        <Link to="/" className="header-link">
          <img src={logo} alt="logo" className="logo" />
          <h1>SAMPLE APP REACT</h1>
        </Link>
      </header>
      <Suspense fallback={<div className="loading">LOADING...</div>}>
        <Routes>
          <Route path="/" element={<DemoPage />} />
        </Routes>
      </Suspense>
```

---

**User**

react-router-dom 라이브러리 제거 및 관련 코드도 제거해줘

---

**Cursor**

```typescriptreact
import "@/App.css";
import logo from "@/assets/react.svg";
import DemoPage from "@/pages/DemoPage";

const App = () => {
  return (
    <main>
      <header className="header">
        <div className="header-link">
          <img src={logo} alt="logo" className="logo" />
          <h1>SAMPLE APP REACT</h1>
        </div>
      </header>
      <DemoPage />
    </main>
  );
};

export default App;

```

```typescriptreact
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);

```

- `react-router-dom` 완전히 삭제했어. `npm uninstall react-router-dom`으로 `package.json`이랑 `package-lock.json`도 정리됨.
- `src/App.tsx`는 이제 라우터 없이 바로 `DemoPage`만 렌더링하고, 헤더도 단순 div로 바꿨어.
- `src/main.tsx`에서도 `BrowserRouter` 감싸던 부분 제거해서 `StrictMode` + `App`만 남겨놨고,
- 라우터 관련 스타일과 파일은 이미 없어졌어.

한 번 `npm run dev` 돌려서 문제 없이 뜨는지만 확인해줘.

---

**User**

좋아 그럼 sample-app-react 내 데모중 createAsyncAtom 예제도 추가해줄래?

---

**Cursor**

```typescriptreact
import { Suspense, useEffect, useMemo, useState } from "react";
import useAtom from "@/hooks/useAtom";
import useRenderCount from "@/hooks/useRenderCount";
import {
  $counter,
  $counterHistory,
  $doubleCounter,
  $nickname,
  $step,
  $summary,
} from "@/stores/demo";
import { createAsyncAtom, get, set as setAtom, subscribe } from "sangtae-js";

interface RemoteTodo {
  id: number;
  title: string;
  description: string;
  completed: boolean;
}

const STEP_OPTIONS = [1, 5, 10] as const;

const RenderBadge = () => {
  const renders = useRenderCount();
  return <span className="render-badge">렌더링 {renders}회</span>;
};

const CounterValueCard = () => {
  const [counter] = useAtom($counter);

  return (
    <article className="atom-card">
      <header className="atom-card__header">
        <h3>Atom 값</h3>
        <RenderBadge />
      </header>
      <p className="atom-card__value">{counter}</p>
      <p className="atom-card__hint">
        `createAtom`으로 생성한 전역 값을 `useAtom`으로 구독합니다.
      </p>
    </article>
  );
};

const CounterControlsCard = () => {
  const [counter, setCounter] = useAtom($counter);
  const [step] = useAtom($step);

  const onIncrease = () => setCounter(counter + step);
  const onDecrease = () => setCounter(counter - step);
  const onReset = () => setAtom($counter, 0);
  const onSetSameValue = () => {
    const current = get($counter);
    setAtom($counter, current);
  };

  return (
    <article className="atom-card">
      <header className="atom-card__header">
        <h3>Atom 업데이트</h3>
        <RenderBadge />
      </header>
      <p className="atom-card__value atom-card__value--small">
        현재 값: <strong>{counter}</strong> / 스텝: <strong>{step}</strong>
      </p>
      <div className="atom-card__actions">
        <button onClick={onDecrease}>- 스텝</button>
        <button onClick={onIncrease}>+ 스텝</button>
        <button onClick={onReset}>0으로 초기화</button>
        <button onClick={onSetSameValue}>같은 값으로 set</button>
      </div>
      <p className="atom-card__hint">
        `set` 호출 시 값이 변하지 않으면 구독 중인 컴포넌트가 다시 렌더링되지
        않습니다.
      </p>
    </article>
  );
};

const StepSelectorCard = () => {
  const [step, setStep] = useAtom($step);

  return (
    <article className="atom-card">
      <header className="atom-card__header">
        <h3>스텝 Atom</h3>
        <RenderBadge />
      </header>
      <div className="atom-card__options">
        {STEP_OPTIONS.map((option) => (
          <label key={option}>
            <input
              type="radio"
              name="step"
              value={option}
              checked={step === option}
              onChange={() => setStep(option)}
            />
            {option}
          </label>
        ))}
      </div>
      <p className="atom-card__hint">
        별도의 Atom으로 관리된 값이 변경되면 해당 Atom을 구독 중인 컴포넌트만
        렌더링됩니다.
      </p>
    </article>
  );
};

const NicknameCard = () => {
  const [nickname, setNickname] = useAtom($nickname);

  return (
    <article className="atom-card">
      <header className="atom-card__header">
        <h3>입력 Atom</h3>
        <RenderBadge />
      </header>
      <input
        className="atom-card__input"
        value={nickname}
        placeholder="닉네임을 입력하세요"
        onChange={({ target }) => setNickname(target.value)}
      />
      <p className="atom-card__hint">
        하나의 Atom을 여러 컴포넌트에서 공유할 수 있으며, 입력값과 파생 상태가
        연결됩니다.
      </p>
    </article>
  );
};

const DerivedCounterCard = () => {
  const [doubleCount] = useAtom($doubleCounter);

  return (
    <article className="atom-card">
      <header className="atom-card__header">
        <h3>파생 Atom</h3>
        <RenderBadge />
      </header>
      <p className="atom-card__value">{doubleCount}</p>
      <p className="atom-card__hint">
        `createDerivedAtom`으로 기본 Atom을 조합하여 만든 값입니다.
      </p>
    </article>
  );
};

const SummaryCard = () => {
  const [summary] = useAtom($summary);

  const onLogSnapshot = () => {
    const snapshot = get($summary);
    console.table(snapshot);
  };

  return (
    <article className="atom-card">
      <header className="atom-card__header">
        <h3>Atom 요약</h3>
        <RenderBadge />
      </header>
      <dl className="atom-card__list">
        <div>
          <dt>현재 값</dt>
          <dd>{summary.counter}</dd>
        </div>
        <div>
          <dt>스텝</dt>
          <dd>{summary.step}</dd>
        </div>
        <div>
          <dt>다음 값</dt>
          <dd>{summary.next}</dd>
        </div>
        <div>
          <dt>메시지</dt>
          <dd>{summary.greeting}</dd>
        </div>
      </dl>
      <button onClick={onLogSnapshot} className="atom-card__log-btn">
        현재 상태 콘솔로 확인
      </button>
      <p className="atom-card__hint">
        `get`을 호출하면 React 컴포넌트 밖에서도 atom 스냅샷을 읽을 수 있습니다.
      </p>
    </article>
  );
};

const CounterHistoryCard = () => {
  const [history] = useAtom($counterHistory);
  const [isSubscribed, setIsSubscribed] = useState(true);

  useEffect(() => {
    if (!isSubscribed) {
      return;
    }

    const unsubscribe = subscribe($counter, (value) => {
      const summary = get($summary);
      const timestamp = new Date().toLocaleTimeString();
      const entry = `${timestamp} → ${value} (다음: ${summary.next})`;
      const current = get($counterHistory);
      const nextHistory = [entry, ...current].slice(0, 8);
      setAtom($counterHistory, nextHistory);
    });

    return () => unsubscribe();
  }, [isSubscribed]);

  const onToggleSubscribe = () => {
    if (isSubscribed) {
      setAtom($counterHistory, []);
    }
    setIsSubscribed((prev) => !prev);
  };

  return (
    <article className="atom-card atom-card--wide">
      <header className="atom-card__header">
        <h3>수동 구독자</h3>
        <RenderBadge />
      </header>
      <div className="atom-card__actions">
        <button onClick={onToggleSubscribe}>
          {isSubscribed ? "구독 해제" : "다시 구독"}
        </button>
      </div>
      <p className="atom-card__hint">
        `subscribe`로 직접 구독을 생성하고 해제할 수 있습니다. 구독이 제거되면
        내부 listener Set이 비워집니다.
      </p>
      {isSubscribed ? (
        <ul className="history-list">
          {history.length === 0 && (
            <li className="history-list__empty">아직 변경 이력이 없습니다.</li>
          )}
          {history.map((entry, index) => (
            <li key={`${entry}-${index}`}>{entry}</li>
          ))}
        </ul>
      ) : (
        <div className="history-list__empty">
          구독이 해제되어 변경 이력을 수집하지 않습니다.
        </div>
      )}
    </article>
  );
};

const DemoPage = () => {
  return (
    <div className="demo-page">
      <section className="demo-section">
        <header className="demo-section__header">
          <h2>Minimal Global State 데모</h2>
          <p>
            Atom 생성부터 파생 값, 수동 구독까지 라이브러리의 핵심 기능을 한
            페이지에서 확인할 수 있습니다.
          </p>
        </header>
        <div className="demo-grid">
          <CounterValueCard />
          <CounterControlsCard />
          <StepSelectorCard />
          <NicknameCard />
          <DerivedCounterCard />
          <SummaryCard />
        </div>
      </section>
      <section className="demo-section">
        <header className="demo-section__header">
          <h2>구독자 동작 확인</h2>
          <p>
            동일한 값으로 `set`하면 구독자가 호출되지 않으며, 필요 시 구독을
            직접 관리하여 GC-friendly하게 동작합니다.
          </p>
        </header>
        <CounterHistoryCard />
      </section>
    </div>
  );
};

export default DemoPage;

```

```typescriptreact
import { Suspense, useEffect, useMemo, useState } from "react";
import useAtom from "@/hooks/useAtom";
import useRenderCount from "@/hooks/useRenderCount";
import {
  $counter,
  $counterHistory,
  $doubleCounter,
  $nickname,
  $step,
  $summary,
} from "@/stores/demo";
import { createAsyncAtom, get, set as setAtom, subscribe } from "sangtae-js";

interface RemoteTodo {
  id: number;
  title: string;
  description: string;
  completed: boolean;
}

const STEP_OPTIONS = [1, 5, 10] as const;

const REMOTE_TODO_TEMPLATES: Array<Pick<RemoteTodo, "title" | "description">> = [
  {
    title: "API 문서 검토",
    description: "README 요약을 확인하고 팀 공유 준비",
  },
  {
    title: "디자인 동기화",
    description: "UI 컴포넌트 상태와 실제 데이터를 비교",
  },
  {
    title: "렌더 카운트 점검",
    description: "변경된 atom이 컴포넌트에 미치는 영향 확인",
  },
  {
    title: "배포 체크리스트",
    description: "build, lint, 테스트 명령어가 모두 통과하는지 확인",
  },
];

const loadRemoteTodos = (version: number): Promise<RemoteTodo[]> =>
  new Promise((resolve) => {
    const delay = 600 + ((version % 3) + 1) * 200;
    const startedAt = Date.now();

    setTimeout(() => {
      const now = new Date();
      const generated = REMOTE_TODO_TEMPLATES.map((template, index) => ({
        id: version * 10 + index + 1,
        title: `${template.title} #${version + 1}`,
        description: `${template.description} - ${now.toLocaleTimeString()}`,
        completed: (version + index) % 2 === 0,
      }));

      const elapsed = Date.now() - startedAt;
      resolve(
        generated.map((todo) => ({
          ...todo,
          description: `${todo.description} (응답 ${elapsed}ms)`,
        }))
      );
    }, delay);
  });

const RenderBadge = () => {
  const renders = useRenderCount();
  return <span className="render-badge">렌더링 {renders}회</span>;
};

const CounterValueCard = () => {
  const [counter] = useAtom($counter);

  return (
    <article className="atom-card">
      <header className="atom-card__header">
        <h3>Atom 값</h3>
        <RenderBadge />
      </header>
      <p className="atom-card__value">{counter}</p>
      <p className="atom-card__hint">
        `createAtom`으로 생성한 전역 값을 `useAtom`으로 구독합니다.
      </p>
    </article>
  );
};

const CounterControlsCard = () => {
  const [counter, setCounter] = useAtom($counter);
  const [step] = useAtom($step);

  const onIncrease = () => setCounter(counter + step);
  const onDecrease = () => setCounter(counter - step);
  const onReset = () => setAtom($counter, 0);
  const onSetSameValue = () => {
    const current = get($counter);
    setAtom($counter, current);
  };

  return (
    <article className="atom-card">
      <header className="atom-card__header">
        <h3>Atom 업데이트</h3>
        <RenderBadge />
      </header>
      <p className="atom-card__value atom-card__value--small">
        현재 값: <strong>{counter}</strong> / 스텝: <strong>{step}</strong>
      </p>
      <div className="atom-card__actions">
        <button onClick={onDecrease}>- 스텝</button>
        <button onClick={onIncrease}>+ 스텝</button>
        <button onClick={onReset}>0으로 초기화</button>
        <button onClick={onSetSameValue}>같은 값으로 set</button>
      </div>
      <p className="atom-card__hint">
        `set` 호출 시 값이 변하지 않으면 구독 중인 컴포넌트가 다시 렌더링되지
        않습니다.
      </p>
    </article>
  );
};

const StepSelectorCard = () => {
  const [step, setStep] = useAtom($step);

  return (
    <article className="atom-card">
      <header className="atom-card__header">
        <h3>스텝 Atom</h3>
        <RenderBadge />
      </header>
      <div className="atom-card__options">
        {STEP_OPTIONS.map((option) => (
          <label key={option}>
            <input
              type="radio"
              name="step"
              value={option}
              checked={step === option}
              onChange={() => setStep(option)}
            />
            {option}
          </label>
        ))}
      </div>
      <p className="atom-card__hint">
        별도의 Atom으로 관리된 값이 변경되면 해당 Atom을 구독 중인 컴포넌트만
        렌더링됩니다.
      </p>
    </article>
  );
};

const NicknameCard = () => {
  const [nickname, setNickname] = useAtom($nickname);

  return (
    <article className="atom-card">
      <header className="atom-card__header">
        <h3>입력 Atom</h3>
        <RenderBadge />
      </header>
      <input
        className="atom-card__input"
        value={nickname}
        placeholder="닉네임을 입력하세요"
        onChange={({ target }) => setNickname(target.value)}
      />
      <p className="atom-card__hint">
        하나의 Atom을 여러 컴포넌트에서 공유할 수 있으며, 입력값과 파생 상태가
        연결됩니다.
      </p>
    </article>
  );
};

const DerivedCounterCard = () => {
  const [doubleCount] = useAtom($doubleCounter);

  return (
    <article className="atom-card">
      <header className="atom-card__header">
        <h3>파생 Atom</h3>
        <RenderBadge />
      </header>
      <p className="atom-card__value">{doubleCount}</p>
      <p className="atom-card__hint">
        `createDerivedAtom`으로 기본 Atom을 조합하여 만든 값입니다.
      </p>
    </article>
  );
};

const SummaryCard = () => {
  const [summary] = useAtom($summary);

  const onLogSnapshot = () => {
    const snapshot = get($summary);
    console.table(snapshot);
  };

  return (
    <article className="atom-card">
      <header className="atom-card__header">
        <h3>Atom 요약</h3>
        <RenderBadge />
      </header>
      <dl className="atom-card__list">
        <div>
          <dt>현재 값</dt>
          <dd>{summary.counter}</dd>
        </div>
        <div>
          <dt>스텝</dt>
          <dd>{summary.step}</dd>
        </div>
        <div>
          <dt>다음 값</dt>
          <dd>{summary.next}</dd>
        </div>
        <div>
          <dt>메시지</dt>
          <dd>{summary.greeting}</dd>
        </div>
      </dl>
      <button onClick={onLogSnapshot} className="atom-card__log-btn">
        현재 상태 콘솔로 확인
      </button>
      <p className="atom-card__hint">
        `get`을 호출하면 React 컴포넌트 밖에서도 atom 스냅샷을 읽을 수 있습니다.
      </p>
    </article>
  );
};

const CounterHistoryCard = () => {
  const [history] = useAtom($counterHistory);
  const [isSubscribed, setIsSubscribed] = useState(true);

  useEffect(() => {
    if (!isSubscribed) {
      return;
    }

    const unsubscribe = subscribe($counter, (value) => {
      const summary = get($summary);
      const timestamp = new Date().toLocaleTimeString();
      const entry = `${timestamp} → ${value} (다음: ${summary.next})`;
      const current = get($counterHistory);
      const nextHistory = [entry, ...current].slice(0, 8);
      setAtom($counterHistory, nextHistory);
    });

    return () => unsubscribe();
  }, [isSubscribed]);

  const onToggleSubscribe = () => {
    if (isSubscribed) {
      setAtom($counterHistory, []);
    }
    setIsSubscribed((prev) => !prev);
  };

  return (
    <article className="atom-card atom-card--wide">
      <header className="atom-card__header">
        <h3>수동 구독자</h3>
        <RenderBadge />
      </header>
      <div className="atom-card__actions">
        <button onClick={onToggleSubscribe}>
          {isSubscribed ? "구독 해제" : "다시 구독"}
        </button>
      </div>
      <p className="atom-card__hint">
        `subscribe`로 직접 구독을 생성하고 해제할 수 있습니다. 구독이 제거되면
        내부 listener Set이 비워집니다.
      </p>
      {isSubscribed ? (
        <ul className="history-list">
          {history.length === 0 && (
            <li className="history-list__empty">아직 변경 이력이 없습니다.</li>
          )}
          {history.map((entry, index) => (
            <li key={`${entry}-${index}`}>{entry}</li>
          ))}
        </ul>
      ) : (
        <div className="history-list__empty">
          구독이 해제되어 변경 이력을 수집하지 않습니다.
        </div>
      )}
    </article>
  );
};

const DemoPage = () => {
  return (
    <div className="demo-page">
      <section className="demo-section">
        <header className="demo-section__header">
          <h2>Minimal Global State 데모</h2>
          <p>
            Atom 생성부터 파생 값, 수동 구독까지 라이브러리의 핵심 기능을 한
            페이지에서 확인할 수 있습니다.
          </p>
        </header>
        <div className="demo-grid">
          <CounterValueCard />
          <CounterControlsCard />
          <StepSelectorCard />
          <NicknameCard />
          <DerivedCounterCard />
          <SummaryCard />
        </div>
      </section>
      <section className="demo-section">
        <header className="demo-section__header">
          <h2>구독자 동작 확인</h2>
          <p>
            동일한 값으로 `set`하면 구독자가 호출되지 않으며, 필요 시 구독을
            직접 관리하여 GC-friendly하게 동작합니다.
          </p>
        </header>
        <CounterHistoryCard />
      </section>
    </div>
  );
};

export default DemoPage;

```

```typescriptreact
import { Suspense, useEffect, useMemo, useState } from "react";
import useAtom from "@/hooks/useAtom";
import useRenderCount from "@/hooks/useRenderCount";
import {
  $counter,
  $counterHistory,
  $doubleCounter,
  $nickname,
  $step,
  $summary,
} from "@/stores/demo";
import { createAsyncAtom, get, set as setAtom, subscribe } from "sangtae-js";

interface RemoteTodo {
  id: number;
  title: string;
  description: string;
  completed: boolean;
}

const STEP_OPTIONS = [1, 5, 10] as const;

const REMOTE_TODO_TEMPLATES: Array<Pick<RemoteTodo, "title" | "description">> = [
  {
    title: "API 문서 검토",
    description: "README 요약을 확인하고 팀 공유 준비",
  },
  {
    title: "디자인 동기화",
    description: "UI 컴포넌트 상태와 실제 데이터를 비교",
  },
  {
    title: "렌더 카운트 점검",
    description: "변경된 atom이 컴포넌트에 미치는 영향 확인",
  },
  {
    title: "배포 체크리스트",
    description: "build, lint, 테스트 명령어가 모두 통과하는지 확인",
  },
];

const loadRemoteTodos = (version: number): Promise<RemoteTodo[]> =>
  new Promise((resolve) => {
    const delay = 600 + ((version % 3) + 1) * 200;
    const startedAt = Date.now();

    setTimeout(() => {
      const now = new Date();
      const generated = REMOTE_TODO_TEMPLATES.map((template, index) => ({
        id: version * 10 + index + 1,
        title: `${template.title} #${version + 1}`,
        description: `${template.description} - ${now.toLocaleTimeString()}`,
        completed: (version + index) % 2 === 0,
      }));

      const elapsed = Date.now() - startedAt;
      resolve(
        generated.map((todo) => ({
          ...todo,
          description: `${todo.description} (응답 ${elapsed}ms)`,
        }))
      );
    }, delay);
  });

const RenderBadge = () => {
  const renders = useRenderCount();
  return <span className="render-badge">렌더링 {renders}회</span>;
};

const CounterValueCard = () => {
  const [counter] = useAtom($counter);

  return (
    <article className="atom-card">
      <header className="atom-card__header">
        <h3>Atom 값</h3>
        <RenderBadge />
      </header>
      <p className="atom-card__value">{counter}</p>
      <p className="atom-card__hint">
        `createAtom`으로 생성한 전역 값을 `useAtom`으로 구독합니다.
      </p>
    </article>
  );
};

const CounterControlsCard = () => {
  const [counter, setCounter] = useAtom($counter);
  const [step] = useAtom($step);

  const onIncrease = () => setCounter(counter + step);
  const onDecrease = () => setCounter(counter - step);
  const onReset = () => setAtom($counter, 0);
  const onSetSameValue = () => {
    const current = get($counter);
    setAtom($counter, current);
  };

  return (
    <article className="atom-card">
      <header className="atom-card__header">
        <h3>Atom 업데이트</h3>
        <RenderBadge />
      </header>
      <p className="atom-card__value atom-card__value--small">
        현재 값: <strong>{counter}</strong> / 스텝: <strong>{step}</strong>
      </p>
      <div className="atom-card__actions">
        <button onClick={onDecrease}>- 스텝</button>
        <button onClick={onIncrease}>+ 스텝</button>
        <button onClick={onReset}>0으로 초기화</button>
        <button onClick={onSetSameValue}>같은 값으로 set</button>
      </div>
      <p className="atom-card__hint">
        `set` 호출 시 값이 변하지 않으면 구독 중인 컴포넌트가 다시 렌더링되지
        않습니다.
      </p>
    </article>
  );
};

const StepSelectorCard = () => {
  const [step, setStep] = useAtom($step);

  return (
    <article className="atom-card">
      <header className="atom-card__header">
        <h3>스텝 Atom</h3>
        <RenderBadge />
      </header>
      <div className="atom-card__options">
        {STEP_OPTIONS.map((option) => (
          <label key={option}>
            <input
              type="radio"
              name="step"
              value={option}
              checked={step === option}
              onChange={() => setStep(option)}
            />
            {option}
          </label>
        ))}
      </div>
      <p className="atom-card__hint">
        별도의 Atom으로 관리된 값이 변경되면 해당 Atom을 구독 중인 컴포넌트만
        렌더링됩니다.
      </p>
    </article>
  );
};

const NicknameCard = () => {
  const [nickname, setNickname] = useAtom($nickname);

  return (
    <article className="atom-card">
      <header className="atom-card__header">
        <h3>입력 Atom</h3>
        <RenderBadge />
      </header>
      <input
        className="atom-card__input"
        value={nickname}
        placeholder="닉네임을 입력하세요"
        onChange={({ target }) => setNickname(target.value)}
      />
      <p className="atom-card__hint">
        하나의 Atom을 여러 컴포넌트에서 공유할 수 있으며, 입력값과 파생 상태가
        연결됩니다.
      </p>
    </article>
  );
};

const DerivedCounterCard = () => {
  const [doubleCount] = useAtom($doubleCounter);

  return (
    <article className="atom-card">
      <header className="atom-card__header">
        <h3>파생 Atom</h3>
        <RenderBadge />
      </header>
      <p className="atom-card__value">{doubleCount}</p>
      <p className="atom-card__hint">
        `createDerivedAtom`으로 기본 Atom을 조합하여 만든 값입니다.
      </p>
    </article>
  );
};

const SummaryCard = () => {
  const [summary] = useAtom($summary);

  const onLogSnapshot = () => {
    const snapshot = get($summary);
    console.table(snapshot);
  };

  return (
    <article className="atom-card">
      <header className="atom-card__header">
        <h3>Atom 요약</h3>
        <RenderBadge />
      </header>
      <dl className="atom-card__list">
        <div>
          <dt>현재 값</dt>
          <dd>{summary.counter}</dd>
        </div>
        <div>
          <dt>스텝</dt>
          <dd>{summary.step}</dd>
        </div>
        <div>
          <dt>다음 값</dt>
          <dd>{summary.next}</dd>
        </div>
        <div>
          <dt>메시지</dt>
          <dd>{summary.greeting}</dd>
        </div>
      </dl>
      <button onClick={onLogSnapshot} className="atom-card__log-btn">
        현재 상태 콘솔로 확인
      </button>
      <p className="atom-card__hint">
        `get`을 호출하면 React 컴포넌트 밖에서도 atom 스냅샷을 읽을 수 있습니다.
      </p>
    </article>
  );
};

const AsyncTodosCardContent = ({
  version,
  onRefresh,
}: {
  version: number;
  onRefresh: () => void;
}) => {
  const remoteAtom = useMemo(
    () => createAsyncAtom(loadRemoteTodos(version)),
    [version]
  );
  const [todos, setTodos] = useAtom(remoteAtom);

  const completedCount = todos.filter((todo) => todo.completed).length;

  const onToggleComplete = (id: number) => {
    setTodos(
      todos.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  };

  const onCompleteAll = () => {
    setTodos(todos.map((todo) => ({ ...todo, completed: true })));
  };

  return (
    <article className="atom-card atom-card--wide async-card">
      <header className="atom-card__header">
        <h3>createAsyncAtom 데모</h3>
        <RenderBadge />
      </header>
      <p className="atom-card__hint">
        Promise를 받아 최초 구독 시 `Suspense`를 통해 로딩 상태를 노출합니다.
        이후에는 `set`을 사용해 비동기 데이터도 즉시 수정할 수 있습니다.
      </p>
      <div className="async-card__stats">
        <span>데이터 버전: v{version + 1}</span>
        <span>
          완료 {completedCount}/{todos.length}
        </span>
      </div>
      <ul className="async-card__list">
        {todos.map((todo) => (
          <li
            key={todo.id}
            className={`async-card__item${
              todo.completed ? " async-card__item--completed" : ""
            }`}
          >
            <div className="async-card__item-main">
              <strong>{todo.title}</strong>
              <p>{todo.description}</p>
            </div>
            <button onClick={() => onToggleComplete(todo.id)}>
              {todo.completed ? "되돌리기" : "완료"}
            </button>
          </li>
        ))}
      </ul>
      <div className="atom-card__actions async-card__actions">
        <button onClick={onRefresh}>데이터 새로고침</button>
        <button onClick={onCompleteAll}>모두 완료 처리</button>
      </div>
    </article>
  );
};

const AsyncTodosCard = () => {
  const [version, setVersion] = useState(0);

  return (
    <Suspense
      fallback={
        <article className="atom-card atom-card--wide async-card async-card--loading">
          <header className="atom-card__header">
            <h3>createAsyncAtom 데모</h3>
          </header>
          <p className="atom-card__hint">비동기 데이터를 불러오는 중입니다...</p>
        </article>
      }
    >
      <AsyncTodosCardContent
        version={version}
        onRefresh={() => setVersion((prev) => prev + 1)}
      />
    </Suspense>
  );
};

const CounterHistoryCard = () => {
  const [history] = useAtom($counterHistory);
  const [isSubscribed, setIsSubscribed] = useState(true);

  useEffect(() => {
    if (!isSubscribed) {
      return;
    }

    const unsubscribe = subscribe($counter, (value) => {
      const summary = get($summary);
      const timestamp = new Date().toLocaleTimeString();
      const entry = `${timestamp} → ${value} (다음: ${summary.next})`;
      const current = get($counterHistory);
      const nextHistory = [entry, ...current].slice(0, 8);
      setAtom($counterHistory, nextHistory);
    });

    return () => unsubscribe();
  }, [isSubscribed]);

  const onToggleSubscribe = () => {
    if (isSubscribed) {
      setAtom($counterHistory, []);
    }
    setIsSubscribed((prev) => !prev);
  };

  return (
    <article className="atom-card atom-card--wide">
      <header className="atom-card__header">
        <h3>수동 구독자</h3>
        <RenderBadge />
      </header>
      <div className="atom-card__actions">
        <button onClick={onToggleSubscribe}>
          {isSubscribed ? "구독 해제" : "다시 구독"}
        </button>
      </div>
      <p className="atom-card__hint">
        `subscribe`로 직접 구독을 생성하고 해제할 수 있습니다. 구독이 제거되면
        내부 listener Set이 비워집니다.
      </p>
      {isSubscribed ? (
        <ul className="history-list">
          {history.length === 0 && (
            <li className="history-list__empty">아직 변경 이력이 없습니다.</li>
          )}
          {history.map((entry, index) => (
            <li key={`${entry}-${index}`}>{entry}</li>
          ))}
        </ul>
      ) : (
        <div className="history-list__empty">
          구독이 해제되어 변경 이력을 수집하지 않습니다.
        </div>
      )}
    </article>
  );
};

const DemoPage = () => {
  return (
    <div className="demo-page">
      <section className="demo-section">
        <header className="demo-section__header">
          <h2>Minimal Global State 데모</h2>
          <p>
            Atom 생성부터 파생 값, 수동 구독까지 라이브러리의 핵심 기능을 한
            페이지에서 확인할 수 있습니다.
          </p>
        </header>
        <div className="demo-grid">
          <CounterValueCard />
          <CounterControlsCard />
          <StepSelectorCard />
          <NicknameCard />
          <DerivedCounterCard />
          <SummaryCard />
        </div>
      </section>
      <section className="demo-section">
        <header className="demo-section__header">
          <h2>비동기 Atom</h2>
          <p>
            `createAsyncAtom`은 Promise를 전달받아 데이터를 캐싱하고,
            `Suspense`와 결합하여 자연스러운 비동기 UX를 제공합니다.
          </p>
        </header>
        <AsyncTodosCard />
      </section>
      <section className="demo-section">
        <header className="demo-section__header">
          <h2>구독자 동작 확인</h2>
          <p>
            동일한 값으로 `set`하면 구독자가 호출되지 않으며, 필요 시 구독을
            직접 관리하여 GC-friendly하게 동작합니다.
          </p>
        </header>
        <CounterHistoryCard />
      </section>
    </div>
  );
};

export default DemoPage;

```

```css
#root {
  margin: 0 auto;
  min-height: 100vh;
  padding: 2rem;
  background: linear-gradient(135deg, #eef2ff 0%, #f7f9fc 100%);
  display: flex;
  justify-content: center;
  align-items: stretch;
  box-sizing: border-box;
}

main {
  width: clamp(320px, 90vw, 960px);
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 12px 32px rgba(30, 41, 59, 0.12);
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  overflow: hidden;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

.header-link {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  text-decoration: none;
  color: #1f2937;
  transition: opacity 0.2s;
}

.header-link:hover {
  opacity: 0.85;
}

.logo {
  width: 52px;
  height: 52px;
}

.header h1 {
  font-size: 1.35rem;
  margin: 0;
}

.loading {
  text-align: center;
  font-weight: 600;
  font-size: 1.1rem;
  color: #4b5563;
  padding: 2rem 0;
}

.demo-page {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  overflow-y: auto;
  padding-right: 0.5rem;
}

.demo-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.demo-section__header h2 {
  margin: 0;
  font-size: 1.35rem;
  color: #1f2937;
}

.demo-section__header p {
  margin: 0.5rem 0 0;
  color: #6b7280;
  font-size: 0.95rem;
}

.demo-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1rem;
}

.atom-card {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  padding: 1rem;
  min-height: 160px;
  transition: transform 0.2s, box-shadow 0.2s;
}

.atom-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 18px rgba(148, 163, 184, 0.2);
}

.atom-card__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
}

.atom-card__header h3 {
  margin: 0;
  font-size: 1rem;
  color: #1f2937;
}

.render-badge {
  font-size: 0.75rem;
  background: #ede9fe;
  color: #5b21b6;
  padding: 0.25rem 0.55rem;
  border-radius: 999px;
  font-weight: 600;
}

.atom-card__value {
  margin: 0;
  font-size: 2.4rem;
  font-weight: 700;
  color: #111827;
}

.atom-card__value--small {
  font-size: 1rem;
  color: #1f2937;
}

.atom-card__hint {
  margin: 0;
  font-size: 0.8rem;
  line-height: 1.4;
  color: #6b7280;
}

.atom-card__actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.atom-card__actions button,
.atom-card__log-btn {
  padding: 0.45rem 0.9rem;
  border-radius: 8px;
  border: none;
  background: #e0e7ff;
  color: #3730a3;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s, transform 0.2s;
}

.atom-card__actions button:hover,
.atom-card__log-btn:hover {
  background: #c7d2fe;
  transform: translateY(-1px);
}

.atom-card__options {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.atom-card__options label {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.9rem;
  color: #374151;
}

.atom-card__input {
  width: 100%;
  padding: 0.55rem 0.75rem;
  border: 1.5px solid #d1d5db;
  border-radius: 8px;
  font-size: 0.95rem;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.atom-card__input:focus {
  border-color: #6366f1;
  box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.15);
  outline: none;
}

.atom-card__list {
  display: grid;
  gap: 0.45rem;
}

.atom-card__list dt {
  font-size: 0.8rem;
  font-weight: 600;
  color: #6b7280;
}

.atom-card__list dd {
  margin: 0;
  font-size: 0.95rem;
  color: #1f2937;
}

.atom-card--wide {
  grid-column: 1 / -1;
}

.async-card {
  gap: 1rem;
}

.async-card--loading {
  min-height: 180px;
  justify-content: center;
}

.async-card__stats {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.85rem;
  color: #4b5563;
}

.async-card__list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.async-card__item {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.75rem;
  border-radius: 10px;
  border: 1px solid #e5e7eb;
  background: #ffffff;
  box-shadow: 0 4px 12px rgba(148, 163, 184, 0.1);
  transition: transform 0.2s, box-shadow 0.2s;
}

.async-card__item:hover {
  transform: translateY(-1px);
  box-shadow: 0 8px 18px rgba(148, 163, 184, 0.18);
}

.async-card__item--completed {
  background: #f0fdf4;
  border-color: #86efac;
}

.async-card__item--completed strong {
  text-decoration: line-through;
}

.async-card__item-main {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  max-width: 70%;
}

.async-card__item-main p {
  margin: 0;
  font-size: 0.85rem;
  color: #6b7280;
  line-height: 1.4;
}

.async-card__item button {
  align-self: center;
  padding: 0.4rem 0.75rem;
  border-radius: 8px;
  border: none;
  background: #dbeafe;
  color: #1d4ed8;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s, transform 0.2s;
  white-space: nowrap;
}

.async-card__item button:hover {
  background: #bfdbfe;
  transform: translateY(-1px);
}

.async-card__actions {
  justify-content: flex-end;
}

.history-list {
  margin: 0;
  padding-left: 1rem;
  max-height: 220px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  color: #374151;
  font-size: 0.85rem;
}

.history-list__empty {
  padding: 0.75rem;
  border-radius: 10px;
  background: #f3f4f6;
  color: #6b7280;
  text-align: center;
}

@media (max-width: 640px) {
  #root {
    padding: 1rem;
  }

  main {
    padding: 1rem;
  }

  .demo-grid {
    grid-template-columns: 1fr;
  }

  .post-list {
    max-height: 320px;
  }
}
```

````markdown
# Minimal Global State Sample App

이 프로젝트는 `sangtae-js` Minimal Global State 라이브러리의 필수 기능을 한눈에 시연할 수 있도록 구성된 React + Vite 예제 앱이다. 단일 데모 페이지에서 `createAtom`, `createDerivedAtom`, `createAsyncAtom`, `set`, `get`, `subscribe`, `useAtom` 등의 핵심 API를 인터랙티브하게 체험할 수 있다.

## 실행 방법

```bash
npm install
npm run dev
```
````

이후 브라우저에서 `http://localhost:5173`에 접속하면 된다.

## 화면 구성

### 데모 (`/`)

- **Atom 값/업데이트 카드**  
  `createAtom`으로 만든 카운터 상태를 여러 컴포넌트에서 `useAtom`으로 구독한다.  
  `같은 값으로 set` 버튼을 눌러도 렌더 배지가 증가하지 않는 것을 통해, 값이 변하지 않으면 구독자가 알림을 받지 않는다는 사실을 확인할 수 있다.

- **스텝 Atom & 파생 Atom**  
  별도의 `step` Atom과 `createDerivedAtom`으로 만든 두 배 카운터 값을 별도 카드로 분리했다. 특정 Atom을 구독하는 컴포넌트만 다시 렌더링되는 모습을 렌더 배지에서 확인할 수 있다.

- **createAsyncAtom 카드**  
  `createAsyncAtom`에 Promise를 전달해 가짜 원격 데이터를 가져오고 `Suspense`로 로딩 상태를 노출한다. 새로고침 버튼으로 Promise를 다시 생성하여 로딩→완료 흐름을 반복 확인할 수 있고, 가져온 데이터는 `set`으로 즉시 수정 가능하다.

- **요약 카드**  
  `get`을 통해 React 컴포넌트 밖에서도 스냅샷을 읽어올 수 있음을 보여주기 위해 "현재 상태 콘솔로 확인" 버튼을 제공한다. 콘솔에서 `createDerivedAtom`이 결괏값을 어떻게 묶어주는지 확인하면 된다.

- **수동 구독 카드**  
  `subscribe`를 사용해 카운터 변경 이력을 쌓는다. "구독 해제" 버튼을 누르면 내부 listener Set이 정리되고, 다시 구독을 시작하면 최초 값부터 다시 누적되는 모습을 볼 수 있다.

## 확인 팁

- 데모 페이지에서는 React DevTools의 "Highlight updates" 옵션을 켜면 구독 중인 컴포넌트만 다시 렌더링되는 모습을 더 직관적으로 볼 수 있다.
- 수동 구독 카드에서 구독을 해제하면 리스트가 초기화되며, 다시 구독을 누르면 `subscribe` 등록 시 바로 현재 값이 한 번 실행된다는 것을 확인할 수 있다.
- README와 함께 `Design.md`(별도 문서)를 참고하면 라이브러리 설계 의도와 API 사용 패턴을 더 쉽게 설명할 수 있다.

````

- 데모 페이지에 `createAsyncAtom` 카드 추가해서 Promise 기반 가짜 원격 데이터를 `Suspense`로 로딩 보여주고, 로드된 리스트는 `set`으로 즉시 수정·완료 처리할 수 있게 했어.
- 같은 카드에서 새로고침마다 새로운 atom을 만들어 로딩→완료 플로우를 반복 확인할 수 있고, 렌더 카운트 뱃지로 비동기 값 갱신 시 렌더링 여부도 확인 가능해.
- 스타일에 `.async-card` 계열 클래스를 추가해서 비동기 리스트 UI랑 버튼 상태를 보기 좋게 정리했고, README에도 createAsyncAtom 데모 안내를 넣었어.

```236:282:sample-app-react/src/pages/DemoPage.tsx
const AsyncTodosCardContent = ({
  version,
  onRefresh,
}: {
  version: number;
  onRefresh: () => void;
}) => {
  const remoteAtom = useMemo(
    () => createAsyncAtom(loadRemoteTodos(version)),
    [version]
  );
  const [todos, setTodos] = useAtom(remoteAtom);
  // ... 중략 ...
  <div className="atom-card__actions async-card__actions">
    <button onClick={onRefresh}>데이터 새로고침</button>
    <button onClick={onCompleteAll}>모두 완료 처리</button>
  </div>
````

- `npm run dev` 돌려서 새 카드가 로딩→완료 잘 동작하는지 한번 확인해줘.

```typescriptreact
const AsyncTodosCardContent = ({
  version,
  onRefresh,
}: {
  version: number;
  onRefresh: () => void;
}) => {
  const remoteAtom = useMemo(
    () => createAsyncAtom(loadRemoteTodos(version)),
    [version]
  );
  const [todos, setTodos] = useAtom(remoteAtom);
  // ... 중략 ...
  <div className="atom-card__actions async-card__actions">
    <button onClick={onRefresh}>데이터 새로고침</button>
    <button onClick={onCompleteAll}>모두 완료 처리</button>
  </div>
```

---

**User**

비동기 데이터를 불러오는 중입니다... 만 노출되고 데이터는 노출되지 않고 있어

---

**Cursor**

```typescriptreact
import { Suspense, useEffect, useState } from "react";
import useAtom from "@/hooks/useAtom";
import useRenderCount from "@/hooks/useRenderCount";
import {
  $counter,
  $counterHistory,
  $doubleCounter,
  $nickname,
  $step,
  $summary,
} from "@/stores/demo";
import { createAsyncAtom, get, set as setAtom, subscribe, type Atom } from "sangtae-js";

interface RemoteTodo {
  id: number;
  title: string;
  description: string;
  completed: boolean;
}

const STEP_OPTIONS = [1, 5, 10] as const;

const REMOTE_TODO_TEMPLATES: Array<Pick<RemoteTodo, "title" | "description">> =
  [
    {
      title: "API 문서 검토",
      description: "README 요약을 확인하고 팀 공유 준비",
    },
    {
      title: "디자인 동기화",
      description: "UI 컴포넌트 상태와 실제 데이터를 비교",
    },
    {
      title: "렌더 카운트 점검",
      description: "변경된 atom이 컴포넌트에 미치는 영향 확인",
    },
    {
      title: "배포 체크리스트",
      description: "build, lint, 테스트 명령어가 모두 통과하는지 확인",
    },
  ];

const loadRemoteTodos = (version: number): Promise<RemoteTodo[]> =>
  new Promise((resolve) => {
    const delay = 600 + ((version % 3) + 1) * 200;
    const startedAt = Date.now();

    setTimeout(() => {
      const now = new Date();
      const generated = REMOTE_TODO_TEMPLATES.map((template, index) => ({
        id: version * 10 + index + 1,
        title: `${template.title} #${version + 1}`,
        description: `${template.description} - ${now.toLocaleTimeString()}`,
        completed: (version + index) % 2 === 0,
      }));

      const elapsed = Date.now() - startedAt;
      resolve(
        generated.map((todo) => ({
          ...todo,
          description: `${todo.description} (응답 ${elapsed}ms)`,
        }))
      );
    }, delay);
  });

const RenderBadge = () => {
  const renders = useRenderCount();
  return <span className="render-badge">렌더링 {renders}회</span>;
};

const CounterValueCard = () => {
  const [counter] = useAtom($counter);

  return (
    <article className="atom-card">
      <header className="atom-card__header">
        <h3>Atom 값</h3>
        <RenderBadge />
      </header>
      <p className="atom-card__value">{counter}</p>
      <p className="atom-card__hint">
        `createAtom`으로 생성한 전역 값을 `useAtom`으로 구독합니다.
      </p>
    </article>
  );
};

const CounterControlsCard = () => {
  const [counter, setCounter] = useAtom($counter);
  const [step] = useAtom($step);

  const onIncrease = () => setCounter(counter + step);
  const onDecrease = () => setCounter(counter - step);
  const onReset = () => setAtom($counter, 0);
  const onSetSameValue = () => {
    const current = get($counter);
    setAtom($counter, current);
  };

  return (
    <article className="atom-card">
      <header className="atom-card__header">
        <h3>Atom 업데이트</h3>
        <RenderBadge />
      </header>
      <p className="atom-card__value atom-card__value--small">
        현재 값: <strong>{counter}</strong> / 스텝: <strong>{step}</strong>
      </p>
      <div className="atom-card__actions">
        <button onClick={onDecrease}>- 스텝</button>
        <button onClick={onIncrease}>+ 스텝</button>
        <button onClick={onReset}>0으로 초기화</button>
        <button onClick={onSetSameValue}>같은 값으로 set</button>
      </div>
      <p className="atom-card__hint">
        `set` 호출 시 값이 변하지 않으면 구독 중인 컴포넌트가 다시 렌더링되지
        않습니다.
      </p>
    </article>
  );
};

const StepSelectorCard = () => {
  const [step, setStep] = useAtom($step);

  return (
    <article className="atom-card">
      <header className="atom-card__header">
        <h3>스텝 Atom</h3>
        <RenderBadge />
      </header>
      <div className="atom-card__options">
        {STEP_OPTIONS.map((option) => (
          <label key={option}>
            <input
              type="radio"
              name="step"
              value={option}
              checked={step === option}
              onChange={() => setStep(option)}
            />
            {option}
          </label>
        ))}
      </div>
      <p className="atom-card__hint">
        별도의 Atom으로 관리된 값이 변경되면 해당 Atom을 구독 중인 컴포넌트만
        렌더링됩니다.
      </p>
    </article>
  );
};

const NicknameCard = () => {
  const [nickname, setNickname] = useAtom($nickname);

  return (
    <article className="atom-card">
      <header className="atom-card__header">
        <h3>입력 Atom</h3>
        <RenderBadge />
      </header>
      <input
        className="atom-card__input"
        value={nickname}
        placeholder="닉네임을 입력하세요"
        onChange={({ target }) => setNickname(target.value)}
      />
      <p className="atom-card__hint">
        하나의 Atom을 여러 컴포넌트에서 공유할 수 있으며, 입력값과 파생 상태가
        연결됩니다.
      </p>
    </article>
  );
};

const DerivedCounterCard = () => {
  const [doubleCount] = useAtom($doubleCounter);

  return (
    <article className="atom-card">
      <header className="atom-card__header">
        <h3>파생 Atom</h3>
        <RenderBadge />
      </header>
      <p className="atom-card__value">{doubleCount}</p>
      <p className="atom-card__hint">
        `createDerivedAtom`으로 기본 Atom을 조합하여 만든 값입니다.
      </p>
    </article>
  );
};

const SummaryCard = () => {
  const [summary] = useAtom($summary);

  const onLogSnapshot = () => {
    const snapshot = get($summary);
    console.table(snapshot);
  };

  return (
    <article className="atom-card">
      <header className="atom-card__header">
        <h3>Atom 요약</h3>
        <RenderBadge />
      </header>
      <dl className="atom-card__list">
        <div>
          <dt>현재 값</dt>
          <dd>{summary.counter}</dd>
        </div>
        <div>
          <dt>스텝</dt>
          <dd>{summary.step}</dd>
        </div>
        <div>
          <dt>다음 값</dt>
          <dd>{summary.next}</dd>
        </div>
        <div>
          <dt>메시지</dt>
          <dd>{summary.greeting}</dd>
        </div>
      </dl>
      <button onClick={onLogSnapshot} className="atom-card__log-btn">
        현재 상태 콘솔로 확인
      </button>
      <p className="atom-card__hint">
        `get`을 호출하면 React 컴포넌트 밖에서도 atom 스냅샷을 읽을 수 있습니다.
      </p>
    </article>
  );
};

const AsyncTodosCardContent = ({
  atom,
  version,
  onRefresh,
}: {
  atom: Atom<RemoteTodo[]>;
  version: number;
  onRefresh: () => void;
}) => {
  const [todos, setTodos] = useAtom(atom);

  const completedCount = todos.filter((todo) => todo.completed).length;

  const onToggleComplete = (id: number) => {
    setTodos(
      todos.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  };

  const onCompleteAll = () => {
    setTodos(todos.map((todo) => ({ ...todo, completed: true })));
  };

  return (
    <article className="atom-card atom-card--wide async-card">
      <header className="atom-card__header">
        <h3>createAsyncAtom 데모</h3>
        <RenderBadge />
      </header>
      <p className="atom-card__hint">
        Promise를 받아 최초 구독 시 `Suspense`를 통해 로딩 상태를 노출합니다.
        이후에는 `set`을 사용해 비동기 데이터도 즉시 수정할 수 있습니다.
      </p>
      <div className="async-card__stats">
        <span>데이터 버전: v{version + 1}</span>
        <span>
          완료 {completedCount}/{todos.length}
        </span>
      </div>
      <ul className="async-card__list">
        {todos.map((todo) => (
          <li
            key={todo.id}
            className={`async-card__item${
              todo.completed ? " async-card__item--completed" : ""
            }`}
          >
            <div className="async-card__item-main">
              <strong>{todo.title}</strong>
              <p>{todo.description}</p>
            </div>
            <button onClick={() => onToggleComplete(todo.id)}>
              {todo.completed ? "되돌리기" : "완료"}
            </button>
          </li>
        ))}
      </ul>
      <div className="atom-card__actions async-card__actions">
        <button onClick={onRefresh}>데이터 새로고침</button>
        <button onClick={onCompleteAll}>모두 완료 처리</button>
      </div>
    </article>
  );
};

const AsyncTodosCard = () => {
  const [{ atom, version }, setAsyncState] = useState(() => ({
    atom: createAsyncAtom(loadRemoteTodos(0)),
    version: 0,
  }));

  const onRefresh = () =>
    setAsyncState((prev) => {
      const nextVersion = prev.version + 1;
      return {
        atom: createAsyncAtom(loadRemoteTodos(nextVersion)),
        version: nextVersion,
      };
    });

  return (
    <Suspense
      fallback={
        <article className="atom-card atom-card--wide async-card async-card--loading">
          <header className="atom-card__header">
            <h3>createAsyncAtom 데모</h3>
          </header>
          <p className="atom-card__hint">
            비동기 데이터를 불러오는 중입니다...
          </p>
        </article>
      }
    >
      <AsyncTodosCardContent
        atom={atom}
        version={version}
        onRefresh={onRefresh}
      />
    </Suspense>
  );
};

const CounterHistoryCard = () => {
  const [history] = useAtom($counterHistory);
  const [isSubscribed, setIsSubscribed] = useState(true);

  useEffect(() => {
    if (!isSubscribed) {
      return;
    }

    const unsubscribe = subscribe($counter, (value) => {
      const summary = get($summary);
      const timestamp = new Date().toLocaleTimeString();
      const entry = `${timestamp} → ${value} (다음: ${summary.next})`;
      const current = get($counterHistory);
      const nextHistory = [entry, ...current].slice(0, 8);
      setAtom($counterHistory, nextHistory);
    });

    return () => unsubscribe();
  }, [isSubscribed]);

  const onToggleSubscribe = () => {
    if (isSubscribed) {
      setAtom($counterHistory, []);
    }
    setIsSubscribed((prev) => !prev);
  };

  return (
    <article className="atom-card atom-card--wide">
      <header className="atom-card__header">
        <h3>수동 구독자</h3>
        <RenderBadge />
      </header>
      <div className="atom-card__actions">
        <button onClick={onToggleSubscribe}>
          {isSubscribed ? "구독 해제" : "다시 구독"}
        </button>
      </div>
      <p className="atom-card__hint">
        `subscribe`로 직접 구독을 생성하고 해제할 수 있습니다. 구독이 제거되면
        내부 listener Set이 비워집니다.
      </p>
      {isSubscribed ? (
        <ul className="history-list">
          {history.length === 0 && (
            <li className="history-list__empty">아직 변경 이력이 없습니다.</li>
          )}
          {history.map((entry, index) => (
            <li key={`${entry}-${index}`}>{entry}</li>
          ))}
        </ul>
      ) : (
        <div className="history-list__empty">
          구독이 해제되어 변경 이력을 수집하지 않습니다.
        </div>
      )}
    </article>
  );
};

const DemoPage = () => {
  return (
    <div className="demo-page">
      <section className="demo-section">
        <header className="demo-section__header">
          <h2>Minimal Global State 데모</h2>
          <p>
            Atom 생성부터 파생 값, 수동 구독까지 라이브러리의 핵심 기능을 한
            페이지에서 확인할 수 있습니다.
          </p>
        </header>
        <div className="demo-grid">
          <CounterValueCard />
          <CounterControlsCard />
          <StepSelectorCard />
          <NicknameCard />
          <DerivedCounterCard />
          <SummaryCard />
        </div>
      </section>
      <section className="demo-section">
        <header className="demo-section__header">
          <h2>비동기 Atom</h2>
          <p>
            `createAsyncAtom`은 Promise를 전달받아 데이터를 캐싱하고,
            `Suspense`와 결합하여 자연스러운 비동기 UX를 제공합니다.
          </p>
        </header>
        <AsyncTodosCard />
      </section>
      <section className="demo-section">
        <header className="demo-section__header">
          <h2>구독자 동작 확인</h2>
          <p>
            동일한 값으로 `set`하면 구독자가 호출되지 않으며, 필요 시 구독을
            직접 관리하여 GC-friendly하게 동작합니다.
          </p>
        </header>
        <CounterHistoryCard />
      </section>
    </div>
  );
};

export default DemoPage;

```

- `createAsyncAtom` 카드가 로딩에만 머물던 문제는 Suspense 리렌더링 때마다 새 atom이 만들어져서 Promise가 계속 대기 상태가 되던 구조 때문이었어. 이제 atom을 `useState`로 고정해서 최초 생성 이후엔 동일 인스턴스를 재사용하고, 새로고침할 때만 새 atom을 만들도록 바꿨다.
- `AsyncTodosCardContent`는 외부에서 주입받은 atom을 `useAtom`으로 구독하고, `AsyncTodosCard`가 버전과 atom을 함께 관리하면서 새 데이터 로드 흐름을 제어해.
- 스타일과 README는 그대로라 변경 없어.
- dev 서버를 다시 띄워서 카드가 몇 초 뒤 데이터로 교체되고, 새로고침 버튼이 정상 동작하는지 확인해 줘.

---

**User**

좋아 그럼 sample-app-vue도 마찬가지로
같은 UI와 데모기능을 가지도록 변경해줄래?

---

**Cursor**

```typescript
import { createAtom, createDerivedAtom, type Atom } from "sangtae-js";

export const $counter = createAtom(0);
export const $step = createAtom(1);
export const $nickname = createAtom("");
export const $counterHistory = createAtom<string[]>([]);

export const $doubleCounter = createDerivedAtom((get) => get($counter) * 2);

export interface CounterSummary {
  counter: number;
  step: number;
  next: number;
  greeting: string;
}

export const $summary: Atom<CounterSummary> = createDerivedAtom((get) => {
  const counter = get($counter);
  const step = get($step);
  const nickname = get($nickname).trim();

  return {
    counter,
    step,
    next: counter + step,
    greeting: nickname
      ? `${nickname}님, 다음 값은 ${counter + step}`
      : "이름을 입력해보세요.",
  };
});
```

```typescript
export * from "./demo";
```

```typescript
import { ref, onMounted, onUpdated } from "vue";

export const useRenderCount = () => {
  const renderCount = ref(0);

  onMounted(() => {
    renderCount.value += 1;
  });

  onUpdated(() => {
    renderCount.value += 1;
  });

  return renderCount;
};
```

```vue
<script setup lang="ts">
import { useRenderCount } from "@/hooks/useRenderCount";

const renders = useRenderCount();
</script>

<template>
  <span class="render-badge">렌더링 {{ renders }}</span>
</template>
```

```vue
<script setup lang="ts">
import { computed } from "vue";
import { createAsyncAtom } from "sangtae-js";
import { useAtom } from "@/hooks/useAtom";
import RenderBadge from "@/components/RenderBadge.vue";

interface RemoteTodo {
  id: number;
  title: string;
  description: string;
  completed: boolean;
}

const props = defineProps<{
  version: number;
}>();

const emit = defineEmits<{
  (event: "refresh"): void;
}>();

const REMOTE_TODO_TEMPLATES: Array<Pick<RemoteTodo, "title" | "description">> =
  [
    {
      title: "API 문서 검토",
      description: "README 요약을 확인하고 팀 공유 준비",
    },
    {
      title: "디자인 동기화",
      description: "UI 컴포넌트 상태와 실제 데이터를 비교",
    },
    {
      title: "렌더 카운트 점검",
      description: "변경된 atom이 컴포넌트에 미치는 영향 확인",
    },
    {
      title: "배포 체크리스트",
      description: "build, lint, 테스트 명령어가 모두 통과하는지 확인",
    },
  ];

const loadRemoteTodos = (version: number): Promise<RemoteTodo[]> =>
  new Promise((resolve) => {
    const delay = 600 + ((version % 3) + 1) * 200;
    const startedAt = Date.now();

    setTimeout(() => {
      const now = new Date();
      const generated = REMOTE_TODO_TEMPLATES.map((template, index) => ({
        id: version * 10 + index + 1,
        title: `${template.title} #${version + 1}`,
        description: `${template.description} - ${now.toLocaleTimeString()}`,
        completed: (version + index) % 2 === 0,
      }));

      const elapsed = Date.now() - startedAt;
      resolve(
        generated.map((todo) => ({
          ...todo,
          description: `${todo.description} (응답 ${elapsed}ms)`,
        }))
      );
    }, delay);
  });

const remoteAtom = createAsyncAtom(loadRemoteTodos(props.version));
const [todos, setTodos] = useAtom(remoteAtom);

const isLoading = computed(() => !Array.isArray(todos.value));

const completedCount = computed(() => {
  if (!Array.isArray(todos.value)) return 0;
  return todos.value.filter((todo) => todo.completed).length;
});

const totalCount = computed(() =>
  Array.isArray(todos.value) ? todos.value.length : 0
);

const onToggleComplete = (id: number) => {
  if (!Array.isArray(todos.value)) return;
  setTodos(
    todos.value.map((todo) =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    )
  );
};

const onCompleteAll = () => {
  if (!Array.isArray(todos.value)) return;
  setTodos(todos.value.map((todo) => ({ ...todo, completed: true })));
};
</script>

<template>
  <article v-if="!isLoading" class="atom-card atom-card--wide async-card">
    <header class="atom-card__header">
      <h3>createAsyncAtom 데모</h3>
      <RenderBadge />
    </header>
    <p class="atom-card__hint">
      Promise를 받아 최초 구독 시 로딩 상태를 노출합니다. 이후에는 `set`을 통해
      비동기 데이터도 즉시 수정할 수 있습니다.
    </p>
    <div class="async-card__stats">
      <span>데이터 버전: v{{ props.version + 1 }}</span>
      <span>완료 {{ completedCount }}/{{ totalCount }}</span>
    </div>
    <ul class="async-card__list">
      <li
        v-for="todo in todos"
        :key="todo.id"
        class="async-card__item"
        :class="{ 'async-card__item--completed': todo.completed }"
      >
        <div class="async-card__item-main">
          <strong>{{ todo.title }}</strong>
          <p>{{ todo.description }}</p>
        </div>
        <button @click="onToggleComplete(todo.id)">
          {{ todo.completed ? "되돌리기" : "완료" }}
        </button>
      </li>
    </ul>
    <div class="atom-card__actions async-card__actions">
      <button @click="emit('refresh')">데이터 새로고침</button>
      <button @click="onCompleteAll">모두 완료 처리</button>
    </div>
  </article>
  <article
    v-else
    class="atom-card atom-card--wide async-card async-card--loading"
  >
    <header class="atom-card__header">
      <h3>createAsyncAtom 데모</h3>
    </header>
    <p class="atom-card__hint">비동기 데이터를 불러오는 중입니다...</p>
  </article>
</template>
```

```vue
<script setup lang="ts">
import {
  computed,
  onBeforeUnmount,
  onMounted,
  reactive,
  ref,
  watch,
} from "vue";
import { get, set as setAtom, subscribe } from "sangtae-js";
import { useAtom } from "@/hooks/useAtom";
import RenderBadge from "@/components/RenderBadge.vue";
import AsyncTodosCard from "@/components/AsyncTodosCard.vue";
import {
  $counter,
  $counterHistory,
  $doubleCounter,
  $nickname,
  $step,
  $summary,
} from "@/stores";

const STEP_OPTIONS = [1, 5, 10] as const;

const [counter, setCounter] = useAtom($counter);
const [step, setStep] = useAtom($step);
const [nickname, setNickname] = useAtom($nickname);
const [summary] = useAtom($summary);
const [history] = useAtom($counterHistory);

const counterRenderCount = ref(0);
const controlRenderCount = ref(0);
const stepRenderCount = ref(0);
const nicknameRenderCount = ref(0);
const doubleRenderCount = ref(0);
const summaryRenderCount = ref(0);
const historyRenderCount = ref(0);

watch(
  () => counter.value,
  () => {
    counterRenderCount.value += 1;
  },
  { immediate: true }
);

watch(
  () => [counter.value, step.value],
  () => {
    controlRenderCount.value += 1;
  },
  { immediate: true }
);

watch(
  () => step.value,
  () => {
    stepRenderCount.value += 1;
  },
  { immediate: true }
);

watch(
  () => nickname.value,
  () => {
    nicknameRenderCount.value += 1;
  },
  { immediate: true }
);

watch(
  () => get($doubleCounter),
  () => {
    doubleRenderCount.value += 1;
  },
  { immediate: true }
);

watch(
  () => summary.value,
  () => {
    summaryRenderCount.value += 1;
  },
  { immediate: true, deep: true }
);

watch(
  () => history.value,
  () => {
    historyRenderCount.value += 1;
  },
  { immediate: true, deep: true }
);

const onIncrease = () => setCounter(counter.value + step.value);
const onDecrease = () => setCounter(counter.value - step.value);
const onReset = () => setAtom($counter, 0);
const onSetSameValue = () => setAtom($counter, get($counter));

const inputNickname = computed({
  get: () => nickname.value,
  set: (val: string) => setNickname(val),
});

const doubleCounter = computed(() => get($doubleCounter));

const onLogSnapshot = () => {
  const snapshot = get($summary);
  console.table(snapshot);
};

const isSubscribed = ref(true);
let unsubscribe: (() => void) | undefined;

const subscribeHistory = () => {
  unsubscribe?.();
  unsubscribe = subscribe($counter, (value) => {
    const snapshot = get($summary);
    const timestamp = new Date().toLocaleTimeString();
    const entry = `${timestamp} → ${value} (다음: ${snapshot.next})`;
    const current = get($counterHistory);
    const nextHistory = [entry, ...current].slice(0, 8);
    setAtom($counterHistory, nextHistory);
  });
};

onMounted(() => {
  if (isSubscribed.value) {
    subscribeHistory();
  }
});

onBeforeUnmount(() => {
  unsubscribe?.();
});

const onToggleSubscribe = () => {
  if (isSubscribed.value) {
    unsubscribe?.();
    setAtom($counterHistory, []);
  } else {
    subscribeHistory();
  }
  isSubscribed.value = !isSubscribed.value;
};

const asyncVersion = ref(0);
const refreshAsync = () => {
  asyncVersion.value += 1;
};
</script>

<template>
  <div class="demo-page">
    <section class="demo-section">
      <header class="demo-section__header">
        <h2>Minimal Global State 데모</h2>
        <p>
          Atom 생성부터 파생 값, 수동 구독까지 라이브러리의 핵심 기능을 한
          페이지에서 확인할 수 있습니다.
        </p>
      </header>
      <div class="demo-grid">
        <article class="atom-card">
          <header class="atom-card__header">
            <h3>Atom 값</h3>
            <span class="render-badge">렌더링 {{ counterRenderCount }}회</span>
          </header>
          <p class="atom-card__value">{{ counter }}</p>
          <p class="atom-card__hint">
            `createAtom`으로 생성한 전역 값을 `useAtom`으로 구독합니다.
          </p>
        </article>

        <article class="atom-card">
          <header className="atom-card__header">
            <h3>Atom 업데이트</h3>
            <span class="render-badge">렌더링 {{ controlRenderCount }}회</span>
          </header>
          <p class="atom-card__value atom-card__value--small">
            현재 값: <strong>{{ counter }}</strong> / 스텝:
            <strong>{{ step }}</strong>
          </p>
          <div class="atom-card__actions">
            <button @click="onDecrease">- 스텝</button>
            <button @click="onIncrease">+ 스텝</button>
            <button @click="onReset">0으로 초기화</button>
            <button @click="onSetSameValue">같은 값으로 set</button>
          </div>
          <p class="atom-card__hint">
            `set` 호출 시 값이 변하지 않으면 구독 중인 컴포넌트가 다시
            렌더링되지 않습니다.
          </p>
        </article>

        <article class="atom-card">
          <header class="atom-card__header">
            <h3>스텝 Atom</h3>
            <span class="render-badge">렌더링 {{ stepRenderCount }}회</span>
          </header>
          <div class="atom-card__options">
            <label v-for="option in STEP_OPTIONS" :key="option">
              <input
                type="radio"
                name="step"
                :value="option"
                :checked="step === option"
                @change="setStep(option)"
              />
              {{ option }}
            </label>
          </div>
          <p class="atom-card__hint">
            별도의 Atom으로 관리된 값이 변경되면 해당 Atom을 구독 중인
            컴포넌트만 렌더링됩니다.
          </p>
        </article>

        <article class="atom-card">
          <header class="atom-card__header">
            <h3>입력 Atom</h3>
            <span class="render-badge">렌더링 {{ nicknameRenderCount }}회</span>
          </header>
          <input
            class="atom-card__input"
            v-model="inputNickname"
            placeholder="닉네임을 입력하세요"
          />
          <p class="atom-card__hint">
            하나의 Atom을 여러 컴포넌트에서 공유할 수 있으며, 입력값과 파생
            상태가 연결됩니다.
          </p>
        </article>

        <article class="atom-card">
          <header class="atom-card__header">
            <h3>파생 Atom</h3>
            <span class="render-badge">렌더링 {{ doubleRenderCount }}회</span>
          </header>
          <p class="atom-card__value">{{ doubleCounter }}</p>
          <p class="atom-card__hint">
            `createDerivedAtom`으로 기본 Atom을 조합하여 만든 값입니다.
          </p>
        </article>

        <article class="atom-card">
          <header class="atom-card__header">
            <h3>Atom 요약</h3>
            <span class="render-badge">렌더링 {{ summaryRenderCount }}회</span>
          </header>
          <dl class="atom-card__list">
            <div>
              <dt>현재 값</dt>
              <dd>{{ summary.counter }}</dd>
            </div>
            <div>
              <dt>스텝</dt>
              <dd>{{ summary.step }}</dd>
            </div>
            <div>
              <dt>다음 값</dt>
              <dd>{{ summary.next }}</dd>
            </div>
            <div>
              <dt>메시지</dt>
              <dd>{{ summary.greeting }}</dd>
            </div>
          </dl>
          <button @click="onLogSnapshot" class="atom-card__log-btn">
            현재 상태 콘솔로 확인
          </button>
          <p class="atom-card__hint">
            `get`을 호출하면 Vue 컴포넌트 밖에서도 atom 스냅샷을 읽을 수
            있습니다.
          </p>
        </article>
      </div>
    </section>

    <section class="demo-section">
      <header class="demo-section__header">
        <h2>비동기 Atom</h2>
        <p>
          `createAsyncAtom`은 Promise를 전달받아 데이터를 캐싱하고, 자연스러운
          비동기 UX를 제공합니다.
        </p>
      </header>
      <AsyncTodosCard
        :key="asyncVersion"
        :version="asyncVersion"
        @refresh="refreshAsync"
      />
    </section>

    <section class="demo-section">
      <header class="demo-section__header">
        <h2>구독자 동작 확인</h2>
        <p>
          동일한 값으로 `set`하면 구독자가 호출되지 않으며, 필요 시 구독을 직접
          관리하여 메모리를 절약할 수 있습니다.
        </p>
      </header>
      <article class="atom-card atom-card--wide">
        <header class="atom-card__header">
          <h3>수동 구독자</h3>
          <span class="render-badge">렌더링 {{ historyRenderCount }}회</span>
        </header>
        <div class="atom-card__actions">
          <button @click="onToggleSubscribe">
            {{ isSubscribed ? "구독 해제" : "다시 구독" }}
          </button>
        </div>
        <p class="atom-card__hint">
          `subscribe`로 직접 구독을 생성하고 해제할 수 있습니다. 구독이 제거되면
          내부 listener Set이 비워집니다.
        </p>
        <ul v-if="isSubscribed" class="history-list">
          <li v-if="history.length === 0" class="history-list__empty">
            아직 변경 이력이 없습니다.
          </li>
          <li v-for="(entry, index) in history" :key="`${entry}-${index}`">
            {{ entry }}
          </li>
        </ul>
        <div v-else class="history-list__empty">
          구독이 해제되어 변경 이력을 수집하지 않습니다.
        </div>
      </article>
    </section>
  </div>
</template>
```

```vue
<script setup lang="ts">
import {
  computed,
  onBeforeUnmount,
  onMounted,
  reactive,
  ref,
  watch,
} from "vue";
import { get, set as setAtom, subscribe } from "sangtae-js";
import { useAtom } from "@/hooks/useAtom";
import RenderBadge from "@/components/RenderBadge.vue";
import AsyncTodosCard from "@/components/AsyncTodosCard.vue";
import {
  $counter,
  $counterHistory,
  $doubleCounter,
  $nickname,
  $step,
  $summary,
} from "@/stores";

const STEP_OPTIONS = [1, 5, 10] as const;

const [counter, setCounter] = useAtom($counter);
const [step, setStep] = useAtom($step);
const [nickname, setNickname] = useAtom($nickname);
const [summary] = useAtom($summary);
const [history] = useAtom($counterHistory);

const doubleCounter = computed(() => get($doubleCounter));

const counterRenderCount = ref(0);
const controlRenderCount = ref(0);
const stepRenderCount = ref(0);
const nicknameRenderCount = ref(0);
const doubleRenderCount = ref(0);
const summaryRenderCount = ref(0);
const historyRenderCount = ref(0);

watch(
  () => counter.value,
  () => {
    counterRenderCount.value += 1;
  },
  { immediate: true }
);

watch(
  () => [counter.value, step.value],
  () => {
    controlRenderCount.value += 1;
  },
  { immediate: true }
);

watch(
  () => step.value,
  () => {
    stepRenderCount.value += 1;
  },
  { immediate: true }
);

watch(
  () => nickname.value,
  () => {
    nicknameRenderCount.value += 1;
  },
  { immediate: true }
);

watch(
  doubleCounter,
  () => {
    doubleRenderCount.value += 1;
  },
  { immediate: true }
);

watch(
  summary,
  () => {
    summaryRenderCount.value += 1;
  },
  { immediate: true, deep: true }
);

watch(
  history,
  () => {
    historyRenderCount.value += 1;
  },
  { immediate: true, deep: true }
);

const onIncrease = () => setCounter(counter.value + step.value);
const onDecrease = () => setCounter(counter.value - step.value);
const onReset = () => setAtom($counter, 0);
const onSetSameValue = () => setAtom($counter, get($counter));

const inputNickname = computed({
  get: () => nickname.value,
  set: (val: string) => setNickname(val),
});

const onLogSnapshot = () => {
  const snapshot = get($summary);
  console.table(snapshot);
};

const isSubscribed = ref(true);
let unsubscribe: (() => void) | undefined;

const subscribeHistory = () => {
  unsubscribe?.();
  unsubscribe = subscribe($counter, (value) => {
    const snapshot = get($summary);
    const timestamp = new Date().toLocaleTimeString();
    const entry = `${timestamp} → ${value} (다음: ${snapshot.next})`;
    const current = get($counterHistory);
    const nextHistory = [entry, ...current].slice(0, 8);
    setAtom($counterHistory, nextHistory);
  });
};

onMounted(() => {
  if (isSubscribed.value) {
    subscribeHistory();
  }
});

onBeforeUnmount(() => {
  unsubscribe?.();
});

const onToggleSubscribe = () => {
  if (isSubscribed.value) {
    unsubscribe?.();
    setAtom($counterHistory, []);
  } else {
    subscribeHistory();
  }
  isSubscribed.value = !isSubscribed.value;
};

const asyncVersion = ref(0);
const refreshAsync = () => {
  asyncVersion.value += 1;
};
</script>

<template>
  <div class="demo-page">
    <section class="demo-section">
      <header class="demo-section__header">
        <h2>Minimal Global State 데모</h2>
        <p>
          Atom 생성부터 파생 값, 수동 구독까지 라이브러리의 핵심 기능을 한
          페이지에서 확인할 수 있습니다.
        </p>
      </header>
      <div class="demo-grid">
        <article class="atom-card">
          <header class="atom-card__header">
            <h3>Atom 값</h3>
            <span class="render-badge">렌더링 {{ counterRenderCount }}회</span>
          </header>
          <p class="atom-card__value">{{ counter }}</p>
          <p class="atom-card__hint">
            `createAtom`으로 생성한 전역 값을 `useAtom`으로 구독합니다.
          </p>
        </article>

        <article class="atom-card">
          <header className="atom-card__header">
            <h3>Atom 업데이트</h3>
            <span class="render-badge">렌더링 {{ controlRenderCount }}회</span>
          </header>
          <p class="atom-card__value atom-card__value--small">
            현재 값: <strong>{{ counter }}</strong> / 스텝:
            <strong>{{ step }}</strong>
          </p>
          <div class="atom-card__actions">
            <button @click="onDecrease">- 스텝</button>
            <button @click="onIncrease">+ 스텝</button>
            <button @click="onReset">0으로 초기화</button>
            <button @click="onSetSameValue">같은 값으로 set</button>
          </div>
          <p class="atom-card__hint">
            `set` 호출 시 값이 변하지 않으면 구독 중인 컴포넌트가 다시
            렌더링되지 않습니다.
          </p>
        </article>

        <article class="atom-card">
          <header class="atom-card__header">
            <h3>스텝 Atom</h3>
            <span class="render-badge">렌더링 {{ stepRenderCount }}회</span>
          </header>
          <div class="atom-card__options">
            <label v-for="option in STEP_OPTIONS" :key="option">
              <input
                type="radio"
                name="step"
                :value="option"
                :checked="step === option"
                @change="setStep(option)"
              />
              {{ option }}
            </label>
          </div>
          <p class="atom-card__hint">
            별도의 Atom으로 관리된 값이 변경되면 해당 Atom을 구독 중인
            컴포넌트만 렌더링됩니다.
          </p>
        </article>

        <article class="atom-card">
          <header class="atom-card__header">
            <h3>입력 Atom</h3>
            <span class="render-badge">렌더링 {{ nicknameRenderCount }}회</span>
          </header>
          <input
            class="atom-card__input"
            v-model="inputNickname"
            placeholder="닉네임을 입력하세요"
          />
          <p class="atom-card__hint">
            하나의 Atom을 여러 컴포넌트에서 공유할 수 있으며, 입력값과 파생
            상태가 연결됩니다.
          </p>
        </article>

        <article class="atom-card">
          <header class="atom-card__header">
            <h3>파생 Atom</h3>
            <span class="render-badge">렌더링 {{ doubleRenderCount }}회</span>
          </header>
          <p class="atom-card__value">{{ doubleCounter }}</p>
          <p class="atom-card__hint">
            `createDerivedAtom`으로 기본 Atom을 조합하여 만든 값입니다.
          </p>
        </article>

        <article class="atom-card">
          <header class="atom-card__header">
            <h3>Atom 요약</h3>
            <span class="render-badge">렌더링 {{ summaryRenderCount }}회</span>
          </header>
          <dl class="atom-card__list">
            <div>
              <dt>현재 값</dt>
              <dd>{{ summary.counter }}</dd>
            </div>
            <div>
              <dt>스텝</dt>
              <dd>{{ summary.step }}</dd>
            </div>
            <div>
              <dt>다음 값</dt>
              <dd>{{ summary.next }}</dd>
            </div>
            <div>
              <dt>메시지</dt>
              <dd>{{ summary.greeting }}</dd>
            </div>
          </dl>
          <button @click="onLogSnapshot" class="atom-card__log-btn">
            현재 상태 콘솔로 확인
          </button>
          <p class="atom-card__hint">
            `get`을 호출하면 Vue 컴포넌트 밖에서도 atom 스냅샷을 읽을 수
            있습니다.
          </p>
        </article>
      </div>
    </section>

    <section class="demo-section">
      <header class="demo-section__header">
        <h2>비동기 Atom</h2>
        <p>
          `createAsyncAtom`은 Promise를 전달받아 데이터를 캐싱하고, 자연스러운
          비동기 UX를 제공합니다.
        </p>
      </header>
      <AsyncTodosCard
        :key="asyncVersion"
        :version="asyncVersion"
        @refresh="refreshAsync"
      />
    </section>

    <section class="demo-section">
      <header class="demo-section__header">
        <h2>구독자 동작 확인</h2>
        <p>
          동일한 값으로 `set`하면 구독자가 호출되지 않으며, 필요 시 구독을 직접
          관리하여 메모리를 절약할 수 있습니다.
        </p>
      </header>
      <article class="atom-card atom-card--wide">
        <header class="atom-card__header">
          <h3>수동 구독자</h3>
          <span class="render-badge">렌더링 {{ historyRenderCount }}회</span>
        </header>
        <div class="atom-card__actions">
          <button @click="onToggleSubscribe">
            {{ isSubscribed ? "구독 해제" : "다시 구독" }}
          </button>
        </div>
        <p class="atom-card__hint">
          `subscribe`로 직접 구독을 생성하고 해제할 수 있습니다. 구독이 제거되면
          내부 listener Set이 비워집니다.
        </p>
        <ul v-if="isSubscribed" class="history-list">
          <li v-if="history.length === 0" class="history-list__empty">
            아직 변경 이력이 없습니다.
          </li>
          <li v-for="(entry, index) in history" :key="`${entry}-${index}`">
            {{ entry }}
          </li>
        </ul>
        <div v-else class="history-list__empty">
          구독이 해제되어 변경 이력을 수집하지 않습니다.
        </div>
      </article>
    </section>
  </div>
</template>
```

```vue
<script setup lang="ts">
import DemoPage from "@/pages/DemoPage.vue";
import logo from "./assets/vue.svg";
</script>

<template>
  <main>
    <header class="header">
      <div class="header-link">
        <img :src="logo" alt="logo" class="logo" />
        <h1>SAMPLE APP VUE</h1>
      </div>
    </header>
    <DemoPage />
  </main>
</template>
```

```css
:root {
  font-family: "Inter", "Pretendard", -apple-system, BlinkMacSystemFont, "Segoe UI",
    sans-serif;
  line-height: 1.5;
  font-weight: 400;
  color: #111827;
  background-color: #f8fafc;
}

* {
  box-sizing: border-box;
}

body {
  margin: 0;
}

button {
  font-family: inherit;
}

#app {
  min-height: 100vh;
  padding: 2rem;
  background: linear-gradient(135deg, #eef2ff 0%, #f7f9fc 100%);
  display: flex;
  justify-content: center;
  align-items: stretch;
  box-sizing: border-box;
}

main {
  width: clamp(320px, 90vw, 960px);
  background: #ffffff;
  border-radius: 16px;
  box-shadow: 0 12px 32px rgba(30, 41, 59, 0.12);
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  overflow: hidden;
}

.header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 1rem;
  flex-wrap: wrap;
}

.header-link {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  text-decoration: none;
  color: #1f2937;
  transition: opacity 0.2s;
}

.header-link:hover {
  opacity: 0.85;
}

.logo {
  width: 52px;
  height: 52px;
}

.header h1 {
  font-size: 1.35rem;
  margin: 0;
}

.loading {
  text-align: center;
  font-weight: 600;
  font-size: 1.1rem;
  color: #4b5563;
  padding: 2rem 0;
}

.demo-page {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  overflow-y: auto;
  padding-right: 0.5rem;
}

.demo-section {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.demo-section__header h2 {
  margin: 0;
  font-size: 1.35rem;
  color: #1f2937;
}

.demo-section__header p {
  margin: 0.5rem 0 0;
  color: #6b7280;
  font-size: 0.95rem;
}

.demo-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
  gap: 1rem;
}

.atom-card {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  background: #f9fafb;
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  padding: 1rem;
  min-height: 160px;
  transition: transform 0.2s, box-shadow 0.2s;
}

.atom-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 10px 18px rgba(148, 163, 184, 0.2);
}

.atom-card__header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 0.5rem;
}

.atom-card__header h3 {
  margin: 0;
  font-size: 1rem;
  color: #1f2937;
}

.render-badge {
  font-size: 0.75rem;
  background: #ede9fe;
  color: #5b21b6;
  padding: 0.25rem 0.55rem;
  border-radius: 999px;
  font-weight: 600;
}

.atom-card__value {
  margin: 0;
  font-size: 2.4rem;
  font-weight: 700;
  color: #111827;
}

.atom-card__value--small {
  font-size: 1rem;
  color: #1f2937;
}

.atom-card__hint {
  margin: 0;
  font-size: 0.8rem;
  line-height: 1.4;
  color: #6b7280;
}

.atom-card__actions {
  display: flex;
  gap: 0.5rem;
  flex-wrap: wrap;
}

.atom-card__actions button,
.atom-card__log-btn {
  padding: 0.45rem 0.9rem;
  border-radius: 8px;
  border: none;
  background: #e0e7ff;
  color: #3730a3;
  font-size: 0.85rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s, transform 0.2s;
}

.atom-card__actions button:hover,
.atom-card__log-btn:hover {
  background: #c7d2fe;
  transform: translateY(-1px);
}

.atom-card__options {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  flex-wrap: wrap;
}

.atom-card__options label {
  display: flex;
  align-items: center;
  gap: 0.35rem;
  font-size: 0.9rem;
  color: #374151;
}

.atom-card__input {
  width: 100%;
  padding: 0.55rem 0.75rem;
  border: 1.5px solid #d1d5db;
  border-radius: 8px;
  font-size: 0.95rem;
  transition: border-color 0.2s, box-shadow 0.2s;
}

.atom-card__input:focus {
  border-color: #6366f1;
  box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.15);
  outline: none;
}

.atom-card__list {
  display: grid;
  gap: 0.45rem;
}

.atom-card__list dt {
  font-size: 0.8rem;
  font-weight: 600;
  color: #6b7280;
}

.atom-card__list dd {
  margin: 0;
  font-size: 0.95rem;
  color: #1f2937;
}

.atom-card--wide {
  grid-column: 1 / -1;
}

.async-card {
  gap: 1rem;
}

.async-card--loading {
  min-height: 180px;
  justify-content: center;
}

.async-card__stats {
  display: flex;
  justify-content: space-between;
  align-items: center;
  font-size: 0.85rem;
  color: #4b5563;
}

.async-card__list {
  margin: 0;
  padding: 0;
  list-style: none;
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
}

.async-card__item {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 0.75rem;
  padding: 0.75rem;
  border-radius: 10px;
  border: 1px solid #e5e7eb;
  background: #ffffff;
  box-shadow: 0 4px 12px rgba(148, 163, 184, 0.1);
  transition: transform 0.2s, box-shadow 0.2s;
}

.async-card__item:hover {
  transform: translateY(-1px);
  box-shadow: 0 8px 18px rgba(148, 163, 184, 0.18);
}

.async-card__item--completed {
  background: #f0fdf4;
  border-color: #86efac;
}

.async-card__item--completed strong {
  text-decoration: line-through;
}

.async-card__item-main {
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  max-width: 70%;
}

.async-card__item-main p {
  margin: 0;
  font-size: 0.85rem;
  color: #6b7280;
  line-height: 1.4;
}

.async-card__item button {
  align-self: center;
  padding: 0.4rem 0.75rem;
  border-radius: 8px;
  border: none;
  background: #dbeafe;
  color: #1d4ed8;
  font-size: 0.8rem;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.2s, transform 0.2s;
  white-space: nowrap;
}

.async-card__item button:hover {
  background: #bfdbfe;
  transform: translateY(-1px);
}

.async-card__actions {
  justify-content: flex-end;
}

.history-list {
  margin: 0;
  padding-left: 1rem;
  max-height: 220px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 0.35rem;
  color: #374151;
  font-size: 0.85rem;
}

.history-list__empty {
  padding: 0.75rem;
  border-radius: 10px;
  background: #f3f4f6;
  color: #6b7280;
  text-align: center;
}

@media (max-width: 640px) {
  #app {
    padding: 1rem;
  }

  main {
    padding: 1rem;
  }

  .demo-grid {
    grid-template-columns: 1fr;
  }

  .history-list {
    max-height: 320px;
  }
}
```

````markdown
# Minimal Global State Sample App (Vue)

이 프로젝트는 `sangtae-js` Minimal Global State 라이브러리의 필수 기능을 한눈에 시연할 수 있도록 구성된 Vue 3 + Vite 예제 앱이다. 단일 데모 페이지에서 `createAtom`, `createDerivedAtom`, `createAsyncAtom`, `set`, `get`, `subscribe`, `useAtom` 등의 핵심 API를 인터랙티브하게 체험할 수 있다.

## 실행 방법

```bash
npm install
npm run dev
```
````

이후 브라우저에서 `http://localhost:5173`에 접속하면 된다.

## 화면 구성

### 데모 (`/`)

- **Atom 값/업데이트 카드**  
  `createAtom`으로 만든 카운터 상태를 여러 컴포넌트에서 `useAtom`으로 구독한다.  
  `같은 값으로 set` 버튼을 눌러도 렌더 배지가 증가하지 않는 것을 통해, 값이 변하지 않으면 구독자가 알림을 받지 않는다는 사실을 확인할 수 있다.

- **스텝 Atom & 파생 Atom**  
  별도의 `step` Atom과 `createDerivedAtom`으로 만든 두 배 카운터 값을 별도 카드로 분리했다. 특정 Atom을 구독하는 컴포넌트만 다시 렌더링되는 모습을 렌더 배지에서 확인할 수 있다.

- **createAsyncAtom 카드**  
  `createAsyncAtom`에 Promise를 전달해 가짜 원격 데이터를 가져오고, 로딩 상태 → 완료 상태 전환을 확인할 수 있다. 새로고침 버튼으로 Promise를 다시 생성하여 흐름을 반복 확인할 수 있고, 가져온 데이터는 `set`으로 즉시 수정 가능하다.

- **요약 카드**  
  `get`을 통해 Vue 컴포넌트 밖에서도 스냅샷을 읽어올 수 있음을 보여주기 위해 "현재 상태 콘솔로 확인" 버튼을 제공한다. 콘솔에서 `createDerivedAtom`이 결괏값을 어떻게 묶어주는지 확인하면 된다.

- **수동 구독 카드**  
  `subscribe`를 사용해 카운터 변경 이력을 쌓는다. "구독 해제" 버튼을 누르면 내부 listener Set이 정리되고, 다시 구독을 시작하면 최초 값부터 다시 누적되는 모습을 볼 수 있다.

## 확인 팁

- 데모 페이지에서는 Vue Devtools의 component highlighter를 사용하면 어떤 카드가 다시 그려지는지 직관적으로 확인할 수 있다.
- 수동 구독 카드에서 구독을 해제하면 리스트가 초기화되며, 다시 구독을 누르면 `subscribe` 등록 시 바로 현재 값이 한 번 실행된다는 것을 확인할 수 있다.
- README와 함께 `Design.md`(별도 문서)를 참고하면 라이브러리 설계 의도와 API 사용 패턴을 더 쉽게 설명할 수 있다.

````

```typescript
import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import path from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
    },
  },
});

````

```vue
<script setup lang="ts">
import {
  computed,
  onBeforeUnmount,
  onMounted,
  reactive,
  ref,
  watch,
} from "vue";
import { get, set as setAtom, subscribe } from "sangtae-js";
import { useAtom } from "@/hooks/useAtom";
import RenderBadge from "@/components/RenderBadge.vue";
import AsyncTodosCard from "@/components/AsyncTodosCard.vue";
import {
  $counter,
  $counterHistory,
  $doubleCounter,
  $nickname,
  $step,
  $summary,
} from "@/stores";

const STEP_OPTIONS = [1, 5, 10] as const;

const [counter, setCounter] = useAtom($counter);
const [step, setStep] = useAtom($step);
const [nickname, setNickname] = useAtom($nickname);
const [summary] = useAtom($summary);
const [history] = useAtom($counterHistory);

const doubleCounter = computed(() => get($doubleCounter));

const counterRenderCount = ref(0);
const controlRenderCount = ref(0);
const stepRenderCount = ref(0);
const nicknameRenderCount = ref(0);
const doubleRenderCount = ref(0);
const summaryRenderCount = ref(0);
const historyRenderCount = ref(0);

watch(
  () => counter.value,
  () => {
    counterRenderCount.value += 1;
  },
  { immediate: true }
);

watch(
  () => [counter.value, step.value],
  () => {
    controlRenderCount.value += 1;
  },
  { immediate: true }
);

watch(
  () => step.value,
  () => {
    stepRenderCount.value += 1;
  },
  { immediate: true }
);

watch(
  () => nickname.value,
  () => {
    nicknameRenderCount.value += 1;
  },
  { immediate: true }
);

watch(
  doubleCounter,
  () => {
    doubleRenderCount.value += 1;
  },
  { immediate: true }
);

watch(
  summary,
  () => {
    summaryRenderCount.value += 1;
  },
  { immediate: true, deep: true }
);

watch(
  history,
  () => {
    historyRenderCount.value += 1;
  },
  { immediate: true, deep: true }
);

const onIncrease = () => setCounter(counter.value + step.value);
const onDecrease = () => setCounter(counter.value - step.value);
const onReset = () => setAtom($counter, 0);
const onSetSameValue = () => setAtom($counter, get($counter));

const inputNickname = computed({
  get: () => nickname.value,
  set: (val: string) => setNickname(val),
});

const onLogSnapshot = () => {
  const snapshot = get($summary);
  console.table(snapshot);
};

const isSubscribed = ref(true);
let unsubscribe: (() => void) | undefined;

const subscribeHistory = () => {
  unsubscribe?.();
  unsubscribe = subscribe($counter, (value) => {
    const snapshot = get($summary);
    const timestamp = new Date().toLocaleTimeString();
    const entry = `${timestamp} → ${value} (다음: ${snapshot.next})`;
    const current = get($counterHistory);
    const nextHistory = [entry, ...current].slice(0, 8);
    setAtom($counterHistory, nextHistory);
  });
};

onMounted(() => {
  if (isSubscribed.value) {
    subscribeHistory();
  }
});

onBeforeUnmount(() => {
  unsubscribe?.();
});

const onToggleSubscribe = () => {
  if (isSubscribed.value) {
    unsubscribe?.();
    setAtom($counterHistory, []);
  } else {
    subscribeHistory();
  }
  isSubscribed.value = !isSubscribed.value;
};

const asyncVersion = ref(0);
const refreshAsync = () => {
  asyncVersion.value += 1;
};
</script>

<template>
  <div class="demo-page">
    <section class="demo-section">
      <header class="demo-section__header">
        <h2>Minimal Global State 데모</h2>
        <p>
          Atom 생성부터 파생 값, 수동 구독까지 라이브러리의 핵심 기능을 한
          페이지에서 확인할 수 있습니다.
        </p>
      </header>
      <div class="demo-grid">
        <article class="atom-card">
          <header class="atom-card__header">
            <h3>Atom 값</h3>
            <span class="render-badge">렌더링 {{ counterRenderCount }}회</span>
          </header>
          <p class="atom-card__value">{{ counter }}</p>
          <p class="atom-card__hint">
            `createAtom`으로 생성한 전역 값을 `useAtom`으로 구독합니다.
          </p>
        </article>

        <article class="atom-card">
          <header class="atom-card__header">
            <h3>Atom 업데이트</h3>
            <span class="render-badge">렌더링 {{ controlRenderCount }}회</span>
          </header>
          <p class="atom-card__value atom-card__value--small">
            현재 값: <strong>{{ counter }}</strong> / 스텝:
            <strong>{{ step }}</strong>
          </p>
          <div class="atom-card__actions">
            <button @click="onDecrease">- 스텝</button>
            <button @click="onIncrease">+ 스텝</button>
            <button @click="onReset">0으로 초기화</button>
            <button @click="onSetSameValue">같은 값으로 set</button>
          </div>
          <p class="atom-card__hint">
            `set` 호출 시 값이 변하지 않으면 구독 중인 컴포넌트가 다시
            렌더링되지 않습니다.
          </p>
        </article>

        <article class="atom-card">
          <header class="atom-card__header">
            <h3>스텝 Atom</h3>
            <span class="render-badge">렌더링 {{ stepRenderCount }}회</span>
          </header>
          <div class="atom-card__options">
            <label v-for="option in STEP_OPTIONS" :key="option">
              <input
                type="radio"
                name="step"
                :value="option"
                :checked="step === option"
                @change="setStep(option)"
              />
              {{ option }}
            </label>
          </div>
          <p class="atom-card__hint">
            별도의 Atom으로 관리된 값이 변경되면 해당 Atom을 구독 중인
            컴포넌트만 렌더링됩니다.
          </p>
        </article>

        <article class="atom-card">
          <header class="atom-card__header">
            <h3>입력 Atom</h3>
            <span class="render-badge">렌더링 {{ nicknameRenderCount }}회</span>
          </header>
          <input
            class="atom-card__input"
            v-model="inputNickname"
            placeholder="닉네임을 입력하세요"
          />
          <p class="atom-card__hint">
            하나의 Atom을 여러 컴포넌트에서 공유할 수 있으며, 입력값과 파생
            상태가 연결됩니다.
          </p>
        </article>

        <article class="atom-card">
          <header class="atom-card__header">
            <h3>파생 Atom</h3>
            <span class="render-badge">렌더링 {{ doubleRenderCount }}회</span>
          </header>
          <p class="atom-card__value">{{ doubleCounter }}</p>
          <p class="atom-card__hint">
            `createDerivedAtom`으로 기본 Atom을 조합하여 만든 값입니다.
          </p>
        </article>

        <article class="atom-card">
          <header class="atom-card__header">
            <h3>Atom 요약</h3>
            <span class="render-badge">렌더링 {{ summaryRenderCount }}회</span>
          </header>
          <dl class="atom-card__list">
            <div>
              <dt>현재 값</dt>
              <dd>{{ summary.counter }}</dd>
            </div>
            <div>
              <dt>스텝</dt>
              <dd>{{ summary.step }}</dd>
            </div>
            <div>
              <dt>다음 값</dt>
              <dd>{{ summary.next }}</dd>
            </div>
            <div>
              <dt>메시지</dt>
              <dd>{{ summary.greeting }}</dd>
            </div>
          </dl>
          <button @click="onLogSnapshot" class="atom-card__log-btn">
            현재 상태 콘솔로 확인
          </button>
          <p class="atom-card__hint">
            `get`을 호출하면 Vue 컴포넌트 밖에서도 atom 스냅샷을 읽을 수
            있습니다.
          </p>
        </article>
      </div>
    </section>

    <section class="demo-section">
      <header class="demo-section__header">
        <h2>비동기 Atom</h2>
        <p>
          `createAsyncAtom`은 Promise를 전달받아 데이터를 캐싱하고, 자연스러운
          비동기 UX를 제공합니다.
        </p>
      </header>
      <AsyncTodosCard
        :key="asyncVersion"
        :version="asyncVersion"
        @refresh="refreshAsync"
      />
    </section>

    <section class="demo-section">
      <header class="demo-section__header">
        <h2>구독자 동작 확인</h2>
        <p>
          동일한 값으로 `set`하면 구독자가 호출되지 않으며, 필요 시 구독을 직접
          관리하여 메모리를 절약할 수 있습니다.
        </p>
      </header>
      <article class="atom-card atom-card--wide">
        <header class="atom-card__header">
          <h3>수동 구독자</h3>
          <span class="render-badge">렌더링 {{ historyRenderCount }}회</span>
        </header>
        <div class="atom-card__actions">
          <button @click="onToggleSubscribe">
            {{ isSubscribed ? "구독 해제" : "다시 구독" }}
          </button>
        </div>
        <p class="atom-card__hint">
          `subscribe`로 직접 구독을 생성하고 해제할 수 있습니다. 구독이 제거되면
          내부 listener Set이 비워집니다.
        </p>
        <ul v-if="isSubscribed" class="history-list">
          <li v-if="history.length === 0" class="history-list__empty">
            아직 변경 이력이 없습니다.
          </li>
          <li v-for="(entry, index) in history" :key="`${entry}-${index}`">
            {{ entry }}
          </li>
        </ul>
        <div v-else class="history-list__empty">
          구독이 해제되어 변경 이력을 수집하지 않습니다.
        </div>
      </article>
    </section>
  </div>
</template>
```

```vue
<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { get, set as setAtom, subscribe } from "sangtae-js";
import { useAtom } from "@/hooks/useAtom";
import AsyncTodosCard from "@/components/AsyncTodosCard.vue";
import {
  $counter,
  $counterHistory,
  $doubleCounter,
  $nickname,
  $step,
  $summary,
} from "@/stores";

const STEP_OPTIONS = [1, 5, 10] as const;

const [counter, setCounter] = useAtom($counter);
const [step, setStep] = useAtom($step);
const [nickname, setNickname] = useAtom($nickname);
const [summary] = useAtom($summary);
const [history] = useAtom($counterHistory);

const doubleCounter = computed(() => get($doubleCounter));

const counterRenderCount = ref(0);
const controlRenderCount = ref(0);
const stepRenderCount = ref(0);
const nicknameRenderCount = ref(0);
const doubleRenderCount = ref(0);
const summaryRenderCount = ref(0);
const historyRenderCount = ref(0);

watch(
  () => counter.value,
  () => {
    counterRenderCount.value += 1;
  },
  { immediate: true }
);

watch(
  () => [counter.value, step.value],
  () => {
    controlRenderCount.value += 1;
  },
  { immediate: true }
);

watch(
  () => step.value,
  () => {
    stepRenderCount.value += 1;
  },
  { immediate: true }
);

watch(
  () => nickname.value,
  () => {
    nicknameRenderCount.value += 1;
  },
  { immediate: true }
);

watch(
  doubleCounter,
  () => {
    doubleRenderCount.value += 1;
  },
  { immediate: true }
);

watch(
  summary,
  () => {
    summaryRenderCount.value += 1;
  },
  { immediate: true, deep: true }
);

watch(
  history,
  () => {
    historyRenderCount.value += 1;
  },
  { immediate: true, deep: true }
);

const onIncrease = () => setCounter(counter.value + step.value);
const onDecrease = () => setCounter(counter.value - step.value);
const onReset = () => setAtom($counter, 0);
const onSetSameValue = () => setAtom($counter, get($counter));

const inputNickname = computed({
  get: () => nickname.value,
  set: (val: string) => setNickname(val),
});

const onLogSnapshot = () => {
  const snapshot = get($summary);
  console.table(snapshot);
};

const isSubscribed = ref(true);
let unsubscribe: (() => void) | undefined;

const subscribeHistory = () => {
  unsubscribe?.();
  unsubscribe = subscribe($counter, (value) => {
    const snapshot = get($summary);
    const timestamp = new Date().toLocaleTimeString();
    const entry = `${timestamp} → ${value} (다음: ${snapshot.next})`;
    const current = get($counterHistory);
    const nextHistory = [entry, ...current].slice(0, 8);
    setAtom($counterHistory, nextHistory);
  });
};

onMounted(() => {
  if (isSubscribed.value) {
    subscribeHistory();
  }
});

onBeforeUnmount(() => {
  unsubscribe?.();
});

const onToggleSubscribe = () => {
  if (isSubscribed.value) {
    unsubscribe?.();
    setAtom($counterHistory, []);
  } else {
    subscribeHistory();
  }
  isSubscribed.value = !isSubscribed.value;
};

const asyncVersion = ref(0);
const refreshAsync = () => {
  asyncVersion.value += 1;
};
</script>

<template>
  <div class="demo-page">
    <section class="demo-section">
      <header class="demo-section__header">
        <h2>Minimal Global State 데모</h2>
        <p>
          Atom 생성부터 파생 값, 수동 구독까지 라이브러리의 핵심 기능을 한
          페이지에서 확인할 수 있습니다.
        </p>
      </header>
      <div class="demo-grid">
        <article class="atom-card">
          <header class="atom-card__header">
            <h3>Atom 값</h3>
            <span class="render-badge">렌더링 {{ counterRenderCount }}회</span>
          </header>
          <p class="atom-card__value">{{ counter }}</p>
          <p class="atom-card__hint">
            `createAtom`으로 생성한 전역 값을 `useAtom`으로 구독합니다.
          </p>
        </article>

        <article class="atom-card">
          <header class="atom-card__header">
            <h3>Atom 업데이트</h3>
            <span class="render-badge">렌더링 {{ controlRenderCount }}회</span>
          </header>
          <p class="atom-card__value atom-card__value--small">
            현재 값: <strong>{{ counter }}</strong> / 스텝:
            <strong>{{ step }}</strong>
          </p>
          <div class="atom-card__actions">
            <button @click="onDecrease">- 스텝</button>
            <button @click="onIncrease">+ 스텝</button>
            <button @click="onReset">0으로 초기화</button>
            <button @click="onSetSameValue">같은 값으로 set</button>
          </div>
          <p class="atom-card__hint">
            `set` 호출 시 값이 변하지 않으면 구독 중인 컴포넌트가 다시
            렌더링되지 않습니다.
          </p>
        </article>

        <article class="atom-card">
          <header class="atom-card__header">
            <h3>스텝 Atom</h3>
            <span class="render-badge">렌더링 {{ stepRenderCount }}회</span>
          </header>
          <div class="atom-card__options">
            <label v-for="option in STEP_OPTIONS" :key="option">
              <input
                type="radio"
                name="step"
                :value="option"
                :checked="step === option"
                @change="setStep(option)"
              />
              {{ option }}
            </label>
          </div>
          <p class="atom-card__hint">
            별도의 Atom으로 관리된 값이 변경되면 해당 Atom을 구독 중인
            컴포넌트만 렌더링됩니다.
          </p>
        </article>

        <article class="atom-card">
          <header class="atom-card__header">
            <h3>입력 Atom</h3>
            <span class="render-badge">렌더링 {{ nicknameRenderCount }}회</span>
          </header>
          <input
            class="atom-card__input"
            v-model="inputNickname"
            placeholder="닉네임을 입력하세요"
          />
          <p class="atom-card__hint">
            하나의 Atom을 여러 컴포넌트에서 공유할 수 있으며, 입력값과 파생
            상태가 연결됩니다.
          </p>
        </article>

        <article class="atom-card">
          <header class="atom-card__header">
            <h3>파생 Atom</h3>
            <span class="render-badge">렌더링 {{ doubleRenderCount }}회</span>
          </header>
          <p class="atom-card__value">{{ doubleCounter }}</p>
          <p class="atom-card__hint">
            `createDerivedAtom`으로 기본 Atom을 조합하여 만든 값입니다.
          </p>
        </article>

        <article class="atom-card">
          <header class="atom-card__header">
            <h3>Atom 요약</h3>
            <span class="render-badge">렌더링 {{ summaryRenderCount }}회</span>
          </header>
          <dl class="atom-card__list">
            <div>
              <dt>현재 값</dt>
              <dd>{{ summary.counter }}</dd>
            </div>
            <div>
              <dt>스텝</dt>
              <dd>{{ summary.step }}</dd>
            </div>
            <div>
              <dt>다음 값</dt>
              <dd>{{ summary.next }}</dd>
            </div>
            <div>
              <dt>메시지</dt>
              <dd>{{ summary.greeting }}</dd>
            </div>
          </dl>
          <button @click="onLogSnapshot" class="atom-card__log-btn">
            현재 상태 콘솔로 확인
          </button>
          <p class="atom-card__hint">
            `get`을 호출하면 Vue 컴포넌트 밖에서도 atom 스냅샷을 읽을 수
            있습니다.
          </p>
        </article>
      </div>
    </section>

    <section class="demo-section">
      <header class="demo-section__header">
        <h2>비동기 Atom</h2>
        <p>
          `createAsyncAtom`은 Promise를 전달받아 데이터를 캐싱하고, 자연스러운
          비동기 UX를 제공합니다.
        </p>
      </header>
      <AsyncTodosCard
        :key="asyncVersion"
        :version="asyncVersion"
        @refresh="refreshAsync"
      />
    </section>

    <section class="demo-section">
      <header class="demo-section__header">
        <h2>구독자 동작 확인</h2>
        <p>
          동일한 값으로 `set`하면 구독자가 호출되지 않으며, 필요 시 구독을 직접
          관리하여 메모리를 절약할 수 있습니다.
        </p>
      </header>
      <article class="atom-card atom-card--wide">
        <header class="atom-card__header">
          <h3>수동 구독자</h3>
          <span class="render-badge">렌더링 {{ historyRenderCount }}회</span>
        </header>
        <div class="atom-card__actions">
          <button @click="onToggleSubscribe">
            {{ isSubscribed ? "구독 해제" : "다시 구독" }}
          </button>
        </div>
        <p class="atom-card__hint">
          `subscribe`로 직접 구독을 생성하고 해제할 수 있습니다. 구독이 제거되면
          내부 listener Set이 비워집니다.
        </p>
        <ul v-if="isSubscribed" class="history-list">
          <li v-if="history.length === 0" class="history-list__empty">
            아직 변경 이력이 없습니다.
          </li>
          <li v-for="(entry, index) in history" :key="`${entry}-${index}`">
            {{ entry }}
          </li>
        </ul>
        <div v-else class="history-list__empty">
          구독이 해제되어 변경 이력을 수집하지 않습니다.
        </div>
      </article>
    </section>
  </div>
</template>
```

```jsonc
{
  "extends": "@vue/tsconfig/tsconfig.dom.json",
  "compilerOptions": {
    "tsBuildInfoFile": "./node_modules/.tmp/tsconfig.app.tsbuildinfo",
    "types": ["vite/client"],
    "baseUrl": ".",
    "paths": {
      "@/*": ["src/*"]
    },

    /* Linting */
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "erasableSyntaxOnly": true,
    "noFallthroughCasesInSwitch": true,
    "noUncheckedSideEffectImports": true
  },
  "include": ["src/**/*.ts", "src/**/*.vue"]
}
```

- Vue 샘플 앱도 React 데모랑 같은 UI/동작으로 갈아엎었어. 기존 포스트 목록 전부 지우고 `DemoPage.vue`에서 카운터, 파생 상태, 수동 구독, `createAsyncAtom` 카드까지 그대로 재현했어.
- `AsyncTodosCard.vue`, `RenderBadge.vue`, `useRenderCount.ts`, `stores/demo.ts` 같은 새 컴포넌트/스토어를 추가했고, `style.css`도 React 쪽 테마랑 동일하게 맞췄어. `@` 경로 alias랑 tsconfig 설정도 세팅해놨다.
- README도 Vue 버전에 맞게 데모 설명으로 갱신해놨어.

테스트는 아직 못 돌려봤어. `cd sample-app-vue && npm run dev` 한번 띄워서 새 카드들이 로딩→완료 잘 뜨는지만 확인해줘.

---

**User**

sample-app-vue 의 createAsyncAtom 데모 에서 렌더링이 비정상적으로 많이 일어나는것 같아(다른데모는 1회씩인데 101번씩 렌더링)

---

**Cursor**

```vue
<script setup lang="ts">
import { onMounted, onUpdated, ref } from "vue";

const badgeRef = ref<HTMLSpanElement | null>(null);
let renderCount = 0;

const updateBadge = () => {
  renderCount += 1;
  if (badgeRef.value) {
    badgeRef.value.textContent = `렌더링 ${renderCount}회`;
  }
};

onMounted(updateBadge);
onUpdated(updateBadge);
</script>

<template>
  <span class="render-badge" ref="badgeRef"></span>
</template>
```

- `RenderBadge`가 Vue에서 자기 자신을 계속 다시 렌더링시키던 구조라서 렌더 횟수가 폭증했어. 이제 렌더 횟수를 직접 DOM에 찍어주는 방식으로 바꿔서 실제 업데이트가 일어날 때만 숫자가 올라가.
- `useRenderCount.ts`는 더 이상 필요 없어져서 삭제했고, 나머지 데모 카드들도 영향 없이 기존 카운터/파생/수동 구독 로직 그대로 돌아가.

`cd sample-app-vue && npm run dev` 돌려서 `createAsyncAtom` 카드의 렌더 뱃지가 1회 정도로 유지되는지만 확인해줘.

---

**User**

잘되는것 확인했어 근데 sample-app-vue의 파생 Atom이 동작하지 않는것같아

---

**Cursor**

```vue
<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from "vue";
import { get, set as setAtom, subscribe } from "sangtae-js";
import { useAtom } from "@/hooks/useAtom";
import AsyncTodosCard from "@/components/AsyncTodosCard.vue";
import {
  $counter,
  $counterHistory,
  $doubleCounter,
  $nickname,
  $step,
  $summary,
} from "@/stores";

const STEP_OPTIONS = [1, 5, 10] as const;

const [counter, setCounter] = useAtom($counter);
const [step, setStep] = useAtom($step);
const [nickname, setNickname] = useAtom($nickname);
const [doubleCounter] = useAtom($doubleCounter);
const [summary] = useAtom($summary);
const [history] = useAtom($counterHistory);

const counterRenderCount = ref(0);
const controlRenderCount = ref(0);
const stepRenderCount = ref(0);
const nicknameRenderCount = ref(0);
const doubleRenderCount = ref(0);
const summaryRenderCount = ref(0);
const historyRenderCount = ref(0);

watch(
  () => counter.value,
  () => {
    counterRenderCount.value += 1;
  },
  { immediate: true }
);

watch(
  () => [counter.value, step.value],
  () => {
    controlRenderCount.value += 1;
  },
  { immediate: true }
);

watch(
  () => step.value,
  () => {
    stepRenderCount.value += 1;
  },
  { immediate: true }
);

watch(
  () => nickname.value,
  () => {
    nicknameRenderCount.value += 1;
  },
  { immediate: true }
);

watch(
  doubleCounter,
  () => {
    doubleRenderCount.value += 1;
  },
  { immediate: true }
);

watch(
  summary,
  () => {
    summaryRenderCount.value += 1;
  },
  { immediate: true, deep: true }
);

watch(
  history,
  () => {
    historyRenderCount.value += 1;
  },
  { immediate: true, deep: true }
);

const onIncrease = () => setCounter(counter.value + step.value);
const onDecrease = () => setCounter(counter.value - step.value);
const onReset = () => setAtom($counter, 0);
const onSetSameValue = () => setAtom($counter, get($counter));

const inputNickname = computed({
  get: () => nickname.value,
  set: (val: string) => setNickname(val),
});

const onLogSnapshot = () => {
  const snapshot = get($summary);
  console.table(snapshot);
};

const isSubscribed = ref(true);
let unsubscribe: (() => void) | undefined;

const subscribeHistory = () => {
  unsubscribe?.();
  unsubscribe = subscribe($counter, (value) => {
    const snapshot = get($summary);
    const timestamp = new Date().toLocaleTimeString();
    const entry = `${timestamp} → ${value} (다음: ${snapshot.next})`;
    const current = get($counterHistory);
    const nextHistory = [entry, ...current].slice(0, 8);
    setAtom($counterHistory, nextHistory);
  });
};

onMounted(() => {
  if (isSubscribed.value) {
    subscribeHistory();
  }
});

onBeforeUnmount(() => {
  unsubscribe?.();
});

const onToggleSubscribe = () => {
  if (isSubscribed.value) {
    unsubscribe?.();
    setAtom($counterHistory, []);
  } else {
    subscribeHistory();
  }
  isSubscribed.value = !isSubscribed.value;
};

const asyncVersion = ref(0);
const refreshAsync = () => {
  asyncVersion.value += 1;
};
</script>

<template>
  <div class="demo-page">
    <section class="demo-section">
      <header class="demo-section__header">
        <h2>Minimal Global State 데모</h2>
        <p>
          Atom 생성부터 파생 값, 수동 구독까지 라이브러리의 핵심 기능을 한
          페이지에서 확인할 수 있습니다.
        </p>
      </header>
      <div class="demo-grid">
        <article class="atom-card">
          <header class="atom-card__header">
            <h3>Atom 값</h3>
            <span class="render-badge">렌더링 {{ counterRenderCount }}회</span>
          </header>
          <p class="atom-card__value">{{ counter }}</p>
          <p class="atom-card__hint">
            `createAtom`으로 생성한 전역 값을 `useAtom`으로 구독합니다.
          </p>
        </article>

        <article class="atom-card">
          <header class="atom-card__header">
            <h3>Atom 업데이트</h3>
            <span class="render-badge">렌더링 {{ controlRenderCount }}회</span>
          </header>
          <p class="atom-card__value atom-card__value--small">
            현재 값: <strong>{{ counter }}</strong> / 스텝:
            <strong>{{ step }}</strong>
          </p>
          <div class="atom-card__actions">
            <button @click="onDecrease">- 스텝</button>
            <button @click="onIncrease">+ 스텝</button>
            <button @click="onReset">0으로 초기화</button>
            <button @click="onSetSameValue">같은 값으로 set</button>
          </div>
          <p class="atom-card__hint">
            `set` 호출 시 값이 변하지 않으면 구독 중인 컴포넌트가 다시
            렌더링되지 않습니다.
          </p>
        </article>

        <article class="atom-card">
          <header class="atom-card__header">
            <h3>스텝 Atom</h3>
            <span class="render-badge">렌더링 {{ stepRenderCount }}회</span>
          </header>
          <div class="atom-card__options">
            <label v-for="option in STEP_OPTIONS" :key="option">
              <input
                type="radio"
                name="step"
                :value="option"
                :checked="step === option"
                @change="setStep(option)"
              />
              {{ option }}
            </label>
          </div>
          <p class="atom-card__hint">
            별도의 Atom으로 관리된 값이 변경되면 해당 Atom을 구독 중인
            컴포넌트만 렌더링됩니다.
          </p>
        </article>

        <article class="atom-card">
          <header class="atom-card__header">
            <h3>입력 Atom</h3>
            <span class="render-badge">렌더링 {{ nicknameRenderCount }}회</span>
          </header>
          <input
            class="atom-card__input"
            v-model="inputNickname"
            placeholder="닉네임을 입력하세요"
          />
          <p class="atom-card__hint">
            하나의 Atom을 여러 컴포넌트에서 공유할 수 있으며, 입력값과 파생
            상태가 연결됩니다.
          </p>
        </article>

        <article class="atom-card">
          <header class="atom-card__header">
            <h3>파생 Atom</h3>
            <span class="render-badge">렌더링 {{ doubleRenderCount }}회</span>
          </header>
          <p class="atom-card__value">{{ doubleCounter }}</p>
          <p class="atom-card__hint">
            `createDerivedAtom`으로 기본 Atom을 조합하여 만든 값입니다.
          </p>
        </article>

        <article class="atom-card">
          <header class="atom-card__header">
            <h3>Atom 요약</h3>
            <span class="render-badge">렌더링 {{ summaryRenderCount }}회</span>
          </header>
          <dl class="atom-card__list">
            <div>
              <dt>현재 값</dt>
              <dd>{{ summary.counter }}</dd>
            </div>
            <div>
              <dt>스텝</dt>
              <dd>{{ summary.step }}</dd>
            </div>
            <div>
              <dt>다음 값</dt>
              <dd>{{ summary.next }}</dd>
            </div>
            <div>
              <dt>메시지</dt>
              <dd>{{ summary.greeting }}</dd>
            </div>
          </dl>
          <button @click="onLogSnapshot" class="atom-card__log-btn">
            현재 상태 콘솔로 확인
          </button>
          <p class="atom-card__hint">
            `get`을 호출하면 Vue 컴포넌트 밖에서도 atom 스냅샷을 읽을 수
            있습니다.
          </p>
        </article>
      </div>
    </section>

    <section class="demo-section">
      <header class="demo-section__header">
        <h2>비동기 Atom</h2>
        <p>
          `createAsyncAtom`은 Promise를 전달받아 데이터를 캐싱하고, 자연스러운
          비동기 UX를 제공합니다.
        </p>
      </header>
      <AsyncTodosCard
        :key="asyncVersion"
        :version="asyncVersion"
        @refresh="refreshAsync"
      />
    </section>

    <section class="demo-section">
      <header class="demo-section__header">
        <h2>구독자 동작 확인</h2>
        <p>
          동일한 값으로 `set`하면 구독자가 호출되지 않으며, 필요 시 구독을 직접
          관리하여 메모리를 절약할 수 있습니다.
        </p>
      </header>
      <article class="atom-card atom-card--wide">
        <header class="atom-card__header">
          <h3>수동 구독자</h3>
          <span class="render-badge">렌더링 {{ historyRenderCount }}회</span>
        </header>
        <div class="atom-card__actions">
          <button @click="onToggleSubscribe">
            {{ isSubscribed ? "구독 해제" : "다시 구독" }}
          </button>
        </div>
        <p class="atom-card__hint">
          `subscribe`로 직접 구독을 생성하고 해제할 수 있습니다. 구독이 제거되면
          내부 listener Set이 비워집니다.
        </p>
        <ul v-if="isSubscribed" class="history-list">
          <li v-if="history.length === 0" class="history-list__empty">
            아직 변경 이력이 없습니다.
          </li>
          <li v-for="(entry, index) in history" :key="`${entry}-${index}`">
            {{ entry }}
          </li>
        </ul>
        <div v-else class="history-list__empty">
          구독이 해제되어 변경 이력을 수집하지 않습니다.
        </div>
      </article>
    </section>
  </div>
</template>
```

- 파생 atom이 값이 안 바뀌던 건 Vue에서 `get($doubleCounter)`만 읽고 구독을 안 걸어서였어. 이제 `useAtom($doubleCounter)`로 ref를 받아서 상태 변경에 반응하도록 바꿨고, render-count watcher도 그 ref를 구독하게 수정했어.
- 나머지 기능(요약, 수동 구독)은 기존 로직 유지.

`sample-app-vue`에서 `npm run dev` 다시 돌려서 파생 Atom 카드 값이 스텝/카운터 변경에 맞춰 바로 갱신되는지 확인해줘.

---

**User**

잘되는데 sample-app-react 에 데이터 새로고침이 동작하지 않아

---

**Cursor**

```typescript
import { createAsyncAtom, createAtom, createDerivedAtom } from "sangtae-js";

export const $counter = createAtom<number>(0);
export const $step = createAtom<number>(1);
export const $nickname = createAtom<string>("");

export interface CounterSummary {
  counter: number;
  step: number;
  next: number;
  greeting: string;
}

export interface RemoteTodo {
  id: number;
  title: string;
  description: string;
  completed: boolean;
}

export const $summary = createDerivedAtom<CounterSummary>((get) => {
  const counter = get($counter);
  const step = get($step);
  const nickname = get($nickname).trim();

  return {
    counter,
    step,
    next: counter + step,
    greeting: nickname
      ? `${nickname}님, 다음 값은 ${counter + step}`
      : "이름을 입력해보세요.",
  };
});

export const $doubleCounter = createDerivedAtom<number>(
  (get) => get($counter) * 2
);

export const $counterHistory = createAtom<string[]>([]);

const loadRemoteTodos = (version: number): Promise<RemoteTodo[]> =>
  new Promise((resolve) => {
    const delay = 600 + ((version % 3) + 1) * 200;
    const startedAt = Date.now();

    setTimeout(() => {
      const now = new Date();
      const generated = [
        {
          title: "API 문서 검토",
          description: "README 요약을 확인하고 팀 공유 준비",
        },
        {
          title: "디자인 동기화",
          description: "UI 컴포넌트 상태와 실제 데이터를 비교",
        },
        {
          title: "렌더 카운트 점검",
          description: "변경된 atom이 컴포넌트에 미치는 영향 확인",
        },
        {
          title: "배포 체크리스트",
          description: "build, lint, 테스트 명령어가 모두 통과하는지 확인",
        },
      ].map((template, index) => ({
        id: version * 10 + index + 1,
        title: `${template.title} #${version + 1}`,
        description: `${template.description} - ${now.toLocaleTimeString()}`,
        completed: (version + index) % 2 === 0,
      }));

      const elapsed = Date.now() - startedAt;
      resolve(
        generated.map((todo) => ({
          ...todo,
          description: `${todo.description} (응답 ${elapsed}ms)`,
        }))
      );
    }, delay);
  });

export const createRemoteTodosAtom = (version: number) =>
  createAsyncAtom(loadRemoteTodos(version));
```

```typescriptreact
import { Suspense, useEffect, useState } from "react";
import useAtom from "@/hooks/useAtom";
import useRenderCount from "@/hooks/useRenderCount";
import {
  $counter,
  $counterHistory,
  $doubleCounter,
  $nickname,
  $step,
  $summary,
  createRemoteTodosAtom,
  type RemoteTodo,
} from "@/stores/demo";
import { get, set, subscribe, type Atom } from "sangtae-js";

/**
 * @description 렌더링 횟수를 표시하는 컴포넌트
 */
const RenderBadge = () => {
  const renders = useRenderCount();
  return <span className="render-badge">렌더링 {renders}회</span>;
};

const CounterValueCard = () => {
  const [counter] = useAtom($counter);

  return (
    <article className="atom-card">
      <header className="atom-card__header">
        <h3>Atom 값</h3>
        <RenderBadge />
      </header>
      <p className="atom-card__value">{counter}</p>
      <p className="atom-card__hint">
        `createAtom`으로 생성한 전역 값을 `useAtom`으로 구독합니다.
      </p>
    </article>
  );
};

/**
 * @description 카운터 업데이트 컴포넌트
 */
const CounterControlsCard = () => {
  const [counter, setCounter] = useAtom($counter);
  const [step] = useAtom($step);

  const onIncrease = () => setCounter(counter + step);
  const onDecrease = () => setCounter(counter - step);
  const onReset = () => set($counter, 0);
  const onSetSameValue = () => {
    const current = get($counter);
    set($counter, current);
  };

  return (
    <article className="atom-card">
      <header className="atom-card__header">
        <h3>Atom 업데이트</h3>
        <RenderBadge />
      </header>
      <p className="atom-card__value atom-card__value--small">
        현재 값: <strong>{counter}</strong> / 스텝: <strong>{step}</strong>
      </p>
      <div className="atom-card__actions">
        <button onClick={onDecrease}>- 스텝</button>
        <button onClick={onIncrease}>+ 스텝</button>
        <button onClick={onReset}>0으로 초기화</button>
        <button onClick={onSetSameValue}>같은 값으로 set</button>
      </div>
      <p className="atom-card__hint">
        `set` 호출 시 값이 변하지 않으면 구독 중인 컴포넌트가 다시 렌더링되지
        않습니다.
      </p>
    </article>
  );
};

/**
 * @description 스텝 선택 컴포넌트
 */
const StepSelectorCard = () => {
  const [step, setStep] = useAtom($step);

  return (
    <article className="atom-card">
      <header className="atom-card__header">
        <h3>스텝 Atom</h3>
        <RenderBadge />
      </header>
      <div className="atom-card__options">
        {[1, 5, 10].map((option) => (
          <label key={option}>
            <input
              type="radio"
              name="step"
              value={option}
              checked={step === option}
              onChange={() => setStep(option)}
            />
            {option}
          </label>
        ))}
      </div>
      <p className="atom-card__hint">
        별도의 Atom으로 관리된 값이 변경되면 해당 Atom을 구독 중인 컴포넌트만
        렌더링됩니다.
      </p>
    </article>
  );
};

/**
 * @description 닉네임 입력 컴포넌트
 */
const NicknameCard = () => {
  const [nickname, setNickname] = useAtom($nickname);

  return (
    <article className="atom-card">
      <header className="atom-card__header">
        <h3>입력 Atom</h3>
        <RenderBadge />
      </header>
      <input
        className="atom-card__input"
        value={nickname}
        placeholder="닉네임을 입력하세요"
        onChange={({ target }) => setNickname(target.value)}
      />
      <p className="atom-card__hint">
        하나의 Atom을 여러 컴포넌트에서 공유할 수 있으며, 입력값과 파생 상태가
        연결됩니다.
      </p>
    </article>
  );
};

/**
 * @description 파생 카운터 컴포넌트
 */
const DerivedCounterCard = () => {
  const [doubleCount] = useAtom($doubleCounter);

  return (
    <article className="atom-card">
      <header className="atom-card__header">
        <h3>파생 Atom</h3>
        <RenderBadge />
      </header>
      <p className="atom-card__value">{doubleCount}</p>
      <p className="atom-card__hint">
        `createDerivedAtom`으로 기본 Atom을 조합하여 만든 값입니다.
      </p>
    </article>
  );
};

/**
 * @description 요약 카운터 컴포넌트
 */
const SummaryCard = () => {
  const [summary] = useAtom($summary);

  const onLogSnapshot = () => {
    const snapshot = get($summary);
    console.table(snapshot);
  };

  return (
    <article className="atom-card">
      <header className="atom-card__header">
        <h3>Atom 요약</h3>
        <RenderBadge />
      </header>
      <dl className="atom-card__list">
        <div>
          <dt>현재 값</dt>
          <dd>{summary.counter}</dd>
        </div>
        <div>
          <dt>스텝</dt>
          <dd>{summary.step}</dd>
        </div>
        <div>
          <dt>다음 값</dt>
          <dd>{summary.next}</dd>
        </div>
        <div>
          <dt>메시지</dt>
          <dd>{summary.greeting}</dd>
        </div>
      </dl>
      <button onClick={onLogSnapshot} className="atom-card__log-btn">
        현재 상태 콘솔로 확인
      </button>
      <p className="atom-card__hint">
        `get`을 호출하면 React 컴포넌트 밖에서도 atom 스냅샷을 읽을 수 있습니다.
      </p>
    </article>
  );
};

/**
 * @description 비동기 투두 카드 컴포넌트
 */
const AsyncTodosCardContent = ({
  atom,
  version,
  onRefresh,
}: {
  atom: Atom<RemoteTodo[]>;
  version: number;
  onRefresh: () => void;
}) => {
  const [todos, setTodos] = useAtom(atom);

  const completedCount = todos.filter((todo) => todo.completed).length;

  const onToggleComplete = (id: number) => {
    setTodos(
      todos.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  };

  const onCompleteAll = () => {
    setTodos(todos.map((todo) => ({ ...todo, completed: true })));
  };

  return (
    <article className="atom-card atom-card--wide async-card">
      <header className="atom-card__header">
        <h3>createAsyncAtom 데모</h3>
        <RenderBadge />
      </header>
      <p className="atom-card__hint">
        Promise를 받아 최초 구독 시 `Suspense`를 통해 로딩 상태를 노출합니다.
        이후에는 `set`을 사용해 비동기 데이터도 즉시 수정할 수 있습니다.
      </p>
      <div className="async-card__stats">
        <span>데이터 버전: v{version + 1}</span>
        <span>
          완료 {completedCount}/{todos.length}
        </span>
      </div>
      <ul className="async-card__list">
        {todos.map((todo) => (
          <li
            key={todo.id}
            className={`async-card__item${
              todo.completed ? " async-card__item--completed" : ""
            }`}
          >
            <div className="async-card__item-main">
              <strong>{todo.title}</strong>
              <p>{todo.description}</p>
            </div>
            <button onClick={() => onToggleComplete(todo.id)}>
              {todo.completed ? "되돌리기" : "완료"}
            </button>
          </li>
        ))}
      </ul>
      <div className="atom-card__actions async-card__actions">
        <button onClick={onRefresh}>데이터 새로고침</button>
        <button onClick={onCompleteAll}>모두 완료 처리</button>
      </div>
    </article>
  );
};

/**
 * @description 비동기 투두 카드 컴포넌트
 */
const AsyncTodosCard = () => {
  const [{ atom, version }, setAsyncState] = useState(() => ({
    atom: createRemoteTodosAtom(0),
    version: 0,
  }));

  const onRefresh = () =>
    setAsyncState((prev) => {
      const nextVersion = prev.version + 1;
      return {
        atom: createRemoteTodosAtom(nextVersion),
        version: nextVersion,
      };
    });

  return (
    <Suspense
      fallback={
        <article className="atom-card atom-card--wide async-card async-card--loading">
          <header className="atom-card__header">
            <h3>createAsyncAtom 데모</h3>
          </header>
          <p className="atom-card__hint">
            비동기 데이터를 불러오는 중입니다...
          </p>
        </article>
      }
    >
      <AsyncTodosCardContent
        atom={atom}
        version={version}
        onRefresh={onRefresh}
      />
    </Suspense>
  );
};

/**
 * @description 카운터 변경 이력 카드 컴포넌트
 */
const CounterHistoryCard = () => {
  const [history] = useAtom($counterHistory);
  const [isSubscribed, setIsSubscribed] = useState(true);

  useEffect(() => {
    if (!isSubscribed) {
      return;
    }

    const unsubscribe = subscribe($counter, (value) => {
      const summary = get($summary);
      const timestamp = new Date().toLocaleTimeString();
      const entry = `${timestamp} → ${value} (다음: ${summary.next})`;
      const current = get($counterHistory);
      const nextHistory = [entry, ...current].slice(0, 8);
      set($counterHistory, nextHistory);
    });

    return () => unsubscribe();
  }, [isSubscribed]);

  const onToggleSubscribe = () => {
    if (isSubscribed) {
      set($counterHistory, []);
    }
    setIsSubscribed((prev) => !prev);
  };

  return (
    <article className="atom-card atom-card--wide">
      <header className="atom-card__header">
        <h3>수동 구독자</h3>
        <RenderBadge />
      </header>
      <div className="atom-card__actions">
        <button onClick={onToggleSubscribe}>
          {isSubscribed ? "구독 해제" : "다시 구독"}
        </button>
      </div>
      <p className="atom-card__hint">
        `subscribe`로 직접 구독을 생성하고 해제할 수 있습니다. 구독이 제거되면
        내부 listener Set이 비워집니다.
      </p>
      {isSubscribed ? (
        <ul className="history-list">
          {history.length === 0 && (
            <li className="history-list__empty">아직 변경 이력이 없습니다.</li>
          )}
          {history.map((entry, index) => (
            <li key={`${entry}-${index}`}>{entry}</li>
          ))}
        </ul>
      ) : (
        <div className="history-list__empty">
          구독이 해제되어 변경 이력을 수집하지 않습니다.
        </div>
      )}
    </article>
  );
};

/**
 * @description 데모 페이지 컴포넌트
 */
const DemoPage = () => {
  return (
    <div className="demo-page">
      <section className="demo-section">
        <header className="demo-section__header">
          <h2>Minimal Global State 데모</h2>
          <p>
            Atom 생성부터 파생 값, 수동 구독까지 라이브러리의 핵심 기능을 한
            페이지에서 확인할 수 있습니다.
          </p>
        </header>
        <div className="demo-grid">
          <CounterValueCard />
          <CounterControlsCard />
          <StepSelectorCard />
          <NicknameCard />
          <DerivedCounterCard />
          <SummaryCard />
        </div>
      </section>
      <section className="demo-section">
        <header className="demo-section__header">
          <h2>비동기 Atom</h2>
          <p>
            `createAsyncAtom`은 Promise를 전달받아 데이터를 캐싱하고,
            `Suspense`와 결합하여 자연스러운 비동기 UX를 제공합니다.
          </p>
        </header>
        <AsyncTodosCard />
      </section>
      <section className="demo-section">
        <header className="demo-section__header">
          <h2>구독자 동작 확인</h2>
          <p>
            동일한 값으로 `set`하면 구독자가 호출되지 않으며, 필요 시 구독을
            직접 관리하여 GC-friendly하게 동작합니다.
          </p>
        </header>
        <CounterHistoryCard />
      </section>
    </div>
  );
};

export default DemoPage;

```

- React 데모의 비동기 카드가 같은 atom을 계속 재사용하고 있어서 새 Promise가 돌지 않았던 거야.
- `createRemoteTodosAtom(version)`을 만들어서 버전마다 새로운 `createAsyncAtom`을 생성하도록 바꿨고, 컴포넌트에서는 이 팩토리를 써서 초기 로드와 새로고침 모두 새 atom을 구독하게 했어.

```209:231:sample-app-react/src/pages/DemoPage.tsx
const AsyncTodosCard = () => {
  const [{ atom, version }, setAsyncState] = useState(() => ({
    atom: createRemoteTodosAtom(0),
    version: 0,
  }));

  const onRefresh = () =>
    setAsyncState((prev) => {
      const nextVersion = prev.version + 1;
      return {
        atom: createRemoteTodosAtom(nextVersion),
        version: nextVersion,
      };
    });
```

- 이제 `데이터 새로고침` 누르면 로딩 → 새로운 버전 데이터가 정상적으로 갱신될 거야.
- 한 번 `npm run dev`로 확인해 보고 문제 있으면 알려줘.

```typescriptreact
const AsyncTodosCard = () => {
  const [{ atom, version }, setAsyncState] = useState(() => ({
    atom: createRemoteTodosAtom(0),
    version: 0,
  }));

  const onRefresh = () =>
    setAsyncState((prev) => {
      const nextVersion = prev.version + 1;
      return {
        atom: createRemoteTodosAtom(nextVersion),
        version: nextVersion,
      };
    });
```

---

**User**

sample-app-vue 의 비동기 Atom 쪽의 렌더링이 카운트되지않고있어

---

**Cursor**

```vue
<script setup lang="ts">
import { onMounted, onUpdated, ref, watch } from "vue";

const props = defineProps<{
  trigger?: number;
}>();

const badgeRef = ref<HTMLSpanElement | null>(null);
let renderCount = 0;

const updateBadge = () => {
  renderCount += 1;
  if (badgeRef.value) {
    badgeRef.value.textContent = `렌더링 ${renderCount}회`;
  }
};

onMounted(updateBadge);

if (props.trigger === undefined) {
  onUpdated(updateBadge);
} else {
  watch(
    () => props.trigger,
    (newVal, oldVal) => {
      if (oldVal !== undefined) {
        updateBadge();
      }
    }
  );
}
</script>

<template>
  <span class="render-badge" ref="badgeRef"></span>
</template>
```

```vue
<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { createAsyncAtom } from "sangtae-js";
import { useAtom } from "sangtae-vue";
import RenderBadge from "@/components/RenderBadge.vue";

interface RemoteTodo {
  id: number;
  title: string;
  description: string;
  completed: boolean;
}

const props = defineProps<{
  version: number;
}>();

const emit = defineEmits<{
  (event: "refresh"): void;
}>();

const REMOTE_TODO_TEMPLATES: Array<Pick<RemoteTodo, "title" | "description">> =
  [
    {
      title: "API 문서 검토",
      description: "README 요약을 확인하고 팀 공유 준비",
    },
    {
      title: "디자인 동기화",
      description: "UI 컴포넌트 상태와 실제 데이터를 비교",
    },
    {
      title: "렌더 카운트 점검",
      description: "변경된 atom이 컴포넌트에 미치는 영향 확인",
    },
    {
      title: "배포 체크리스트",
      description: "build, lint, 테스트 명령어가 모두 통과하는지 확인",
    },
  ];

const loadRemoteTodos = (version: number): Promise<RemoteTodo[]> =>
  new Promise((resolve) => {
    const delay = 600 + ((version % 3) + 1) * 200;
    const startedAt = Date.now();

    setTimeout(() => {
      const now = new Date();
      const generated = REMOTE_TODO_TEMPLATES.map((template, index) => ({
        id: version * 10 + index + 1,
        title: `${template.title} #${version + 1}`,
        description: `${template.description} - ${now.toLocaleTimeString()}`,
        completed: (version + index) % 2 === 0,
      }));

      const elapsed = Date.now() - startedAt;
      resolve(
        generated.map((todo) => ({
          ...todo,
          description: `${todo.description} (응답 ${elapsed}ms)`,
        }))
      );
    }, delay);
  });

const remoteAtom = createAsyncAtom(loadRemoteTodos(props.version));
const [todos, setTodos] = useAtom(remoteAtom);

const isLoading = computed(() => !Array.isArray(todos.value));

const completedCount = computed(() => {
  if (!Array.isArray(todos.value)) return 0;
  return todos.value.filter((todo) => todo.completed).length;
});

const totalCount = computed(() =>
  Array.isArray(todos.value) ? todos.value.length : 0
);

const renderTrigger = ref(0);

watch(
  () => [isLoading.value, todos.value],
  () => {
    renderTrigger.value += 1;
  },
  { immediate: true, deep: true }
);

const onToggleComplete = (id: number) => {
  if (!Array.isArray(todos.value)) return;
  setTodos(
    todos.value.map((todo) =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    )
  );
};

const onCompleteAll = () => {
  if (!Array.isArray(todos.value)) return;
  setTodos(todos.value.map((todo) => ({ ...todo, completed: true })));
};
</script>

<template>
  <article v-if="!isLoading" class="atom-card atom-card--wide async-card">
    <header class="atom-card__header">
      <h3>createAsyncAtom 데모</h3>
      <RenderBadge :trigger="renderTrigger" />
    </header>
    <p class="atom-card__hint">
      Promise를 받아 최초 구독 시 로딩 상태를 노출합니다. 이후에는 `set`을 통해
      비동기 데이터도 즉시 수정할 수 있습니다.
    </p>
    <div class="async-card__stats">
      <span>데이터 버전: v{{ props.version + 1 }}</span>
      <span>완료 {{ completedCount }}/{{ totalCount }}</span>
    </div>
    <ul class="async-card__list">
      <li
        v-for="todo in todos"
        :key="todo.id"
        class="async-card__item"
        :class="{ 'async-card__item--completed': todo.completed }"
      >
        <div class="async-card__item-main">
          <strong>{{ todo.title }}</strong>
          <p>{{ todo.description }}</p>
        </div>
        <button @click="onToggleComplete(todo.id)">
          {{ todo.completed ? "되돌리기" : "완료" }}
        </button>
      </li>
    </ul>
    <div class="atom-card__actions async-card__actions">
      <button @click="emit('refresh')">데이터 새로고침</button>
      <button @click="onCompleteAll">모두 완료 처리</button>
    </div>
  </article>
  <article
    v-else
    class="atom-card atom-card--wide async-card async-card--loading"
  >
    <header class="atom-card__header">
      <h3>createAsyncAtom 데모</h3>
    </header>
    <p class="atom-card__hint">비동기 데이터를 불러오는 중입니다...</p>
  </article>
</template>
```

- Vue 비동기 카드에 렌더 카운트가 안 올라가던 건 `RenderBadge`가 자체 업데이트만 감지해서였어.
- `RenderBadge`에 `trigger` prop을 추가해서 부모가 원하는 시점에 카운트를 갱신하도록 만들고,  
  `AsyncTodosCard`에서 `isLoading`/`todos` 변화를 감지해 `trigger`를 올려주도록 수정했어.
- 이제 로딩 완료, 새로고침, 완료 토글마다 뱃지가 정상적으로 증가해.

`sample-app-vue`에서 `npm run dev`로 다시 확인해봐. render 배지가 올바르게 증가할 거야.

---

**User**

수정한 영역이 해당 프로젝트의 다른 데모기능에 영향이 있는지도 확인해줄럐?

---

**Cursor**

다른 데모 카드들도 영향 없는지 빠르게 훑어봤어.

- React 쪽은 `createRemoteTodosAtom()` 팩토리만 추가됐고 나머지 atom/컴포넌트 의존성이 그대로라 기존 카운터·파생·수동 구독 카드 동작에는 변화 없어.
- Vue 쪽은 `RenderBadge`에 `trigger` 옵션이 생겼지만 기본값으로 쓰면 예전처럼 `onUpdated`에서 카운트가 올라가니까 다른 카드들은 기존 구현 그대로 잘 돌고 있어. 비동기 카드만 `:trigger` 넘겨서 추가 렌더를 잡아주고.

추가 테스트는 못 돌렸으니까 한 번 `sample-app-react`랑 `sample-app-vue` 각각 `npm run dev` 돌려서 전체 페이지가 예전처럼 잘 뜨는지만 확인해줘.
