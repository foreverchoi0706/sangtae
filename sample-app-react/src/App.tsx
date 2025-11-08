import { Suspense, useRef, useState, useMemo, type FC } from "react";
import { Routes, Route, Link, useParams, useNavigate } from "react-router-dom";
import "@/App.css";
import useAtom from "@/hooks/useAtom";
import logo from "@/assets/react.svg";
import { createAsyncAtom } from "sangtae-js";
import { type Post, getPost, getPosts } from "./apis";

const UserItem: FC<{
  post: Post;
  onEdit: (id: number, postTitle: Post["title"]) => void;
  onDelete: (id: number) => void;
}> = ({ post, onEdit, onDelete }) => {
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editValue, setEditValue] = useState<Post["title"]>(post.title);

  const onSaveClick = () => {
    if (editValue.trim() !== "") {
      onEdit(post.id, editValue.trim());
      setIsEditing(false);
    }
  };

  const onCancelClick = () => {
    setEditValue(post.title);
    setIsEditing(false);
  };

  return (
    <li className="post-item">
      {isEditing ? (
        <div className="post-edit">
          <input
            type="text"
            value={editValue}
            onChange={({ target }) => setEditValue(target.value)}
            onKeyDown={({ key }) => {
              if (key === "Enter") onSaveClick();
              if (key === "Escape") onCancelClick();
            }}
            className="post-edit-input"
            autoFocus
          />
          <button onClick={onSaveClick} className="post-save-btn">
            저장
          </button>
          <button onClick={onCancelClick} className="post-cancel-btn">
            취소
          </button>
        </div>
      ) : (
        <>
          <Link to={`/post/${post.id}`} className="post-name">
            {post.title}
          </Link>
          <div className="post-actions">
            <button
              onClick={() => setIsEditing(true)}
              className="post-edit-btn"
            >
              수정
            </button>
            <button
              onClick={() => onDelete(post.id)}
              className="post-delete-btn"
            >
              삭제
            </button>
          </div>
        </>
      )}
    </li>
  );
};

const HomePage = () => {
  console.log("USER LIST RENDER");
  const [posts, setPosts] = useAtom(createAsyncAtom<Post[]>(getPosts()));
  const [inputValue, setInputValue] = useState<Post["title"]>("");
  const listRef = useRef<HTMLUListElement>(null);

  const onAddClick = () => {
    if (inputValue.trim() === "") return;

    const newPost = {
      id: posts.length > 0 ? Math.max(...posts.map((p) => p.id)) + 1 : 1,
      title: inputValue.trim(),
      body: "body",
      userId: 1,
    };

    setPosts([newPost, ...posts]);
    setInputValue("");
    listRef.current?.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const onEditClick = (id: number, newName: string) => {
    if (newName.trim() === "") return;

    setPosts(
      posts.map((post) =>
        post.id === id ? { ...post, title: newName.trim() } : post
      )
    );
  };

  const onDeleteClick = (id: number) => {
    setPosts(posts.filter((post) => post.id !== id));
  };

  return (
    <>
      <div className="post-input">
        <input
          type="text"
          value={inputValue}
          onChange={({ target }) => setInputValue(target.value)}
          onKeyDown={({ key }) => key === "Enter" && onAddClick()}
          placeholder="사용자 이름을 입력하세요..."
          className="post-input-field"
        />
        <button onClick={onAddClick} className="post-add-btn">
          추가
        </button>
      </div>
      <ul className="post-list" ref={listRef}>
        {posts.map((post) => (
          <UserItem
            key={post.id}
            post={post}
            onEdit={onEditClick}
            onDelete={onDeleteClick}
          />
        ))}
      </ul>
      {posts.length > 0 && (
        <div className="post-stats">전체: {posts.length}개</div>
      )}
    </>
  );
};

const PostPage = () => {
  console.log("POST PAGE RENDER");
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const postAtom = useMemo(
    () => createAsyncAtom<Post>(getPost(Number(id!))),
    [id]
  );
  const [post] = useAtom(postAtom);

  console.log(post);

  if (!post) {
    return (
      <div className="post-detail">
        <h2>포스트를 찾을 수 없습니다</h2>
        <button onClick={() => navigate("/")} className="post-back-btn">
          목록으로 돌아가기
        </button>
      </div>
    );
  }

  return (
    <div className="post-detail">
      <button onClick={() => navigate("/")} className="post-back-btn">
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

const App = () => {
  return (
    <main>
      <header className="header">
        <Link to="/" className="header-link">
          <img src={logo} alt="logo" className="logo" />
          <h1>SAMPLE APP REACT</h1>
        </Link>
      </header>
      <Routes>
        <Route
          path="/"
          element={
            <Suspense fallback={<div className="loading">LOADING...</div>}>
              <HomePage />
            </Suspense>
          }
        />
        <Route
          path="/post/:id"
          element={
            <Suspense fallback={<div className="loading">LOADING...</div>}>
              <PostPage />
            </Suspense>
          }
        />
      </Routes>
    </main>
  );
};

export default App;
