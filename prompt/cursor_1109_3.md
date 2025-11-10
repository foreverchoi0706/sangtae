# Handling infinite re-renders in App
_Exported on 2025. 11. 9. at 21시 37분 10초 GMT+9 from Cursor (2.0.69)_

---

**User**

@index.ts (1-39) 

export const $posts = createAsyncAtom<Post[]>(getPosts());

이부분 여기서 호출해서 App에서 import 하면 한번만 렌더링 쟐 되는데

직접 App에서 호출하면 무한 리렌더링이 발생하고있어 

---

**Cursor**

관련 파일 확인 중.


원인 확인 중. `useAtom` 훅 구현도 확인 중.


원인은 다음과 같아:

## 문제 원인

`createAsyncAtom`은 `WeakMap`으로 같은 Promise에 대해 같은 atom을 반환해. 차이점은:

1. 모듈 레벨에서 호출 (`apis/index.ts`):
   - `getPosts()`가 모듈 로드 시 한 번만 호출됨
   - 같은 Promise 인스턴스가 캐시되어 같은 atom 반환
   - 한 번만 렌더링됨

2. 컴포넌트 내부에서 직접 호출:
   - 매 렌더링마다 `getPosts()`가 호출되어 새로운 Promise 인스턴스 생성
   - `WeakMap`의 키가 Promise이므로 새로운 Promise = 새로운 atom
   - `useAtom`의 `useCallback`에서 `atom`이 의존성이라 atom이 바뀔 때마다 새로운 subscribe 함수 생성
   - 무한 리렌더링 발생

## 해결 방법

컴포넌트 내부에서 사용해야 한다면, Promise를 `useMemo`로 메모이제이션해야 해:

```typescript
// ❌ 잘못된 방법 (무한 리렌더링)
const [posts] = useAtom(createAsyncAtom(getPosts()));

// ✅ 올바른 방법 1: Promise를 메모이제이션
const postsPromise = useMemo(() => getPosts(), []);
const [posts] = useAtom(createAsyncAtom(postsPromise));

// ✅ 올바른 방법 2: 모듈 레벨에서 atom 생성 (현재 방식 - 가장 좋음)
// apis/index.ts에서 export const $posts = createAsyncAtom(getPosts());
const [posts] = useAtom($posts);
```

`PostPage`에서는 `useMemo`로 `id`가 바뀔 때만 새로운 Promise를 생성하도록 했어:

```150:153:sample-app-react/src/App.tsx
  const postAtom = useMemo(
    () => createAsyncAtom<Post>(getPost(Number(id!))),
    [id]
  );
```

결론: 모듈 레벨에서 atom을 생성하는 현재 방식이 가장 좋아. 컴포넌트 내부에서 생성해야 한다면 Promise를 `useMemo`로 메모이제이션해야 해.

```typescript
// ❌ 잘못된 방법 (무한 리렌더링)
const [posts] = useAtom(createAsyncAtom(getPosts()));

// ✅ 올바른 방법 1: Promise를 메모이제이션
const postsPromise = useMemo(() => getPosts(), []);
const [posts] = useAtom(createAsyncAtom(postsPromise));

// ✅ 올바른 방법 2: 모듈 레벨에서 atom 생성 (현재 방식 - 가장 좋음)
// apis/index.ts에서 export const $posts = createAsyncAtom(getPosts());
const [posts] = useAtom($posts);
```

```typescriptreact
  const postAtom = useMemo(
    () => createAsyncAtom<Post>(getPost(Number(id!))),
    [id]
  );
```

---

**User**

음... 그래ㅑ도 컴포넌트 내부에서 호출하고 싶은데 매 렌더링마다 Pomise를 유지시키는 방법이 없을까?

---

**Cursor**

컴포넌트 내부에서 Promise를 유지하는 방법 확인 중.


컴포넌트 내부에서 Promise를 유지하는 방법:

## 방법 1: `useMemo`로 Promise 메모이제이션 (추천)

```typescript
const HomePage = () => {
  // Promise를 useMemo로 메모이제이션
  const postsPromise = useMemo(() => getPosts(), []);
  const postsAtom = useMemo(() => createAsyncAtom(postsPromise), [postsPromise]);
  const [posts, setPosts] = useAtom(postsAtom);
  
  // ... 나머지 코드
};
```

## 방법 2: `useRef`로 Promise 저장 (더 명시적)

```typescript
const HomePage = () => {
  // useRef로 Promise를 저장 (컴포넌트 생명주기 동안 유지)
  const postsPromiseRef = useRef<Promise<Post[]>>();
  if (!postsPromiseRef.current) {
    postsPromiseRef.current = getPosts();
  }
  
  const postsAtom = useMemo(
    () => createAsyncAtom(postsPromiseRef.current!),
    [] // 빈 배열 - 한 번만 생성
  );
  const [posts, setPosts] = useAtom(postsAtom);
  
  // ... 나머지 코드
};
```

## 방법 3: 커스텀 훅으로 추상화

더 깔끔하게 사용하려면 커스텀 훅을 만들어:

```typescript
// hooks/useAsyncAtom.ts
import { useMemo, useRef } from "react";
import { createAsyncAtom, type Atom } from "sangtae-js";
import useAtom from "./useAtom";

const useAsyncAtom = <T>(promiseFactory: () => Promise<T>): ReturnType<typeof useAtom<T>> => {
  const promiseRef = useRef<Promise<T>>();
  
  if (!promiseRef.current) {
    promiseRef.current = promiseFactory();
  }
  
  const atom = useMemo(
    () => createAsyncAtom(promiseRef.current!),
    []
  );
  
  return useAtom(atom);
};

// 사용 예시
const HomePage = () => {
  const [posts, setPosts] = useAsyncAtom(() => getPosts());
  // ... 나머지 코드
};
```

