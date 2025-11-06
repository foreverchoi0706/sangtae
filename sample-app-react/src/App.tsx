import { useState, type FC } from "react";
import "@/App.css";
import { $gender, $posts, type Post } from "@/stores/posts";
import useAtom from "@/hooks/useAtom";
import logo from "@/assets/react.svg";

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
    <li className="user-item">
      {isEditing ? (
        <div className="user-edit">
          <input
            type="text"
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === "Enter") onSaveClick();
              if (e.key === "Escape") onCancelClick();
            }}
            className="user-edit-input"
            autoFocus
          />
          <button onClick={onSaveClick} className="user-save-btn">
            저장
          </button>
          <button onClick={onCancelClick} className="user-cancel-btn">
            취소
          </button>
        </div>
      ) : (
        <>
          <span
            className="user-name"
            onDoubleClick={() => setIsEditing(true)}
            onClick={() => setGender(gender === "M" ? "F" : "M")}
          >
            {gender}:{post.title}
          </span>
          <div className="user-actions">
            <button
              onClick={() => setIsEditing(true)}
              className="user-edit-btn"
            >
              수정
            </button>
            <button
              onClick={() => onDelete(post.id)}
              className="user-delete-btn"
            >
              삭제
            </button>
          </div>
        </>
      )}
    </li>
  );
};

const App = () => {
  const [posts, setPosts] = useAtom($posts);
  const [inputValue, setInputValue] = useState("");

  console.log(123);

  // Create - User 추가
  const handleAdd = () => {
    if (inputValue.trim() === "") return;

    const newPost = {
      id: posts.length > 0 ? Math.max(...posts.map((p) => p.id)) + 1 : 1,
      title: inputValue.trim(),
      body: "body",
      userId: 1,
    };

    setPosts([...posts, newPost]);
    setInputValue("");
  };

  // Update - User 이름 수정
  const handleEdit = (id: number, newName: string) => {
    if (newName.trim() === "") return;

    setPosts(
      posts.map((post) =>
        post.id === id ? { ...post, title: newName.trim() } : post
      )
    );
  };

  // Delete - User 삭제
  const handleDelete = (id: number) => {
    setPosts(posts.filter((post) => post.id !== id));
  };

  return (
    <main>
      <img src={logo} alt="logo" className="logo" />
      <h1>Users List</h1>

      {/* Create */}
      <div className="user-input">
        <input
          type="text"
          value={inputValue}
          onChange={({ target }) => setInputValue(target.value)}
          onKeyDown={({ key }) => key === "Enter" && handleAdd()}
          placeholder="사용자 이름을 입력하세요..."
          className="user-input-field"
        />
        <button onClick={handleAdd} className="user-add-btn">
          추가
        </button>
      </div>

      {/* Read */}
      <ul className="user-list">
        {posts.length === 0 ? (
          <li className="user-empty">사용자가 없습니다.</li>
        ) : (
          posts.map((post) => (
            <UserItem
              key={post.id}
              post={post}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))
        )}
      </ul>

      {posts.length > 0 && (
        <div className="user-stats">전체: {posts.length}개</div>
      )}
    </main>
  );
};

export default App;
