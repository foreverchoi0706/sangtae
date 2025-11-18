# 서버-클라이언트 동기화: 같은 Atom 재사용이 중요한 경우

## 문제 상황 이해하기

### ❌ Key 없이 하면 생기는 문제

```typescript
// 🖥️ 서버 (Next.js getServerSideProps)
export async function getServerSideProps() {
  // 서버에서 atom 생성
  const userAtom = createAtom({ name: "서버 사용자", id: 1 });

  // DB에서 데이터 가져오기
  const userData = await fetchUserFromDB();
  set(userAtom, userData);

  // 직렬화해서 클라이언트로 전송
  return {
    props: {
      userData: get(userAtom), // { name: "서버 사용자", id: 1 }
    },
  };
}

// 💻 클라이언트 컴포넌트
function UserPage({ userData }) {
  // 서버에서 받은 데이터로 새 atom 생성
  const userAtom = createAtom(userData); // ⚠️ 새로운 atom!

  const [user, setUser] = useAtom(userAtom);

  // 사용자가 이름 변경
  const handleChange = () => {
    setUser({ ...user, name: "변경된 이름" });
    // API 호출
    fetch("/api/user", {
      method: "PUT",
      body: JSON.stringify(user),
    });
  };

  return <div>{user.name}</div>;
}
```

**문제점:**

- 서버에서 만든 atom과 클라이언트에서 만든 atom이 **다른 객체**
- 다른 컴포넌트에서 같은 atom을 사용하려면 **props로 전달**해야 함
- 여러 컴포넌트가 각자 atom을 만들면 **상태가 분리**됨

---

## ✅ Key를 사용하면 해결되는 경우

### 예시 1: 여러 컴포넌트가 같은 사용자 정보 공유

```typescript
// 🖥️ 서버 (Next.js)
export async function getServerSideProps() {
  const userAtom = createAtom(null, "user"); // key: "user"

  const userData = await fetchUserFromDB();
  set(userAtom, userData);

  return {
    props: {
      userData: serializeAtom(userAtom, "user"),
    },
  };
}

// 💻 클라이언트 - 컴포넌트 A
function UserProfile({ userData }) {
  // 같은 key로 atom 복원 → 같은 atom 객체!
  const userAtom = deserializeAtom(userData); // key: "user"
  const [user] = useAtom(userAtom);

  return <div>프로필: {user.name}</div>;
}

// 💻 클라이언트 - 컴포넌트 B (다른 파일)
function UserMenu() {
  // 같은 key로 atom 찾기 → 같은 atom 객체!
  const userAtom = getAtomByKey("user"); // 같은 atom!
  const [user] = useAtom(userAtom);

  return <div>메뉴: {user.name}</div>;
}

// 💻 클라이언트 - 컴포넌트 C (또 다른 파일)
function UserSettings() {
  const userAtom = getAtomByKey("user"); // 같은 atom!
  const [user, setUser] = useAtom(userAtom);

  const handleSave = () => {
    setUser({ ...user, name: "변경된 이름" });
    // 컴포넌트 A, B도 자동으로 업데이트됨!
  };

  return <button onClick={handleSave}>저장</button>;
}
```

**장점:**

- ✅ 여러 컴포넌트가 **같은 atom 객체**를 공유
- ✅ 한 곳에서 변경하면 **모든 곳이 자동 업데이트**
- ✅ Props drilling 불필요

---

### 예시 2: 실시간 협업 (여러 사용자가 같은 데이터 편집)

