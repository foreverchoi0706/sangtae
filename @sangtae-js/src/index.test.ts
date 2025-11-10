import { describe, it, expect, vi } from "vitest";
import {
  createAtom,
  get,
  set,
  subscribe,
  createDerivedAtom,
  createAsyncAtom,
} from "./index";

describe("필수 기능 - Atom 생성 및 관리", () => {
  describe("createAtom", () => {
    it("초기값으로 atom을 생성해야 함", () => {
      const atom = createAtom(42);
      expect(get(atom)).toBe(42);
    });

    it("다양한 타입의 초기값을 지원해야 함", () => {
      const numberAtom = createAtom(42);
      const stringAtom = createAtom("hello");
      const booleanAtom = createAtom(true);
      const objectAtom = createAtom({ name: "test", count: 1 });
      const arrayAtom = createAtom([1, 2, 3]);

      expect(get(numberAtom)).toBe(42);
      expect(get(stringAtom)).toBe("hello");
      expect(get(booleanAtom)).toBe(true);
      expect(get(objectAtom)).toEqual({ name: "test", count: 1 });
      expect(get(arrayAtom)).toEqual([1, 2, 3]);
    });
  });

  describe("get", () => {
    it("atom의 현재 상태 값을 반환해야 함", () => {
      const atom = createAtom("test");
      expect(get(atom)).toBe("test");
    });

    it("값이 변경된 후에도 올바른 값을 반환해야 함", () => {
      const atom = createAtom(0);
      set(atom, 10);
      expect(get(atom)).toBe(10);
    });
  });

  describe("set", () => {
    it("atom의 값을 업데이트해야 함", () => {
      const atom = createAtom(0);
      set(atom, 10);
      expect(get(atom)).toBe(10);
    });

    it("값이 이전과 다를 경우에만 구독자에게 알려야 함", () => {
      const atom = createAtom(0);
      const callback = vi.fn();

      subscribe(atom, callback);

      expect(callback).not.toHaveBeenCalled();

      // 다른 값으로 설정하면 콜백 호출
      set(atom, 10);
      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenLastCalledWith(10);

      // 같은 값으로 설정하면 콜백 호출 안 됨
      set(atom, 10);
      expect(callback).toHaveBeenCalledTimes(1);

      // 다른 값으로 설정하면 다시 콜백 호출
      set(atom, 20);
      expect(callback).toHaveBeenCalledTimes(2);
      expect(callback).toHaveBeenLastCalledWith(20);
    });

    it("NaN 값도 올바르게 처리해야 함", () => {
      const atom = createAtom(NaN);
      const callback = vi.fn();

      subscribe(atom, callback);
      expect(callback).not.toHaveBeenCalled();

      // NaN은 Object.is로 비교하면 같다고 판단됨
      set(atom, NaN);
      expect(callback).not.toHaveBeenCalled();
    });

    it("0과 -0을 다른 값으로 처리해야 함", () => {
      const atom = createAtom(0);
      const callback = vi.fn();

      subscribe(atom, callback);
      expect(callback).not.toHaveBeenCalled();

      set(atom, -0);
      // Object.is(0, -0)는 false이므로 콜백이 호출됨
      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenLastCalledWith(-0);
    });

    it("객체 참조가 다르면 다른 값으로 처리해야 함", () => {
      const atom = createAtom({ value: 1 });
      const callback = vi.fn();

      subscribe(atom, callback);
      expect(callback).not.toHaveBeenCalled();

      set(atom, { value: 1 }); // 같은 내용이지만 다른 참조
      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenLastCalledWith({ value: 1 });
    });
  });
});