**추천**: 방법 1(`useMemo`)이 가장 간단해. 방법 3은 재사용성이 좋아.

`PostPage`처럼 `id` 같은 의존성이 있으면:

```typescript
const PostPage = () => {
  const { id } = useParams<{ id: string }>();
  
  // id가 변경될 때만 새로운 Promise 생성
  const postAtom = useMemo(
    () => createAsyncAtom(getPost(Number(id!))),
    [id]
  );
  const [post] = useAtom(postAtom);
  
  // ... 나머지 코드
};
```

핵심은 Promise 인스턴스를 렌더링 사이에 유지하는 것. `useMemo`나 `useRef`로 해결할 수 있어.

```typescript
const HomePage = () => {
  // Promise를 useMemo로 메모이제이션
  const postsPromise = useMemo(() => getPosts(), []);
  const postsAtom = useMemo(() => createAsyncAtom(postsPromise), [postsPromise]);
  const [posts, setPosts] = useAtom(postsAtom);
  
  // ... 나머지 코드
};
```

```typescript
const HomePage = () => {
  // useRef로 Promise를 저장 (컴포넌트 생명주기 동안 유지)
  const postsPromiseRef = useRef<Promise<Post[]>>();
  if (!postsPromiseRef.current) {
    postsPromiseRef.current = getPosts();
  }
  
  const postsAtom = useMemo(
    () => createAsyncAtom(postsPromiseRef.current!),
    [] // 빈 배열 - 한 번만 생성
  );
  const [posts, setPosts] = useAtom(postsAtom);
  
  // ... 나머지 코드
};
```

```typescript
// hooks/useAsyncAtom.ts
import { useMemo, useRef } from "react";
import { createAsyncAtom, type Atom } from "sangtae-js";
import useAtom from "./useAtom";

const useAsyncAtom = <T>(promiseFactory: () => Promise<T>): ReturnType<typeof useAtom<T>> => {
  const promiseRef = useRef<Promise<T>>();
  
  if (!promiseRef.current) {
    promiseRef.current = promiseFactory();
  }
  
  const atom = useMemo(
    () => createAsyncAtom(promiseRef.current!),
    []
  );
  
  return useAtom(atom);
};

// 사용 예시
const HomePage = () => {
  const [posts, setPosts] = useAsyncAtom(() => getPosts());
  // ... 나머지 코드
};
```

```typescript
const PostPage = () => {
  const { id } = useParams<{ id: string }>();
  
  // id가 변경될 때만 새로운 Promise 생성
  const postAtom = useMemo(
    () => createAsyncAtom(getPost(Number(id!))),
    [id]
  );
  const [post] = useAtom(postAtom);
  
  // ... 나머지 코드
};
```

---

**User**

@useAtom.ts (1-25) 



여기가 useAtom 부분이야

---

**Cursor**

`useAtom` 훅을 확인했어. 컴포넌트 내부에서 Promise를 유지하도록 확장하는 방법을 제안할게.


`useAtom` 훅을 확장해 Promise를 직접 받을 수 있게 하면 컴포넌트 내부에서도 Promise가 유지돼. 방법은 두 가지야:

## 방법 1: `useAtom`을 오버로드해서 Promise도 받을 수 있게 하기

```typescript
import { useSyncExternalStore, useCallback, useMemo, useRef } from "react";
import { get, set, subscribe, createAsyncAtom, type Atom } from "sangtae-js";

/**
 * @description atom을 사용하여 상태를 관리하는 훅
 * @param {Atom<T>} atom atom 객체
 * @returns {[T, (newValue: T) => void]} [atom의 현재 값, atom의 값을 변경할 수 있는 함수]
 */
function useAtom<T>(atom: Atom<T>): [T, (newValue: T) => void];

/**
 * @description Promise를 받아 비동기 atom을 생성하고 상태를 관리하는 훅
 * @param {Promise<T>} promise Promise 객체
 * @returns {[T, (newValue: T) => void]} [atom의 현재 값, atom의 값을 변경할 수 있는 함수]
 */
function useAtom<T>(promise: Promise<T>): [T, (newValue: T) => void];

function useAtom<T>(atomOrPromise: Atom<T> | Promise<T>): [T, (newValue: T) => void] {
  // Promise인지 확인
  const isPromise = atomOrPromise instanceof Promise;
  
  // Promise인 경우 useRef로 메모이제이션하고 createAsyncAtom으로 변환
  const promiseRef = useRef<Promise<T> | null>(null);
  if (isPromise && !promiseRef.current) {
    promiseRef.current = atomOrPromise as Promise<T>;
  }
  
  const atom = useMemo(() => {
    if (isPromise) {
      return createAsyncAtom(promiseRef.current!);
    }
    return atomOrPromise as Atom<T>;
  }, [isPromise, atomOrPromise]);
  
  const subscribeAtom = useCallback<Parameters<typeof useSyncExternalStore>[0]>(
    (onStoreChange) => subscribe(atom, onStoreChange),
    [atom]
  );

  const getSnapshot = useCallback(() => get(atom), [atom]);

  const setValue = useCallback((newValue: T) => set(atom, newValue), [atom]);

  const value = useSyncExternalStore(subscribeAtom, getSnapshot, getSnapshot);

  return [value, setValue];
}

export default useAtom;
```

이렇게 하면 이렇게 사용할 수 있어:

```typescript
// 기존 방식 (atom 직접 전달)
const [posts, setPosts] = useAtom($posts);

// 새로운 방식 (Promise 직접 전달 - 자동으로 메모이제이션됨)
const [posts, setPosts] = useAtom(getPosts());
```

