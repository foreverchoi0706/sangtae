# createDerivedAtom 쉽게 이해하기 🎯

## 🎬 핵심 개념: 파생 아톰이란?

**비유:** 엑셀의 수식처럼 생각해봐!

- A1 셀에 `10`이 있고
- B1 셀에 `20`이 있으면
- C1 셀에 `=A1+B1`을 입력하면 자동으로 `30`이 계산되고
- A1이나 B1이 바뀌면 C1도 자동으로 업데이트돼!

`createDerivedAtom`도 똑같아:

- 다른 atom들의 값을 읽어서
- 계산된 새로운 값을 만들고
- 원본 atom이 바뀌면 자동으로 재계산해!

---

## 📝 기본 사용 예시

```typescript
// 1. 기본 atom들 만들기
const priceAtom = createAtom(1000); // 가격: 1000원
const countAtom = createAtom(3); // 개수: 3개

// 2. 파생 atom 만들기 (가격 × 개수 = 총액)
const totalAtom = createDerivedAtom((get) => {
  const price = get(priceAtom); // 1000
  const count = get(countAtom); // 3
  return price * count; // 3000
});

console.log(get(totalAtom)); // 3000

// 3. 원본 atom 변경하면 자동으로 재계산!
set(countAtom, 5);
console.log(get(totalAtom)); // 5000 (자동으로 업데이트됨!)
```

---

## 🔍 코드 동작 원리 (단계별 설명)

### 1️⃣ 초기 설정 (42-50줄)

```typescript
const state = {
  status: ASYNC_ATOM_STATUS.PENDING, // 현재 상태: 대기중/성공/에러
  suspense: null, // Promise가 있으면 여기 저장
  error: undefined, // 에러가 있으면 여기 저장
};
```

**이유:** 비동기 작업(Promise)이나 에러를 처리하기 위해서야.

---

### 2️⃣ 의존성 추적 준비 (52-53줄, 62줄)

```typescript
const subscriptions = new Map<Atom<unknown>, () => void>();
let atoms = new Set<Atom<unknown>>();
```

**이유:**

- `atoms`: 지금 이 파생 atom이 **어떤 atom들을 읽고 있는지** 추적
- `subscriptions`: 읽고 있는 atom들에 **구독**해서 변경되면 알림 받기

**비유:**

- 내가 계산하려면 A, B, C atom을 읽어야 해
- 그럼 A, B, C가 바뀔 때마다 나도 다시 계산해야 해
- 그래서 A, B, C에 "나도 알려줘!"라고 구독하는 거야

---

### 3️⃣ 구독 관리 함수 (64-80줄)

```typescript
const applySubscriptions = (nextTrackedAtoms: Set<Atom<unknown>>) => {
  // 1. 이전에 읽었는데 이번엔 안 읽은 atom → 구독 해제
  atoms.forEach((atom) => {
    if (!nextTrackedAtoms.has(atom)) {
      subscriptions.get(atom)?.(); // 구독 해제
      subscriptions.delete(atom);
    }
  });

  // 2. 새로 읽은 atom → 구독 시작
  nextTrackedAtoms.forEach((atom) => {
    if (!subscriptions.has(atom)) {
      const unsubscribe = subscribe(atom, () => evaluate(true));
      subscriptions.set(atom, unsubscribe);
    }
  });

  atoms = nextTrackedAtoms; // 추적 목록 업데이트
};
```

**이 부분을 단계별로 이해해보자!**

#### 🔍 단계 1: `subscribe(atom, () => evaluate(true))` 뭐하는 거야?

**비유:**

- `subscribe`는 "이 atom이 바뀌면 알려줘!"라고 등록하는 거야
- 첫 번째 인자 `atom`: 감시할 atom (예: `priceAtom`)
- 두 번째 인자 `() => evaluate(true)`: atom이 바뀌면 실행할 함수

**구체적으로:**

