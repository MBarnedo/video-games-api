const express = require('express');
const app = express();

app.use(express.json());

let games = require('./seed');
let currentId = games.length + 1;
games = games.map((g, idx) => ({ id: idx + 1, ...g }));

// GET /games - List all games
app.get('/games', (req, res) => {
  res.status(200).json(games);
});

// GET /games/:id - List single game
app.get('/games/:id', (req, res) => {
  const game = games.find(g => g.id === parseInt(req.params.id));
  if (!game) return res.status(404).json({ error: "Game not found" });
  res.status(200).json(game);
});

// POST /games - Create game with validation
app.post('/games', (req, res) => {
  const { title, genre, platform } = req.body;
  if (!title || !genre || !platform) {
    return res.status(400).json({ error: "Missing required fields: title, genre, and platform are required." });
  }

  const newGame = { id: currentId++, ...req.body };
  games.push(newGame);
  res.status(201).json(newGame);
});

// PUT /games/:id - Update game with validation
app.put('/games/:id', (req, res) => {
  const index = games.findIndex(g => g.id === parseInt(req.params.id));
  if (index === -1) return res.status(404).json({ error: "Game not found" });

  const { title, genre, platform } = req.body;
  if (!title || !genre || !platform) {
    return res.status(400).json({ error: "Missing required fields: title, genre, and platform are required." });
  }

  games[index] = { id: parseInt(req.params.id), ...req.body };
  res.status(200).json(games[index]);
});

// DELETE /games/:id - Delete game
app.delete('/games/:id', (req, res) => {
  const index = games.findIndex(g => g.id === parseInt(req.params.id));
  if (index === -1) return res.status(404).json({ error: "Game not found" });

  const deleted = games.splice(index, 1);
  res.status(200).json({ message: "Game deleted successfully", deletedItem: deleted[0] });
});

app.listen(3000, () => console.log("Server running on http://localhost:3000"));