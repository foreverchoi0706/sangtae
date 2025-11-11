# 초기 세팅 요청을 위한 폴더 생성
_Exported on 2025. 11. 9. at 21시 50분 8초 GMT+9 from Cursor (2.0.69)_

---

**User**

@sangtae-react 폴더를 새로 생성하였어

이 폴더는 sample-app-react/src/hooks에 존재하는 useAtom 훅을 간단한 라이브러리 형태 독립적으로 분리하기 위한 폴더야 

아래 조건에 맞춰서 초기 세팅을 부탁해

- react 18버전 이상만 사용가능 

- react 19버전으로 Dependencies 로 가짐

- 타입스크립트 지원

- tsup으로 번들

---

**Cursor**

```json
{
  "name": "project",
  "version": "1.0.0",
  "private": true,
  "workspaces": [
    "@sangtae-js",
    "@sangtae-react",
    "sample-app-react",
    "sample-app-vue"
  ],
  "devDependencies": {
    "typescript": "^5.9.3"
  },
  "scripts": {
    "install:all": "npm install",
    "build": "npm run build --workspace=@sangtae-js",
    "build:watch": "npm run build-watch --workspace=@sangtae-js",
    "dev:react": "npm run dev --workspace=sample-app-react",
    "dev:vue": "npm run dev --workspace=sample-app-vue"
  },
  "author": "foreverchoi0706",
  "license": "ISC",
  "description": "Monorepo for sangtae-js state management library"
}

```

```json
{
  "name": "sangtae-react",
  "version": "0.1.0",
  "type": "module",
  "main": "./dist/index.cjs",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "require": "./dist/index.cjs"
    }
  },
  "files": ["dist"],
  "scripts": {
    "build": "tsup",
    "build:watch": "tsup --watch"
  },
  "peerDependencies": {
    "react": ">=18.0.0"
  },
  "dependencies": {
    "react": "^19.0.0",
    "sangtae-js": "workspace:^"
  },
  "devDependencies": {
    "@types/react": "^18.3.3",
    "tsup": "^8.5.0",
    "typescript": "^5.9.3"
  }
}
```

```jsonc
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "declaration": true,
    "sourceMap": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "jsx": "react-jsx"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

```typescript
import { defineConfig } from "tsup";

export default defineConfig(({ watch }) => ({
  entry: ["src/index.ts"],
  format: ["cjs", "esm"],
  dts: true,
  sourcemap: true,
  splitting: false,
  outDir: "dist",
  minify: !watch,
  clean: !watch,
  treeshake: true,
  external: ["react", "sangtae-js"],
}));
```

```typescript
import { useSyncExternalStore, useCallback } from "react";
import { get, set, subscribe, type Atom } from "sangtae-js";

const useAtom = <T>(atom: Atom<T>): [T, (newValue: T) => void] => {
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
export type { Atom };
```

```typescript
import useAtom from "./useAtom";

export { useAtom };
export default useAtom;
export type { Atom } from "./useAtom";
```

```json
{
  "name": "sangtae-react",
  "version": "0.1.0",
  "type": "module",
  "main": "./dist/index.cjs",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "require": "./dist/index.cjs"
    }
  },
  "files": ["dist"],
  "scripts": {
    "build": "tsup",
    "build:watch": "tsup --watch"
  },
  "peerDependencies": {
    "react": ">=18.0.0"
  },
  "dependencies": {
    "react": "^19.1.1",
    "sangtae-js": "*"
  },
  "devDependencies": {
    "@types/react": "^19.1.16",
    "tsup": "^8.5.0",
    "typescript": "^5.9.3"
  }
}

```

셋업해놨어.

- 루트 워크스페이스에 `@sangtae-react`를 추가하고 `package-lock.json`까지 `npm install --workspace=sangtae-react`로 최신화했어.
- 새 라이브러리의 `package.json`, `tsconfig.json`, `tsup.config.ts` 세팅 완료했고 React 19를 의존성으로, React 18 이상을 peer 범위로 명시했어.
- `sample-app-react`에 있던 `useAtom` 훅을 그대로 옮겨와서 엔트리에서 기본/이름 둘 다 export 하도록 구성했어.

```1:16:@sangtae-react/src/useAtom.ts
import { useSyncExternalStore, useCallback } from "react";
import { get, set, subscribe, type Atom } from "sangtae-js";
// ... existing code ...
```

```1:4:@sangtae-react/src/index.ts
import useAtom from "./useAtom";

export { useAtom };
export default useAtom;
export type { Atom } from "./useAtom";
```

- `npm run build --workspace=@sangtae-react`까지 돌려서 번들·타입 출력 확인했는데, CJS 번들에서 기본 export와 named export를 동시에 쓰면 경고가 뜨니 필요하면 default만 쓰거나 `tsup` 설정에서 `output.exports` 조정하면 되겠다.

다음으로 샘플 앱들이 이 패키지를 바라보도록 import 경로만 갈아끼우면 돼. 필요하면 빌드나 테스트 한 번 더 돌려봐.

```typescript
import { useSyncExternalStore, useCallback } from "react";
import { get, set, subscribe, type Atom } from "sangtae-js";
// ... existing code ...
```

```typescript
import useAtom from "./useAtom";

export { useAtom };
export default useAtom;
export type { Atom } from "./useAtom";
```

---

**User**

@useAtom.ts 을 지우고 해당 내용을 @index.ts 로 옮겨줘

---

**Cursor**

```typescript
import { useSyncExternalStore, useCallback } from "react";
import { get, set, subscribe, type Atom } from "sangtae-js";

