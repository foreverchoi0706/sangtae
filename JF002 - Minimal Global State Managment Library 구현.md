# Minimal Global State Managment 구현

## Overview

이 과제는 React에서 사용할 수 있는 최소 기능의 전역 상태 관리 기능을 라이브러리 형태로 직접 구현하는 프로젝트입니다. 외부 상태 관리 라이브러리를 사용하지 않고 직접 코드를 구현하는 과정을 통해, 상태 관리와 React Hook에 대한 이해도, 라이브러리 설계 및 구현 능력을 종합적으로 평가하고자 합니다.

## 기능 요구 사항 - 필수

다음 필수 요구사항을 만족하는 상태 관리 라이브러리와, 라이브러리의 기능을 테스트/시연할 수 있는 예제 app을 만들어 제출하세요.

### 1. Atom 생성 및 관리

Atom은 상태를 저장하는 최소 단위입니다. 특정 초기값(`initialValue`)을 가지며, 이 값을 읽거나 새로운 값으로 쓸 수 있어야 합니다.

**API 명세:**

- `createAtom(initialValue: T): Atom<T>`
  - 초기값을 받아 새로운 atom을 생성합니다.
- `get(atom: Atom<T>): T`
  - atom의 현재 상태 값을 반환합니다.
- `set(atom: Atom<T>, newValue: T): void`
  - atom의 값을 `newValue`로 업데이트합니다.
  - 값이 **이전과 달라졌을 경우에만** 이 변화를 구독하는 대상에게 알려야 합니다.

### 2. 구독자 관리 및 상태 제공자

구독자 관리 및 react render trigger를 추상화하는 계층으로, 전역 store나 context 없이도 atom 단위로 구독자를 관리할 수 있어야 합니다.

- 각 atom 은 자체적으로 구독자 목록(Set)을 관리합니다.
- Redux 의 provider 처럼 global 하게 관리하지 않고, atom-local scope 로 관리됩니다.
- useAtom 에서 렌더 트리거를 구독자로 등록하면 component를 re-rendering 합니다.
- GC-friendly 하게 작성되어, unsubscribe 시 내부 메모리도 함께 정리해야 합니다.

### 3. 구독(subscribe) API

atom의 값이 변경되었을 때, 등록된 콜백 함수를 실행하는 기능입니다.

**API 명세:**

- `subscribe(atom: Atom<T>, callback: (value: T) => void): () => void`
  - `callback` 함수를 해당 atom의 구독자로 등록합니다. atom의 값이 변경되면 이 `callback`이 실행됩니다.
  - 이 함수는 **구독을 해지하는 함수(`unsubscribe`)를 반환**해야 합니다.

**구독 조건**:

- `set` 호출 시 **값이 이전 상태와 다를 경우에만** 구독자에게 알려줍니다.
- 동일한 값으로 `set`하는 경우, callback 호출 없이 무시되어야 합니다.

### 4. React 연동

React 컴포넌트에서 atom의 상태를 사용하고 업데이트할 수 있는 커스텀 훅(`useAtom`)을 구현합니다.

**API 명세:**

- `useAtom(atom: Atom<T>): [T, (newValue: T) => void]`
  - 인자로 받은 atom의 현재 상태 값과, 그 값을 변경할 수 있는 `setter` 함수를 배열 형태로 반환합니다.
  - `useAtom`을 사용하는 컴포넌트는 atom의 값이 변경될 때마다 리렌더링되어야 합니다.

**렌더링 조건:**

- atom의 값이 변경되면, 해당 atom을 사용하는 component만 re-rendering 됩니다.
- `useEffect` 또는 `useSyncExternalStore`로 구독/해제를 관리할 수 있어야 합니다.

## 기능 요구 사항 - 선택

아래는 필수 요구사항을 충족한 후 추가적으로 구현을 시도해볼 수 있는 고급 기능들입니다.

| 기능                   | 설명                                                                                          |
| ---------------------- | --------------------------------------------------------------------------------------------- |
| **파생 Atom**          | `createDerivedAtom(get => get(atomA) + get(atomB))` 형식으로 계산된 상태 생성                 |
| **비동기 Atom**        | `createAsyncAtom(Promise)` 기반으로 비동기 로직 처리. Suspense 대응 가능.                     |
| **배치 업데이트**      | `set(atomA, 1); set(atomB, 2);` 와 같이 일괄 처리될 때 `useAtom`이 한 번만 리렌더링 되도록 함 |
| **메모리 관리**        | 마지막 구독자가 `unsubscribe`하면 atom의 내부 listener Set도 GC 대상에 포함                   |
| **Frameworkless 사용** | React 외 환경 (예 - vue.js ) 에서도 `get`, `set`, `subscribe`만으로 상태 관리 가능            |

## 비 기능 요구 사항 및 기타 제약 사항

- 만들어진 상태 관리 기능을 이용하여 실제 동작을 테스트해볼 수 있는 app이 제출물에 포함되어야 합니다.

- 상태 관리 라이브러리는 시연 app 에서 쉽게 독립된 npm 등의 형태로 분리할 수 있는 구조를 유지하여야 하며, API Interface는 jsdoc/tsdoc 등의 형태로 분명하게 문서화 되어야 합니다.

- README.md 파일은 과제 안내 문서에 따라 상세하게 작성되어야 합니다.

- API를 어떻게 설계/구현하였는지, 자세한 설계 문서를 DESIGN.md 파일로 포함해야 합니다.

  - 구현된 선택 요구사항을 포함하여 라이브러리를 설계할 때 고려한 사항과 구조/설계상의 기술적 선택에 대한 설명
  - 원자 상태(Atom)/구독 시스템이 구현된 구조 설명 - 텍스트 또는 그림/사진등 자유롭게 기술 가능
  - 원자 상태의 값이 같은지를 비교하는 방식이 어떻게 구현되었는지에대한 설명(특히 최적화 방식에 대한 설명)
  - React와 연동할 때 발생했던 문제를 포함하여 구현중 발생했던 문제들과 이를 해결한 방법 (별도 문서로 분리 가능)

## 필수 산출물

- README.md 및 빌드/실행을 위한문서 일체
- 프로그램 소스 코드 (sample app 포함)
- DESIGN.md 및 이에 포함되는 이미지/부속 문서등 첨부 파일들
- AI Agent를 사용한 경우 해당 Agent들에 대한 workspace-level 설정 파일 일체