## 방법 2: 의존성 배열을 받는 버전 (더 유연함)

`PostPage`처럼 `id`가 변경될 때 새로운 Promise를 생성하려면:

```typescript
import { useSyncExternalStore, useCallback, useMemo, useRef } from "react";
import { get, set, subscribe, createAsyncAtom, type Atom } from "sangtae-js";

type UseAtomOverload = {
  <T>(atom: Atom<T>): [T, (newValue: T) => void];
  <T>(promiseFactory: () => Promise<T>, deps?: React.DependencyList): [T, (newValue: T) => void];
};

const useAtom = <T>(
  atomOrFactory: Atom<T> | (() => Promise<T>),
  deps?: React.DependencyList
): [T, (newValue: T) => void] => {
  const isFactory = typeof atomOrFactory === "function";
  
  // Promise factory인 경우
  if (isFactory) {
    const promise = useMemo(
      () => (atomOrFactory as () => Promise<T>)(),
      deps || []
    );
    
    const promiseRef = useRef<Promise<T>>();
    if (!promiseRef.current || promise !== promiseRef.current) {
      promiseRef.current = promise;
    }
    
    const atom = useMemo(
      () => createAsyncAtom(promiseRef.current!),
      [promiseRef.current]
    );
    
    const subscribeAtom = useCallback<Parameters<typeof useSyncExternalStore>[0]>(
      (onStoreChange) => subscribe(atom, onStoreChange),
      [atom]
    );

    const getSnapshot = useCallback(() => get(atom), [atom]);
    const setValue = useCallback((newValue: T) => set(atom, newValue), [atom]);
    const value = useSyncExternalStore(subscribeAtom, getSnapshot, getSnapshot);

    return [value, setValue];
  }
  
  // 기존 atom인 경우
  const atom = atomOrFactory as Atom<T>;
  const subscribeAtom = useCallback<Parameters<typeof useSyncExternalStore>[0]>(
    (onStoreChange) => subscribe(atom, onStoreChange),
    [atom]
  );

  const getSnapshot = useCallback(() => get(atom), [atom]);
  const setValue = useCallback((newValue: T) => set(atom, newValue), [atom]);
  const value = useSyncExternalStore(subscribeAtom, getSnapshot, getSnapshot);

  return [value, setValue];
};

export default useAtom;
```

사용 예시:

```typescript
// 의존성 없음 (한 번만 실행)
const [posts, setPosts] = useAtom(() => getPosts());

// 의존성 있음 (id가 변경될 때만 재실행)
const { id } = useParams();
const [post, setPost] = useAtom(() => getPost(Number(id!)), [id]);
```

방법 1이 더 간단하고, 방법 2는 의존성 관리가 필요할 때 유용해. 어떤 방식을 원해?

```typescript
import { useSyncExternalStore, useCallback, useMemo, useRef } from "react";
import { get, set, subscribe, createAsyncAtom, type Atom } from "sangtae-js";

/**
 * @description atom을 사용하여 상태를 관리하는 훅
 * @param {Atom<T>} atom atom 객체
 * @returns {[T, (newValue: T) => void]} [atom의 현재 값, atom의 값을 변경할 수 있는 함수]
 */
function useAtom<T>(atom: Atom<T>): [T, (newValue: T) => void];

/**
 * @description Promise를 받아 비동기 atom을 생성하고 상태를 관리하는 훅
 * @param {Promise<T>} promise Promise 객체
 * @returns {[T, (newValue: T) => void]} [atom의 현재 값, atom의 값을 변경할 수 있는 함수]
 */
function useAtom<T>(promise: Promise<T>): [T, (newValue: T) => void];

function useAtom<T>(atomOrPromise: Atom<T> | Promise<T>): [T, (newValue: T) => void] {
  // Promise인지 확인
  const isPromise = atomOrPromise instanceof Promise;
  
  // Promise인 경우 useRef로 메모이제이션하고 createAsyncAtom으로 변환
  const promiseRef = useRef<Promise<T> | null>(null);
  if (isPromise && !promiseRef.current) {
    promiseRef.current = atomOrPromise as Promise<T>;
  }
  
  const atom = useMemo(() => {
    if (isPromise) {
      return createAsyncAtom(promiseRef.current!);
    }
    return atomOrPromise as Atom<T>;
  }, [isPromise, atomOrPromise]);
  
  const subscribeAtom = useCallback<Parameters<typeof useSyncExternalStore>[0]>(
    (onStoreChange) => subscribe(atom, onStoreChange),
    [atom]
  );

  const getSnapshot = useCallback(() => get(atom), [atom]);

  const setValue = useCallback((newValue: T) => set(atom, newValue), [atom]);

  const value = useSyncExternalStore(subscribeAtom, getSnapshot, getSnapshot);

  return [value, setValue];
}

export default useAtom;
```

```typescript
// 기존 방식 (atom 직접 전달)
const [posts, setPosts] = useAtom($posts);

// 새로운 방식 (Promise 직접 전달 - 자동으로 메모이제이션됨)
const [posts, setPosts] = useAtom(getPosts());
```