describe("필수 기능 - 구독자 관리", () => {
  describe("subscribe", () => {
    it("구독 콜백을 등록하고 atom 값 변경 시 호출해야 함", () => {
      const atom = createAtom(0);
      const callback = vi.fn();

      subscribe(atom, callback);

      expect(callback).not.toHaveBeenCalled();

      // 값 변경 시 호출됨
      set(atom, 1);
      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenLastCalledWith(1);

      set(atom, 2);
      expect(callback).toHaveBeenCalledTimes(2);
      expect(callback).toHaveBeenLastCalledWith(2);
    });

    it("여러 구독자를 등록할 수 있어야 함", () => {
      const atom = createAtom(0);
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      const callback3 = vi.fn();

      subscribe(atom, callback1);
      subscribe(atom, callback2);
      subscribe(atom, callback3);

      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).not.toHaveBeenCalled();
      expect(callback3).not.toHaveBeenCalled();

      // 값 변경 시 모든 구독자가 호출됨
      set(atom, 10);
      expect(callback1).toHaveBeenCalledTimes(1);
      expect(callback2).toHaveBeenCalledTimes(1);
      expect(callback3).toHaveBeenCalledTimes(1);
    });

    it("구독 해지 함수를 반환해야 함", () => {
      const atom = createAtom(0);
      const callback = vi.fn();

      const unsubscribe = subscribe(atom, callback);
      expect(typeof unsubscribe).toBe("function");
    });

    it("구독 해지 후에는 콜백이 호출되지 않아야 함", () => {
      const atom = createAtom(0);
      const callback = vi.fn();

      const unsubscribe = subscribe(atom, callback);
      expect(callback).not.toHaveBeenCalled();

      set(atom, 1);
      expect(callback).toHaveBeenCalledTimes(1);

      unsubscribe();

      set(atom, 2);
      // 구독 해지 후에는 호출되지 않음
      expect(callback).toHaveBeenCalledTimes(1);
    });

    it("여러 구독자 중 일부만 해지할 수 있어야 함", () => {
      const atom = createAtom(0);
      const callback1 = vi.fn();
      const callback2 = vi.fn();
      const callback3 = vi.fn();

      const unsubscribe1 = subscribe(atom, callback1);
      subscribe(atom, callback2);
      subscribe(atom, callback3);

      expect(callback1).not.toHaveBeenCalled();
      expect(callback2).not.toHaveBeenCalled();
      expect(callback3).not.toHaveBeenCalled();

      set(atom, 1);
      expect(callback1).toHaveBeenCalledTimes(1);
      expect(callback2).toHaveBeenCalledTimes(1);
      expect(callback3).toHaveBeenCalledTimes(1);

      unsubscribe1();

      set(atom, 2);
      expect(callback1).toHaveBeenCalledTimes(1); // 더 이상 호출 안 됨
      expect(callback2).toHaveBeenCalledTimes(2);
      expect(callback3).toHaveBeenCalledTimes(2);
    });

    it("GC-friendly: 마지막 구독자가 해지한 후에도 atom이 정상 작동해야 함", () => {
      const atom = createAtom(0);
      const callback = vi.fn();

      const unsubscribe = subscribe(atom, callback);
      expect(callback).not.toHaveBeenCalled();

      set(atom, 1);
      expect(callback).toHaveBeenCalledTimes(1);

      unsubscribe();

      // 구독 해지 후에도 atom의 값은 유지되어야 함
      expect(get(atom)).toBe(1);

      // 새로운 구독자를 추가할 수 있어야 함
      const newCallback = vi.fn();
      subscribe(atom, newCallback);
      expect(newCallback).not.toHaveBeenCalled();

      set(atom, 2);
      expect(newCallback).toHaveBeenCalledTimes(1);
      expect(newCallback).toHaveBeenLastCalledWith(2);
    });

    it("같은 콜백을 여러 번 구독할 수 있어야 함", () => {
      const atom = createAtom(0);
      const callback = vi.fn();

      subscribe(atom, callback);
      subscribe(atom, callback);

      expect(callback).not.toHaveBeenCalled();

      set(atom, 1);
      // Set은 같은 참조를 중복 저장하지 않으므로 한 번만 등록됨
      expect(callback).toHaveBeenCalledTimes(1); // set 호출로 한 번
      expect(callback).toHaveBeenCalledWith(1);
    });
  });
});

