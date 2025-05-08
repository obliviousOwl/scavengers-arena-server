const { activeGames } = require('./gameRooms');

const WebSocket = require('ws');
function handleAttack(ws, msg, wss) {
    const gameId = ws.gameId;
    if (!gameId || !activeGames.has(gameId)) {
        console.warn(`Attack ignored: invalid gameId ${gameId}`);
        return;
    }

    const game = activeGames.get(gameId);
    const playersInGame = game.players;

    const response = {
        type: "player_attack",
        playerId: msg.player_id,
        attack: msg.attack,
    };

    // ✅ Send attack to all other players in the same game
    playersInGame.forEach(player => {
        if (player !== ws && player.readyState === WebSocket.OPEN) {
            player.send(JSON.stringify(response));
            console.log("Sent attack from playerId:", msg.player_id);
        }
    });
}

module.exports = { handleAttack };
