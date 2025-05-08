const WebSocket = require('ws');
const { handleJoinQueue, handleLeaveQueue, removeFromQueues } = require('./src/matchmaking');
const { handleRespawnRequest, handleSpawnables, stopSpawnLoop } = require('./src/spawnManager');
const { handleStateUpdate } = require('./src/movementHandler')
const { handleAttack } = require('./src/attackHandler')
const { collectibleCollected, addScore, subtractScore, resetScores } = require('./src/scoreManager')
const { cleanupGame } = require('./src/gameRooms');

const wss = new WebSocket.Server({ port: 8080 });
console.log("WebSocket server running on ws://localhost:8080");

wss.on('connection', (ws) => {
    console.log("A new client connected!");
    ws.send(JSON.stringify({ type: "welcome", message: "Welcome to Scavengers Arena!" }));

    ws.on('message', (data) => {
        let msg;
        try {
            msg = JSON.parse(data);
        } catch (e) {
            console.error("Invalid JSON message", data);
            return;
        }

        switch (msg.type) {
            case 'join_queue':
                handleJoinQueue(ws, msg);
                break;
            case 'leave_queue':
                handleLeaveQueue(ws, msg);
                break;
            case 'respawn_request':
            handleRespawnRequest(ws, msg, wss);
                break;
            case "state_update":
                handleStateUpdate(ws, msg, wss);
            break;
            case 'attack':
                handleAttack(ws, msg, wss);
                break;
            case 'game_started':
                handleSpawnables(ws, msg, wss);
                break;
            case 'collectible_collected':
                collectibleCollected(ws, msg, wss);
                break
            case 'add_score':
                addScore(ws, msg, wss);
                break
            case 'subtract_score':
                subtractScore(ws, msg, wss)
                break
            case 'game_over':
                const gameId = ws.gameId;
                cleanupGame(gameId);
                break
        }
    });

    ws.on('close', () => {
        console.log("A client disconnected");
        removeFromQueues(ws);

        if (wss.clients.size < 2) {
            stopSpawnLoop(ws.gameId);
            resetScores(ws.gameId)
        }
        if (ws.playerId) {
            resetScores(ws.gameId)
        }
    });
});
