export const monetizationIsEnabled: Promise<boolean> = (() =>
    new Promise(resolve => {
        try {
            const monetization = (document as any).monetization;

            if (!monetization) {
                return;
            }

            monetization.addEventListener('monetizationstart', () => {
                if (process.env.NODE_ENV !== 'production') {
                    console.log('Monetization state', monetization.state);
                }
                resolve(monetization.state === 'started');
            });
        } catch (error) {
            if (process.env.NODE_ENV !== 'production') {
                console.error('Failed to initialize monetization', error);
            }
        }
        resolve(false);
    }))();