```typescript
import { useSyncExternalStore, useCallback, useMemo, useRef } from "react";
import { get, set, subscribe, createAsyncAtom, type Atom } from "sangtae-js";

type UseAtomOverload = {
  <T>(atom: Atom<T>): [T, (newValue: T) => void];
  <T>(promiseFactory: () => Promise<T>, deps?: React.DependencyList): [T, (newValue: T) => void];
};

const useAtom = <T>(
  atomOrFactory: Atom<T> | (() => Promise<T>),
  deps?: React.DependencyList
): [T, (newValue: T) => void] => {
  const isFactory = typeof atomOrFactory === "function";
  
  // Promise factory인 경우
  if (isFactory) {
    const promise = useMemo(
      () => (atomOrFactory as () => Promise<T>)(),
      deps || []
    );
    
    const promiseRef = useRef<Promise<T>>();
    if (!promiseRef.current || promise !== promiseRef.current) {
      promiseRef.current = promise;
    }
    
    const atom = useMemo(
      () => createAsyncAtom(promiseRef.current!),
      [promiseRef.current]
    );
    
    const subscribeAtom = useCallback<Parameters<typeof useSyncExternalStore>[0]>(
      (onStoreChange) => subscribe(atom, onStoreChange),
      [atom]
    );

    const getSnapshot = useCallback(() => get(atom), [atom]);
    const setValue = useCallback((newValue: T) => set(atom, newValue), [atom]);
    const value = useSyncExternalStore(subscribeAtom, getSnapshot, getSnapshot);

    return [value, setValue];
  }
  
  // 기존 atom인 경우
  const atom = atomOrFactory as Atom<T>;
  const subscribeAtom = useCallback<Parameters<typeof useSyncExternalStore>[0]>(
    (onStoreChange) => subscribe(atom, onStoreChange),
    [atom]
  );

  const getSnapshot = useCallback(() => get(atom), [atom]);
  const setValue = useCallback((newValue: T) => set(atom, newValue), [atom]);
  const value = useSyncExternalStore(subscribeAtom, getSnapshot, getSnapshot);

  return [value, setValue];
};

export default useAtom;
```

```typescript
// 의존성 없음 (한 번만 실행)
const [posts, setPosts] = useAtom(() => getPosts());

// 의존성 있음 (id가 변경될 때만 재실행)
const { id } = useParams();
const [post, setPost] = useAtom(() => getPost(Number(id!)), [id]);
```

---

**User**

둘다 아니야 기존 호출방식은 다 유지하고 오버라이딩도 하지 않되,

컴포넌트 내에서 createAsyncAtom을 호출하고싶어

---

**Cursor**

컴포넌트 내부에서 `createAsyncAtom`을 직접 호출할 수 있도록 Promise를 메모이제이션하는 헬퍼 훅을 추가하는 게 좋겠어.


`createAsyncAtom`을 래핑하는 헬퍼 훅을 추가하면 돼. 이렇게 하면:

1. 기존 `useAtom`은 그대로 유지
2. 컴포넌트 내에서 `createAsyncAtom`을 직접 호출 가능
3. Promise가 자동으로 메모이제이션됨

새로운 훅을 만들어:

```typescript
// hooks/useCreateAsyncAtom.ts
import { useMemo, useRef } from "react";
import { createAsyncAtom, type Atom } from "sangtae-js";

/**
 * @description 컴포넌트 내에서 Promise를 받아 비동기 atom을 생성하는 훅
 * Promise가 메모이제이션되어 무한 리렌더링을 방지합니다.
 * @param {() => Promise<T>} promiseFactory Promise를 생성하는 함수
 * @param {React.DependencyList} deps 의존성 배열 (선택사항)
 * @returns {Atom<T>} 비동기 atom 객체
 */
const useCreateAsyncAtom = <T>(
  promiseFactory: () => Promise<T>,
  deps?: React.DependencyList
): Atom<T> => {
  // Promise를 메모이제이션
  const promise = useMemo(() => promiseFactory(), deps || []);
  
  // useRef로 Promise 인스턴스를 유지 (렌더링 간 동일성 보장)
  const promiseRef = useRef<Promise<T>>();
  
  // deps가 없거나 변경되지 않았으면 같은 Promise 유지
  if (!promiseRef.current || (deps === undefined && promise !== promiseRef.current)) {
    promiseRef.current = promise;
  }
  
  // deps가 있으면 deps가 변경될 때만 Promise 업데이트
  if (deps !== undefined) {
    promiseRef.current = promise;
  }
  
  // atom 생성 (같은 Promise에 대해 같은 atom 반환)
  return useMemo(
    () => createAsyncAtom(promiseRef.current!),
    [promiseRef.current]
  );
};

export default useCreateAsyncAtom;
```

사용 예시:

```typescript
// App.tsx에서
import useCreateAsyncAtom from "@/hooks/useCreateAsyncAtom";
import { getPosts, getPost } from "./apis";

const HomePage = () => {
  // 의존성 없음 - 한 번만 실행
  const postsAtom = useCreateAsyncAtom(() => getPosts());
  const [posts, setPosts] = useAtom(postsAtom);
  
  // ... 나머지 코드
};

const PostPage = () => {
  const { id } = useParams<{ id: string }>();
  
  // id가 변경될 때만 새로운 Promise 생성
  const postAtom = useCreateAsyncAtom(
    () => getPost(Number(id!)),
    [id]
  );
  const [post] = useAtom(postAtom);
  
  // ... 나머지 코드
};
```

이렇게 하면:
- 기존 `useAtom` 호출 방식 유지
- 컴포넌트 내에서 `createAsyncAtom` 직접 호출 가능
- Promise가 메모이제이션되어 무한 리렌더링 방지
- 의존성 배열로 필요할 때만 재생성 가능

더 간단한 버전(의존성 배열 없이 항상 같은 Promise 유지):