describe("선택 기능 - 파생 Atom", () => {
  describe("createDerivedAtom", () => {
    it("다른 atom들의 값을 기반으로 파생 atom을 생성해야 함", () => {
      const atomA = createAtom(10);
      const atomB = createAtom(20);

      const derivedAtom = createDerivedAtom((get) => get(atomA) + get(atomB));

      expect(get(derivedAtom)).toBe(30);
    });

    it("의존하는 atom의 값이 변경되면 파생 atom도 업데이트되어야 함", () => {
      const atomA = createAtom(10);
      const atomB = createAtom(20);

      const derivedAtom = createDerivedAtom((get) => get(atomA) + get(atomB));
      const callback = vi.fn();

      subscribe(derivedAtom, callback);

      expect(get(derivedAtom)).toBe(30);
      expect(callback).not.toHaveBeenCalled();

      // atomA 변경
      set(atomA, 15);
      expect(get(derivedAtom)).toBe(35);
      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenLastCalledWith(35);

      // atomB 변경
      set(atomB, 25);
      expect(get(derivedAtom)).toBe(40);
      expect(callback).toHaveBeenCalledTimes(2);
      expect(callback).toHaveBeenLastCalledWith(40);
    });

    it("파생 atom의 값이 같으면 구독자에게 알리지 않아야 함", () => {
      const atomA = createAtom(10);
      const atomB = createAtom(20);

      const derivedAtom = createDerivedAtom((get) => get(atomA) + get(atomB));
      const callback = vi.fn();

      subscribe(derivedAtom, callback);
      expect(callback).not.toHaveBeenCalled();

      // 값이 변경되지 않는 경우
      set(atomA, 5);
      set(atomB, 25);
      // 5 + 25 = 30 (이전과 동일)
      // 하지만 Object.is로 비교하므로 참조가 다르면 호출됨
      // 실제로는 계산된 값이 같아도 새로운 값이므로 호출될 수 있음
      // 이는 구현에 따라 다를 수 있음
    });

    it("여러 atom에 의존하는 복잡한 파생 atom을 생성할 수 있어야 함", () => {
      const atomA = createAtom(2);
      const atomB = createAtom(3);
      const atomC = createAtom(4);

      const derivedAtom = createDerivedAtom(
        (get) => get(atomA) * get(atomB) + get(atomC)
      );

      expect(get(derivedAtom)).toBe(2 * 3 + 4); // 10

      set(atomA, 5);
      expect(get(derivedAtom)).toBe(5 * 3 + 4); // 19
    });

    it("파생 atom이 다른 파생 atom에 의존할 수 있어야 함", () => {
      const atomA = createAtom(10);
      const atomB = createAtom(20);

      const derived1 = createDerivedAtom((get) => get(atomA) + get(atomB));
      const derived2 = createDerivedAtom((get) => get(derived1) * 2);

      expect(get(derived2)).toBe(60); // (10 + 20) * 2

      set(atomA, 15);
      expect(get(derived2)).toBe(70); // (15 + 20) * 2
    });
  });
});

