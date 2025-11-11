# 최적화 가능성 검토하기

_Exported on 2025. 11. 8. at 20시 12분 0초 GMT+9 from Cursor (2.0.63)_

---

**User**

@index.ts (155-162)

이 부분 최적화의 여지가 있을까?

---

**Cursor**

코드 컨텍스트 확인 중.

최적화 여지 확인 중. 관련 코드 확인 중.

다음 최적화를 제안해:

## 최적화 제안

1. 타입 캐스팅 최소화: `atom`을 `InternalAtom<T>`로 한 번만 캐스팅해 변수에 저장
2. LISTENERS 중복 접근 방지: 한 번만 접근해 변수에 저장
3. null 체크 명시화: 옵셔널 체이닝 대신 명시적 null 체크

최적화된 코드:

```typescript
export const set = <T>(atom: Atom<T>, newValue: T) => {
  if (!Object.is(atom[VALUE], newValue)) {
    // 타입 캐스팅을 한 번만 수행
    const internalAtom = atom as InternalAtom<T>;
    internalAtom[VALUE] = newValue;

    // LISTENERS를 한 번만 접근하고 null 체크
    const listeners = internalAtom[LISTENERS];
    if (listeners !== null) {
      listeners.forEach((listener) => listener(newValue));
    }
  }
};
```

**개선 포인트:**

- 타입 캐스팅을 한 번만 수행해 오버헤드 감소
- `LISTENERS` 속성을 한 번만 접근해 중복 접근 방지
- 명시적 null 체크로 옵셔널 체이닝 오버헤드 제거

성능 차이는 미미하지만, 코드가 더 명확해져. 특히 `LISTENERS`가 `null`인 경우가 많다면 이 방식이 더 효율적이야.

다른 부분(55, 92, 133줄)도 동일한 패턴으로 최적화할 수 있어.

```typescript
export const set = <T>(atom: Atom<T>, newValue: T) => {
  if (!Object.is(atom[VALUE], newValue)) {
    // 타입 캐스팅을 한 번만 수행
    const internalAtom = atom as InternalAtom<T>;
    internalAtom[VALUE] = newValue;

    // LISTENERS를 한 번만 접근하고 null 체크
    const listeners = internalAtom[LISTENERS];
    if (listeners !== null) {
      listeners.forEach((listener) => listener(newValue));
    }
  }
};
```

---

**User**

불변 패턴을 지키지 않거나 내부 프로퍼티만 바뀌면 예측 불가능하거나 과도한 업데이트가 발생한다고 하는데 그 관점에서도 최적화할 필요가없는거야?

---

**Cursor**

불변성과 관련된 최적화 관점에서 코드 확인 중.

불변성 관점에서 확인 중. 현재 코드의 문제점을 파악 중.

불변성 관점에서 확인한 문제:

## 현재 코드의 문제점

### 1. **내부 프로퍼티 변경 감지 실패**

```typescript
const obj = { count: 1 };
set(atom, obj);
obj.count = 2; // 내부 변경
set(atom, obj); // 같은 참조라서 Object.is가 false 반환 → 업데이트 안 됨!
```

같은 객체 참조를 유지하면서 내부만 변경하면 `Object.is`로는 감지되지 않아 구독자에게 알림이 가지 않아.

### 2. **과도한 업데이트 발생**

```typescript
set(atom, { count: 1 }); // 참조 A
set(atom, { count: 1 }); // 참조 B (같은 내용이지만 다른 참조)
// Object.is(A, B) = false → 불필요한 업데이트 발생!
```

내용이 같아도 참조가 다르면 매번 업데이트가 발생해.

### 3. **불변성 패턴 위반**

현재는 `atom[VALUE]`를 직접 변경(mutation)하고 있어. 이는 불변성 원칙에 어긋나.

## 최적화 제안

다음과 같이 개선할 수 있어:

```typescript
export const set = <T>(atom: Atom<T>, newValue: T) => {
  const oldValue = atom[VALUE];

  // 1. 참조 비교 먼저 (빠른 경로)
  if (Object.is(oldValue, newValue)) {
    return; // 같은 참조면 즉시 반환
  }

  // 2. 객체/배열인 경우 얕은 비교 (선택적)
  // 단, 이건 성능 트레이드오프가 있어서 라이브러리 설계 철학에 따라 달라질 수 있음
  if (
    typeof oldValue === "object" &&
    oldValue !== null &&
    typeof newValue === "object" &&
    newValue !== null &&
    !Array.isArray(oldValue) &&
    !Array.isArray(newValue)
  ) {
    // 얕은 비교로 실제 변경 여부 확인
    const keysOld = Object.keys(oldValue);
    const keysNew = Object.keys(newValue);

    if (
      keysOld.length === keysNew.length &&
      keysOld.every((key) =>
        Object.is((oldValue as any)[key], (newValue as any)[key])
      )
    ) {
      return; // 실제로 변경되지 않았으면 반환
    }
  }

  // 3. 값 업데이트 및 알림
  const internalAtom = atom as InternalAtom<T>;
  internalAtom[VALUE] = newValue;

  const listeners = internalAtom[LISTENERS];
  if (listeners !== null) {
    listeners.forEach((listener) => listener(newValue));
  }
};
```

