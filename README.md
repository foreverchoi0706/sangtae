> 📖 **[소개 페이지](https://foreverchoi0706.github.io/sangtae/)**

## Overview

이 프로젝트는 React에서 사용할 수 있는 최소 기능의 전역 상태 관리 기능을 라이브러리 형태로 직접 구현하는 프로젝트입니다. 외부 상태 관리 라이브러리를 사용하지 않고 직접 코드를 구현하는 과정을 통해, 상태 관리와 React Hook에 대한 이해도, 라이브러리 설계 능력을 함양하고자 했습니다.

### Atom 생성 및 관리

Atom은 상태를 저장하는 최소 단위입니다. 특정 초기값(`initialValue`)을 가지며, 이 값을 읽거나 새로운 값으로 쓸 수 있습니다.

**API 명세:**

- `createAtom(initialValue: T): Atom<T>`
  - 초기값을 받아 새로운 atom을 생성합니다.
- `get(atom: Atom<T>): T`
  - atom의 현재 상태 값을 반환합니다.
- `set(atom: Atom<T>, newValue: T): void`
  - atom의 값을 `newValue`로 업데이트합니다.
  - 값이 **이전과 달라졌을 경우에만** 이 변화를 구독하는 대상에게 알립니다.

### 구독자 관리 및 상태 제공자

구독자 관리 및 react render trigger를 추상화하는 계층으로, 전역 store나 context 없이도 atom 단위로 구독자를 관리할 수 있습니다.

- 각 atom 은 자체적으로 구독자 목록(Set)을 관리합니다.
- Redux 의 provider 처럼 global 하게 관리하지 않고, atom-local scope 로 관리합니다.
- useAtom 에서 렌더 트리거를 구독자로 등록하면 component를 re-rendering 합니다.
- GC-friendly 하게 작성되어, unsubscribe 시 내부 메모리도 함께 정리됩니다.

### 구독(subscribe) API

atom의 값이 변경되었을 때, 등록된 콜백 함수를 실행하는 기능입니다.

**API 명세:**

- `subscribe(atom: Atom<T>, callback: (value: T) => void): () => void`
  - `callback` 함수를 해당 atom의 구독자로 등록합니다. atom의 값이 변경되면 이 `callback`이 실행됩니다.
  - 이 함수는 **구독을 해지하는 함수(`unsubscribe`)를 반환** 합니다.

**구독 조건**:

- `set` 호출 시 **값이 이전 상태와 다를 경우에만** 구독자에게 알려줍니다.
- 동일한 값으로 `set`하는 경우, callback 호출 없이 무시됩니다.

### React 연동

**API 명세:**

- `useAtom(atom: Atom<T>): [T, (newValue: T) => void]`
  - 인자로 받은 atom의 현재 상태 값과, 그 값을 변경할 수 있는 `setter` 함수를 배열 형태로 반환합니다.
  - `useAtom`을 사용하는 컴포넌트는 atom의 값이 변경될 때마다 리렌더링됩니다.

**렌더링 조건:**

- atom의 값이 변경되면, 해당 atom을 사용하는 component만 re-rendering 합나디.
- `useEffect` 또는 `useSyncExternalStore`로 구독/해제를 관리합니다.

## 고급 기능

| 기능                   | 설명                                                                                          |
| ---------------------- | --------------------------------------------------------------------------------------------- |
| **파생 Atom**          | `createDerivedAtom(get => get(atomA) + get(atomB))` 형식으로 계산된 상태 생성                 |
| **비동기 Atom**        | `createAsyncAtom(Promise)` 기반으로 비동기 로직 처리. Suspense 대응 가능.                     |
| **배치 업데이트**      | `set(atomA, 1); set(atomB, 2);` 와 같이 일괄 처리될 때 `useAtom`이 한 번만 리렌더링 되도록 함 |
| **메모리 관리**        | 마지막 구독자가 `unsubscribe`하면 atom의 내부 listener Set도 GC 대상에 포함                   |
| **Frameworkless 사용** | React 외 환경 (예 - vue.js ) 에서도 `get`, `set`, `subscribe`만으로 상태 관리 가능            |

---

### 수행 환경

- 운영 체제: macOS (Darwin 25.0.0)
- Node.js: LTS 버전(v24 계열)을 권장드리며 동일 환경에서 개발,테스트했습니다.
- 패키지 매니저: npm 10.9.3
- 주요 개발 도구: Cursor IDE, GPT-5 Codex Agent
- 참고 문서: React 공식 문서, Vue 공식 문서, MDN JavaScript 문서, Javascript.info 문서, Vite 및 Vitest 공식 문서

### 참고사항

- 프로젝트 내 `@sangtae-js`, `@sangtae-react`, `@sangtae-vue`는 각각 패키지화 가능한 독립적인 프로젝트로 구축하였으며
  패키지 관리의 편의상 npm workspace 를 사용 각각의 프로젝트들을 연동하였습니다.
- 요구사항중 useAtom은 별도의 `@sangtae-react`에서 구현하였습니다.
- 현재 작업 환경에서는 별도의 MCP 서버를 설치하거나 구동하지 않았습니다.
- <a href="./DESIGN.md">DESGIN.md</a> 내 다이어그램은 mermaid로 작성되어있습니다 관련 확장 프로그램 설치를 권장드립니다.

### 결과 요약

| 분류              | 항목                                    | 상태 | 비고                                                                                                   |
| ----------------- | --------------------------------------- | ---- | ------------------------------------------------------------------------------------------------------ |
| 핵심 API          | `createAtom`, `get`, `set`, `subscribe` | 완료 | 값 비교는 `Object.is`로 처리하여 NaN, ±0도 안전하게 비교합니다.                                        |
| 선택 기능         | `createDerivedAtom`                     | 완료 | 의존 atom을 자동 추적하고, 값 변경 시 파생 atom을 다시 계산합니다.                                     |
| 선택 기능         | `createAsyncAtom`                       | 완료 | `Promise` 완료 전에는 Suspense 친화적으로 `Promise`를 throw하며, WeakMap 캐싱을 적용했습니다.          |
| 리소스 관리       | Listener GC 처리                        | 완료 | 마지막 구독자가 해지되면 내부 `Set`을 `null`로 되돌려 GC가 가능합니다.                                 |
| 프레임워크 연동   | `sangtae-react` `useAtom` 훅            | 완료 | `useSyncExternalStore`를 활용해 안정적인 스냅샷을 제공합니다.                                          |
| 프레임워크 연동   | `sangtae-vue` `useAtom` 훅              | 완료 | Vue `ref`와 `onUnmounted`를 사용해 구독 수명 주기를 관리합니다.                                        |
| 샘플 애플리케이션 | React (Vite) 데모                       | 완료 | 모든 핵심/선택 기능을 UI로 검증할 수 있습니다.                                                         |
| 샘플 애플리케이션 | Vue (Vite) 데모                         | 완료 | React 버전과 동일한 시나리오를 Vue 3 컴포넌트로 제공합니다.                                            |
| 테스트            | `@sangtae-js` 단위 테스트               | 완료 | Vitest로 필수/선택 기능을 모두 검증합니다.                                                             |
| 배치 업데이트     | 별도 배치 API                           | 완료 | react에서 제공되는 API와 useAtom을 연동하여 별도의 배치 API 구현 없이 해당 기능 구현을 만족하였습니다. |

### 가정

- Node.js LTS 환경이 사전에 설치되어 있다고 가정했습니다.
- 요구사항 중 **값이 이전과 달라졌을 경우에만** 의 기준은 참조가 다르면 값이 다르다고 가정하였습니다.
- 불변성 유지하도록 설계 및 유도하였습니다.
- React 관련 요구사항은 React 18버전 이상의 환경에서 동작되는 것으로 가정하였습니다. (peerDependencies "react": ">=18.0.0")
- Vue 연동은 Vue3 환경에서 동작되는 것으로 가정하였습니다. (peerDependencies "vue": ">=3.0.0")

## 산출물 정보

### 3.1 디렉터리/파일 구조

<pre>
.
├── @sangtae-js        # 코어 상태 관리 라이브러리
│   ├── src
│   ├── dist
│   ├── <a href="./@sangtae-js/README.md">README.md</a>
│   └── ...
├── @sangtae-react     # React 전용 훅 라이브러리 (useAtom)
│   ├── src
│   ├── dist
│   ├── <a href="./@sangtae-react/README.md">README.md</a>
│   └── ...
├── @sangtae-vue       # Vue 3 전용 훅 라이브러리 (useAtom)
│   ├── src
│   ├── dist
│   ├── <a href="./@sangtae-vue/README.md">README.md</a>
│   └── ...
├── sample-app-react   # React + Vite 데모 앱
├── sample-app-vue     # Vue 3 + Vite 데모 앱
├── <a href="./package.json">package.json</a>        # 루트 워크스페이스 설정
├── <a href="./package-lock.json">package-lock.json</a>   # 의존성 잠금 파일
├── <a href="./README.md">README.md</a>        # 프로젝트 설명 파일
├── <a href="./DESIGN.md">DESIGN.md</a>        # 프로젝트 설계 파일
├── <a href="./agent-config.yaml">agent-config.yaml</a>        # 에이전트 설정 및 과제 시 가이드라인 파일
└── prompt      #ai 협업 프롬프트 폴더
</pre>

### 설치 및 실행 방법

- 아래 명령어는 루트의 <a href="./package.json">pakage.json</a> 실행가능합니다

1. **프로젝트 워크스페이스 의존성 설치**
   ```bash
   npm run install:all
   ```
2. **sangtae-js, sangtae-react, sangtae-vue 빌드**
   ```bash
   npm run build:all
   ```
3. **단위 테스트 실행 (`@sangtae-js`)**
   ```bash
   npm run test --workspace=@sangtae-js
   # 필요 시: npm run test:run --workspace=@sangtae-js
   ```
4. **React 데모 앱 실행**
   ```bash
   npm run preview:sample-app-react
   ```
   브라우저에서 http://localhost:4173 주소에서 확인하실 수 있습니다.
5. **Vue 데모 앱 실행**
   ```bash
   npm run preview:sample-app-vue
   ```
   브라우저에서 http://localhost:4174 주소에서 확인하실 수 있습니다.

### 기타 의존성

- `tsup`: ESM/CJS 번들 생성을 위해 사용했습니다.
- `vitest`: `@sangtae-js` 패키지의 단위 테스트 러너로 사용했습니다.
- `vite`, `@vitejs/plugin-react-swc`, `@vitejs/plugin-vue`: 데모 앱 개발 서버 및 번들링을 담당합니다.
- `vue-tsc`: Vue 프로젝트의 타입 검사를 위해 사용했습니다.
- `eslint` (React 앱): 개발 중 정적 분석을 수행할 수 있도록 설정했습니다.

## 라이브러리 및 샘플 앱 설명

### `sangtae-js`

- Atom은 `Symbol` 기반의 은닉 필드를 사용해 현재 값과 구독자 집합을 관리합니다.
- `set` 호출 시 `Object.is` 비교를 통해 동일 값 업데이트를 방지하며, 구독자는 변경 시점에만 호출됩니다.
- `subscribe`는 등록 즉시 최신 값을 한 번 호출하며, 마지막 구독자가 해지되면 내부 `Set`을 `null`로 되돌려 메모리 누수를 방지합니다.
- `createDerivedAtom`은 의존 atom을 자동으로 추적하고 변경 시 재계산하며, 중복 알림을 방지합니다.
- `createAsyncAtom`은 WeakMap 캐시, Suspense 대응 throw, `set`을 통한 수동 완료 등 비동기 흐름을 지원합니다.

### `sangtae-react`

- React 18 이상에서 공식 권장되는 `useSyncExternalStore`를 사용하여 스냅샷 싱크과 호환성을 확보했습니다.
- Setter는 `sangtae-js`의 `set`을 그대로 위임하여 API 일관성을 유지했습니다.

### `sangtae-vue`

- Vue 3 `ref`로 상태를 래핑하고, `subscribe` 해지 로직을 `onUnmounted`에 연결했습니다.
- `createAsyncAtom`과 함께 사용할 때 `Promise`를 throw하는 상황을 고려해 안전하게 초기값을 처리합니다.

### 샘플 애플리케이션

- React/Vue 데모 모두 동일한 시나리오(카운터, 파생 상태, 비동기 상태, 수동 구독)를 제공하여 프레임워크별 동작을 비교하실 수 있습니다.
- 컴포넌트별 렌더 횟수를 뱃지 형태로 시각화하여 최소 렌더 전략이 제대로 작동하는지 확인할 수 있습니다.

## 테스트 및 검증

- `@sangtae-js/src/index.test.ts`에서 필수 및 선택 기능을 모두 검증했습니다.
- 비동기 atom 시나리오는 `Promise` 해결/거부, 캐싱, 수동 `set`까지 포함합니다.
