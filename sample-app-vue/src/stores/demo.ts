import { createAtom, createDerivedAtom, type Atom } from "sangtae-js";

export const $counter = createAtom(0);
export const $step = createAtom(1);
export const $nickname = createAtom("");
export const $counterHistory = createAtom<string[]>([]);

export const $doubleCounter = createDerivedAtom((read) => read($counter) * 2);

export interface CounterSummary {
  counter: number;
  step: number;
  next: number;
  greeting: string;
}

export const $summary: Atom<CounterSummary> = createDerivedAtom((read) => {
  const counter = read($counter);
  const step = read($step);
  const nickname = read($nickname).trim();

  return {
    counter,
    step,
    next: counter + step,
    greeting: nickname
      ? `${nickname}님, 다음 값은 ${counter + step}`
      : "이름을 입력해보세요.",
  };
});

