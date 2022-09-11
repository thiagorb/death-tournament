import { NearBindgen, near, call, view } from 'near-sdk-js';

@NearBindgen({})
export class DeathTournament {
    registeredPlayers = {};
    weaponOwnership = {};

    @view({}) // This method is read-only and can be called for free
    is_registered(playerId: string): boolean {
        return typeof this.registeredPlayers[playerId] !== undefined;
    }

    @view({}) // This method is read-only and can be called for free
    get_registered_players(): Array<String> {
        return Object.keys(this.registeredPlayers);
    }

    @call({}) // This method changes the state, for which it cost gas
    register_player(): void {
        const accountId = near.predecessorAccountId();
        // Record a log permanently to the blockchain!
        near.log(`Registering ${accountId}`);
        this.registeredPlayers[accountId] = true;
    }
}
