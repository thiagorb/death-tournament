import { storageGetNetworkId, storageKey, storageSetNetworkId } from './storage';

declare const nearApi: any;

const enum NearInstanceProperties {
    NetworkId,
    ContractName,
    Connection,
    Contract,
}

export type NearInstance = {
    [NearInstanceProperties.NetworkId]: string;
    [NearInstanceProperties.ContractName]: string;
    [NearInstanceProperties.Connection]: {
        isSignedIn(): boolean;
        account(): object;
        getAccountId(): string;
        requestSignIn(contractName?: string, title?: string): void;
        signOut(): void;
    };
    [NearInstanceProperties.Contract]: {
        is_registered(_: { playerId: string }): Promise<boolean>;
        get_registered_players(): Promise<Set<string>>;
        register_player(): Promise<void>;
    };
};

const nearCreate = async (networkId: string): Promise<NearInstance> => {
    const contractStorageKey = `${storageKey}-${networkId}`;
    const contractName = `death-tournament.${networkId === 'testnet' ? 'testnet' : 'near'}`;
    const nearConnection = await nearApi.connect({
        nodeUrl: `https://rpc.${networkId}.near.org`,
        walletUrl: `https://wallet.${networkId}.near.org`,
        helperUrl: `https://helper.${networkId}.near.org`,
        explorerUrl: `https://explorer.${networkId}.near.org`,
        networkId,
        keyStore: new nearApi.keyStores.BrowserLocalStorageKeyStore(localStorage, contractStorageKey),
    });

    const walletConnection = new nearApi.WalletConnection(nearConnection, contractStorageKey);

    let contract;
    if (process.env.NODE_ENV !== 'production') {
        contract = await new nearApi.Contract(walletConnection.account(), contractName, {
            viewMethods: ['is_registered', 'get_registered_players'],
            changeMethods: ['register_player'],
            sender: walletConnection.getAccountId(),
        });
    } else {
        contract = await new nearApi.Contract(walletConnection.account(), contractName, {
            viewMethods: ['is_registered', 'get_registered_players'],
            changeMethods: ['register_player'],
            sender: walletConnection.getAccountId(),
        });
    }

    return {
        [NearInstanceProperties.NetworkId]: networkId,
        [NearInstanceProperties.ContractName]: contractName,
        [NearInstanceProperties.Connection]: walletConnection,
        [NearInstanceProperties.Contract]: contract,
    };
};

export const nearGetAccountId = (near: NearInstance) => near[NearInstanceProperties.Connection].getAccountId();
export const nearIsSignedIn = (near: NearInstance) => near[NearInstanceProperties.Connection].isSignedIn();

let getNearTest = () => nearCreate('testnet');
let getNearMain = () => nearCreate('mainnet');
let nearSignedIn: Promise<NearInstance>;

export const nearRequestSignIn = async (networkId: string) => {
    storageSetNetworkId(networkId);
    const near = await (networkId === 'testnet' ? getNearTest() : getNearMain());
    near[NearInstanceProperties.Connection].requestSignIn(
        near[NearInstanceProperties.ContractName],
        'Death Tournament'
    );
};

export const nearGetSignedIn = (): Promise<NearInstance> => {
    if (!nearSignedIn) {
        nearSignedIn = (async () => {
            const networkId = storageGetNetworkId();
            if (!networkId) {
                return null;
            }

            const near = await (networkId === 'testnet' ? getNearTest() : getNearMain());

            if (nearIsSignedIn(near)) {
                if (
                    !(await near[NearInstanceProperties.Contract].is_registered({ playerId: nearGetAccountId(near) }))
                ) {
                    await near[NearInstanceProperties.Contract].register_player();
                }
            }

            return nearIsSignedIn(near) ? near : null;
        })();
    }

    return nearSignedIn;
};

export const nearSignOut = async () => {
    (await getNearMain())[NearInstanceProperties.Connection].signOut();
    (await getNearTest())[NearInstanceProperties.Connection].signOut();
    nearSignedIn = null;
    storageSetNetworkId(null);
};

export const nearGetNeworkId = (near: NearInstance) => near[NearInstanceProperties.NetworkId];
