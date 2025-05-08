
const activeGames = new Map();
let spawnPool = [0, 1, 2, 3, 4];
let gameReadyCount = 0;
let spawnInterval = null;
let finalSpawnTimeout = null;



function createGame(gameId, players) {
    activeGames.set(gameId, {
        players, // Array of player WebSocket objects
        scores: {}, // Object to store player scores by playerId
        gameReadyCount: 0, // Tracks how many players are ready
        spawnInterval: null, // Will hold the interval for spawn events
        spawnPool: [0, 1, 2, 3, 4], // Example spawn pool
        spawnCount: 0, // Tracks how many spawn events have occurred
        finalSpawnTimeout: null, // Will hold the timeout for the final spawn event
    })

    players.forEach(ws => {
        if (ws.playerId) {
            activeGames.get(gameId).scores[ws.playerId] = 0;
        }
        ws.gameId = gameId; // So each socket knows what game it's in
    });
}

function getGame(gameId) {
    return activeGames.get(gameId);
}

function removeGame(gameId) {
    activeGames.delete(gameId);
}




function cleanupGame(gameId) {
    const game = activeGames.get(gameId);

    if (!game) {
        console.warn(`Game with ID ${gameId} does not exist.`);
        return;
    }

    // Clear intervals and timeouts
    if (game.spawnInterval) {
        clearInterval(game.spawnInterval);
    }
    if (game.finalSpawnTimeout) {
        clearTimeout(game.finalSpawnTimeout);
    }

    // Inform players (optional cleanup)
    game.players.forEach(ws => {
        if (ws.readyState === ws.OPEN) {
            ws.send(JSON.stringify({
                type: "game_over",
                message: "Game has ended and will now be cleaned up."
            }));
        }

        // Clear player-specific data
        delete ws.gameId;
    });

    // Finally, remove the game from the active games map
    activeGames.delete(gameId);
    console.log(`Cleaned up and removed game ${gameId} from active games.`);
}

module.exports = {
    activeGames,
    createGame,
    getGame,
    removeGame,
    cleanupGame
};
