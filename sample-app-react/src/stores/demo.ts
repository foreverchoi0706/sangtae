import {
  createAsyncAtom,
  createAtom,
  createDerivedAtom,
  type Atom,
} from "sangtae-js";

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

export interface RemoteTeamMember {
  id: number;
  name: string;
  role: string;
  capacity: number;
  focus: string;
}

export interface RemoteAsyncInsightsSuggestion {
  assignee: RemoteTeamMember;
  todo: RemoteTodo;
  message: string;
}

export interface RemoteAsyncInsights {
  completedCount: number;
  pendingCount: number;
  suggestion: RemoteAsyncInsightsSuggestion | null;
  teamLoad: Array<
    RemoteTeamMember & {
      status: "여유" | "주의" | "포화";
    }
  >;
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

const TEAM_TEMPLATES: Array<Pick<RemoteTeamMember, "name" | "role" | "focus">> =
  [
    {
      name: "민지",
      role: "프론트엔드",
      focus: "상태 구조 점검",
    },
    {
      name: "현우",
      role: "백엔드",
      focus: "API 응답 검증",
    },
    {
      name: "서윤",
      role: "디자인",
      focus: "UX 피드백 정리",
    },
    {
      name: "지훈",
      role: "QA",
      focus: "회귀 테스트",
    },
  ];

const loadRemoteTeam = (version: number): Promise<RemoteTeamMember[]> =>
  new Promise((resolve) => {
    const delay = 500 + ((version % 2) + 1) * 250;

    setTimeout(() => {
      resolve(
        TEAM_TEMPLATES.map((template, index) => {
          const capacity =
            1 + ((version + index * 2) % 4) + (version % 2 === 0 ? 0 : -1);

          return {
            id: version * 10 + index + 101,
            name: `${template.name}`,
            role: template.role,
            focus: template.focus,
            capacity: Math.max(0, capacity),
          };
        })
      );
    }, delay);
  });

export const createRemoteTeamAtom = (version: number) =>
  createAsyncAtom(loadRemoteTeam(version));

const resolveStatus = (capacity: number): "여유" | "주의" | "포화" => {
  if (capacity >= 3) return "여유";
  if (capacity >= 1) return "주의";
  return "포화";
};

export const createRemoteInsightsAtom = (
  todosAtom: Atom<RemoteTodo[]>,
  teamAtom: Atom<RemoteTeamMember[]>
) =>
  createDerivedAtom<RemoteAsyncInsights>((read) => {
    const todos = read(todosAtom);
    const team = read(teamAtom);

    const completedCount = todos.filter((todo) => todo.completed).length;
    const pendingTodos = todos.filter((todo) => !todo.completed);
    const pendingCount = pendingTodos.length;

    const sortedTeam = [...team].sort((a, b) => b.capacity - a.capacity);
    const suggestedMember =
      sortedTeam.find((member) => member.capacity > 0) ?? sortedTeam[0] ?? null;
    const highlightedTodo = pendingTodos[0] ?? null;

    const suggestion =
      suggestedMember && highlightedTodo
        ? {
            assignee: suggestedMember,
            todo: highlightedTodo,
            message:
              suggestedMember.capacity > 0
                ? `${suggestedMember.name}님이 여유가 있어 우선 배정하면 좋겠어요.`
                : `${suggestedMember.name}님이 최근 경험이 있어 적합해요.`,
          }
        : null;

    const teamLoad = team.map((member) => ({
      ...member,
      status: resolveStatus(member.capacity),
    }));

    return {
      completedCount,
      pendingCount,
      suggestion,
      teamLoad,
    };
  });

const getPostList = () => {
  return fetch("https://jsonplaceholder.typicode.com/posts/1").then((res) =>
    res.json()
  );
};

const getPostList2 = () => {
  return fetch("https://jsonplaceholder.typicode.com/posts/2").then((res) =>
    res.json()
  );
};

export const $asyncAtom = createAsyncAtom(getPostList());
export const $asyncAtom2 = createAsyncAtom(getPostList2());
