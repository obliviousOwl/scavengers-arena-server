// Spawn index pool (shared for all players)
let spawnPool = [0, 1, 2, 3, 4];
let gameReadyCount = 0;
let spawnInterval = null;
let finalSpawnTimeout = null;

const { activeGames } = require('./gameRooms');


const collectibleData = {
    "apple_collectibles": 0.5,
    "banana_collectibles": 0.45,
    "cherry_collectibles": 0.4,
    "kiwi_collectibles": 0.35,
    "melon_collectibles": 0.3,
    "orange_collectibles": 0.25,
    "pineapple_collectible": 0.2,
    "strawberry_collectibles": 0.15,
    "coin_collectibles": 0.1
};

function getNextSpawnIndex(gameId) {
    const game = activeGames.get(gameId);

    if (!game || !game.spawnPool) {
        console.error("Game or spawnPool not found.");
        return null;
    }

    if (game.spawnPool.length === 0) {
        // Reset the pool when all indices are used
        game.spawnPool = [0, 1, 2, 3, 4];
        console.log(`Resetting spawnPool for game ${gameId}`);
    }

    // Pick a random index from the pool
    const randomIndex = Math.floor(Math.random() * game.spawnPool.length);
    const spawnIndex = game.spawnPool.splice(randomIndex, 1)[0]; // Remove and return
    return spawnIndex;
}

function handleRespawnRequest(ws, msg, wss) {
    const gameId = ws.gameId;
    if (!gameId || !activeGames.has(gameId)) {
        console.warn(`Game ID not found for respawn: ${gameId}`);
        return;
    }

    const spawnIndex = getNextSpawnIndex(gameId);

    const response = {
        type: "spawn",
        player_id: msg.playerIndex,
        spawn_index: spawnIndex
    };

    // ✅ Only send to the requesting player
    if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(response));
    }
}

function handleSpawnables(ws, msg, wss) {
    const gameId = ws.gameId;

    const game = activeGames.get(gameId);

    if (!game) {
        console.warn(`No active game found for gameId: ${gameId}`);
        return;
    }

    game.gameReadyCount = (game.gameReadyCount || 0) + 1;

    if (game.gameReadyCount === 2 && !game.spawnInterval) {
        console.log(`Starting spawn loop for game ${gameId}`);

        game.spawnPool = [0, 1, 2, 3, 4];
        game.spawnCount = 0;

        // Send first spawn event
        const firstSpawn = {
            type: "spawn_event",
            spawnables: generateSpawnables(collectibleData),
        };

        game.players.forEach(player => {
            if (player.readyState === WebSocket.OPEN) {
                player.send(JSON.stringify(firstSpawn));
            }
        });

        game.spawnInterval = setInterval(() => {
            if (game.spawnCount >= 2) {
                clearInterval(game.spawnInterval);
                game.spawnInterval = null;
                console.log(`Stopped spawn loop for game ${gameId}`);
                return;
            }

            const newSpawn = {
                type: "spawn_event",
                spawnables: generateSpawnables(collectibleData),
            };

            game.players.forEach(player => {
                if (player.readyState === WebSocket.OPEN) {
                    player.send(JSON.stringify(newSpawn));
                }
            });

            game.spawnCount++;
        }, 15000);

        game.finalSpawnTimeout = setTimeout(() => {
            const finalSpawn = {
                type: "final_spawn_event",
                message: "Final 15 seconds! Spawn all collectibles!",
                spawnables: generateFullSpawnables(collectibleData),
            };

            game.players.forEach(player => {
                if (player.readyState === WebSocket.OPEN) {
                    player.send(JSON.stringify(finalSpawn));
                }
            });

            console.log(`Sent final_spawn_event to game ${gameId}`);
        }, 45000);
    }
}



function generateSpawnables(data) {
    const spawnables = {};

    for (const [type, weight] of Object.entries(data)) {
        spawnables[type] = [];

        for (let i = 0; i < 5; i++) {
            // Each variation has a chance based on the collectible's weight
            const willSpawn = Math.random() < weight;
            spawnables[type].push(willSpawn ? 1 : 0);
        }
    }

    return spawnables;
}

module.exports = { handleSpawnables };


function stopSpawnLoop(gameId) {
    const game = activeGames.get(gameId);
    if (!game) return;

    console.log(`Stopping spawn loop for game ${gameId}...`);

    if (game.spawnInterval) {
        clearInterval(game.spawnInterval);
        game.spawnInterval = null;
        console.log("Cleared spawnInterval");
    }

    if (game.finalSpawnTimeout) {
        clearTimeout(game.finalSpawnTimeout);
        game.finalSpawnTimeout = null;
        console.log("Cleared finalSpawnTimeout");
    }

    game.gameReadyCount = 0;
    game.spawnPool = [0, 1, 2, 3, 4];
}


function generateFullSpawnables(data) {
    const spawnables = {};

    for (const type of Object.keys(data)) {
        // Force all 5 spawn nodes to 1
        spawnables[type] = [1, 1, 1, 1, 1];
    }

    return spawnables;
}

module.exports = {handleRespawnRequest, handleSpawnables, stopSpawnLoop};
