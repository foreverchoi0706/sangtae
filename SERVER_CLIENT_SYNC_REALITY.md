# 서버-클라이언트 Atom 동기화의 현실 🎯

## 핵심 사실: 서버와 클라이언트는 분리되어 있음

### ❌ 동기화 안 되는 이유

```typescript
// 🖥️ 서버 (Node.js 프로세스)
const serverAtom = createAtom({ name: "서버" }, "user");
// 서버의 메모리에 있는 atom 객체

// 클라이언트로 직렬화해서 전송
const serialized = serializeAtom(serverAtom, "user");
res.json(serialized); // { value: { name: "서버" }, key: "user" }

// 💻 클라이언트 (브라우저 프로세스)
const clientData = await fetch("/api/user").then((r) => r.json());
const clientAtom = deserializeAtom(clientData); // 새로운 atom 객체!

// 클라이언트에서 값 변경
set(clientAtom, { name: "클라이언트" });

// ❌ 서버의 atom은 변경되지 않음!
// 서버와 클라이언트는 완전히 다른 프로세스이기 때문
```

**핵심:**

- 서버 = Node.js 프로세스 (메모리 A)
- 클라이언트 = 브라우저 프로세스 (메모리 B)
- **완전히 분리된 메모리 공간!**

---

## 🔍 실제 동작 방식

### 1. 서버에서 atom 생성

```typescript
// 🖥️ 서버 (Next.js API Route)
export async function GET() {
  const userAtom = createAtom({ name: "서버 사용자" }, "user");

  // 직렬화 (값만 전송)
  return Response.json({
    value: get(userAtom), // { name: "서버 사용자" }
    key: "user",
  });
}
```

**서버 메모리:**

```
userAtom (서버) → { name: "서버 사용자" }
```

### 2. 클라이언트에서 atom 복원

```typescript
// 💻 클라이언트
const response = await fetch("/api/user");
const { value, key } = await response.json();

// 새로운 atom 생성 (클라이언트 메모리에)
const clientAtom = createAtom(value, key);
// 또는 deserializeAtom({ value, key })
```

**클라이언트 메모리:**

```
clientAtom (클라이언트) → { name: "서버 사용자" }
```

**중요:** 서버의 atom과 클라이언트의 atom은 **완전히 다른 객체**!

### 3. 클라이언트에서 값 변경

```typescript
// 💻 클라이언트
set(clientAtom, { name: "변경된 이름" });
```

**클라이언트 메모리:**

```
clientAtom (클라이언트) → { name: "변경된 이름" } ✅ 변경됨
```

**서버 메모리:**

```
userAtom (서버) → { name: "서버 사용자" } ❌ 변경 안 됨!
```

---

## ✅ 서버-클라이언트 동기화가 필요한 경우

### 방법 1: API 호출로 서버에 알리기

```typescript
// 💻 클라이언트
const [user, setUser] = useAtom(userAtom);

const handleUpdate = async (newUser) => {
  // 1. 클라이언트 atom 업데이트 (즉시 UI 반영)
  setUser(newUser);

  // 2. 서버에 API 호출 (서버 DB 업데이트)
  await fetch("/api/user", {
    method: "PUT",
    body: JSON.stringify(newUser),
  });

  // 3. 서버 응답으로 최신 데이터 받아서 다시 동기화
  const response = await fetch("/api/user");
  const latestUser = await response.json();
  setUser(latestUser); // 서버에서 확인된 최신 데이터로 업데이트
};
```

**흐름:**

1. 클라이언트에서 즉시 업데이트 (낙관적 업데이트)
2. 서버에 API 호출
3. 서버 응답으로 최종 동기화

---

### 방법 2: WebSocket으로 실시간 동기화

```typescript
// 🖥️ 서버 (WebSocket)
const serverAtoms = new Map<string, Atom<any>>();

ws.on("connection", (client) => {
  // 클라이언트 연결 시 atom 생성
  const userAtom = createAtom({ name: "초기값" }, "user");
  serverAtoms.set("user", userAtom);

  // 클라이언트에 초기값 전송
  client.send({
    type: "atom-init",
    key: "user",
    value: get(userAtom),
  });
});

// 클라이언트에서 업데이트 요청 받기
ws.on("message", (client, message) => {
  if (message.type === "atom-update") {
    const atom = serverAtoms.get(message.key);
    set(atom, message.value); // 서버 atom 업데이트

    // 다른 모든 클라이언트에게 브로드캐스트
    broadcast({
      type: "atom-update",
      key: message.key,
      value: message.value,
    });
  }
});

// 💻 클라이언트
const ws = new WebSocket("ws://localhost:3001");
const userAtom = createAtom(null, "user");

// 서버에서 초기값 받기
ws.onmessage = (event) => {
  const msg = JSON.parse(event.data);

  if (msg.type === "atom-init") {
    set(userAtom, msg.value);
  }

  if (msg.type === "atom-update") {
    set(userAtom, msg.value); // 다른 클라이언트의 변경사항 반영
  }
};

// 클라이언트에서 값 변경
const handleUpdate = (newUser) => {
  // 1. 클라이언트 atom 업데이트
  set(userAtom, newUser);

  // 2. 서버에 WebSocket으로 전송
  ws.send({
    type: "atom-update",
    key: "user",
    value: newUser,
  });

  // 3. 서버가 다른 클라이언트들에게 브로드캐스트
  // → 다른 클라이언트들도 자동 업데이트됨
};
```

