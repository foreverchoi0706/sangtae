"use strict";

// src/index.ts
var VALUE = Symbol("ATOM_VALUE");
var LISTENERS = Symbol("ATOM_LISTENERS");
var createAtom = (initialValue) => {
  return {
    [VALUE]: initialValue,
    [LISTENERS]: /* @__PURE__ */ new Set(),
  };
};
var get = (atom) => {
  return atom[VALUE];
};
var set = (atom, newValue) => {
  if (Object.is(atom[VALUE], newValue)) return;
  atom[VALUE] = newValue;
  atom[LISTENERS].forEach((listener) => listener(newValue));
};
function subscribe(atom, callback) {
  const listeners = atom[LISTENERS];
  listeners.add(callback);
  callback(atom[VALUE]);
  return () => listeners.delete(callback);
}

exports.createAtom = createAtom;
exports.get = get;
exports.set = set;
exports.subscribe = subscribe;
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map
