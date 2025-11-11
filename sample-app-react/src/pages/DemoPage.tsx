import { Suspense, useEffect, useState } from "react";
import { useAtom } from "sangtae-react";
import useRenderCount from "@/hooks/useRenderCount";
import {
  $counter,
  $counterHistory,
  $doubleCounter,
  $nickname,
  $step,
  $summary,
  createRemoteTodosAtom,
  createRemoteTeamAtom,
  createRemoteInsightsAtom,
  type RemoteAsyncInsights,
  type RemoteTeamMember,
  type RemoteTodo,
} from "@/stores/demo";
import { get, set, subscribe, type Atom } from "sangtae-js";

/**
 * @description 렌더링 횟수를 표시하는 컴포넌트
 */
const RenderBadge = () => {
  const renders = useRenderCount();
  return <span className="render-badge">렌더링 {renders}회</span>;
};

const CounterValueCard = () => {
  const [counter] = useAtom($counter);

  return (
    <article className="atom-card">
      <header className="atom-card__header">
        <h3>Atom 값</h3>
        <RenderBadge />
      </header>
      <p className="atom-card__value">{counter}</p>
      <p className="atom-card__hint">
        `createAtom`으로 생성한 전역 값을 `useAtom`으로 구독합니다.
      </p>
    </article>
  );
};

/**
 * @description 카운터 업데이트 컴포넌트
 */
const CounterControlsCard = () => {
  const [counter, setCounter] = useAtom($counter);
  const [step] = useAtom($step);

  const onIncrease = () => setCounter(counter + step);
  const onDecrease = () => setCounter(counter - step);
  const onReset = () => set($counter, 0);
  const onSetSameValue = () => {
    const current = get($counter);
    set($counter, current);
  };

  return (
    <article className="atom-card">
      <header className="atom-card__header">
        <h3>Atom 업데이트</h3>
        <RenderBadge />
      </header>
      <p className="atom-card__value atom-card__value--small">
        현재 값: <strong>{counter}</strong> / 스텝: <strong>{step}</strong>
      </p>
      <div className="atom-card__actions">
        <button onClick={onDecrease}>- 스텝</button>
        <button onClick={onIncrease}>+ 스텝</button>
        <button onClick={onReset}>0으로 초기화</button>
        <button onClick={onSetSameValue}>같은 값으로 set</button>
      </div>
      <p className="atom-card__hint">
        `set` 호출 시 값이 변하지 않으면 구독 중인 컴포넌트가 다시 렌더링되지
        않습니다.
      </p>
    </article>
  );
};

/**
 * @description 스텝 선택 컴포넌트
 */
const StepSelectorCard = () => {
  const [step, setStep] = useAtom($step);

  return (
    <article className="atom-card">
      <header className="atom-card__header">
        <h3>스텝 Atom</h3>
        <RenderBadge />
      </header>
      <div className="atom-card__options">
        {[1, 5, 10].map((option) => (
          <label key={option}>
            <input
              type="radio"
              name="step"
              value={option}
              checked={step === option}
              onChange={() => setStep(option)}
            />
            {option}
          </label>
        ))}
      </div>
      <p className="atom-card__hint">
        별도의 Atom으로 관리된 값이 변경되면 해당 Atom을 구독 중인 컴포넌트만
        렌더링됩니다.
      </p>
    </article>
  );
};

/**
 * @description 닉네임 입력 컴포넌트
 */
const NicknameCard = () => {
  const [nickname, setNickname] = useAtom($nickname);

  return (
    <article className="atom-card">
      <header className="atom-card__header">
        <h3>입력 Atom</h3>
        <RenderBadge />
      </header>
      <input
        className="atom-card__input"
        value={nickname}
        placeholder="닉네임을 입력하세요"
        onChange={({ target }) => setNickname(target.value)}
      />
      <p className="atom-card__hint">
        하나의 Atom을 여러 컴포넌트에서 공유할 수 있으며, 입력값과 파생 상태가
        연결됩니다.
      </p>
    </article>
  );
};

/**
 * @description 파생 카운터 컴포넌트
 */
const DerivedCounterCard = () => {
  const [doubleCount] = useAtom($doubleCounter);

  return (
    <article className="atom-card">
      <header className="atom-card__header">
        <h3>파생 Atom</h3>
        <RenderBadge />
      </header>
      <p className="atom-card__value">{doubleCount}</p>
      <p className="atom-card__hint">
        `createDerivedAtom`으로 기본 Atom을 조합하여 만든 값입니다.
      </p>
    </article>
  );
};

/**
 * @description 요약 카운터 컴포넌트
 */
