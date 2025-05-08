let playerScores = {};

const collectibleScores = {
    apple_collectibles: 40,
    banana_collectibles: 45,
    cherry_collectibles: 50,
    kiwi_collectibles: 55,
    melon_collectibles: 65,
    orange_collectibles: 80,
    pineapple_collectible: 100,
    strawberry_collectibles: 135,
    coin_collectibles: 200
};

const { activeGames } = require('./gameRooms');

function collectibleCollected(ws, msg, wss) {
    const playerIndex = msg.player_index;
    const collectibleId = msg.collectible_id;
    const group = msg.group;

    console.log(`Player ${playerIndex} collected ${collectibleId}`);

    const response = {
        type: "collectible_removed",
        collectible_id: collectibleId,
        group,
        player_index: playerIndex
    };

    const gameId = ws.gameId;
    if (!gameId || !activeGames.has(gameId)) {
        console.warn("Game ID not found for collectibleCollected.");
        return;
    }

    const playersInGame = activeGames.get(gameId).players;
    playersInGame.forEach(client => {
        if (client.readyState === ws.OPEN) {
            client.send(JSON.stringify(response));
        }
    });

    console.log(`Sending Response: ${JSON.stringify(response)}`);
}



function addScore(ws, msg, wss) {
    const { player_id, group_name, player_name } = msg;
    const gameId = ws.gameId;
    console.log(`Received score data — Player ID: ${player_id}, Group: ${group_name}`);

    const game = activeGames.get(gameId);
    if (!game.scores[player_id]) {
        game.scores[player_id] = {
            name: player_name,
            score: 0
        };
    }
    const scoreToAdd = collectibleScores[group_name] || 0;
    game.scores[player_id].score += scoreToAdd;


    // playerScores[player_id].score += scoreToAdd;

    const response = {
        type: "score_updated",
        player_id,
        player_name,
        score: game.scores[player_id].score
    };


    if (!gameId || !activeGames.has(gameId)) {
        console.warn("Game ID not found for addScore.");
        return;
    }

    const playersInGame = activeGames.get(gameId).players;
    playersInGame.forEach(client => {
        if (client.readyState === ws.OPEN) {
            client.send(JSON.stringify(response));
        }
    });

    console.log("Score updated and sent to players in game:", game.scores[player_id].score);
}

function subtractScore(ws, msg, wss) {
    const { player_id, player_name } = msg;
    const gameId = ws.gameId;

    if (!gameId || !activeGames.has(gameId)) {
        console.warn("Game ID not found for subtractScore.");
        return;
    }

    const game = activeGames.get(gameId);

    if (!game.scores[player_id]) return;

    const currentScore = game.scores[player_id].score;
    const penalty = Math.floor(currentScore * 0.10);

    game.scores[player_id].score = Math.max(currentScore - penalty, 0);

    const response = {
        type: "score_updated",
        player_id,
        player_name,
        score: game.scores[player_id].score
    };

    const playersInGame = game.players;
    playersInGame.forEach(client => {
        if (client.readyState === ws.OPEN) {
            client.send(JSON.stringify(response));
        }
    });

    console.log("Penalty applied and score updated:", game.scores[player_id].score);
}

function resetScores(gameId) {
    const game = activeGames.get(gameId);
    if (game) {
        game.scores = {};
        console.log(`Scores reset for game ${gameId}`);
    } else {
        console.warn(`No game found for gameId: ${gameId}`);
    }
}


module.exports = {collectibleCollected, addScore, subtractScore, resetScores}
