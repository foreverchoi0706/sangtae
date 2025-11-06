import { useState, type FC } from "react";
import "@/App.css";
import { $gender, $users, type User } from "@/stores/users";
import useAtom from "@/hooks/useAtom";
import logo from "@/assets/react.svg";

const UserItem: FC<{
  user: User;
  onEdit: (id: number, userName: User["name"]) => void;
  onDelete: (id: number) => void;
}> = ({ user, onEdit, onDelete }) => {
  const [gender, setGender] = useAtom($gender);

  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [editValue, setEditValue] = useState<User["name"]>(user.name);

  const onSaveClick = () => {
    if (editValue.trim() !== "") {
      onEdit(user.id, editValue.trim());
      setIsEditing(false);
    }
  };

  const onCancelClick = () => {
    setEditValue(user.name);
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
            {gender}:{user.name}
          </span>
          <div className="user-actions">
            <button
              onClick={() => setIsEditing(true)}
              className="user-edit-btn"
            >
              수정
            </button>
            <button
              onClick={() => onDelete(user.id)}
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
  const [users, setUsers] = useAtom($users);
  const [inputValue, setInputValue] = useState("");

  console.log(123);

  // Create - User 추가
  const handleAdd = () => {
    if (inputValue.trim() === "") return;

    const newUser = {
      id: users.length > 0 ? Math.max(...users.map((u) => u.id)) + 1 : 1,
      name: inputValue.trim(),
    };

    setUsers([...users, newUser]);
    setInputValue("");
  };

  // Update - User 이름 수정
  const handleEdit = (id: number, newName: string) => {
    if (newName.trim() === "") return;

    setUsers(
      users.map((user) =>
        user.id === id ? { ...user, name: newName.trim() } : user
      )
    );
  };

  // Delete - User 삭제
  const handleDelete = (id: number) => {
    setUsers(users.filter((user) => user.id !== id));
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
        {users.length === 0 ? (
          <li className="user-empty">사용자가 없습니다.</li>
        ) : (
          users.map((user) => (
            <UserItem
              key={user.id}
              user={user}
              onEdit={handleEdit}
              onDelete={handleDelete}
            />
          ))
        )}
      </ul>

      {users.length > 0 && (
        <div className="user-stats">전체: {users.length}명</div>
      )}
    </main>
  );
};

export default App;