const SummaryCard = () => {
  const [summary] = useAtom($summary);

  const onLogSnapshot = () => {
    const snapshot = get($summary);
    console.table(snapshot);
  };

  return (
    <article className="atom-card">
      <header className="atom-card__header">
        <h3>Atom 요약</h3>
        <RenderBadge />
      </header>
      <dl className="atom-card__list">
        <div>
          <dt>현재 값</dt>
          <dd>{summary.counter}</dd>
        </div>
        <div>
          <dt>스텝</dt>
          <dd>{summary.step}</dd>
        </div>
        <div>
          <dt>다음 값</dt>
          <dd>{summary.next}</dd>
        </div>
        <div>
          <dt>메시지</dt>
          <dd>{summary.greeting}</dd>
        </div>
      </dl>
      <button onClick={onLogSnapshot} className="atom-card__log-btn">
        현재 상태 콘솔로 확인
      </button>
      <p className="atom-card__hint">
        `get`을 호출하면 React 컴포넌트 밖에서도 atom 스냅샷을 읽을 수 있습니다.
      </p>
    </article>
  );
};

/**
 * @description 비동기 투두 카드 컴포넌트
 */
const AsyncTodosCardContent = ({
  atom,
  version,
  onRefresh,
}: {
  atom: Atom<RemoteTodo[]>;
  version: number;
  onRefresh: () => void;
}) => {
  const [todos, setTodos] = useAtom(atom);

  const completedCount = todos.filter((todo) => todo.completed).length;

  const onToggleComplete = (id: number) => {
    setTodos(
      todos.map((todo) =>
        todo.id === id ? { ...todo, completed: !todo.completed } : todo
      )
    );
  };

  const onCompleteAll = () => {
    const isAllCompleted = todos.every(({ completed }) => completed);

    setTodos(
      isAllCompleted
        ? todos
        : todos.map((todo) => ({ ...todo, completed: true }))
    );
  };

  return (
    <article className="atom-card atom-card--wide async-card">
      <header className="atom-card__header">
        <h3>createAsyncAtom 데모</h3>
        <RenderBadge />
      </header>
      <p className="atom-card__hint">
        Promise를 받아 최초 구독 시 `Suspense`를 통해 로딩 상태를 노출합니다.
        이후에는 `set`을 사용해 비동기 데이터도 즉시 수정할 수 있습니다.
      </p>
      <div className="async-card__stats">
        <span>데이터 버전: v{version + 1}</span>
        <span>
          완료 {completedCount}/{todos.length}
        </span>
      </div>
      <ul className="async-card__list">
        {todos.map((todo) => (
          <li
            key={todo.id}
            className={`async-card__item${
              todo.completed ? " async-card__item--completed" : ""
            }`}
          >
            <div className="async-card__item-main">
              <strong>{todo.title}</strong>
              <p>{todo.description}</p>
            </div>
            <button onClick={() => onToggleComplete(todo.id)}>
              {todo.completed ? "되돌리기" : "완료"}
            </button>
          </li>
        ))}
      </ul>
      <div className="atom-card__actions async-card__actions">
        <button onClick={onRefresh}>데이터 새로고침</button>
        <button onClick={onCompleteAll}>모두 완료 처리</button>
      </div>
    </article>
  );
};

/**
 * @description 비동기 투두 카드 컨테이너
 */
const AsyncTodosCard = ({
  atom,
  version,
  onRefresh,
}: {
  atom: Atom<RemoteTodo[]>;
  version: number;
  onRefresh: () => void;
}) => {
  return (
    <Suspense
      fallback={
        <article className="atom-card atom-card--wide async-card async-card--loading">
          <header className="atom-card__header">
            <h3>createAsyncAtom 데모</h3>
          </header>
          <p className="atom-card__hint">
            비동기 데이터를 불러오는 중입니다...
          </p>
        </article>
      }
    >
      <AsyncTodosCardContent
        atom={atom}
        version={version}
        onRefresh={onRefresh}
      />
    </Suspense>
  );
};

/**
 * @description createAsyncAtom 파생 아톰 카드
 */