```typescript
// hooks/useCreateAsyncAtom.ts
import { useMemo, useRef } from "react";
import { createAsyncAtom, type Atom } from "sangtae-js";

const useCreateAsyncAtom = <T>(
  promiseFactory: () => Promise<T>,
  deps?: React.DependencyList
): Atom<T> => {
  const promiseRef = useRef<Promise<T>>();
  
  // deps가 없으면 한 번만 생성
  if (!promiseRef.current) {
    promiseRef.current = promiseFactory();
  }
  
  // deps가 있으면 deps가 변경될 때만 재생성
  const promise = useMemo(() => {
    if (deps !== undefined) {
      return promiseFactory();
    }
    return promiseRef.current!;
  }, deps);
  
  // deps가 있으면 promise가 변경될 수 있으므로 업데이트
  if (deps !== undefined) {
    promiseRef.current = promise;
  }
  
  return useMemo(
    () => createAsyncAtom(promiseRef.current!),
    [promiseRef.current]
  );
};

export default useCreateAsyncAtom;
```

어떤 버전이 더 마음에 들어?

```typescript
// hooks/useCreateAsyncAtom.ts
import { useMemo, useRef } from "react";
import { createAsyncAtom, type Atom } from "sangtae-js";

/**
 * @description 컴포넌트 내에서 Promise를 받아 비동기 atom을 생성하는 훅
 * Promise가 메모이제이션되어 무한 리렌더링을 방지합니다.
 * @param {() => Promise<T>} promiseFactory Promise를 생성하는 함수
 * @param {React.DependencyList} deps 의존성 배열 (선택사항)
 * @returns {Atom<T>} 비동기 atom 객체
 */
const useCreateAsyncAtom = <T>(
  promiseFactory: () => Promise<T>,
  deps?: React.DependencyList
): Atom<T> => {
  // Promise를 메모이제이션
  const promise = useMemo(() => promiseFactory(), deps || []);
  
  // useRef로 Promise 인스턴스를 유지 (렌더링 간 동일성 보장)
  const promiseRef = useRef<Promise<T>>();
  
  // deps가 없거나 변경되지 않았으면 같은 Promise 유지
  if (!promiseRef.current || (deps === undefined && promise !== promiseRef.current)) {
    promiseRef.current = promise;
  }
  
  // deps가 있으면 deps가 변경될 때만 Promise 업데이트
  if (deps !== undefined) {
    promiseRef.current = promise;
  }
  
  // atom 생성 (같은 Promise에 대해 같은 atom 반환)
  return useMemo(
    () => createAsyncAtom(promiseRef.current!),
    [promiseRef.current]
  );
};

export default useCreateAsyncAtom;
```

```typescript
// App.tsx에서
import useCreateAsyncAtom from "@/hooks/useCreateAsyncAtom";
import { getPosts, getPost } from "./apis";

const HomePage = () => {
  // 의존성 없음 - 한 번만 실행
  const postsAtom = useCreateAsyncAtom(() => getPosts());
  const [posts, setPosts] = useAtom(postsAtom);
  
  // ... 나머지 코드
};

const PostPage = () => {
  const { id } = useParams<{ id: string }>();
  
  // id가 변경될 때만 새로운 Promise 생성
  const postAtom = useCreateAsyncAtom(
    () => getPost(Number(id!)),
    [id]
  );
  const [post] = useAtom(postAtom);
  
  // ... 나머지 코드
};
```

```typescript
// hooks/useCreateAsyncAtom.ts
import { useMemo, useRef } from "react";
import { createAsyncAtom, type Atom } from "sangtae-js";

const useCreateAsyncAtom = <T>(
  promiseFactory: () => Promise<T>,
  deps?: React.DependencyList
): Atom<T> => {
  const promiseRef = useRef<Promise<T>>();
  
  // deps가 없으면 한 번만 생성
  if (!promiseRef.current) {
    promiseRef.current = promiseFactory();
  }
  
  // deps가 있으면 deps가 변경될 때만 재생성
  const promise = useMemo(() => {
    if (deps !== undefined) {
      return promiseFactory();
    }
    return promiseRef.current!;
  }, deps);
  
  // deps가 있으면 promise가 변경될 수 있으므로 업데이트
  if (deps !== undefined) {
    promiseRef.current = promise;
  }
  
  return useMemo(
    () => createAsyncAtom(promiseRef.current!),
    [promiseRef.current]
  );
};

export default useCreateAsyncAtom;
```

---

**User**

@JF002 - Minimal Global State Managment Library 구현.md (1-97) 

상세한 요구사항이야...

---

**Cursor**

과제 요구사항 확인했어. 기존 API는 유지하고, 컴포넌트 내부에서 `createAsyncAtom`을 직접 호출할 수 있도록 Promise를 메모이제이션하는 헬퍼 훅을 추가하는 게 좋겠어.

`createAsyncAtom`의 WeakMap 캐싱은 Promise 인스턴스를 키로 사용하므로, 같은 Promise 인스턴스를 유지해야 해.

가장 간단한 방법은 별도 헬퍼 훅을 만드는 거야:

```typescript
// hooks/useCreateAsyncAtom.ts
import { useMemo, useRef } from "react";
import { createAsyncAtom, type Atom } from "sangtae-js";

/**
 * @description 컴포넌트 내에서 Promise를 받아 비동기 atom을 생성하는 훅
 * Promise가 메모이제이션되어 무한 리렌더링을 방지합니다.
 * 
 * @param promiseFactory Promise를 생성하는 함수
 * @param deps 의존성 배열 (선택사항). 제공하지 않으면 항상 같은 Promise를 유지합니다.
 * @returns 비동기 atom 객체
 * 
 * @example
 * // 의존성 없음 - 한 번만 실행
 * const postsAtom = useCreateAsyncAtom(() => getPosts());
 * const [posts] = useAtom(postsAtom);
 * 
 * @example
 * // 의존성 있음 - id가 변경될 때만 재생성
 * const postAtom = useCreateAsyncAtom(() => getPost(id), [id]);
 * const [post] = useAtom(postAtom);
 */
const useCreateAsyncAtom = <T>(
  promiseFactory: () => Promise<T>,
  deps?: React.DependencyList
): Atom<T> => {
  const promiseRef = useRef<Promise<T>>();
  
  // deps가 없으면 한 번만 생성하고 계속 유지
  if (deps === undefined) {
    if (!promiseRef.current) {
      promiseRef.current = promiseFactory();
    }
  } else {
    // deps가 있으면 deps가 변경될 때만 재생성
    const promise = useMemo(() => promiseFactory(), deps);
    promiseRef.current = promise;
  }
  
  // 같은 Promise 인스턴스에 대해 같은 atom 반환
  return useMemo(
    () => createAsyncAtom(promiseRef.current!),
    [promiseRef.current]
  );
};

export default useCreateAsyncAtom;
```

