import { createAtom } from "sangtae-js";

export interface User {
  id: number;
  name: string;
}

export const $users = createAtom<User[]>([{ id: 1, name: "John Doe" }]);

export const $gender = createAtom<string>("M");
