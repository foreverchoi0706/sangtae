import { ref, onUnmounted } from "vue";
import { get, set, subscribe, type Atom } from "sangtae-js";

export const useAtom = <T>(atom: Atom<T>) => {
  // Vue 반응형 ref로 atom의 현재 값을 추적
  let initialValue: T;

  try {
    initialValue = get(atom);
  } catch (promise) {
    // Promise가 throw되면 (비동기 atom의 경우) undefined로 초기화
    if (promise instanceof Promise) {
      initialValue = undefined as any;
    } else {
      throw promise;
    }
  }

  // 구독 해제 함수를 저장할 변수
  let unsubscribe: (() => void) | undefined;

  const value = ref<T>(initialValue);

  // atom이 변경될 때마다 ref 업데이트하는 함수
  const updateValue = () => {
    try {
      value.value = get(atom);
    } catch (promise) {
      // Promise가 throw되면 무시 (이미 로딩 중)
      if (!(promise instanceof Promise)) {
        throw promise;
      }
    }
  };

  // subscribe 호출 시 즉시 callback이 실행되므로 try-catch로 감싸기
  try {
    unsubscribe = subscribe(atom, updateValue);
  } catch (promise) {
    // 비동기 atom의 경우 초기 구독 시 Promise가 throw될 수 있음
    if (promise instanceof Promise) {
      // Promise가 완료되면 다시 구독 시도
      promise.then(() => {
        unsubscribe = subscribe(atom, updateValue);
      });
    } else {
      throw promise;
    }
  }

  // 컴포넌트가 언마운트될 때 구독 해제
  onUnmounted(() => {
    unsubscribe?.();
  });

  // setter 함수
  const setValue = (newValue: T) => {
    set(atom, newValue);
  };

  return [value, setValue] as const;
};
