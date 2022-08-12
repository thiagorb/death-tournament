export const keyboardInitialize = <Key extends string>(keys: Key[]): Map<Key, boolean> => {
    const state = new Map(keys.map(key => [key, false]));

    addEventListener('keydown', (e: KeyboardEvent) => {
        const code = e.code as Key;
        if (state.has(code)) {
            e.preventDefault();
            e.stopPropagation();
            state.set(code, true);
        }
    });

    addEventListener('keyup', (e: KeyboardEvent) => {
        const code = e.code as Key;
        if (state.has(code)) {
            e.preventDefault();
            e.stopPropagation();
            state.set(code, false);
        }
    });

    return state;
};
