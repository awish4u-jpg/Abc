// Undo stack: stores up to 20 actions with their reverse operations
const MAX_STACK = 20;
let stack = [];
let listeners = new Set();

function notify() {
  listeners.forEach((fn) => fn(stack.length));
}

export const undoStore = {
  push(action) {
    // action: { description, undo: async () => void }
    stack.push(action);
    if (stack.length > MAX_STACK) stack.shift();
    notify();
  },

  async undo() {
    const action = stack.pop();
    if (!action) return null;
    await action.undo();
    notify();
    return action;
  },

  peek() {
    return stack.length > 0 ? stack[stack.length - 1] : null;
  },

  size() {
    return stack.length;
  },

  clear() {
    stack = [];
    notify();
  },

  subscribe(fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  },
};
