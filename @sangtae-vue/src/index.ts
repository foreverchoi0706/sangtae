import { ref, onUnmounted } from "vue";
import { get, set, subscribe, type Atom } from "sangtae-js";

const useAtom = <T>(atom: Atom<T>) => {
  let initialValue: T;

  try {
    initialValue = get(atom);
  } catch (promise) {
    if (promise instanceof Promise) {
      initialValue = undefined as unknown as T;
    } else {
      throw promise;
    }
  }

  let unsubscribe: (() => void) | undefined;

  const value = ref<T>(initialValue);

  const updateValue = () => {
    try {
      value.value = get(atom);
    } catch (promise) {
      if (!(promise instanceof Promise)) {
        throw promise;
      }
    }
  };

  try {
    unsubscribe = subscribe(atom, updateValue);
  } catch (promise) {
    if (promise instanceof Promise) {
      promise.then(() => {
        unsubscribe = subscribe(atom, updateValue);
      });
    } else {
      throw promise;
    }
  }

  onUnmounted(() => {
    unsubscribe?.();
  });

  const setValue = (newValue: T) => {
    set(atom, newValue);
  };

  return [value, setValue] as const;
};

export { useAtom };
export type { Atom };