const AsyncInsightsCardContent = ({
  insightsAtom,
  teamAtom,
  version,
  onRefresh,
}: {
  insightsAtom: Atom<RemoteAsyncInsights>;
  teamAtom: Atom<RemoteTeamMember[]>;
  version: number;
  onRefresh: () => void;
}) => {
  const [insights] = useAtom(insightsAtom);
  const [team, setTeam] = useAtom(teamAtom);

  const CAPACITY_PRESETS = [
    { label: "여유", capacity: 3 },
    { label: "주의", capacity: 1 },
    { label: "포화", capacity: 0 },
  ] as const;
  const MAX_CAPACITY = 6;

  const resolveStatusLabel = (capacity: number) => {
    if (capacity >= 3) return "여유";
    if (capacity >= 1) return "주의";
    return "포화";
  };

  const onAdjustCapacity = (id: number, delta: number) => {
    setTeam(
      team.map((member) =>
        member.id === id
          ? {
              ...member,
              capacity: Math.max(
                0,
                Math.min(MAX_CAPACITY, member.capacity + delta)
              ),
            }
          : member
      )
    );
  };

  const onSetPreset = (id: number, capacity: number) => {
    setTeam(
      team.map((member) =>
        member.id === id ? { ...member, capacity } : member
      )
    );
  };

  return (
    <article className="atom-card atom-card--wide async-card">
      <header className="atom-card__header">
        <h3>파생 Async Atom</h3>
        <RenderBadge />
      </header>
      <p className="atom-card__hint">
        두 개의 `createAsyncAtom`에서 불러온 데이터를 `createDerivedAtom`으로
        합성해 추천 정보를 계산합니다.
      </p>
      <div className="async-card__stats">
        <span>데이터 버전: v{version + 1}</span>
        <span>팀원 {team.length}명</span>
        <span>
          미완료 {insights.pendingCount} / 완료 {insights.completedCount}
        </span>
      </div>
      {insights.suggestion ? (
        <div className="async-card__summary">
          <strong>{insights.suggestion.assignee.name}</strong>
          <span>{insights.suggestion.message}</span>
          <p>
            <em>{insights.suggestion.todo.title}</em> 작업을 맡으면 좋겠어요.
          </p>
        </div>
      ) : (
        <div className="async-card__summary async-card__summary--success">
          모든 작업이 완료되었습니다! 팀이 휴식을 취해도 좋겠어요.
        </div>
      )}
      <ul className="team-list">
        {insights.teamLoad.map((member) => {
          const statusClass =
            member.status === "여유"
              ? "team-list__status--positive"
              : member.status === "주의"
              ? "team-list__status--warning"
              : "team-list__status--danger";

          return (
            <li key={member.id} className="team-list__item">
              <div className="team-list__meta">
                <strong>{member.name}</strong>
                <span>{member.role}</span>
                <small>{member.focus}</small>
              </div>
              <div className={`team-list__status ${statusClass}`}>
                {member.status} · 여유 {member.capacity}
              </div>
              <div className="team-list__controls">
                <div className="team-list__control-row">
                  <button
                    className="team-list__btn"
                    onClick={() => onAdjustCapacity(member.id, 1)}
                  >
                    + 여유도
                  </button>
                  <button
                    className="team-list__btn"
                    onClick={() => onAdjustCapacity(member.id, -1)}
                  >
                    - 여유도
                  </button>
                </div>
                <div className="team-list__control-row">
                  {CAPACITY_PRESETS.map((preset) => (
                    <button
                      key={preset.label}
                      className={`team-list__preset${
                        member.status === preset.label
                          ? " team-list__preset--active"
                          : ""
                      }`}
                      onClick={() => onSetPreset(member.id, preset.capacity)}
                    >
                      {preset.label}로 설정
                    </button>
                  ))}
                </div>
                <div className="team-list__hint">
                  현재 상태: {resolveStatusLabel(member.capacity)} / 여유도{" "}
                  {member.capacity}
                </div>
              </div>
            </li>
          );
        })}
      </ul>
      <div className="atom-card__actions async-card__actions">
        <button onClick={onRefresh}>데이터 새로고침</button>
      </div>
    </article>
  );
};

const AsyncInsightsCard = (props: {
  insightsAtom: Atom<RemoteAsyncInsights>;
  teamAtom: Atom<RemoteTeamMember[]>;
  version: number;
  onRefresh: () => void;
}) => {
  return (
    <Suspense
      fallback={
        <article className="atom-card atom-card--wide async-card async-card--loading">
          <header className="atom-card__header">
            <h3>파생 Async Atom</h3>
          </header>
          <p className="atom-card__hint">
            파생 상태를 계산하기 위한 데이터를 불러오는 중입니다...
          </p>
        </article>
      }
    >
      <AsyncInsightsCardContent {...props} />
    </Suspense>
  );
};

/**
 * @description 비동기 아톰 데모 섹션
 */
