import { createAtom, createAsyncAtom, createDerivedAtom } from "sangtae-js";

export interface User {
  id: number;
  name: string;
}

export interface Post {
  userId: number;
  id: number;
  title: string;
  body: string;
}

export const $user = createAtom<User>({ id: 1, name: "John Doe" });

export const $posts = createAsyncAtom<Post[]>(
  fetch("https://jsonplaceholder.typicode.com/posts").then((res) => res.json())
);

export const $gender = createAtom<string>("M");

export const $a = createAtom("AAA");

export const $b = createAtom("BBB");

export const $c = createDerivedAtom((get) => {
  const A = get($a);
  const B = get($b);
  return A + B;
});
