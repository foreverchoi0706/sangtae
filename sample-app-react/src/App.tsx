import "@/App.css";
import logo from "@/assets/react.svg";
import DemoPage from "@/pages/DemoPage";
import { useEffect } from "react";
import { getAsync, createDerivedAtom, createAsyncAtom } from "sangtae-js";
import { useAtom } from "sangtae-react";

interface Post {
  id: number;
  title: string;
  body: string;
  userId: number;
}

const getPostList = (): Promise<Post> =>
  fetch("https://jsonplaceholder.typicode.com/posts/1").then((response) =>
    response.json()
  );

const getPostList2 = (): Promise<Post> =>
  fetch("https://jsonplaceholder.typicode.com/posts/2").then((response) =>
    response.json()
  );

const $asyncAtom = createAsyncAtom(getPostList());
const $asyncAtom2 = createAsyncAtom(getPostList2());
const $asyncAtom3 = createAsyncAtom(Promise.resolve(1));

const App = () => {
  const derivedAtom = createDerivedAtom((get) => [
    get($asyncAtom3),
    get($asyncAtom),
    get($asyncAtom2),
  ]);

  useEffect(() => {
    getAsync(derivedAtom).then(console.log);
  }, [derivedAtom]);

  const [a, setA] = useAtom(derivedAtom);

  console.log("a", a);
  console.log("setA", setA);
  return (
    <main>
      <header className="header">
        <div className="header-link">
          <img src={logo} alt="logo" className="logo" />
          <h1>SAMPLE APP REACT</h1>
        </div>
      </header>
      <DemoPage />
    </main>
  );
};

export default App;