```typescript
// 🖥️ 서버 (WebSocket 서버)
const serverAtoms = new Map();

// 클라이언트 A가 연결
ws.on("connection", (clientA) => {
  const documentAtom = createAtom("초기 문서 내용", "document-123");
  serverAtoms.set("document-123", documentAtom);

  // 클라이언트 A에게 전송
  clientA.send({
    type: "atom-init",
    key: "document-123",
    value: serializeAtom(documentAtom, "document-123"),
  });
});

// 클라이언트 A가 문서 수정
ws.on("message", (client, message) => {
  if (message.type === "update") {
    const atom = serverAtoms.get(message.key);
    set(atom, message.value);

    // 다른 모든 클라이언트에게 브로드캐스트
    broadcast({
      type: "atom-update",
      key: message.key,
      value: message.value,
    });
  }
});

// 💻 클라이언트 A
const documentAtom = deserializeAtom(serverData); // key: "document-123"
const [doc, setDoc] = useAtom(documentAtom);

const handleChange = (newText) => {
  setDoc(newText);

  // 서버에 전송
  ws.send({
    type: "update",
    key: "document-123",
    value: newText,
  });
};

// 💻 클라이언트 B (다른 사용자)
// 서버에서 브로드캐스트 받음
ws.on("message", (message) => {
  if (message.type === "atom-update") {
    // 같은 key로 atom 찾기
    const atom = getAtomByKey(message.key); // "document-123"
    set(atom, message.value); // 자동으로 UI 업데이트됨!
  }
});
```

**핵심:**

- 여러 클라이언트가 **같은 key**로 atom을 찾음
- 서버에서 업데이트하면 **모든 클라이언트가 자동 동기화**

---

### 예시 3: SSR + 클라이언트 하이드레이션

```typescript
// 🖥️ 서버 렌더링 (Next.js)
export async function getServerSideProps() {
  // 서버에서 atom 생성 (key 있음)
  const cartAtom = createAtom([], "cart");
  const userAtom = createAtom(null, "user");

  // 서버에서만 할 수 있는 작업
  const cart = await getCartFromDB();
  const user = await getUserFromDB();

  set(cartAtom, cart);
  set(userAtom, user);

  return {
    props: {
      atoms: {
        cart: serializeAtom(cartAtom, "cart"),
        user: serializeAtom(userAtom, "user"),
      },
    },
  };
}

// 💻 클라이언트 - _app.tsx
function App({ Component, pageProps }) {
  // 서버에서 받은 atom 데이터를 전역에 저장
  if (typeof window !== "undefined" && pageProps.atoms) {
    window.__ATOM_DATA__ = pageProps.atoms;
  }

  return <Component {...pageProps} />;
}

// 💻 클라이언트 - 페이지 컴포넌트
function CartPage({ atoms }) {
  // 같은 key로 atom 복원 → 서버와 같은 atom!
  const cartAtom = deserializeAtom(atoms.cart); // key: "cart"
  const [cart, setCart] = useAtom(cartAtom);

  // 다른 컴포넌트에서도 같은 atom 사용 가능
  return (
    <div>
      <CartList cart={cart} />
      <CartSummary cart={cart} />
      <AddToCartButton
        onAdd={(item) => {
          setCart([...cart, item]);
          // CartList, CartSummary도 자동 업데이트!
        }}
      />
    </div>
  );
}

// 💻 클라이언트 - 다른 페이지 컴포넌트
function CheckoutPage() {
  // 같은 key로 atom 찾기 → 같은 atom!
  const cartAtom = getAtomByKey("cart");
  const [cart] = useAtom(cartAtom);

  // CartPage에서 추가한 상품이 여기서도 보임!
  return <div>총 {cart.length}개 상품</div>;
}
```

**핵심:**

- 서버에서 만든 atom과 클라이언트에서 복원한 atom이 **같은 객체**
- 여러 페이지/컴포넌트가 **같은 atom 공유**
- Props로 전달할 필요 없음

---

## 🔍 Key 없이 하면 생기는 문제

### 문제 1: 상태 분리

```typescript
// ❌ Key 없이
// 서버
const serverAtom = createAtom({ name: "서버" });

// 클라이언트 A
const clientAtomA = createAtom(serverData); // 새로운 atom!

// 클라이언트 B
const clientAtomB = createAtom(serverData); // 또 다른 새로운 atom!

// clientAtomA !== clientAtomB
// A에서 변경해도 B는 모름!
```

### 문제 2: Props Drilling

