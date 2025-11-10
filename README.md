# Minimal Global State Management 과제 제출물

## 1. 지원자 정보

- 지원자 이름: 최영원
- 지원 직무: SaaS 프론트엔드 개발자

## 2. 과제 정보

### 2.1 기본 정보

- 과제 코드: JF002
- 과제 수령일: 2025.11.05
- 과제 제출일: 2025.11.11
- 소요 시간: 약 18~20시간

### 2.2 수행 환경

- 운영 체제: macOS (Darwin 25.0.0) 기준으로 검증되었습니다.
- Node.js: LTS 버전(v24 계열)을 권장드리며 동일 환경에서 테스트했습니다.
- 패키지 매니저: npm 10.9.3
- 주요 개발 도구: Cursor IDE, GPT-5 Codex Agent
- 참고 문서: React 공식 문서, Vue 공식 문서, MDN JavaScript 문서, Javascript.info 문서, Vite 및 Vitest 공식 문서

### 2.3 참고사항

- 프로젝트 내 `@sangtae-js`, `@sangtae-react`, `@sangtae-vue`는 각각 패키지화 가능한 독립적인 프로젝트로 구축하였으며
  패키지 관리의 편의상 npm workspace 를 사용 각각의 프로젝트들을 연동하였습니다.
- 현재 작업 환경에서는 별도의 MCP 서버를 설치하거나 구동하지 않았습니다.
- <a href="./DESIGN.md">DESGIN.md</a> 내 다이어그램은 mermaid로 작성되어있습니다 관련 확장 프로그램 설치를 권장드립니다.

### 2.3 결과 요약

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

### 2.4 수행 중 가정

- Node.js LTS 환경이 사전에 설치되어 있다고 가정했습니다.
- 요구사항 중 **값이 이전과 달라졌을 경우에만** 의 기준은 참조가 다르면 값이 다르다고 가정하였습니다.
- 불변성 유지하도록 설계 및 유도하였습니다.
- React 관련 요구사항은 React 18버전 이상의 환경에서 동작되는 것으로 가정하였습니다. (peerDependencies "react": ">=18.0.0")
- Vue 연동은 Vue3 환경에서 동작되는 것으로 가정하였습니다. (peerDependencies "vue": ">=3.0.0")

## 3. 과제 산출물 정보

### 3.1 디렉터리/파일 구조

<pre>
.
├── @sangtae-js        # 코어 상태 관리 라이브러리
│   ├── src
│   ├── dist
│   ├── <a href="./@sangtae-js/README.md">README.md</a>
│   └── ...
├── @sangtae-react     # React 전용 훅 라이브러리
│   ├── src
│   ├── dist
│   ├── <a href="./@sangtae-react/README.md">README.md</a>
│   └── ...
├── @sangtae-vue       # Vue 3 전용 훅 라이브러리
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
└── prompt      #ai 협업 프롬프트 파일
</pre>

### 3.2 설치 및 실행 방법

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

### 3.3 기타 의존성

- `tsup`: ESM/CJS 번들 생성을 위해 사용했습니다.
- `vitest`: `@sangtae-js` 패키지의 단위 테스트 러너로 사용했습니다.
- `vite`, `@vitejs/plugin-react-swc`, `@vitejs/plugin-vue`: 데모 앱 개발 서버 및 번들링을 담당합니다.
- `vue-tsc`: Vue 프로젝트의 타입 검사를 위해 사용했습니다.
- `eslint` (React 앱): 개발 중 정적 분석을 수행할 수 있도록 설정했습니다.

## 4. 라이브러리 및 샘플 앱 설명

### 4.1 `sangtae-js`

- Atom은 `Symbol` 기반의 은닉 필드를 사용해 현재 값과 구독자 집합을 관리합니다.
- `set` 호출 시 `Object.is` 비교를 통해 동일 값 업데이트를 방지하며, 구독자는 변경 시점에만 호출됩니다.
- `subscribe`는 등록 즉시 최신 값을 한 번 호출하며, 마지막 구독자가 해지되면 내부 `Set`을 `null`로 되돌려 메모리 누수를 방지합니다.
- `createDerivedAtom`은 의존 atom을 자동으로 추적하고 변경 시 재계산하며, 중복 알림을 방지합니다.
- `createAsyncAtom`은 WeakMap 캐시, Suspense 대응 throw, `set`을 통한 수동 완료 등 비동기 흐름을 지원합니다.

### 4.2 `sangtae-react`

- React 18 이상에서 공식 권장되는 `useSyncExternalStore`를 사용하여 스냅샷 싱크과 호환성을 확보했습니다.
- Setter는 `sangtae-js`의 `set`을 그대로 위임하여 API 일관성을 유지했습니다.

### 4.3 `sangtae-vue`

- Vue 3 `ref`로 상태를 래핑하고, `subscribe` 해지 로직을 `onUnmounted`에 연결했습니다.
- `createAsyncAtom`과 함께 사용할 때 `Promise`를 throw하는 상황을 고려해 안전하게 초기값을 처리합니다.

### 4.4 샘플 애플리케이션

- React/Vue 데모 모두 동일한 시나리오(카운터, 파생 상태, 비동기 상태, 수동 구독)를 제공하여 프레임워크별 동작을 비교하실 수 있습니다.
- 컴포넌트별 렌더 횟수를 뱃지 형태로 시각화하여 최소 렌더 전략이 제대로 작동하는지 확인할 수 있습니다.

## 5. 테스트 및 검증

- `@sangtae-js/src/index.test.ts`에서 필수 및 선택 기능을 모두 검증했습니다.
- 비동기 atom 시나리오는 `Promise` 해결/거부, 캐싱, 수동 `set`까지 포함합니다.

## 6. 과제 피드백

- 과제 난이도: 요구사항은 명확하고 직관적이며, 선택 과제에서 비동기 흐름과 파생 상태 구현이 적절한 난이도를 제공한다고 느꼈습니다.
- 제출은 하지 않았지만 추가로 고려 중인 항목:
  - key 값을 파라미터로 추가하여 캐시 매니징을 통한 자동 업데이트 등을 고려해볼 수 있을 것 같습니다.
  - Nextjs 서버사이드용 함수를 구현하여 서버에서 생성한 Atom을 서버 -> 클라이언트에 동기화 시킬 수도 있을 것같습니다.
- 선택 요구사항 외 추가 구현: `getAsync` 헬퍼를 제공해 `createAsyncAtom`으로 생성한 Atom도 순수 async/await로 소비할 수 있도록 했습니다. 이를 통해 React Suspense가 없는 환경에서도 동일 로직을 재사용할 수 있고, `Promise`를 직접 다루지 않아도 되므로 호출부 복잡도를 낮춥니다.
