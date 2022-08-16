export const keyboardInitialize = <Key extends string>(keys: Key[]): { [K in Key]: boolean } => {
    const state = Object.fromEntries(keys.map(key => [key, false])) as { [K in Key]: boolean };

    addEventListener('keydown', (e: KeyboardEvent) => {
        const code = e.code as Key;
        if (code in state) {
            e.preventDefault();
            e.stopPropagation();
            state[code] = true;
        }
    });

    addEventListener('keyup', (e: KeyboardEvent) => {
        const code = e.code as Key;
        if (code in state) {
            e.preventDefault();
            e.stopPropagation();
            state[code] = false;
        }
    });

    return state;
};