const AsyncAtomsSection = () => {
  const [{ version, todosAtom, teamAtom, insightsAtom }, setAsyncState] =
    useState(() => {
      const initialVersion = 0;
      const initialTodosAtom = createRemoteTodosAtom(initialVersion);
      const initialTeamAtom = createRemoteTeamAtom(initialVersion);

      return {
        version: initialVersion,
        todosAtom: initialTodosAtom,
        teamAtom: initialTeamAtom,
        insightsAtom: createRemoteInsightsAtom(
          initialTodosAtom,
          initialTeamAtom
        ),
      };
    });

  const onRefresh = () =>
    setAsyncState((prev) => {
      const nextVersion = prev.version + 1;
      const nextTodosAtom = createRemoteTodosAtom(nextVersion);
      const nextTeamAtom = createRemoteTeamAtom(nextVersion);

      return {
        version: nextVersion,
        todosAtom: nextTodosAtom,
        teamAtom: nextTeamAtom,
        insightsAtom: createRemoteInsightsAtom(nextTodosAtom, nextTeamAtom),
      };
    });

  return (
    <section className="demo-section">
      <header className="demo-section__header">
        <h2>비동기 Atom</h2>
        <p>
          `createAsyncAtom`을 `Suspense`와 함께 사용하는 기본 예제와, 여러
          비동기 Atom을 파생 Atom으로 묶어 추가 정보를 계산하는 예제를 함께
          확인할 수 있습니다.
        </p>
      </header>
      <div className="demo-grid">
        <AsyncTodosCard
          atom={todosAtom}
          version={version}
          onRefresh={onRefresh}
        />
        <AsyncInsightsCard
          insightsAtom={insightsAtom}
          teamAtom={teamAtom}
          version={version}
          onRefresh={onRefresh}
        />
      </div>
    </section>
  );
};

/**
 * @description 카운터 변경 이력 카드 컴포넌트
 */
const CounterHistoryCard = () => {
  const [history] = useAtom($counterHistory);
  const [isSubscribed, setIsSubscribed] = useState(true);

  useEffect(() => {
    if (!isSubscribed) {
      return;
    }

    const unsubscribe = subscribe($counter, (value) => {
      const summary = get($summary);
      const timestamp = new Date().toLocaleTimeString();
      const entry = `${timestamp} → ${value} (다음: ${summary.next})`;
      const current = get($counterHistory);
      const nextHistory = [entry, ...current].slice(0, 8);
      set($counterHistory, nextHistory);
    });

    return () => unsubscribe();
  }, [isSubscribed]);

  const onToggleSubscribe = () => {
    if (isSubscribed) {
      set($counterHistory, []);
    }
    setIsSubscribed((prev) => !prev);
  };

  return (
    <article className="atom-card atom-card--wide">
      <header className="atom-card__header">
        <h3>수동 구독자</h3>
        <RenderBadge />
      </header>
      <div className="atom-card__actions">
        <button onClick={onToggleSubscribe}>
          {isSubscribed ? "구독 해제" : "다시 구독"}
        </button>
      </div>
      <p className="atom-card__hint">
        `subscribe`로 직접 구독을 생성하고 해제할 수 있습니다. 구독이 제거되면
        내부 listener Set이 비워집니다.
      </p>
      {isSubscribed ? (
        <ul className="history-list">
          {history.length === 0 && (
            <li className="history-list__empty">아직 변경 이력이 없습니다.</li>
          )}
          {history.map((entry, index) => (
            <li key={`${entry}-${index}`}>{entry}</li>
          ))}
        </ul>
      ) : (
        <div className="history-list__empty">
          구독이 해제되어 변경 이력을 수집하지 않습니다.
        </div>
      )}
    </article>
  );
};

/**
 * @description 데모 페이지 컴포넌트
 */
const DemoPage = () => {
  return (
    <div className="demo-page">
      <section className="demo-section">
        <header className="demo-section__header">
          <h2>Minimal Global State 데모</h2>
          <p>
            Atom 생성부터 파생 값, 수동 구독까지 라이브러리의 핵심 기능을 한
            페이지에서 확인할 수 있습니다.
          </p>
        </header>
        <div className="demo-grid">
          <CounterValueCard />
          <CounterControlsCard />
          <StepSelectorCard />
          <NicknameCard />
          <DerivedCounterCard />
          <SummaryCard />
        </div>
      </section>
      <AsyncAtomsSection />
      <section className="demo-section">
        <header className="demo-section__header">
          <h2>구독자 동작 확인</h2>
          <p>
            동일한 값으로 `set`하면 구독자가 호출되지 않으며, 필요 시 구독을
            직접 관리하여 GC-friendly하게 동작합니다.
          </p>
        </header>
        <CounterHistoryCard />
      </section>
    </div>
  );
};

export default DemoPage;
