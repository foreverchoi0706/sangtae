import { ref, onMounted, onUnmounted } from "vue";
import { get, set, subscribe, type Atom } from "sangtae-js";

export const useAtom = <T>(atom: Atom<T>) => {
  // Vue 반응형 ref로 atom의 현재 값을 추적
  const value = ref<T>(get(atom));

  // atom이 변경될 때마다 ref 업데이트하는 함수
  const updateValue = () => {
    value.value = get(atom);
  };

  // 구독 해제 함수를 저장
  let unsubscribe: (() => void) | null = null;

  // 컴포넌트가 마운트될 때 구독 시작
  onMounted(() => {
    unsubscribe = subscribe(atom, updateValue);
  });

  // 컴포넌트가 언마운트될 때 구독 해제
  onUnmounted(() => {
    if (unsubscribe) {
      unsubscribe();
      unsubscribe = null;
    }
  });

  // setter 함수
  const setValue = (newValue: T) => {
    set(atom, newValue);
  };

  return [value, setValue] as const;
};
