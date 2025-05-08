
const activeGames = new Map();
let spawnPool = [0, 1, 2, 3, 4];
let gameReadyCount = 0;
let spawnInterval = null;
let finalSpawnTimeout = null;



function createGame(gameId, players) {
    activeGames.set(gameId, {
        players,
        scores: {},
        spawnPool: [0, 1, 2, 3, 4],     // ✅ Add this
        spawnReadyCount: 0,             // ✅ Optional if used
        spawnInterval: null,            // ✅ Optional if used
        finalSpawnTimeout: null         // ✅ Optional if used
    });

    players.forEach(ws => {
        if (ws.playerId) {
            activeGames.get(gameId).scores[ws.playerId] = 0;
        }
        ws.gameId = gameId;
    });
}

function getGame(gameId) {
    return activeGames.get(gameId);
}

function removeGame(gameId) {
    activeGames.delete(gameId);
}

module.exports = {
    activeGames,
    createGame,
    getGame,
    removeGame,
};
