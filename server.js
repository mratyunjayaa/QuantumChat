const express = require('express');
const app = express();
const http = require('http');
const { Server } = require("socket.io");
const path = require('path');

const server = http.createServer(app);
const io = new Server(server);

// Serve static files (html, css) from the "public" directory
app.use(express.static(path.join(__dirname, 'public')));

io.on("connection", (socket) => {
    console.log(`Connection established: ${socket.id}`);

    // REQUIREMENT: Join Room and notify others
    socket.on('join-room', (data) => {
        // data expects { room: '101', username: 'John' }
        const { room, username } = data;

        socket.join(room);
        
        console.log(`User [${username}] joined room: [${room}]`);

        // Notify everyone ELSE in the room that this user joined
        // socket.to(room) sends to everyone EXCEPT the sender
        socket.to(room).emit('system-message', {
            msg: `${username} joined the chat. Say hello!`,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
    });

    // REQUIREMENT: Handle structured message objects { room, msg, username }
    socket.on('message', (data) => {
        const { room, msg, username } = data;

        console.log(`Msg from [${username}] in [${room}]: ${msg}`);

        // Broadcast the message back to everyone ELSE in that room
        // We add the server timestamp here for consistency
        socket.to(room).emit('new-message', {
            username: username,
            msg: msg,
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
    });

    socket.on('disconnect', () => {
        console.log(`User disconnected: ${socket.id}`);
        // Note: Real-world apps track username associated with socket.id 
        // to send a "User Left" system message upon disconnect.
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Premium Chat Server running on http://localhost:${PORT}`);
});