import { createAtom, get, set } from "sangtae-js";

export interface User {
  id: number;
  name: string;
}

export const $users = createAtom<User[]>([{ id: 1, name: "John Doe" }]);

set($users, [...get($users), { id: 2, name: "Jane Doe" }]);
