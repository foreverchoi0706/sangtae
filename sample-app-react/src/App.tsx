import { Suspense, useEffect, useRef, useState, type FC } from "react";
import "@/App.css";
import { $a, $b, $c, $gender, $posts, type Post } from "@/stores/posts";
import useAtom from "@/hooks/useAtom";
import logo from "@/assets/react.svg";
import { flushSync } from "react-dom";
import { createAtom, get, set, subscribe } from "sangtae-js";

const UserItem: FC<{
  post: Post;
  onEdit: (id: number, postTitle: Post["title"]) => void;
  onDelete: (id: number) => void;
}> = ({ post, onEdit, onDelete }) => {
  const [gender, setGender] = useAtom($gender);
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
            onChange={(e) => setEditValue(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter") onSaveClick();
              if (e.key === "Escape") onCancelClick();
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
          <span
            className="post-name"
            onClick={() => setGender(gender === "M" ? "F" : "M")}
          >
            {gender}:{post.title}
          </span>
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

const UserList = () => {
  const [posts, setPosts] = useAtom($posts);
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

  useEffect(() => {
    const a = { id: 1 };
    const atom = createAtom(a);

    a.id = 2;
    subscribe(atom, () => {
      console.log(get(atom));
    });
    set(atom, a);
  }, []);

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

const App = () => {
  const [a, setA] = useAtom($a);
  const [b, setB] = useAtom($b);
  const [c, setC] = useAtom($c);

  return (
    <main>
      <header className="header">
        <img src={logo} alt="logo" className="logo" />
        <h1>SAMPLE APP REACT</h1>
      </header>
      <div>{a}</div>
      <div>{b}</div>
      <div>{c}</div>
      <button onClick={() => setA(a + "AAAA")}>setA</button>
      <button onClick={() => setB(b + "BBBB")}>setB</button>
      <button onClick={() => setC(c + "CCCC")}>setC</button>
      <button
        onClick={() => {
          flushSync(() => {
            setA("AAAA");
            setB("BBBB");
          });
          setC("CCCC");
        }}
      >
        SET ALL
      </button>
      <Suspense fallback={<div className="loading">LOADING...</div>}>
        <UserList />
      </Suspense>
    </main>
  );
};

export default App;