## 고려사항

1. 성능 vs 정확성: 깊은 비교는 비용이 크므로 얕은 비교만 적용하는 것도 방법이야.
2. 라이브러리 철학: Jotai/Zustand처럼 불변성 사용을 전제로 하면 현재 방식도 유효해.
3. Proxy 기반 감지: 객체 변경을 자동 감지하려면 Proxy가 필요하지만 복잡도가 올라가.

현재 테스트(103-112줄)는 참조 비교를 전제로 하므로, 불변성 사용을 전제로 한다면 현재 방식도 괜찮아. 다만 사용자 가이드에서 불변성 사용을 명확히 안내하는 게 중요해.

어떤 방향으로 개선할지 알려줘.

```typescript
const obj = { count: 1 };
set(atom, obj);
obj.count = 2; // 내부 변경
set(atom, obj); // 같은 참조라서 Object.is가 false 반환 → 업데이트 안 됨!
```

```typescript
set(atom, { count: 1 }); // 참조 A
set(atom, { count: 1 }); // 참조 B (같은 내용이지만 다른 참조)
// Object.is(A, B) = false → 불필요한 업데이트 발생!
```

```typescript
export const set = <T>(atom: Atom<T>, newValue: T) => {
  const oldValue = atom[VALUE];

  // 1. 참조 비교 먼저 (빠른 경로)
  if (Object.is(oldValue, newValue)) {
    return; // 같은 참조면 즉시 반환
  }

  // 2. 객체/배열인 경우 얕은 비교 (선택적)
  // 단, 이건 성능 트레이드오프가 있어서 라이브러리 설계 철학에 따라 달라질 수 있음
  if (
    typeof oldValue === "object" &&
    oldValue !== null &&
    typeof newValue === "object" &&
    newValue !== null &&
    !Array.isArray(oldValue) &&
    !Array.isArray(newValue)
  ) {
    // 얕은 비교로 실제 변경 여부 확인
    const keysOld = Object.keys(oldValue);
    const keysNew = Object.keys(newValue);

    if (
      keysOld.length === keysNew.length &&
      keysOld.every((key) =>
        Object.is((oldValue as any)[key], (newValue as any)[key])
      )
    ) {
      return; // 실제로 변경되지 않았으면 반환
    }
  }

  // 3. 값 업데이트 및 알림
  const internalAtom = atom as InternalAtom<T>;
  internalAtom[VALUE] = newValue;

  const listeners = internalAtom[LISTENERS];
  if (listeners !== null) {
    listeners.forEach((listener) => listener(newValue));
  }
};
```

---

**User**

이해했어. 그렇지만 해당 코드는 react 외에도 독립적으로 동작해야되기때문에

불변하지 않아도 내부 값이 변경되면 값을 변경해야해

---

**Cursor**

요구사항 확인: React 외부에서도 동작하고, 불변성을 지키지 않아도 내부 값 변경을 감지해야 함. 관련 문서와 현재 구현 확인 중.

불변성을 지키지 않아도 내부 변경을 감지해야 한다면, 두 가지 접근이 있어:

## 접근 방법

### 방법 1: `get`이 반환하는 객체를 Proxy로 감싸서 변경 감지

`get`이 객체를 반환할 때 Proxy로 감싸서, 직접 변경 시 자동으로 `set`을 호출:

```typescript
// 깊은 비교 유틸리티
function deepEqual(a: any, b: any): boolean {
  if (Object.is(a, b)) return true;

  if (
    a === null ||
    b === null ||
    typeof a !== "object" ||
    typeof b !== "object"
  ) {
    return false;
  }

  if (Array.isArray(a) !== Array.isArray(b)) return false;

  const keysA = Object.keys(a);
  const keysB = Object.keys(b);

  if (keysA.length !== keysB.length) return false;

  return keysA.every((key) => deepEqual(a[key], b[key]));
}

// Proxy로 객체 변경 감지
function createReactiveValue<T>(value: T, atom: InternalAtom<T>): T {
  if (typeof value !== "object" || value === null) {
    return value; // 원시 타입은 그대로 반환
  }

  return new Proxy(value as object, {
    set(target, property, newValue) {
      const oldValue = (target as any)[property];
      (target as any)[property] = newValue;

      // 내부 변경 감지 후 atom 업데이트
      const currentAtomValue = atom[VALUE];
      if (!deepEqual(currentAtomValue, target)) {
        atom[VALUE] = target as T;
        atom[LISTENERS]?.forEach((listener) => listener(target as T));
      }

      return true;
    },
  }) as T;
}

export const get = <T>(atom: Atom<T>): T => {
  const value = atom[VALUE];
  const internalAtom = atom as InternalAtom<T>;

  // 객체인 경우 Proxy로 감싸서 반환
  if (typeof value === "object" && value !== null) {
    return createReactiveValue(value, internalAtom);
  }

  return value;
};
```

### 방법 2: `set`에서 깊은 비교 수행 (더 실용적)

`set`에서 실제 내용 변경 여부를 확인:

