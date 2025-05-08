// src/matchmaking.js
const matchmakingQueue = [];
// const activeGames = new Map();
const roomQueues = new Map();

const { createGame, activeGames } = require("./gameRooms");

function handleJoinQueue(ws, msg) {
    const playerName = msg.name || "Unknown";
    ws.playerName = playerName;
    const roomId = msg.room_id?.trim();

    if (roomId) {
        console.log(`Player is joining custom room: ${roomId}`);
        if (!roomQueues.has(roomId)) roomQueues.set(roomId, []);
        const queue = roomQueues.get(roomId);
        queue.push(ws);

        if (queue.length >= 2) {
            matchPlayers(queue.shift(), queue.shift(), roomId, true); // Match players in custom room
        }
    } else {
        console.log("Player wants to play. Adding to matchmaking queue.");
        matchmakingQueue.push(ws);

        if (matchmakingQueue.length >= 2) {
            matchPlayers(matchmakingQueue.shift(), matchmakingQueue.shift(), null, false); // Match players in default queue
        }
    }
}


function handleLeaveQueue(ws, msg) {
    const roomId = msg.room_id?.trim();
    let removed = false;

    if (roomId && roomQueues.has(roomId)) {
        const queue = roomQueues.get(roomId);
        const index = queue.indexOf(ws);
        if (index !== -1) {
            queue.splice(index, 1);
            removed = true;
            ws.send(JSON.stringify({ type: "left_queue", message: "You left the custom room queue." }));
            console.log(`Player left custom room queue: ${roomId}`);
        }
    } else {
        const index = matchmakingQueue.indexOf(ws);
        if (index !== -1) {
            matchmakingQueue.splice(index, 1);
            removed = true;
            ws.send(JSON.stringify({ type: "left_queue", message: "You left the matchmaking queue." }));
            console.log("Player left default matchmaking queue.");
        }
    }

    if (!removed) console.log("Player tried to leave queue but wasn't in it.");
}

function removeFromQueues(ws) {
    const index = matchmakingQueue.indexOf(ws);
    if (index !== -1) matchmakingQueue.splice(index, 1);

    for (const [roomId, queue] of roomQueues.entries()) {
        const j = queue.indexOf(ws);
        if (j !== -1) {
            queue.splice(j, 1);
            console.log(`Disconnected player removed from room queue ${roomId}`);
        }
    }
}

function matchPlayers(player1, player2, roomId, isCustomRoom) {
    const gameId = `game-${Date.now()}`;
    createGame(gameId, [player1, player2]);

    // Prepare the match details for both players
    const payload = {
        type: "match_found",
        gameId,
        message: isCustomRoom ? "Match found in custom room!" : "Match found!"
    };

    player1.send(JSON.stringify({
        ...payload,
        playerIndex: 0, // Player 1 gets index 0
        yourName: player1.playerName,
        opponentName: player2.playerName,
        yourScore: player1.score,
        opponentScore: player2.score
    }));

    player2.send(JSON.stringify({
        ...payload,
        playerIndex: 1, // Player 2 gets index 1
        yourName: player2.playerName,
        opponentName: player1.playerName,
        yourScore: player2.score,
        opponentScore: player1.score
    }));

    console.log(`${isCustomRoom ? `Custom room ${roomId}` : "Default matchmaking"}: Match started for game ${gameId}`);
}


function findPlayerRoom(ws) {
    if (!ws.gameId) return null;
    return activeGames.get(ws.gameId) || null;
}
module.exports = {
    handleJoinQueue,
    handleLeaveQueue,
    removeFromQueues,
    findPlayerRoom
};
