# Video Games API + Frontend

A REST API built with Node.js and Express, plus a Steam-inspired frontend (plain HTML, CSS and JavaScript using the Fetch API) that lets you list, view, add, edit and delete games.

Data is kept in memory and loaded from `seed.js`, so it resets every time the server restarts.

## Requirements

- [Node.js](https://nodejs.org/) 18 or newer
- A modern browser

## Run the backend

```bash
npm install
node server.js
```

The API runs at `http://localhost:3000`. Keep this terminal open.

## Run the frontend

**Option A (easiest):** the backend also serves the frontend. With the server running, open:

```
http://localhost:3000
```

**Option B:** open `frontend/index.html` with a static server such as the VS Code Live Server extension. This works because the backend has CORS enabled (`cors` package), so a page from another port (like `5500`) is allowed to call the API.

## API endpoints

| Method | Endpoint       | Description                              |
| ------ | -------------- | ---------------------------------------- |
| GET    | `/games`       | List all games                           |
| GET    | `/games/:id`   | Get one game (404 if not found)          |
| POST   | `/games`       | Create a game                            |
| PUT    | `/games/:id`   | Replace a game (400 / 404 on errors)     |
| DELETE | `/games/:id`   | Delete a game (404 if not found)         |

Required fields for POST and PUT: `title`, `genre`, `platform`. Optional: `releaseYear`, `rating`. A missing required field returns `400` with an `error` message, which the frontend shows in the form.

## Frontend features

- List view of all games as tiles (`GET /games`)
- Detail view for one game (`GET /games/:id`)
- Add form (`POST /games`)
- Edit form (`PUT /games/:id`)
- Delete button (`DELETE /games/:id`)
- Loading spinner while data is fetched
- API validation messages (400) shown inside the form
- Friendly "Game not found" message on a 404, and a clear message if the backend is not running
- Search box to filter the library by title, genre or platform

## Project structure

```
video-games-api/
  server.js        Express API (plus CORS and static frontend hosting)
  seed.js          Starting game data
  frontend/
    index.html     Page structure and dialogs
    style.css      Steam-inspired theme
    app.js         Fetch calls and rendering
```