**흐름:**

1. 클라이언트에서 atom 업데이트
2. WebSocket으로 서버에 전송
3. 서버에서 atom 업데이트
4. 서버가 다른 클라이언트들에게 브로드캐스트
5. 모든 클라이언트가 동기화됨

---

### 방법 3: Server Actions (Next.js 13+)

```typescript
// 🖥️ 서버 (Next.js Server Action)
"use server";

import { createAtom, get, set } from "sangtae-js";

// 서버에서 atom 관리 (세션별로)
const serverAtoms = new Map<string, Atom<any>>();

export async function getUserAtom(userId: string) {
  if (!serverAtoms.has(userId)) {
    const atom = createAtom(null, `user-${userId}`);
    const userData = await fetchUserFromDB(userId);
    set(atom, userData);
    serverAtoms.set(userId, atom);
  }

  return get(serverAtoms.get(userId)!);
}

export async function updateUser(userId: string, newUser: any) {
  const atom = serverAtoms.get(`user-${userId}`);
  if (atom) {
    set(atom, newUser);
    await saveUserToDB(userId, newUser);
  }
}

// 💻 클라이언트
("use client");

import { updateUser } from "./actions";

function UserProfile({ initialUser }) {
  const userAtom = createAtom(initialUser, "user");
  const [user, setUser] = useAtom(userAtom);

  const handleUpdate = async (newUser) => {
    // 1. 클라이언트 atom 업데이트
    setUser(newUser);

    // 2. Server Action 호출 (서버 atom도 업데이트됨)
    await updateUser(userId, newUser);
  };

  return <div>{user.name}</div>;
}
```

**주의:** Server Action도 결국 API 호출이야. 서버의 atom과 클라이언트의 atom은 여전히 분리되어 있어.

---

## 🎯 Key의 실제 역할

### Key는 클라이언트 내에서만 유용함

```typescript
// 💻 클라이언트 A (컴포넌트 1)
const userAtom = getAtomByKey("user");
const [user, setUser] = useAtom(userAtom);

// 💻 클라이언트 A (컴포넌트 2)
const userAtom = getAtomByKey("user"); // 같은 atom!
const [user] = useAtom(userAtom);

// 컴포넌트 1에서 변경하면 컴포넌트 2도 자동 업데이트 ✅
```

**Key의 역할:**

- ✅ **같은 클라이언트 내**에서 여러 컴포넌트가 같은 atom 공유
- ❌ **서버와 클라이언트 간** 동기화는 안 됨 (별도 프로세스)

---

## 📊 정리

### 서버-클라이언트 동기화 방법

| 방법               | 설명                       | 동기화 방식                       |
| ------------------ | -------------------------- | --------------------------------- |
| **API 호출**       | REST/GraphQL로 서버에 알림 | 수동 동기화 (API 호출 필요)       |
| **WebSocket**      | 실시간 양방향 통신         | 자동 동기화 (서버가 브로드캐스트) |
| **Server Actions** | Next.js의 서버 함수        | 수동 동기화 (함수 호출 필요)      |

### Key의 역할

| 범위                  | Key 역할                       | 동기화 여부                    |
| --------------------- | ------------------------------ | ------------------------------ |
| **클라이언트 내**     | 여러 컴포넌트가 같은 atom 공유 | ✅ 자동                        |
| **서버 ↔ 클라이언트** | 서로 다른 프로세스             | ❌ 불가능 (API/WebSocket 필요) |

---

## 결론

**질문: 클라이언트에서 set으로 값을 변경하면 서버의 값도 동기화 안 되는 거지?**

**답: 맞아!**

- 서버와 클라이언트는 **완전히 다른 프로세스**
- 클라이언트에서 atom을 변경해도 **서버의 atom은 변경되지 않음**
- 서버-클라이언트 동기화가 필요하면:
  1. **API 호출**로 서버에 알리기
  2. **WebSocket**으로 실시간 동기화
  3. **Server Actions**로 서버 함수 호출

**Key는 클라이언트 내에서만 유용해!** 서버와 클라이언트 간 동기화는 별도의 통신 메커니즘이 필요해.
