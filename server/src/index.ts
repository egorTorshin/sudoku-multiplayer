import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { generateSudoku, solveSudoku, validatePartialPuzzle, countEmpty } from './sudokuUtils';
import { Room } from './types';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/health', (_req, res) => res.json({ ok: true }));

const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: '*', methods: ['GET', 'POST'] },
});

const rooms = new Map<string, Room>();

function generateRoomId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let id = '';
  for (let i = 0; i < 6; i++) id += chars[Math.floor(Math.random() * chars.length)];
  return id;
}

function getOpponentId(room: Room, myId: string): string | undefined {
  for (const id of room.players.keys()) {
    if (id !== myId) return id;
  }
}

io.on('connection', (socket) => {
  console.log('connect', socket.id);

  socket.on('create_room', ({ difficulty }: { difficulty: string }) => {
    const { puzzle, solution } = generateSudoku(difficulty || 'medium');
    const totalEmpty = countEmpty(puzzle);
    let roomId = generateRoomId();
    while (rooms.has(roomId)) roomId = generateRoomId();

    rooms.set(roomId, {
      id: roomId,
      puzzle,
      solution,
      totalEmpty,
      players: new Map([[socket.id, { socketId: socket.id, correctCells: new Set() }]]),
      isCustom: false,
    });

    socket.join(roomId);
    socket.emit('room_created', { roomId, puzzle, totalEmpty });
  });

  socket.on('create_custom_room', ({ givenCells }: { givenCells: number[][] }) => {
    if (!validatePartialPuzzle(givenCells)) {
      socket.emit('puzzle_error', { message: 'Неверная конфигурация — числа конфликтуют' });
      return;
    }
    const totalEmpty = countEmpty(givenCells);
    if (totalEmpty === 0) {
      socket.emit('puzzle_error', { message: 'Оставьте хотя бы одну пустую клетку' });
      return;
    }

    const solution = solveSudoku(givenCells);
    if (!solution) {
      socket.emit('puzzle_error', { message: 'У этой головоломки нет решения' });
      return;
    }

    let roomId = generateRoomId();
    while (rooms.has(roomId)) roomId = generateRoomId();

    rooms.set(roomId, {
      id: roomId,
      puzzle: givenCells,
      solution,
      totalEmpty,
      players: new Map([[socket.id, { socketId: socket.id, correctCells: new Set() }]]),
      isCustom: true,
    });

    socket.join(roomId);
    socket.emit('room_created', { roomId, puzzle: givenCells, totalEmpty });
  });

  socket.on('join_room', ({ roomId }: { roomId: string }) => {
    const id = roomId.toUpperCase().trim();
    const room = rooms.get(id);
    if (!room) {
      socket.emit('join_error', { message: 'Комната не найдена' });
      return;
    }
    if (room.players.size >= 2) {
      socket.emit('join_error', { message: 'Комната заполнена' });
      return;
    }
    if (room.players.has(socket.id)) {
      socket.emit('join_error', { message: 'Вы уже в этой комнате' });
      return;
    }

    room.players.set(socket.id, { socketId: socket.id, correctCells: new Set() });
    socket.join(id);

    const [hostId] = room.players.keys();
    const hostState = room.players.get(hostId);
    const opponentSolved = hostId !== socket.id ? (hostState?.correctCells.size ?? 0) : 0;

    socket.emit('room_joined', {
      puzzle: room.puzzle,
      totalEmpty: room.totalEmpty,
      opponentSolved,
    });

    socket.to(id).emit('opponent_joined', { opponentSolved: 0 });
  });

  socket.on('check_cell', ({ roomId, row, col, value }: { roomId: string; row: number; col: number; value: number }) => {
    const room = rooms.get(roomId);
    if (!room) return;
    const player = room.players.get(socket.id);
    if (!player) return;
    if (room.puzzle[row][col] !== 0) return;

    const key = `${row},${col}`;
    const correct = room.solution[row][col] === value;

    if (correct) {
      player.correctCells.add(key);
    } else {
      player.correctCells.delete(key);
    }

    const solved = player.correctCells.size;
    socket.emit('cell_result', { row, col, correct, solved, total: room.totalEmpty });

    const opId = getOpponentId(room, socket.id);
    if (opId) {
      io.to(opId).emit('opponent_progress', { solved, total: room.totalEmpty });
    }

    if (correct && solved === room.totalEmpty) {
      socket.emit('game_over', { winner: 'you' });
      if (opId) io.to(opId).emit('game_over', { winner: 'opponent' });
    }
  });

  socket.on('erase_cell', ({ roomId, row, col }: { roomId: string; row: number; col: number }) => {
    const room = rooms.get(roomId);
    if (!room) return;
    const player = room.players.get(socket.id);
    if (!player) return;

    const key = `${row},${col}`;
    if (player.correctCells.has(key)) {
      player.correctCells.delete(key);
      const solved = player.correctCells.size;
      const opId = getOpponentId(room, socket.id);
      if (opId) io.to(opId).emit('opponent_progress', { solved, total: room.totalEmpty });
    }
  });

  socket.on('disconnecting', () => {
    for (const roomId of socket.rooms) {
      const room = rooms.get(roomId);
      if (!room) continue;
      room.players.delete(socket.id);
      socket.to(roomId).emit('opponent_disconnected');
      if (room.players.size === 0) rooms.delete(roomId);
    }
    console.log('disconnect', socket.id);
  });
});

const PORT = process.env.PORT || 3001;
httpServer.listen(PORT, () => console.log(`Server on :${PORT}`));