사용 예시:

```typescript
// App.tsx
import useCreateAsyncAtom from "@/hooks/useCreateAsyncAtom";
import { getPosts, getPost } from "./apis";

const HomePage = () => {
  // 의존성 없음 - Promise가 한 번만 생성되고 계속 유지됨
  const postsAtom = useCreateAsyncAtom(() => getPosts());
  const [posts, setPosts] = useAtom(postsAtom);
  
  // ... 나머지 코드
};

const PostPage = () => {
  const { id } = useParams<{ id: string }>();
  
  // id가 변경될 때만 새로운 Promise 생성
  const postAtom = useCreateAsyncAtom(
    () => getPost(Number(id!)),
    [id]
  );
  const [post] = useAtom(postAtom);
  
  // ... 나머지 코드
};
```

이렇게 하면:
- 기존 `useAtom` API 유지
- `createAsyncAtom` 직접 호출 가능
- Promise가 메모이제이션되어 무한 리렌더링 방지
- 의존성 배열로 필요 시 재생성 가능
- 과제 요구사항에 맞게 기존 API 변경 없음

이 방식이면 기존 코드는 그대로 두고, 컴포넌트 내부에서 `createAsyncAtom`을 안전하게 사용할 수 있어.

```typescript
// hooks/useCreateAsyncAtom.ts
import { useMemo, useRef } from "react";
import { createAsyncAtom, type Atom } from "sangtae-js";

/**
 * @description 컴포넌트 내에서 Promise를 받아 비동기 atom을 생성하는 훅
 * Promise가 메모이제이션되어 무한 리렌더링을 방지합니다.
 * 
 * @param promiseFactory Promise를 생성하는 함수
 * @param deps 의존성 배열 (선택사항). 제공하지 않으면 항상 같은 Promise를 유지합니다.
 * @returns 비동기 atom 객체
 * 
 * @example
 * // 의존성 없음 - 한 번만 실행
 * const postsAtom = useCreateAsyncAtom(() => getPosts());
 * const [posts] = useAtom(postsAtom);
 * 
 * @example
 * // 의존성 있음 - id가 변경될 때만 재생성
 * const postAtom = useCreateAsyncAtom(() => getPost(id), [id]);
 * const [post] = useAtom(postAtom);
 */
const useCreateAsyncAtom = <T>(
  promiseFactory: () => Promise<T>,
  deps?: React.DependencyList
): Atom<T> => {
  const promiseRef = useRef<Promise<T>>();
  
  // deps가 없으면 한 번만 생성하고 계속 유지
  if (deps === undefined) {
    if (!promiseRef.current) {
      promiseRef.current = promiseFactory();
    }
  } else {
    // deps가 있으면 deps가 변경될 때만 재생성
    const promise = useMemo(() => promiseFactory(), deps);
    promiseRef.current = promise;
  }
  
  // 같은 Promise 인스턴스에 대해 같은 atom 반환
  return useMemo(
    () => createAsyncAtom(promiseRef.current!),
    [promiseRef.current]
  );
};

export default useCreateAsyncAtom;
```

```typescript
// App.tsx
import useCreateAsyncAtom from "@/hooks/useCreateAsyncAtom";
import { getPosts, getPost } from "./apis";

const HomePage = () => {
  // 의존성 없음 - Promise가 한 번만 생성되고 계속 유지됨
  const postsAtom = useCreateAsyncAtom(() => getPosts());
  const [posts, setPosts] = useAtom(postsAtom);
  
  // ... 나머지 코드
};

const PostPage = () => {
  const { id } = useParams<{ id: string }>();
  
  // id가 변경될 때만 새로운 Promise 생성
  const postAtom = useCreateAsyncAtom(
    () => getPost(Number(id!)),
    [id]
  );
  const [post] = useAtom(postAtom);
  
  // ... 나머지 코드
};
```

---

**User**

useCreateAsyncAtom 은 없어 useAtom에서 모든걸 해결해야해

---

**Cursor**

`useAtom`에서 Promise를 받아 처리하도록 수정. 기존 atom 사용은 유지하고, Promise가 전달되면 내부에서 메모이제이션해 `createAsyncAtom`으로 변환.


`useAtom`이 Promise도 받도록 수정. Promise가 전달되면 내부에서 메모이제이션해 `createAsyncAtom`으로 변환:

