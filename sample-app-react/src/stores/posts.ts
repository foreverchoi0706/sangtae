import { createAtom, createDerivedAtom } from "sangtae-js";

export interface Post {
  userId: number;
  id: number;
  title: string;
  body: string;
}

export const $posts = createAtom<Post[]>([
  {
    userId: 1,
    id: 1,
    title: "title 1",
    body: "body 1",
  },
]);

export const $gender = createAtom<string>("M");

export const $a = createAtom("AAA");

export const $b = createAtom("BBB");

export const $c = createDerivedAtom((get) => {
  const A = get($a);
  const B = get($b);
  return A + B;
});
