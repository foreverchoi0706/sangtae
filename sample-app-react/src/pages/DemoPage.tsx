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
    setTodos(todos.map((todo) => ({ ...todo, completed: true })));
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
 * @description 비동기 투두 카드 컴포넌트
 */
const AsyncTodosCard = () => {
  const [{ atom, version }, setAsyncState] = useState(() => ({
    atom: createRemoteTodosAtom(0),
    version: 0,
  }));

  const onRefresh = () =>
    setAsyncState((prev) => {
      const nextVersion = prev.version + 1;
      return {
        atom: createRemoteTodosAtom(nextVersion),
        version: nextVersion,
      };
    });

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
      <section className="demo-section">
        <header className="demo-section__header">
          <h2>비동기 Atom</h2>
          <p>
            `createAsyncAtom`은 Promise를 전달받아 데이터를 캐싱하고,
            `Suspense`와 결합하여 자연스러운 비동기 UX를 제공합니다.
          </p>
        </header>
        <AsyncTodosCard />
      </section>
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
