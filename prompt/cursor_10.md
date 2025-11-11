# 콜백 함수 실행 이유 질문

_Exported on 2025. 11. 9. at 19시 33분 16초 GMT+9 from Cursor (2.0.69)_

---

**User**

@index.ts (164-192) 여기서 구독 즉시 콜백 함수 한번 실행하는 이유가 뭐야?

---

**Cursor**

파일을 읽어서 전체 구조를 확인해볼게.

아, 179번 라인의 `callback(atom[VALUE]);`에 대해 물어보는 거구나!

이 콜백을 바로 한 번 실행하는 이유는 **초기 동기화(initial synchronization)** 때문이야:

## 주요 이유들:

### 1. **즉시 현재 상태 반영**

구독을 시작하는 시점에 atom의 현재 값을 바로 받아서 사용할 수 있게 해. 예를 들어 React 컴포넌트가 마운트될 때 이미 존재하는 상태를 기다릴 필요 없이 바로 렌더링할 수 있지.

### 2. **일관된 동작**

구독자 입장에서는 "구독하면 현재 값부터 받는다"는 일관된 경험을 제공해. 이게 없으면 첫 번째 값은 다음 `set` 호출까지 기다려야 하거든.

### 3. **실제 사용 시나리오**

코드를 보면 49-57번 라인의 `createDerivedAtom`에서도 `subscribe`를 사용하는데, 여기서도 초기값을 바로 받아야 파생 atom이 제대로 동작해:

```34:59:@sangtae-js/src/index.ts
export const createDerivedAtom = <T>(
  callback: (get: <U>(atom: Atom<U>) => U) => T
): Atom<T> => {
  const atoms = new Set<Atom<unknown>>();

  const initialValue = callback((atom) => {
    atoms.add(atom as Atom<unknown>);
    return atom[VALUE];
  });
  const derivedAtom: InternalAtom<T> = {
    [VALUE]: initialValue,
    [LISTENERS]: null,
  };
  // 아톰들을 구독하고 있는 아톰이 변경되면 파생 아톰의 값을 업데이트
  atoms.forEach((atom) => {
    subscribe(atom, () => {
      const newValue = callback(get);
      if (!Object.is(derivedAtom[VALUE], newValue)) {
        derivedAtom[VALUE] = newValue;

        // 구독자들에게 알림
        derivedAtom[LISTENERS]?.forEach((listener) => listener(newValue));
      }
    });
  });
  return derivedAtom;
};
```

만약 이 초기 콜백 호출이 없다면:

- React/Vue 컴포넌트가 마운트될 때 빈 화면이 나올 수 있어
- 파생 atom이 초기화 시점에 제대로 동기화되지 않을 수 있어
- 사용자가 수동으로 `get(atom)`을 호출해서 초기값을 가져와야 하는 불편함이 생겨

이런 패턴은 Jotai, Zustand 같은 다른 상태 관리 라이브러리들에서도 흔히 사용하는 방식이야!

```typescript
export const createDerivedAtom = <T>(
  callback: (get: <U>(atom: Atom<U>) => U) => T
): Atom<T> => {
  const atoms = new Set<Atom<unknown>>();

  const initialValue = callback((atom) => {
    atoms.add(atom as Atom<unknown>);
    return atom[VALUE];
  });
  const derivedAtom: InternalAtom<T> = {
    [VALUE]: initialValue,
    [LISTENERS]: null,
  };
  // 아톰들을 구독하고 있는 아톰이 변경되면 파생 아톰의 값을 업데이트
  atoms.forEach((atom) => {
    subscribe(atom, () => {
      const newValue = callback(get);
      if (!Object.is(derivedAtom[VALUE], newValue)) {
        derivedAtom[VALUE] = newValue;

        // 구독자들에게 알림
        derivedAtom[LISTENERS]?.forEach((listener) => listener(newValue));
      }
    });
  });
  return derivedAtom;
};
```