```typescript
// priceAtom이 바뀌면 이 함수가 실행돼
subscribe(priceAtom, () => {
  evaluate(true); // 파생 atom을 다시 계산해!
});
```

**왜 `evaluate(true)`를 호출하나?**

- `priceAtom`이 바뀌었으니, 이걸 읽는 파생 atom도 다시 계산해야 해
- `evaluate(true)`: 파생 atom을 다시 계산하는 함수
- `true`: 에러를 억제하는 플래그 (구독 콜백에서 에러가 나도 계속 동작하도록)

#### 🔍 단계 2: `unsubscribe` 함수를 왜 저장하나?

**비유:**

- 구독을 시작하면 "구독 해제 함수"를 받아
- 나중에 이 atom을 더 이상 읽지 않게 되면 구독을 해제해야 해
- 그래서 해제 함수를 저장해두는 거야

**예시:**

```typescript
// 구독 시작
const unsubscribe = subscribe(priceAtom, () => evaluate(true));
// unsubscribe는 함수야: () => void

// 나중에 priceAtom을 더 이상 읽지 않게 되면
unsubscribe(); // 구독 해제!
```

#### 🔍 단계 3: `subscriptions.set(atom, unsubscribe)` 왜 저장하나?

**이유:**

- `subscriptions`는 Map이야: `Map<Atom, 구독해제함수>`
- 각 atom마다 "구독 해제 함수"를 저장해둬
- 나중에 구독을 해제할 때 사용해

**예시:**

```typescript
subscriptions = Map {
  priceAtom → unsubscribe함수1,
  countAtom → unsubscribe함수2,
}

// 나중에 priceAtom 구독 해제하려면
subscriptions.get(priceAtom)();  // unsubscribe함수1() 실행
```

#### 🔍 단계 4: `if (!subscriptions.has(atom))` 왜 체크하나?

**이유:**

- 이미 구독 중인 atom은 또 구독하면 안 돼!
- 중복 구독을 방지하기 위한 체크야

**예시:**

```typescript
// 첫 번째 계산: priceAtom 읽음
subscribe(priceAtom, ...);  // 구독 시작
subscriptions.set(priceAtom, unsubscribe);  // 저장

// 두 번째 계산: priceAtom 또 읽음
if (!subscriptions.has(priceAtom)) {  // 이미 구독 중이니까 false!
  // 이 블록은 실행 안 됨 (중복 구독 방지!)
}
```

**왜 중복 구독이 문제야?**

- 같은 atom에 여러 번 구독하면
- atom이 바뀔 때마다 여러 번 `evaluate()`가 호출돼
- 불필요한 재계산이 발생해!

---

**전체 동작 흐름 예시:**

```typescript
// 1. 첫 번째 계산: priceAtom, countAtom 읽음
const totalAtom = createDerivedAtom((get) => {
  const price = get(priceAtom); // priceAtom 추적됨
  const count = get(countAtom); // countAtom 추적됨
  return price * count;
});

// applySubscriptions 실행:
// - priceAtom: 구독 시작 → subscriptions에 저장
// - countAtom: 구독 시작 → subscriptions에 저장

// 2. priceAtom 변경
set(priceAtom, 2000);
// → priceAtom의 구독자들에게 알림
// → totalAtom의 evaluate() 실행
// → totalAtom 재계산!

// 3. 두 번째 계산: countAtom만 읽음 (priceAtom 안 읽음)
// applySubscriptions 실행:
// - priceAtom: 더 이상 안 읽으니까 → 구독 해제!
// - countAtom: 계속 읽으니까 → 그대로 유지
```

**왜 이렇게 하나?**

- ✅ **메모리 누수 방지**: 안 쓰는 atom 구독 해제
- ✅ **효율적인 업데이트**: 필요한 것만 구독
- ✅ **중복 방지**: 같은 atom에 여러 번 구독 안 함

---

### 4️⃣ 핵심: evaluate 함수 (92-138줄)

이게 가장 중요한 부분이야!

