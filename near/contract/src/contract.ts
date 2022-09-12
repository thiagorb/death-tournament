import { NearBindgen, near, call, view } from 'near-sdk-js';
import { weaponGetRandomId, weaponTotalTypes } from '../../../src/weapon';

type Opponent = { type: number } | { weaponId: number };
type Weapon = {
    type: number;
    ownerId: string;
};

@NearBindgen({})
export class DeathTournament {
    registeredPlayers: { [playerId: string]: { opponent: Opponent } } = {};
    weapons: Array<Weapon> = [];

    @view({})
    is_registered({ playerId }: { playerId: string }): boolean {
        return typeof this.registeredPlayers[playerId] !== 'undefined';
    }

    @view({})
    get_opponent({ playerId }: { playerId: string }) {
        const player = this.registeredPlayers[playerId];
        if ('weaponId' in player.opponent) {
            return {
                weaponType: this.weapons[player.opponent.weaponId].type,
                playerId: this.weapons[player.opponent.weaponId].ownerId,
            };
        } else {
            return {
                weaponType: player.opponent.type,
                playerId: null,
            };
        }
    }

    @view({})
    get_player_weapons({ playerId }: { playerId: string }) {
        return this.weapons.filter(weapon => weapon.ownerId === playerId).map(weapon => weapon.type);
    }

    @view({})
    get_registered_players() {
        return Object.entries(this.registeredPlayers).map(([accountId, player]) => ({
            accountId,
            opponentId: 'weaponId' in player.opponent ? player.opponent.weaponId : null,
            weaponType: 'weaponId' in player.opponent ? null : player.opponent.type,
        }));
    }

    @view({})
    get_weapons(): Array<Weapon> {
        return this.weapons;
    }

    @call({})
    register_player(): void {
        const accountId = near.signerAccountId();
        this.registeredPlayers[accountId] = {
            opponent: this.select_opponent(accountId),
        };
    }

    @call({})
    claim_weapon(): void {
        const accountId = near.signerAccountId();
        const player = this.registeredPlayers[accountId];
        if ('weaponId' in player.opponent) {
            this.weapons[player.opponent.weaponId].ownerId = accountId;
        } else {
            this.weapons.push({ type: player.opponent.type, ownerId: accountId });
        }
        player.opponent = this.select_opponent(accountId);
    }

    @call({})
    reset(): void {
        this.registeredPlayers = {};
        this.weapons = [];
    }

    select_opponent(playerId: string): Opponent {
        const options = Math.max(
            50,
            (Object.keys(this.registeredPlayers).length * 0.75) | 0,
            Object.keys(this.weapons).length
        );

        let selectedOption = Number(near.blockTimestamp() % BigInt(options));
        if (selectedOption < this.weapons.length && this.weapons[selectedOption].ownerId === playerId) {
            selectedOption++;
        }

        if (selectedOption < this.weapons.length) {
            return {
                weaponId: selectedOption,
            };
        } else {
            const precision = 1_000_000;
            return { type: weaponGetRandomId(Number(near.blockTimestamp() % BigInt(precision)) / precision) };
        }
    }
}
