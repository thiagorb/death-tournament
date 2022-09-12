import { storageGetNetworkId, storageKey, storageSetNetworkId } from './storage';

declare const nearApi: any;

const enum NearInstanceProperties {
    NetworkId,
    ContractName,
    Connection,
    Contract,
}

export type NearOpponent = { weaponType: number; playerId: string };

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
        get_opponent(_: { playerId: string }): Promise<NearOpponent>;
        get_player_weapons(_: { playerId: string }): Promise<Array<number>>;
        get_registered_players(): Promise<Object>;
        get_weapons(): Promise<Object>;
        register_player(): Promise<void>;
        claim_weapon(): Promise<void>;
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

    const contract = ((window as any).contract = await new nearApi.Contract(walletConnection.account(), contractName, {
        viewMethods: ['is_registered', 'get_opponent', 'get_player_weapons', 'get_registered_players', 'get_weapons'],
        changeMethods:
            process.env.NODE_ENV !== 'production'
                ? ['register_player', 'claim_weapon', 'reset']
                : ['register_player', 'claim_weapon'],
        sender: walletConnection.getAccountId(),
    }));

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

const registerIfNewPlayer = async (near: NearInstance) => {
    if (!nearIsSignedIn(near)) {
        return;
    }

    if (await near[NearInstanceProperties.Contract].is_registered({ playerId: nearGetAccountId(near) })) {
        return;
    }

    await near[NearInstanceProperties.Contract].register_player();
};

export const nearGetSignedIn = (): Promise<NearInstance> => {
    if (!nearSignedIn) {
        nearSignedIn = (async () => {
            const networkId = storageGetNetworkId();
            if (!networkId) {
                return null;
            }

            const near = await (networkId === 'testnet' ? getNearTest() : getNearMain());
            registerIfNewPlayer(near);

            // console.log('players', await near[NearInstanceProperties.Contract].get_registered_players());
            // console.log('weapons', await near[NearInstanceProperties.Contract].get_weapons());

            return nearIsSignedIn(near) ? near : null;
        })();
    }

    return nearSignedIn;
};

export const nearSignOut = async () => {
    (await nearGetSignedIn())[NearInstanceProperties.Connection].signOut();
    nearSignedIn = null;
    storageSetNetworkId(null);
};

export const nearGetNeworkId = (near: NearInstance) => near[NearInstanceProperties.NetworkId];

export const nearGetOpponent = (near: NearInstance) => {
    return near[NearInstanceProperties.Contract].get_opponent({ playerId: nearGetAccountId(near) });
};

export const nearClaimWeapon = (near: NearInstance) => {
    return near[NearInstanceProperties.Contract].claim_weapon();
};

export const nearGetPlayerWeapons = (near: NearInstance) => {
    return near[NearInstanceProperties.Contract].get_player_weapons({ playerId: nearGetAccountId(near) });
};
