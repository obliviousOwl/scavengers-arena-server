const { activeGames } = require('./gameRooms'); // ✅ Make sure this is imported

function handleStateUpdate(ws, msg, wss) {
    const gameId = ws.gameId;
    if (!gameId || !activeGames.has(gameId)) {
        console.warn(`State update ignored: invalid gameId ${gameId}`);
        return;
    }

    const game = activeGames.get(gameId);
    const playersInGame = game.players;

    const response = {
        type: "state_update",
        player_id: msg.playerIndex,
        position: msg.position,
        animation: msg.animation,
        flip_h: msg.flip_h
    };

    // ✅ Send to all other players in the same game
    playersInGame.forEach(player => {
        if (player !== ws && player.readyState === WebSocket.OPEN) {
            player.send(JSON.stringify(response));
        }
    });
}

module.exports = { handleStateUpdate };
