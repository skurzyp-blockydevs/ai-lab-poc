// @ts-nocheck
// Browser polyfill for Node.js async_hooks module
// This provides a minimal implementation that prevents crashes

export // @ts-nocheck
    class AsyncLocalStorage {
    constructor() {
        this._store = new Map();
    }

    run(store, callback, ...args) {
        this._store.set('current', store);
        try {
            return callback(...args);
        } finally {
            this._store.delete('current');
        }
    }

    getStore() {
        return this._store.get('current');
    }

    enterWith(store) {
        this._store.set('current', store);
    }

    disable() {
        this._store.clear();
    }
}

export class AsyncResource {
    constructor(type, options) {
        this.type = type;
    }

    runInAsyncScope(fn, thisArg, ...args) {
        return fn.apply(thisArg, args);
    }

    emitDestroy() { }

    asyncId() {
        return 1;
    }

    triggerAsyncId() {
        return 1;
    }
}

export function executionAsyncId() {
    return 1;
}

export function triggerAsyncId() {
    return 1;
}

export function createHook() {
    return {
        enable() { },
        disable() { },
    };
}