```typescript
import { useSyncExternalStore, useCallback, useMemo, useRef } from "react";
import { get, set, subscribe, createAsyncAtom, type Atom } from "sangtae-js";

/**
 * @description atom을 사용하여 상태를 관리하는 훅
 * @param {Atom<T> | Promise<T>} atomOrPromise atom 객체 또는 Promise
 * @returns {[T, (newValue: T) => void]} [atom의 현재 값, atom의 값을 변경할 수 있는 함수]
 */
const useAtom = <T>(atomOrPromise: Atom<T> | Promise<T>): [T, (newValue: T) => void] => {
  // Promise인지 확인
  const isPromise = atomOrPromise instanceof Promise;
  
  // Promise인 경우 메모이제이션
  const promiseRef = useRef<Promise<T> | null>(null);
  if (isPromise && !promiseRef.current) {
    promiseRef.current = atomOrPromise as Promise<T>;
  }
  
  // atom으로 변환 (Promise면 createAsyncAtom 사용)
  const atom = useMemo(() => {
    if (isPromise) {
      return createAsyncAtom(promiseRef.current!);
    }
    return atomOrPromise as Atom<T>;
  }, [isPromise, atomOrPromise]);
  
  const subscribeAtom = useCallback<Parameters<typeof useSyncExternalStore>[0]>(
    (onStoreChange) => subscribe(atom, onStoreChange),
    [atom]
  );

  const getSnapshot = useCallback(() => get(atom), [atom]);

  const setValue = useCallback((newValue: T) => set(atom, newValue), [atom]);

  const value = useSyncExternalStore(subscribeAtom, getSnapshot, getSnapshot);

  return [value, setValue];
};

export default useAtom;
```

사용 예시:

```typescript
// 기존 방식 (atom 직접 전달) - 그대로 작동
const [posts, setPosts] = useAtom($posts);

// 새로운 방식 (Promise 직접 전달) - 자동으로 메모이제이션됨
const [posts, setPosts] = useAtom(getPosts());

// PostPage에서도
const { id } = useParams();
const [post] = useAtom(getPost(Number(id!))); // id가 바뀌면 새로운 Promise 생성됨
```

주의: `id`가 바뀔 때 새로운 Promise를 생성하려면 `useMemo`로 Promise를 메모이제이션해야 해:

```typescript
// PostPage에서
const { id } = useParams();
const postPromise = useMemo(() => getPost(Number(id!)), [id]);
const [post] = useAtom(postPromise);
```

또는 `useAtom` 내부에서 의존성 배열을 받도록 확장할 수도 있어:

```typescript
import { useSyncExternalStore, useCallback, useMemo, useRef } from "react";
import { get, set, subscribe, createAsyncAtom, type Atom } from "sangtae-js";

type UseAtomParam<T> = Atom<T> | Promise<T> | (() => Promise<T>);

/**
 * @description atom을 사용하여 상태를 관리하는 훅
 * @param {Atom<T> | Promise<T> | (() => Promise<T>)} atomOrPromise atom 객체, Promise, 또는 Promise를 생성하는 함수
 * @param {React.DependencyList} deps 의존성 배열 (Promise factory 사용 시)
 * @returns {[T, (newValue: T) => void]} [atom의 현재 값, atom의 값을 변경할 수 있는 함수]
 */
const useAtom = <T>(
  atomOrPromise: UseAtomParam<T>,
  deps?: React.DependencyList
): [T, (newValue: T) => void] => {
  // Promise factory인지 확인
  const isFactory = typeof atomOrPromise === "function";
  
  // Promise factory인 경우
  if (isFactory) {
    const promise = useMemo(
      () => (atomOrPromise as () => Promise<T>)(),
      deps || []
    );
    
    const promiseRef = useRef<Promise<T>>();
    if (!promiseRef.current || (deps === undefined && promise !== promiseRef.current)) {
      promiseRef.current = promise;
    }
    if (deps !== undefined) {
      promiseRef.current = promise;
    }
    
    const atom = useMemo(
      () => createAsyncAtom(promiseRef.current!),
      [promiseRef.current]
    );
    
    const subscribeAtom = useCallback<Parameters<typeof useSyncExternalStore>[0]>(
      (onStoreChange) => subscribe(atom, onStoreChange),
      [atom]
    );

    const getSnapshot = useCallback(() => get(atom), [atom]);
    const setValue = useCallback((newValue: T) => set(atom, newValue), [atom]);
    const value = useSyncExternalStore(subscribeAtom, getSnapshot, getSnapshot);

    return [value, setValue];
  }
  
  // Promise인지 확인
  const isPromise = atomOrPromise instanceof Promise;
  
  // Promise인 경우 메모이제이션
  const promiseRef = useRef<Promise<T> | null>(null);
  if (isPromise && !promiseRef.current) {
    promiseRef.current = atomOrPromise as Promise<T>;
  }
  
  // atom으로 변환
  const atom = useMemo(() => {
    if (isPromise) {
      return createAsyncAtom(promiseRef.current!);
    }
    return atomOrPromise as Atom<T>;
  }, [isPromise, atomOrPromise]);
  
  const subscribeAtom = useCallback<Parameters<typeof useSyncExternalStore>[0]>(
    (onStoreChange) => subscribe(atom, onStoreChange),
    [atom]
  );

  const getSnapshot = useCallback(() => get(atom), [atom]);

  const setValue = useCallback((newValue: T) => set(atom, newValue), [atom]);

  const value = useSyncExternalStore(subscribeAtom, getSnapshot, getSnapshot);

  return [value, setValue];
};

export default useAtom;
```

이렇게 하면:

```typescript
// 기존 방식
const [posts, setPosts] = useAtom($posts);

// Promise 직접 전달 (의존성 없음 - 한 번만 실행)
const [posts, setPosts] = useAtom(getPosts());

// Promise factory + 의존성 배열
const { id } = useParams();
const [post] = useAtom(() => getPost(Number(id!)), [id]);
```

첫 번째 버전(단순 Promise만 받는)과 두 번째 버전(Factory + deps 지원) 중 어떤 걸 원해?

