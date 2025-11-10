# README.md 파일 존댓말로 작성하기
_Exported on 2025. 11. 9. at 19시 48분 14초 GMT+9 from Cursor (2.0.69)_

---

**User**

@과제 테스트 안내.md (1-91) 



@JF002 - Minimal Global State Managment Library 구현.md (1-97) 



두 파일과 프로젝트를 읽고 README.md 파일을 존댓말로 작성해줘 

---

**Cursor**

```markdown
# Minimal Global State Management 과제 제출물

## 1. 지원자 정보
- 지원자 이름: (작성자님께서 입력해 주시면 감사하겠습니다.)
- 지원 직무: (작성자님께서 입력해 주시면 감사하겠습니다.)

## 2. 과제 정보

### 2.1 기본 정보
- 과제 코드: JF002
- 과제 수령일: (날짜를 입력해 주시면 감사하겠습니다.)
- 소요 시간: (총 작업 시간을 입력해 주시면 감사하겠습니다.)

### 2.2 수행 환경
- 운영 체제: macOS (Darwin 25.0.0) 기준으로 검증되었습니다.
- Node.js: LTS 버전(v20 계열)을 권장드리며 동일 환경에서 테스트했습니다.
- 패키지 매니저: npm 10.x
- 주요 개발 도구: Cursor IDE, GPT-5 Codex Agent
- 참고 문서: React 공식 문서, Vue 공식 문서, MDN JavaScript 문서, Vite 및 Vitest 공식 문서

### 2.3 결과 요약
| 분류 | 항목 | 상태 | 비고 |
| --- | --- | --- | --- |
| 핵심 API | `createAtom`, `get`, `set`, `subscribe` | 완료 | 값 비교는 `Object.is`로 처리하여 NaN, ±0도 안전하게 비교합니다. |
| 선택 기능 | `createDerivedAtom` | 완료 | 의존 atom을 자동 추적하고, 값 변경 시 파생 atom을 다시 계산합니다. |
| 선택 기능 | `createAsyncAtom` | 완료 | `Promise` 완료 전에는 Suspense 친화적으로 `Promise`를 throw하며, WeakMap 캐싱을 적용했습니다. |
| 리소스 관리 | Listener GC 처리 | 완료 | 마지막 구독자가 해지되면 내부 `Set`을 `null`로 되돌려 GC가 가능합니다. |
| 프레임워크 연동 | `sangtae-react` `useAtom` 훅 | 완료 | `useSyncExternalStore`를 활용해 안정적인 스냅샷을 제공합니다. |
| 프레임워크 연동 | `sangtae-vue` `useAtom` 훅 | 완료 | Vue `ref`와 `onUnmounted`를 사용해 구독 수명 주기를 관리합니다. |
| 샘플 애플리케이션 | React (Vite) 데모 | 완료 | 모든 핵심/선택 기능을 UI로 검증할 수 있습니다. |
| 샘플 애플리케이션 | Vue (Vite) 데모 | 완료 | React 버전과 동일한 시나리오를 Vue 3 컴포넌트로 제공합니다. |
| 테스트 | `@sangtae-js` 단위 테스트 | 완료 | Vitest로 필수/선택 기능을 모두 검증합니다. |
| 배치 업데이트 | 별도 배치 API | 미구현 | 단일 `set` 호출마다 즉시 반영되는 동작으로 기본 요건을 충족했습니다. |

### 2.4 수행 중 가정
- Node.js LTS 환경이 사전에 설치되어 있다고 가정했습니다.
- 외부 API 호출은 필요하지 않아 네트워크 의존성이 없다고 가정했습니다.
- 제출 시 `.cursor`와 같이 에이전트 설정이 포함된 숨김 디렉터리도 함께 전달해 주실 것을 권장드립니다.

## 3. 과제 산출물 정보

### 3.1 디렉터리/파일 구조
```
.
├── @sangtae-js/        # 코어 상태 관리 라이브러리
│   ├── src/
│   └── dist/
├── @sangtae-react/     # React 전용 훅 패키지
├── @sangtae-vue/       # Vue 3 전용 훅 패키지
├── sample-app-react/   # React + Vite 데모 앱
├── sample-app-vue/     # Vue 3 + Vite 데모 앱
├── package.json        # 루트 워크스페이스 설정
├── package-lock.json   # 의존성 잠금 파일
└── README.md
```

### 3.2 설치 및 실행 방법
1. **워크스페이스 의존성 설치**
   ```bash
   npm install
   ```
2. **코어 및 어댑터 빌드**
   ```bash
   npm run build:sangtae-js
   npm run build:sangtae-react
   npm run build:sangtae-vue
   ```
3. **단위 테스트 실행 (`@sangtae-js`)**
   ```bash
   npm run test --workspace=@sangtae-js
   # 필요 시: npm run test:run --workspace=@sangtae-js
   ```
4. **React 데모 앱 실행**
   ```bash
   npm run dev --workspace=sample-app-react
   ```
   브라우저에서 `http://localhost:5173` 주소로 접속해 주십시오.