#### 4-1. 의존성 추적 시작 (93줄)

```typescript
const nextTrackedAtoms = new Set<Atom<unknown>>();
```

**이유:** 이번 계산에서 어떤 atom들을 읽는지 기록할 빈 Set 준비

#### 4-2. 값 계산하면서 의존성 추적 (96-99줄)

```typescript
const newValue = callback((atom) => {
  nextTrackedAtoms.add(atom as Atom<unknown>); // 이 atom을 읽었다고 기록!
  return get(atom); // 실제 값 가져오기
});
```

**마법의 순간:**

- `callback` 안에서 `get(priceAtom)`을 호출하면
- `get` 함수가 실행되면서 `priceAtom`을 `nextTrackedAtoms`에 추가해
- 이렇게 해서 "어떤 atom을 읽었는지" 자동으로 추적하는 거야!

**비유:**

- 계산할 때 사용한 재료 목록을 자동으로 기록하는 거야
- 나중에 그 재료가 바뀌면 알림을 받을 수 있어

#### 4-3. 성공 처리 (100-106줄)

```typescript
setStatus(ASYNC_ATOM_STATUS.SUCCESS); // 상태를 성공으로 변경
applySubscriptions(nextTrackedAtoms); // 구독 업데이트

if (!Object.is(derivedAtom[VALUE], newValue)) {
  // 값이 실제로 바뀌었나?
  derivedAtom[VALUE] = newValue; // 값 업데이트
  derivedAtom[LISTENERS]?.forEach((listener) => listener(newValue)); // 구독자들에게 알림
}
```

**동작:**

1. 계산 성공했으니 상태를 SUCCESS로 변경
2. 읽은 atom들에 구독 설정 (변경되면 다시 계산하도록)
3. 값이 바뀌었으면 업데이트하고 구독자들에게 알림

#### 4-4. Promise 처리 (110-129줄)

```typescript
if (thrown instanceof Promise) {
  // callback이 Promise를 던졌을 때 (비동기 작업 중)
  state.status = ASYNC_ATOM_STATUS.PENDING;
  state.suspense = thrown; // Promise 저장
  emit(); // 구독자들에게 "아직 로딩 중" 알림

  thrown
    .then(() => {
      // Promise가 완료되면 다시 계산
      if (state.suspense === thrown) {
        evaluate(true);
      }
    })
    .catch((err) => {
      // Promise가 실패하면 에러 상태로
      if (state.suspense === thrown) {
        state.status = ASYNC_ATOM_STATUS.ERROR;
        state.error = err;
        emit();
      }
    });
  return;
}
```

**이게 뭐하는 거야?**

- React Suspense를 지원하기 위한 거야!
- callback 안에서 Promise를 던지면 (throw promise)
- Suspense가 그걸 잡아서 로딩 상태로 처리해
- Promise가 완료되면 자동으로 다시 계산해

**예시:**

```typescript
const asyncTotalAtom = createDerivedAtom(async (get) => {
  const price = get(priceAtom);
  const count = get(countAtom);

  // API 호출 (Promise 반환)
  const discount = await fetchDiscount(price);

  return price * count - discount;
});
```

#### 4-5. 일반 에러 처리 (132-136줄)

```typescript
setStatus(ASYNC_ATOM_STATUS.ERROR);
state.error = thrown;
emit();

if (!suppressErrors) throw thrown;
```

**동작:**

- Promise가 아닌 일반 에러면 에러 상태로 변경
- 구독자들에게 알림
- `suppressErrors`가 false면 에러를 다시 던짐

---

### 5️⃣ 초기 평가 (140줄)

```typescript
evaluate();
```

**이유:** 파생 atom을 만들자마자 한 번 계산해서 초기값을 설정해

---

### 6️⃣ Proxy로 값 접근 제어 (142-168줄)

