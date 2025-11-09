import { createAsyncAtom, createAtom, createDerivedAtom } from "sangtae-js";

export const $counter = createAtom<number>(0);
export const $step = createAtom<number>(1);
export const $nickname = createAtom<string>("");

export interface CounterSummary {
  counter: number;
  step: number;
  next: number;
  greeting: string;
}

export interface RemoteTodo {
  id: number;
  title: string;
  description: string;
  completed: boolean;
}

export const $summary = createDerivedAtom<CounterSummary>((read) => {
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

export const $doubleCounter = createDerivedAtom<number>(
  (read) => read($counter) * 2
);

export const $counterHistory = createAtom<string[]>([]);

const loadRemoteTodos = (version: number): Promise<RemoteTodo[]> =>
  new Promise((resolve) => {
    const delay = 600 + ((version % 3) + 1) * 200;
    const startedAt = Date.now();

    setTimeout(() => {
      const now = new Date();
      const generated = [
        {
          title: "API 문서 검토",
          description: "README 요약을 확인하고 팀 공유 준비",
        },
        {
          title: "디자인 동기화",
          description: "UI 컴포넌트 상태와 실제 데이터를 비교",
        },
        {
          title: "렌더 카운트 점검",
          description: "변경된 atom이 컴포넌트에 미치는 영향 확인",
        },
        {
          title: "배포 체크리스트",
          description: "build, lint, 테스트 명령어가 모두 통과하는지 확인",
        },
      ].map((template, index) => ({
        id: version * 10 + index + 1,
        title: `${template.title} #${version + 1}`,
        description: `${template.description} - ${now.toLocaleTimeString()}`,
        completed: (version + index) % 2 === 0,
      }));

      const elapsed = Date.now() - startedAt;
      resolve(
        generated.map((todo) => ({
          ...todo,
          description: `${todo.description} (응답 ${elapsed}ms)`,
        }))
      );
    }, delay);
  });

export const createRemoteTodosAtom = (version: number) =>
  createAsyncAtom(loadRemoteTodos(version));