```typescript
// 깊은 비교 유틸리티
function deepEqual(a: any, b: any): boolean {
  if (Object.is(a, b)) return true;

  if (
    a === null ||
    b === null ||
    typeof a !== "object" ||
    typeof b !== "object"
  ) {
    return false;
  }

  if (Array.isArray(a) !== Array.isArray(b)) return false;

  const keysA = Object.keys(a);
  const keysB = Object.keys(b);

  if (keysA.length !== keysB.length) return false;

  return keysA.every((key) => deepEqual(a[key], b[key]));
}

export const set = <T>(atom: Atom<T>, newValue: T) => {
  const oldValue = atom[VALUE];

  // 1. 참조 비교 (빠른 경로)
  if (Object.is(oldValue, newValue)) {
    return;
  }

  // 2. 객체/배열인 경우 깊은 비교
  if (
    typeof oldValue === "object" &&
    oldValue !== null &&
    typeof newValue === "object" &&
    newValue !== null
  ) {
    if (deepEqual(oldValue, newValue)) {
      return; // 실제로 변경되지 않았으면 반환
    }
  }

  // 3. 값 업데이트 및 알림
  const internalAtom = atom as InternalAtom<T>;
  internalAtom[VALUE] = newValue;

  const listeners = internalAtom[LISTENERS];
  if (listeners !== null) {
    listeners.forEach((listener) => listener(newValue));
  }
};
```

## 문제: 직접 변경은 여전히 감지 안 됨

```typescript
const obj = get(atom);
obj.count = 2; // 이건 여전히 감지 안 됨
```

이 경우는 방법 1(Proxy)이 필요해. 다만 성능과 복잡도가 올라가.

## 추천: 하이브리드 접근

1. `set`에서 깊은 비교로 불필요한 업데이트 방지
2. `get`이 객체를 반환할 때 Proxy로 감싸서 직접 변경 감지 (선택적)

어떤 방식을 원해? 방법 2만으로도 같은 내용의 객체로 인한 불필요한 업데이트는 막을 수 있어.

```typescript
// 깊은 비교 유틸리티
function deepEqual(a: any, b: any): boolean {
  if (Object.is(a, b)) return true;

  if (
    a === null ||
    b === null ||
    typeof a !== "object" ||
    typeof b !== "object"
  ) {
    return false;
  }

  if (Array.isArray(a) !== Array.isArray(b)) return false;

  const keysA = Object.keys(a);
  const keysB = Object.keys(b);

  if (keysA.length !== keysB.length) return false;

  return keysA.every((key) => deepEqual(a[key], b[key]));
}

// Proxy로 객체 변경 감지
function createReactiveValue<T>(value: T, atom: InternalAtom<T>): T {
  if (typeof value !== "object" || value === null) {
    return value; // 원시 타입은 그대로 반환
  }

  return new Proxy(value as object, {
    set(target, property, newValue) {
      const oldValue = (target as any)[property];
      (target as any)[property] = newValue;

      // 내부 변경 감지 후 atom 업데이트
      const currentAtomValue = atom[VALUE];
      if (!deepEqual(currentAtomValue, target)) {
        atom[VALUE] = target as T;
        atom[LISTENERS]?.forEach((listener) => listener(target as T));
      }

      return true;
    },
  }) as T;
}

export const get = <T>(atom: Atom<T>): T => {
  const value = atom[VALUE];
  const internalAtom = atom as InternalAtom<T>;

  // 객체인 경우 Proxy로 감싸서 반환
  if (typeof value === "object" && value !== null) {
    return createReactiveValue(value, internalAtom);
  }

  return value;
};
```

```typescript
// 깊은 비교 유틸리티
function deepEqual(a: any, b: any): boolean {
  if (Object.is(a, b)) return true;

  if (
    a === null ||
    b === null ||
    typeof a !== "object" ||
    typeof b !== "object"
  ) {
    return false;
  }

  if (Array.isArray(a) !== Array.isArray(b)) return false;

  const keysA = Object.keys(a);
  const keysB = Object.keys(b);

  if (keysA.length !== keysB.length) return false;

  return keysA.every((key) => deepEqual(a[key], b[key]));
}

export const set = <T>(atom: Atom<T>, newValue: T) => {
  const oldValue = atom[VALUE];

  // 1. 참조 비교 (빠른 경로)
  if (Object.is(oldValue, newValue)) {
    return;
  }

  // 2. 객체/배열인 경우 깊은 비교
  if (
    typeof oldValue === "object" &&
    oldValue !== null &&
    typeof newValue === "object" &&
    newValue !== null
  ) {
    if (deepEqual(oldValue, newValue)) {
      return; // 실제로 변경되지 않았으면 반환
    }
  }

  // 3. 값 업데이트 및 알림
  const internalAtom = atom as InternalAtom<T>;
  internalAtom[VALUE] = newValue;

  const listeners = internalAtom[LISTENERS];
  if (listeners !== null) {
    listeners.forEach((listener) => listener(newValue));
  }
};
```

```typescript
const obj = get(atom);
obj.count = 2; // 이건 여전히 감지 안 됨
```
