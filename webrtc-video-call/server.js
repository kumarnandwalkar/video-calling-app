const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: '*', // Allow connections from any origin
    methods: ['GET', 'POST']
  }
});

app.use(cors());

let clients = {}; // Store connected clients

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);
  clients[socket.id] = socket.id; // Add client to list

  socket.emit('me', socket.id); // Send own ID to client

  // Notify all clients about the updated list of connected clients
  io.emit('clientsUpdate', clients);

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    delete clients[socket.id]; // Remove client from list
    io.emit('clientsUpdate', clients); // Notify clients of update
  });

  // Handle call user event
  socket.on('callUser', (data) => {
    io.to(data.userToCall).emit('callUser', {
      signal: data.signalData,
      from: data.from,
    });
  });

  // Handle answer call event
  socket.on('answerCall', (data) => {
    io.to(data.to).emit('callAccepted', data.signal);
  });
});

// Listen on all available network interfaces
const PORT = process.env.PORT || 5000;
server.listen(PORT, '0.0.0.0', () => console.log(`Server running on port ${PORT}`));