const useAtom = <T>(atom: Atom<T>): [T, (newValue: T) => void] => {
  const subscribeAtom = useCallback<Parameters<typeof useSyncExternalStore>[0]>(
    (onStoreChange) => subscribe(atom, onStoreChange),
    [atom]
  );

  const getSnapshot = useCallback(() => get(atom), [atom]);

  const setValue = useCallback((newValue: T) => set(atom, newValue), [atom]);

  const value = useSyncExternalStore(subscribeAtom, getSnapshot, getSnapshot);

  return [value, setValue];
};

export { useAtom };
export default useAtom;
export type { Atom };

```

요청대로 `@sangtae-react/src/index.ts`에 `useAtom` 구현 옮겼고, `useAtom.ts` 파일은 삭제했어. 필요하면 지금 상태에서 다시 빌드 한 번 돌려봐.

---

**User**

정상적으로 동작하는거 확인하였어

그럼 @sangtae-vue 도 만들어줄래?

sample-app-vue에 있는 useAtom.ts를 옮기면 될것같아

---

**Cursor**

```json
{
  "name": "project",
  "version": "1.0.0",
  "private": true,
  "workspaces": [
    "@sangtae-js",
    "@sangtae-react",
    "@sangtae-vue",
    "sample-app-react",
    "sample-app-vue"
  ],
  "devDependencies": {
    "typescript": "^5.9.3"
  },
  "scripts": {
    "install:all": "npm install",
    "build": "npm run build --workspace=@sangtae-js",
    "build:watch": "npm run build-watch --workspace=@sangtae-js",
    "dev:react": "npm run dev --workspace=sample-app-react",
    "dev:vue": "npm run dev --workspace=sample-app-vue"
  },
  "author": "foreverchoi0706",
  "license": "ISC",
  "description": "Monorepo for sangtae-js state management library"
}

```

```json
{
  "name": "sangtae-vue",
  "version": "0.1.0",
  "type": "module",
  "main": "./dist/index.cjs",
  "module": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js",
      "require": "./dist/index.cjs"
    }
  },
  "files": ["dist"],
  "scripts": {
    "build": "tsup",
    "build:watch": "tsup --watch"
  },
  "peerDependencies": {
    "vue": ">=3.0.0"
  },
  "dependencies": {
    "vue": "^3.5.22",
    "sangtae-js": "*"
  },
  "devDependencies": {
    "tsup": "^8.5.0",
    "typescript": "^5.9.3"
  }
}
```

```jsonc
{
  "compilerOptions": {
    "target": "ES2020",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "declaration": true,
    "sourceMap": true,
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

```typescript
import { defineConfig } from "tsup";

export default defineConfig(({ watch }) => ({
  entry: ["src/index.ts"],
  format: ["cjs", "esm"],
  dts: true,
  sourcemap: true,
  splitting: false,
  outDir: "dist",
  minify: !watch,
  clean: !watch,
  treeshake: true,
  external: ["vue", "sangtae-js"],
}));
```

```typescript
import { ref, onUnmounted } from "vue";
import { get, set, subscribe, type Atom } from "sangtae-js";

const useAtom = <T>(atom: Atom<T>) => {
  let initialValue: T;

  try {
    initialValue = get(atom);
  } catch (promise) {
    if (promise instanceof Promise) {
      initialValue = undefined as unknown as T;
    } else {
      throw promise;
    }
  }

  let unsubscribe: (() => void) | undefined;

  const value = ref<T>(initialValue);

  const updateValue = () => {
    try {
      value.value = get(atom);
    } catch (promise) {
      if (!(promise instanceof Promise)) {
        throw promise;
      }
    }
  };

  try {
    unsubscribe = subscribe(atom, updateValue);
  } catch (promise) {
    if (promise instanceof Promise) {
      promise.then(() => {
        unsubscribe = subscribe(atom, updateValue);
      });
    } else {
      throw promise;
    }
  }

  onUnmounted(() => {
    unsubscribe?.();
  });

  const setValue = (newValue: T) => {
    set(atom, newValue);
  };

  return [value, setValue] as const;
};

export { useAtom };
export type { Atom };
```

## 요약
- 루트 `package.json`에 `@sangtae-vue` 워크스페이스 추가했고 디렉터리 구조 `@sangtae-vue/src`까지 잡아놨어.
- `@sangtae-vue/package.json`, `tsconfig.json`, `tsup.config.ts`를 만들어서 Vue 3 이상을 peer로, `vue ^3.5.22`와 `sangtae-js`를 의존성으로 설정했어.
- `sample-app-vue`의 `useAtom` 로직을 `@sangtae-vue/src/index.ts`로 옮기고 `useAtom`과 `Atom` 타입을 내보내도록 했어.

```1:39:@sangtae-vue/src/index.ts
import { ref, onUnmounted } from "vue";
import { get, set, subscribe, type Atom } from "sangtae-js";
...
export { useAtom };
export type { Atom };
```

- `npm run build --workspace=@sangtae-vue` 실행해서 번들/타입 출력까지 확인 완료했어.

## 다음 단계
- `sample-app-vue`가 새 패키지를 사용하도록 import 경로만 정리해주면 돼.
- 필요하면 두 샘플 앱에서 실제 동작 테스트 한 번씩 돌려봐.

```typescript
import { ref, onUnmounted } from "vue";
import { get, set, subscribe, type Atom } from "sangtae-js";
...
export { useAtom };
export type { Atom };
```