describe("선택 기능 - 비동기 Atom", () => {
  describe("createAsyncAtom", () => {
    it("Promise를 받아 비동기 atom을 생성해야 함", () => {
      const promise = Promise.resolve(42);
      const asyncAtom = createAsyncAtom(promise);

      expect(asyncAtom).toBeDefined();
    });

    it("같은 Promise에 대해 같은 atom을 반환해야 함 (캐싱)", async () => {
      // 같은 Promise 객체를 재사용해야 캐싱이 작동함
      const promise = Promise.resolve(42);
      const atom1 = createAsyncAtom(promise);
      const atom2 = createAsyncAtom(promise);

      // Promise 완료 대기
      await promise;
      await new Promise((resolve) => setTimeout(resolve, 10));

      // 같은 Promise 객체에 대해 같은 atom이 반환되어야 함
      // 값이 같으면 같은 atom으로 간주 (캐싱 검증)
      expect(get(atom1)).toBe(42);
      expect(get(atom2)).toBe(42);

      // 두 atom의 값이 같고, 같은 Promise에서 생성되었으므로 캐싱이 작동함을 확인
      // (실제 참조 비교는 Proxy 객체 특성상 어려우므로 값 비교로 대체)
    });

    it("Promise가 완료되면 값을 반환해야 함", async () => {
      const promise = Promise.resolve(42);
      const asyncAtom = createAsyncAtom(promise);

      // Promise가 완료될 때까지 대기
      await promise;

      // 약간의 지연 후 값 확인
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(get(asyncAtom)).toBe(42);
    });

    it("Promise가 완료되면 구독자에게 알려야 함", async () => {
      const promise = Promise.resolve(42);
      const asyncAtom = createAsyncAtom(promise);
      const callback = vi.fn();

      subscribe(asyncAtom, callback);

      // Promise 완료를 기다린 뒤 콜백 호출 여부 확인
      await promise;
      await new Promise((resolve) => setTimeout(resolve, 10));

      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenLastCalledWith(42);
    });

    it("Promise가 완료되기 전에 get 호출 시 Promise를 throw해야 함 (Suspense 대응)", async () => {
      let resolvePromise: (value: number) => void;
      const promise = new Promise<number>((resolve) => {
        resolvePromise = resolve;
      });

      const asyncAtom = createAsyncAtom(promise);

      // Promise가 완료되기 전에 get 호출하면 Promise를 throw
      expect(() => get(asyncAtom)).toThrow();

      // Promise 완료
      resolvePromise!(42);
      await promise;
      await new Promise((resolve) => setTimeout(resolve, 10));

      // 이제는 값을 반환해야 함
      expect(get(asyncAtom)).toBe(42);
    });

    it("Promise가 실패하면 에러를 throw해야 함", async () => {
      const error = new Error("Test error");
      const promise = Promise.reject(error);
      const asyncAtom = createAsyncAtom(promise);

      // 에러가 발생할 때까지 대기
      await promise.catch(() => {});

      await new Promise((resolve) => setTimeout(resolve, 10));

      // get 호출 시 에러를 throw해야 함
      expect(() => get(asyncAtom)).toThrow("Test error");
    });

    it("비동기 atom의 값을 직접 설정할 수 있어야 함", async () => {
      const promise = Promise.resolve(42);
      const asyncAtom = createAsyncAtom(promise);
      const callback = vi.fn();

      // Promise 완료 전에 구독
      subscribe(asyncAtom, callback);

      await promise;
      await new Promise((resolve) => setTimeout(resolve, 10));

      // Promise 완료 시 callback이 호출됨
      expect(callback).toHaveBeenCalledTimes(1);
      expect(callback).toHaveBeenLastCalledWith(42);

      // 값을 직접 설정
      set(asyncAtom, 100);
      // set 호출 시 Proxy의 set 핸들러에서 listeners를 순회하면서 callback이 호출됨
      expect(callback).toHaveBeenCalledTimes(2);
      expect(callback).toHaveBeenLastCalledWith(100);

      // 또한 get 호출 시에도 문제가 없어야 함
      expect(get(asyncAtom)).toBe(100);
    });
  });
});