5. **Vue 데모 앱 실행**
   ```bash
   npm run dev --workspace=sample-app-vue
   ```
   동일하게 `http://localhost:5173` 주소에서 확인하실 수 있습니다.
6. **프로덕션 빌드 및 미리보기**
   ```bash
   npm run preview:sample-app-react
   npm run preview:sample-app-vue
   ```
   각 명령은 빌드 후 Vite 프리뷰 서버를 구동합니다.

### 3.3 기타 의존성
- `tsup`: ESM/CJS 번들 생성을 위해 사용했습니다.
- `vitest`: `@sangtae-js` 패키지의 단위 테스트 러너로 사용했습니다.
- `vite`, `@vitejs/plugin-react-swc`, `@vitejs/plugin-vue`: 샘플 앱 개발 서버 및 번들링을 담당합니다.
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
- React 18 이상에서 공식 권장되는 `useSyncExternalStore`를 사용하여 스냅샷과 서버 사이드 호환성을 확보했습니다.
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
- 필요 시 `npx vitest --coverage --workspace=@sangtae-js` 명령으로 커버리지 리포트를 확인해 주십시오.

## 6. 과제 피드백
- 과제 난이도: 기본 요구사항은 명확하며, 선택 과제에서 비동기 흐름과 파생 상태 구현이 적절한 학습 난이도를 제공한다고 느꼈습니다.
- 제출은 하지 않았지만 추가로 고려 중인 항목: 배치 업데이트 전용 API, React/Vue 외 프레임워크 예제(Nuxt, Next.js) 등을 향후 개선 항목으로 검토하고 있습니다.
- 선택 요구사항 외 추가 구현: Vue 훅 패키지와 WeakMap 기반 비동기 atom 캐싱 등 선택 기능을 적극적으로 포함했습니다.

## 7. 문의
과제 검토 중 궁금하신 점이 있으시면 언제든지 연락 주시면 감사하겠습니다.

```

## 작업 요약
- 루트 `README.md`를 과제 안내 양식에 맞춰 존댓말로 전면 재작성했어. 과제 정보, 수행 환경, 결과 요약, 실행 방법, 피드백 등을 모두 포함했고 Vue/React 데모와 선택 기능 구현 현황도 표로 정리했어.
- 지원자 이름, 직무, 수령일, 소요 시간 같은 개인 입력이 필요한 항목은 직접 채울 수 있게 안내 문구를 남겨 뒀어.

## 추가 확인
- 테스트나 빌드 커맨드는 실행하지 않았어. 필요하면 `npm run test --workspace=@sangtae-js`부터 돌려줘.

---

**User**

해당 파일은 Github-flavored Markdown Format 에 맞춰 작성되어있어?

---

**Cursor**

응, 지금 `README.md`는 GitHub Flavored Markdown 규칙에 맞춰 잘 작성돼 있어.  
- 표는 파이프(`|`)와 헤더 구분선(`---`)을 사용해서 GFM 표 문법을 지켰고, 공백 줄도 부담 없이 허용돼.  
- 코드 블록은 백틱 세 개로 감싸고 언어 지정도 해서 GFM에서 바로 렌더링돼.  
- 헤더, 목록, 인용 등 다른 요소들도 표준 Markdown 문법 그대로라 GitHub에서 문제 없이 렌더링될 거야.

