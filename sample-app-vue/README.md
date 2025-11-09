# Minimal Global State Sample App (Vue)

이 프로젝트는 `sangtae-js` Minimal Global State 라이브러리의 필수 기능을 한눈에 시연할 수 있도록 구성된 Vue 3 + Vite 예제 앱이다. 단일 데모 페이지에서 `createAtom`, `createDerivedAtom`, `createAsyncAtom`, `set`, `get`, `subscribe`, `useAtom` 등의 핵심 API를 인터랙티브하게 체험할 수 있다.

## 실행 방법

```bash
npm install
npm run dev
```

이후 브라우저에서 `http://localhost:5173`에 접속하면 된다.

## 화면 구성

### 데모 (`/`)

- **Atom 값/업데이트 카드**  
  `createAtom`으로 만든 카운터 상태를 여러 컴포넌트에서 `useAtom`으로 구독한다.  
  `같은 값으로 set` 버튼을 눌러도 렌더 배지가 증가하지 않는 것을 통해, 값이 변하지 않으면 구독자가 알림을 받지 않는다는 사실을 확인할 수 있다.

- **스텝 Atom & 파생 Atom**  
  별도의 `step` Atom과 `createDerivedAtom`으로 만든 두 배 카운터 값을 별도 카드로 분리했다. 특정 Atom을 구독하는 컴포넌트만 다시 렌더링되는 모습을 렌더 배지에서 확인할 수 있다.

- **createAsyncAtom 카드**  
  `createAsyncAtom`에 Promise를 전달해 가짜 원격 데이터를 가져오고, 로딩 상태 → 완료 상태 전환을 확인할 수 있다. 새로고침 버튼으로 Promise를 다시 생성하여 흐름을 반복 확인할 수 있고, 가져온 데이터는 `set`으로 즉시 수정 가능하다.

- **요약 카드**  
  `get`을 통해 Vue 컴포넌트 밖에서도 스냅샷을 읽어올 수 있음을 보여주기 위해 "현재 상태 콘솔로 확인" 버튼을 제공한다. 콘솔에서 `createDerivedAtom`이 결괏값을 어떻게 묶어주는지 확인하면 된다.

- **수동 구독 카드**  
  `subscribe`를 사용해 카운터 변경 이력을 쌓는다. "구독 해제" 버튼을 누르면 내부 listener Set이 정리되고, 다시 구독을 시작하면 최초 값부터 다시 누적되는 모습을 볼 수 있다.

## 확인 팁

- 데모 페이지에서는 Vue Devtools의 component highlighter를 사용하면 어떤 카드가 다시 그려지는지 직관적으로 확인할 수 있다.
- 수동 구독 카드에서 구독을 해제하면 리스트가 초기화되며, 다시 구독을 누르면 `subscribe` 등록 시 바로 현재 값이 한 번 실행된다는 것을 확인할 수 있다.
- README와 함께 `Design.md`(별도 문서)를 참고하면 라이브러리 설계 의도와 API 사용 패턴을 더 쉽게 설명할 수 있다.