```typescript
import { useSyncExternalStore, useCallback, useMemo, useRef } from "react";
import { get, set, subscribe, createAsyncAtom, type Atom } from "sangtae-js";

/**
 * @description atom을 사용하여 상태를 관리하는 훅
 * @param {Atom<T> | Promise<T>} atomOrPromise atom 객체 또는 Promise
 * @returns {[T, (newValue: T) => void]} [atom의 현재 값, atom의 값을 변경할 수 있는 함수]
 */
const useAtom = <T>(atomOrPromise: Atom<T> | Promise<T>): [T, (newValue: T) => void] => {
  // Promise인지 확인
  const isPromise = atomOrPromise instanceof Promise;
  
  // Promise인 경우 메모이제이션
  const promiseRef = useRef<Promise<T> | null>(null);
  if (isPromise && !promiseRef.current) {
    promiseRef.current = atomOrPromise as Promise<T>;
  }
  
  // atom으로 변환 (Promise면 createAsyncAtom 사용)
  const atom = useMemo(() => {
    if (isPromise) {
      return createAsyncAtom(promiseRef.current!);
    }
    return atomOrPromise as Atom<T>;
  }, [isPromise, atomOrPromise]);
  
  const subscribeAtom = useCallback<Parameters<typeof useSyncExternalStore>[0]>(
    (onStoreChange) => subscribe(atom, onStoreChange),
    [atom]
  );

  const getSnapshot = useCallback(() => get(atom), [atom]);

  const setValue = useCallback((newValue: T) => set(atom, newValue), [atom]);

  const value = useSyncExternalStore(subscribeAtom, getSnapshot, getSnapshot);

  return [value, setValue];
};

export default useAtom;
```

```typescript
// 기존 방식 (atom 직접 전달) - 그대로 작동
const [posts, setPosts] = useAtom($posts);

// 새로운 방식 (Promise 직접 전달) - 자동으로 메모이제이션됨
const [posts, setPosts] = useAtom(getPosts());

// PostPage에서도
const { id } = useParams();
const [post] = useAtom(getPost(Number(id!))); // id가 바뀌면 새로운 Promise 생성됨
```

```typescript
// PostPage에서
const { id } = useParams();
const postPromise = useMemo(() => getPost(Number(id!)), [id]);
const [post] = useAtom(postPromise);
```

```typescript
import { useSyncExternalStore, useCallback, useMemo, useRef } from "react";
import { get, set, subscribe, createAsyncAtom, type Atom } from "sangtae-js";

type UseAtomParam<T> = Atom<T> | Promise<T> | (() => Promise<T>);

/**
 * @description atom을 사용하여 상태를 관리하는 훅
 * @param {Atom<T> | Promise<T> | (() => Promise<T>)} atomOrPromise atom 객체, Promise, 또는 Promise를 생성하는 함수
 * @param {React.DependencyList} deps 의존성 배열 (Promise factory 사용 시)
 * @returns {[T, (newValue: T) => void]} [atom의 현재 값, atom의 값을 변경할 수 있는 함수]
 */
const useAtom = <T>(
  atomOrPromise: UseAtomParam<T>,
  deps?: React.DependencyList
): [T, (newValue: T) => void] => {
  // Promise factory인지 확인
  const isFactory = typeof atomOrPromise === "function";
  
  // Promise factory인 경우
  if (isFactory) {
    const promise = useMemo(
      () => (atomOrPromise as () => Promise<T>)(),
      deps || []
    );
    
    const promiseRef = useRef<Promise<T>>();
    if (!promiseRef.current || (deps === undefined && promise !== promiseRef.current)) {
      promiseRef.current = promise;
    }
    if (deps !== undefined) {
      promiseRef.current = promise;
    }
    
    const atom = useMemo(
      () => createAsyncAtom(promiseRef.current!),
      [promiseRef.current]
    );
    
    const subscribeAtom = useCallback<Parameters<typeof useSyncExternalStore>[0]>(
      (onStoreChange) => subscribe(atom, onStoreChange),
      [atom]
    );

    const getSnapshot = useCallback(() => get(atom), [atom]);
    const setValue = useCallback((newValue: T) => set(atom, newValue), [atom]);
    const value = useSyncExternalStore(subscribeAtom, getSnapshot, getSnapshot);

    return [value, setValue];
  }
  
  // Promise인지 확인
  const isPromise = atomOrPromise instanceof Promise;
  
  // Promise인 경우 메모이제이션
  const promiseRef = useRef<Promise<T> | null>(null);
  if (isPromise && !promiseRef.current) {
    promiseRef.current = atomOrPromise as Promise<T>;
  }
  
  // atom으로 변환
  const atom = useMemo(() => {
    if (isPromise) {
      return createAsyncAtom(promiseRef.current!);
    }
    return atomOrPromise as Atom<T>;
  }, [isPromise, atomOrPromise]);
  
  const subscribeAtom = useCallback<Parameters<typeof useSyncExternalStore>[0]>(
    (onStoreChange) => subscribe(atom, onStoreChange),
    [atom]
  );

  const getSnapshot = useCallback(() => get(atom), [atom]);

  const setValue = useCallback((newValue: T) => set(atom, newValue), [atom]);

  const value = useSyncExternalStore(subscribeAtom, getSnapshot, getSnapshot);

  return [value, setValue];
};

export default useAtom;
```

```typescript
// 기존 방식
const [posts, setPosts] = useAtom($posts);

// Promise 직접 전달 (의존성 없음 - 한 번만 실행)
const [posts, setPosts] = useAtom(getPosts());

// Promise factory + 의존성 배열
const { id } = useParams();
const [post] = useAtom(() => getPost(Number(id!)), [id]);
```

