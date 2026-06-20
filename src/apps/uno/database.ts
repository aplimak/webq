import { getLocalItem, StorageCategory, setLocalItem } from "../../utils";
import type { PlayerDefinition, RoundResult } from "./models";

const defaultPlayerDefs: PlayerDefinition[] = [
    {
        id: "S",
        name: "Saeed",
    },
    {
        id: "M",
        name: "Masoumeh",
    },
    {
        id: "A",
        name: "Alireza",
    },
];

export function getDefaultPlayerDefs() {
    return defaultPlayerDefs.slice();
}

export function verifyPlayerDefs(players: PlayerDefinition[]) {
    if (players.length < 2) {
        throw Error("At least two players are required");
    }

    const seenIds: string[] = [];
    for (const playerDef of players) {
        if (typeof playerDef.id !== "string") {
            throw TypeError("Player id must be string");
        }
        if (typeof playerDef.name !== "string") {
            throw TypeError("Player name must be string");
        }

        if (!playerDef.id || playerDef.id.length === 0) {
            throw Error("Player id is required");
        }
        if (playerDef.id.length > 1) {
            throw Error("Player id must be one character");
        }

        if (!playerDef.name || playerDef.name.length === 0) {
            throw Error("Player name is required");
        }

        if (seenIds.includes(playerDef.id)) {
            throw Error(`Duplicated player id: ${playerDef.id}`);
        }
        seenIds.push(playerDef.id);
    }
}

export function verifyRounds(rounds: RoundResult[]) {
    let i = 1;
    for (const round of rounds) {
        if (typeof round.id !== "number") {
            throw TypeError("round id must be numeric");
        }
        if (typeof round.winner !== "string") {
            throw TypeError("round winner must be string");
        }

        if (round.id !== i) {
            throw Error("Out of order round record");
        }

        if (!round.winner || round.winner.length === 0) {
            throw Error("Round record does not have any winner");
        }
        if (round.winner.length > 1) {
            throw Error("Invalid winner id");
        }

        // we dont check if the winner is actually exists as players may be updated mid-game

        for (const score of round.scores) {
            if (typeof score.playerId !== "string") {
                throw TypeError("Score's player id must be string");
            }
            if (typeof score.score !== "number") {
                throw TypeError("Player score must be numeric");
            }

            if (!score.playerId || score.playerId.length === 0) {
                throw Error("Score record does not belong to any players");
            }
            if (score.playerId.length > 1) {
                throw Error("Invalid score record player id");
            }

            if (score.score < 0) {
                throw Error("Player score can't be negative");
            }
        }

        i++;
    }
}

export function getPlayerDefs() {
    const existingPlayers = getLocalItem(StorageCategory.Uno, "players");
    let players: PlayerDefinition[];
    if (existingPlayers) {
        try {
            players = JSON.parse(existingPlayers);
            verifyPlayerDefs(players);
        } catch (e) {
            console.error(e);
            players = defaultPlayerDefs.slice();
        }
    } else {
        players = defaultPlayerDefs.slice();
    }
    return players;
}

export function addPlayerDef(player: PlayerDefinition) {
    const players = getPlayerDefs();
    players.push(player);

    updatePlayerDefs(players);
}

export function removePlayerDef(player: PlayerDefinition) {
    const players = getPlayerDefs().filter((item) => {
        return item.id !== player.id;
    });

    updatePlayerDefs(players);
}

export function resetPlayerDefs() {
    updatePlayerDefs(defaultPlayerDefs);
}

export function updatePlayerDefs(players: PlayerDefinition[]) {
    verifyPlayerDefs(players);
    const data = JSON.stringify(players);
    setLocalItem(StorageCategory.Uno, "players", data);
}

export function getRounds() {
    const existingRounds = getLocalItem(StorageCategory.Uno, "rounds");
    let rounds: RoundResult[];
    if (existingRounds) {
        try {
            rounds = JSON.parse(existingRounds);
            verifyRounds(rounds);
        } catch (e) {
            console.error(e);
            rounds = [];
        }
    } else {
        rounds = [];
    }
    return rounds;
}

export function storeRound(round: RoundResult) {
    const rounds = getRounds();
    rounds.push(round);

    updateRounds(rounds);
}

export function removeLastRound() {
    const rounds = getRounds();
    rounds.pop();

    updateRounds(rounds);
}

export function resetRounds() {
    updateRounds([]);
}

function updateRounds(rounds: RoundResult[]) {
    verifyRounds(rounds);
    const data = JSON.stringify(rounds);
    setLocalItem(StorageCategory.Uno, "rounds", data);
}