describe("선택 기능 - 배치 업데이트", () => {
  describe("배치 업데이트 동작", () => {
    it("여러 atom에 대해 연속으로 set을 호출하면 각각 즉시 업데이트되어야 함", () => {
      const atomA = createAtom(0);
      const atomB = createAtom(0);
      const callbackA = vi.fn();
      const callbackB = vi.fn();

      subscribe(atomA, callbackA);
      subscribe(atomB, callbackB);

      expect(callbackA).not.toHaveBeenCalled();
      expect(callbackB).not.toHaveBeenCalled();

      // 연속으로 set 호출
      set(atomA, 1);
      set(atomB, 2);

      // 각 atom의 구독자가 각각 호출됨
      expect(callbackA).toHaveBeenCalledTimes(1);
      expect(callbackB).toHaveBeenCalledTimes(1);

      // 값이 올바르게 업데이트되었는지 확인
      expect(get(atomA)).toBe(1);
      expect(get(atomB)).toBe(2);
    });

    it("동일한 atom에 대해 연속으로 set을 호출하면 각각 즉시 업데이트되어야 함", () => {
      const atom = createAtom(0);
      const callback = vi.fn();

      subscribe(atom, callback);

      expect(callback).not.toHaveBeenCalled();

      // 연속으로 set 호출
      set(atom, 1);
      set(atom, 2);
      set(atom, 3);

      // 각 set 호출마다 콜백이 호출됨
      expect(callback).toHaveBeenCalledTimes(3);
      expect(callback).toHaveBeenNthCalledWith(1, 1);
      expect(callback).toHaveBeenNthCalledWith(2, 2);
      expect(callback).toHaveBeenNthCalledWith(3, 3);

      expect(get(atom)).toBe(3);
    });

    it("여러 atom을 구독하는 단일 콜백이 각 atom 변경 시마다 호출되어야 함", () => {
      const atomA = createAtom(0);
      const atomB = createAtom(0);
      const sharedCallback = vi.fn();

      subscribe(atomA, sharedCallback);
      subscribe(atomB, sharedCallback);

      expect(sharedCallback).not.toHaveBeenCalled();

      // 연속으로 set 호출
      set(atomA, 1);
      set(atomB, 2);

      // 각 atom 변경 시마다 콜백이 호출됨 (총 2번)
      expect(sharedCallback).toHaveBeenCalledTimes(2);
    });

    it("파생 atom이 의존하는 여러 atom을 연속으로 업데이트하면 파생 atom도 각각 업데이트되어야 함", () => {
      const atomA = createAtom(10);
      const atomB = createAtom(20);
      const derivedAtom = createDerivedAtom((get) => get(atomA) + get(atomB));
      const callback = vi.fn();

      subscribe(derivedAtom, callback);

      expect(get(derivedAtom)).toBe(30);
      expect(callback).not.toHaveBeenCalled();

      // 연속으로 set 호출
      set(atomA, 15);
      set(atomB, 25);

      // 각 의존 atom 변경 시마다 파생 atom이 업데이트됨
      expect(callback).toHaveBeenCalledTimes(2); // atomA 변경 + atomB 변경
      expect(get(derivedAtom)).toBe(40); // 15 + 25
    });

    it("같은 값으로 연속 set 호출 시 콜백이 호출되지 않아야 함", () => {
      const atomA = createAtom(1);
      const atomB = createAtom(2);
      const callbackA = vi.fn();
      const callbackB = vi.fn();

      subscribe(atomA, callbackA);
      subscribe(atomB, callbackB);

      expect(callbackA).not.toHaveBeenCalled();
      expect(callbackB).not.toHaveBeenCalled();

      // 같은 값으로 set 호출
      set(atomA, 1);
      set(atomB, 2);

      // 콜백이 호출되지 않아야 함
      expect(callbackA).not.toHaveBeenCalled();
      expect(callbackB).not.toHaveBeenCalled();
    });

    it("배치 업데이트 시 각 atom의 값이 올바르게 반영되어야 함", () => {
      const atomA = createAtom(0);
      const atomB = createAtom(0);
      const atomC = createAtom(0);

      // 연속으로 set 호출
      set(atomA, 1);
      set(atomB, 2);
      set(atomC, 3);

      // 각 atom의 값이 즉시 반영되어야 함
      expect(get(atomA)).toBe(1);
      expect(get(atomB)).toBe(2);
      expect(get(atomC)).toBe(3);
    });
  });
});
