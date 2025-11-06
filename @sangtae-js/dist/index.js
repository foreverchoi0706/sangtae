'use strict';

// src/index.ts
var VALUE = Symbol("ATOM_VALUE");
var LISTENERS = Symbol("ATOM_LISTENERS");
var createAtom = (initialValue) => {
  return {
    [VALUE]: initialValue,
    [LISTENERS]: null
  };
};
var createDerivedAtom = (callback) => {
  const dependencies = /* @__PURE__ */ new Set();
  const initialValue = callback((atom) => {
    dependencies.add(atom);
    return atom[VALUE];
  });
  const derivedAtom = {
    [VALUE]: initialValue,
    [LISTENERS]: null
  };
  dependencies.forEach((dependency) => {
    subscribe(dependency, () => {
      const newValue = callback(get);
      if (!Object.is(derivedAtom[VALUE], newValue)) {
        derivedAtom[VALUE] = newValue;
      }
    });
  });
  return derivedAtom;
};
var get = (atom) => atom[VALUE];
var set = (atom, newValue) => {
  if (Object.is(atom[VALUE], newValue)) return;
  atom[VALUE] = newValue;
  const listeners = atom[LISTENERS];
  if (listeners !== null) listeners.forEach((listener) => listener(newValue));
};
var subscribe = (atom, callback) => {
  let listeners = atom[LISTENERS];
  if (listeners === null) {
    listeners = /* @__PURE__ */ new Set();
    atom[LISTENERS] = listeners;
  }
  listeners.add(callback);
  callback(atom[VALUE]);
  return () => {
    const currentListeners = atom[LISTENERS];
    if (currentListeners === null) return;
    currentListeners.delete(callback);
    if (currentListeners.size === 0) {
      atom[LISTENERS] = null;
    }
  };
};

exports.createAtom = createAtom;
exports.createDerivedAtom = createDerivedAtom;
exports.get = get;
exports.set = set;
exports.subscribe = subscribe;
//# sourceMappingURL=index.js.map
//# sourceMappingURL=index.js.map