```typescript
// ❌ Key 없이 - Props로 전달해야 함
function App({ userData }) {
  const userAtom = createAtom(userData);
  return <Page userAtom={userAtom} />;
}

function Page({ userAtom }) {
  return <Header userAtom={userAtom} />;
}

function Header({ userAtom }) {
  return <Menu userAtom={userAtom} />;
}

function Menu({ userAtom }) {
  const [user] = useAtom(userAtom);
  return <div>{user.name}</div>;
}
```

```typescript
// ✅ Key 있이 - Props 불필요
function App({ userData }) {
  deserializeAtom(userData); // 전역에 등록
  return <Page />;
}

function Page() {
  return <Header />;
}

function Header() {
  return <Menu />;
}

function Menu() {
  const userAtom = getAtomByKey("user"); // 어디서든 접근 가능!
  const [user] = useAtom(userAtom);
  return <div>{user.name}</div>;
}
```

---

## 🎯 실제 사용 케이스

### 케이스 1: 쇼핑몰 장바구니

```typescript
// 🖥️ 서버: 사용자 로그인 시 장바구니 불러오기
const cartAtom = createAtom([], `cart-${userId}`);

// 💻 클라이언트: 여러 페이지에서 같은 장바구니 사용
// - 상품 목록 페이지: 장바구니에 추가
// - 장바구니 페이지: 장바구니 목록 표시
// - 체크아웃 페이지: 장바구니 총액 계산

// 모든 페이지가 같은 key로 atom 찾기
const cartAtom = getAtomByKey(`cart-${userId}`);
// 한 페이지에서 추가하면 다른 페이지도 자동 업데이트!
```

### 케이스 2: 실시간 채팅

```typescript
// 🖥️ 서버: 채팅방별 atom 관리
const messagesAtom = createAtom([], `messages-${roomId}`);

// 💻 클라이언트: 여러 컴포넌트가 같은 메시지 목록 공유
// - 메시지 리스트 컴포넌트
// - 메시지 입력 컴포넌트
// - 읽지 않은 메시지 카운트 컴포넌트

// 모두 같은 key로 atom 찾기
const messagesAtom = getAtomByKey(`messages-${roomId}`);
// 새 메시지가 오면 모든 컴포넌트가 자동 업데이트!
```

### 케이스 3: 다중 탭 동기화

```typescript
// 💻 브라우저 탭 A
const settingsAtom = createAtom({ theme: "dark" }, "settings");
set(settingsAtom, { theme: "light" });

// LocalStorage에 저장
localStorage.setItem(
  "settings",
  JSON.stringify({
    key: "settings",
    value: get(settingsAtom),
  })
);

// 💻 브라우저 탭 B (같은 사이트)
// LocalStorage 변경 감지
window.addEventListener("storage", (e) => {
  if (e.key === "settings") {
    const data = JSON.parse(e.newValue);
    const atom = getAtomByKey(data.key); // 같은 atom!
    set(atom, data.value); // 탭 A의 변경사항 반영
  }
});
```

---

## 📊 비교표

| 상황                           | Key 없이                       | Key 있이                          |
| ------------------------------ | ------------------------------ | --------------------------------- |
| 여러 컴포넌트가 같은 상태 공유 | Props drilling 필요            | `getAtomByKey()`로 바로 접근      |
| 서버-클라이언트 동기화         | 새 atom 생성 (상태 분리)       | 같은 atom 재사용 (상태 공유)      |
| 실시간 협업                    | 각자 atom 생성 (동기화 어려움) | 같은 key로 동기화 (자동 업데이트) |
| 다중 탭 동기화                 | 복잡한 이벤트 처리             | 같은 key로 간단히 동기화          |

---

## 결론

**Key가 중요한 경우:**

1. ✅ 여러 컴포넌트/페이지가 **같은 atom을 공유**해야 할 때
2. ✅ 서버에서 만든 atom을 클라이언트에서 **재사용**해야 할 때
3. ✅ 실시간 협업처럼 **여러 클라이언트가 동기화**해야 할 때
4. ✅ Props drilling을 피하고 싶을 때

**하지만:**

- 단순한 앱에서는 export/import로 충분함
- Key는 복잡한 앱이나 SSR/실시간 협업이 필요할 때만 유용함