```typescript
const proxyAtom = new Proxy(derivedAtom, {
  get(target, property) {
    if (property === VALUE) {
      // 값 읽으려고 할 때
      if (state.status === ASYNC_ATOM_STATUS.PENDING && state.suspense) {
        throw state.suspense; // Promise 던져서 Suspense 트리거
      }
      if (state.status === ASYNC_ATOM_STATUS.ERROR) {
        throw state.error; // 에러 던지기
      }
    }
    return Reflect.get(target, property);
  },

  set(target, property, value) {
    if (property === VALUE) {
      // 값 설정할 때
      if (Object.is(target[VALUE], value)) {
        return true; // 같은 값이면 무시
      }
      target[VALUE] = value as T;
      setStatus(ASYNC_ATOM_STATUS.SUCCESS); // 상태를 성공으로 변경
      return true;
    }
    return Reflect.set(target, property, value);
  },
});
```

**왜 Proxy를 쓰나?**

- `atom[VALUE]`로 값 읽으려고 할 때 가로채서
- 상태에 따라 Promise나 에러를 던질 수 있게 하려고
- 이렇게 해서 Suspense와 에러 처리가 가능해져

**동작:**

1. 값 읽을 때 (`get`):

   - 로딩 중이면 Promise 던져서 Suspense 트리거
   - 에러면 에러 던지기
   - 성공이면 정상 값 반환

2. 값 설정할 때 (`set`):
   - 같은 값이면 무시 (불필요한 업데이트 방지)
   - 다른 값이면 업데이트하고 상태를 성공으로 변경

---

## 🎯 전체 흐름 요약

1. **파생 atom 생성** → `createDerivedAtom` 호출
2. **초기 평가** → `evaluate()` 실행
   - callback 실행하면서 어떤 atom 읽는지 추적
   - 계산된 값 저장
   - 읽은 atom들에 구독 설정
3. **원본 atom 변경** → 구독한 atom이 변경됨
4. **자동 재계산** → `evaluate()` 다시 실행
   - 새로운 값 계산
   - 값이 바뀌었으면 구독자들에게 알림
5. **값 읽기** → Proxy가 가로채서 상태 확인
   - 로딩 중이면 Promise 던짐 (Suspense)
   - 에러면 에러 던짐
   - 성공이면 값 반환

---

## 💡 핵심 포인트

1. **자동 의존성 추적**: `get(atom)` 호출할 때 자동으로 추적
2. **자동 구독 관리**: 읽은 atom에 자동으로 구독하고, 안 읽게 되면 자동으로 해제
3. **자동 재계산**: 의존하는 atom이 바뀌면 자동으로 다시 계산
4. **Suspense 지원**: Promise를 던지면 Suspense가 처리
5. **에러 처리**: 에러 상태 관리 및 전파

---

## 🚀 실전 예시

```typescript
// 쇼핑몰 장바구니 예시
const itemsAtom = createAtom([
  { name: "사과", price: 1000, count: 3 },
  { name: "바나나", price: 2000, count: 2 },
]);

// 총 가격 계산 (파생 atom)
const totalPriceAtom = createDerivedAtom((get) => {
  const items = get(itemsAtom);
  return items.reduce((sum, item) => sum + item.price * item.count, 0);
  // 사과: 1000 × 3 = 3000
  // 바나나: 2000 × 2 = 4000
  // 총: 7000
});

// 할인 적용 (파생 atom의 파생 atom!)
const finalPriceAtom = createDerivedAtom((get) => {
  const total = get(totalPriceAtom); // 7000
  return total > 5000 ? total * 0.9 : total; // 5000원 이상이면 10% 할인
  // 결과: 6300
});

// itemsAtom 변경하면 자동으로 totalPriceAtom과 finalPriceAtom도 업데이트!
set(itemsAtom, [
  { name: "사과", price: 1000, count: 5 }, // 개수 변경
]);
// totalPriceAtom: 9000으로 자동 업데이트
// finalPriceAtom: 8100으로 자동 업데이트
```

이렇게 하면 복잡한 계산도 자동으로 관리할 수 있어! 🎉
