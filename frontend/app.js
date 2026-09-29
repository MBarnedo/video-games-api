// --- CONFIGURATION ---
const API_BASE_URL = 'http://localhost:3000/games';

// --- DOM ELEMENTS ---
const $ = (id) => document.getElementById(id);
const gameList = $('game-list');
const gameCount = $('game-count');
const statusBox = $('status');
const searchInput = $('search');
const detailDialog = $('detail-dialog');
const detailContent = $('detail-content');
const formDialog = $('form-dialog');
const form = $('game-form');
const formTitle = $('form-title');
const formError = $('form-error');
const submitBtn = $('submit-btn');

let allGames = [];

// --- HELPERS ---

// Error that remembers the HTTP status so we can react to 400 / 404 differently
class ApiError extends Error {
    constructor(message, status) {
        super(message);
        this.status = status;
    }
}

// Wraps fetch: returns parsed JSON, or throws an ApiError with the server's message
async function request(url, options) {
    let response;
    try {
        response = await fetch(url, options);
    } catch (err) {
        throw new ApiError('Could not reach the server. Make sure the backend is running on port 3000.', 0);
    }
    const data = await response.json().catch(() => null);
    if (!response.ok) {
        throw new ApiError((data && data.error) || `Request failed (${response.status})`, response.status);
    }
    return data;
}

// Builds an element with textContent (safe: never parses game data as HTML)
function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) node.className = className;
    if (text !== undefined) node.textContent = text;
    return node;
}

// No cover art in the API, so each game gets a colour based on its title
function coverBackground(title) {
    let hue = 0;
    for (const ch of String(title)) hue = (hue * 31 + ch.charCodeAt(0)) % 360;
    return `linear-gradient(135deg, hsl(${hue} 45% 34%), hsl(${(hue + 40) % 360} 50% 14%))`;
}

function initials(title) {
    const skip = new Set(['the', 'of', 'and', 'a']);
    const words = String(title).split(/\s+/).filter((w) => /^[A-Za-z]/.test(w) && !skip.has(w.toLowerCase()));
    return words.slice(0, 2).map((w) => w[0]).join('').toUpperCase() || '?';
}

function makeCover(game, className) {
    const cover = el('span', className);
    cover.style.background = coverBackground(game.title);
    cover.appendChild(el('span', 'cover-initials', initials(game.title)));
    return cover;
}

function ratingLabel(rating) {
    if (rating === undefined || rating === null || rating === '') return 'No rating yet';
    if (rating >= 9) return 'Overwhelmingly Positive';
    if (rating >= 8) return 'Very Positive';
    if (rating >= 7) return 'Mostly Positive';
    if (rating >= 5) return 'Mixed';
    return 'Negative';
}

// --- STATUS (loading / error / empty) FOR THE LIST ---
function showStatus(message, type) {
    statusBox.replaceChildren();
    statusBox.className = `status ${type}`;
    if (type === 'loading') statusBox.appendChild(el('span', 'spinner'));
    statusBox.appendChild(el('span', '', message));
}

function hideStatus() {
    statusBox.className = 'status hidden';
}

// --- API CALLS ---

// 1. GET: List all games
async function fetchGames() {
    showStatus('Loading your library...', 'loading');
    try {
        allGames = await request(API_BASE_URL);
        renderList();
    } catch (err) {
        allGames = [];
        gameList.replaceChildren();
        gameCount.textContent = '';
        showStatus(err.message, 'error');
    }
}

// 2. GET by id: Show one game in the detail view
async function openDetail(id) {
    detailContent.replaceChildren(el('div', 'status loading', 'Loading game...'));
    if (!detailDialog.open) detailDialog.showModal();
    try {
        const game = await request(`${API_BASE_URL}/${id}`);
        renderDetail(game);
    } catch (err) {
        renderDetailError(err);
        if (err.status === 404) fetchGames(); // it was removed elsewhere, refresh the list
    }
}

// 3 & 4. POST / PUT: Save a game (PUT when the form holds an id, otherwise POST)
form.addEventListener('submit', async (e) => {
    e.preventDefault();
    formError.classList.add('hidden');

    const id = $('game-id').value;
    const payload = {
        title: $('game-title').value.trim(),
        genre: $('game-genre').value.trim(),
        platform: $('game-platform').value.trim()
    };
    if ($('game-year').value !== '') payload.releaseYear = Number($('game-year').value);
    if ($('game-rating').value !== '') payload.rating = Number($('game-rating').value);

    submitBtn.disabled = true;
    try {
        await request(id ? `${API_BASE_URL}/${id}` : API_BASE_URL, {
            method: id ? 'PUT' : 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });
        formDialog.close();
        fetchGames();
    } catch (err) {
        // A 400 lands here with the API's own validation message
        formError.textContent = err.message;
        formError.classList.remove('hidden');
        if (err.status === 404) fetchGames();
    } finally {
        submitBtn.disabled = false;
    }
});

// 5. DELETE: Remove a game
async function deleteGame(game) {
    if (!confirm(`Delete "${game.title}" from your library?`)) return;
    try {
        await request(`${API_BASE_URL}/${game.id}`, { method: 'DELETE' });
        detailDialog.close();
    } catch (err) {
        renderDetailError(err);
    }
    fetchGames();
}

// --- RENDERING ---
function renderList() {
    const query = searchInput.value.trim().toLowerCase();
    const visible = allGames.filter((g) =>
        [g.title, g.genre, g.platform].some((v) => String(v ?? '').toLowerCase().includes(query))
    );

    gameCount.textContent = `(${allGames.length})`;
    gameList.replaceChildren();

    if (allGames.length === 0) {
        showStatus('Your library is empty. Use "Add a game" to add your first one.', 'empty');
        return;
    }
    if (visible.length === 0) {
        showStatus(`No games match "${searchInput.value.trim()}".`, 'empty');
        return;
    }
    hideStatus();

    visible.forEach((game) => {
        const tile = el('button', 'game-tile');
        tile.type = 'button';
        tile.addEventListener('click', () => openDetail(game.id));

        const cover = makeCover(game, 'tile-cover');
        if (game.rating !== undefined && game.rating !== null && game.rating !== '') {
            cover.appendChild(el('span', 'score', Number(game.rating).toFixed(1)));
        }

        const body = el('span', 'tile-body');
        body.appendChild(el('span', 'tile-title', game.title));
        const tags = el('span', 'tags');
        tags.appendChild(el('span', 'tag', game.genre));
        tags.appendChild(el('span', 'tag', game.platform));
        body.appendChild(tags);

        tile.append(cover, body);
        gameList.appendChild(tile);
    });
}

function renderDetail(game) {
    const details = el('dl', 'details');
    const rows = [
        ['Genre', game.genre],
        ['Platform', game.platform],
        ['Release year', game.releaseYear ?? 'Not set'],
        ['Rating', game.rating !== undefined && game.rating !== null
            ? `${Number(game.rating).toFixed(1)} / 10 - ${ratingLabel(game.rating)}`
            : ratingLabel(game.rating)]
    ];
    rows.forEach(([label, value]) => {
        details.appendChild(el('dt', '', label));
        details.appendChild(el('dd', '', String(value)));
    });

    const title = el('h2', '', game.title);
    title.id = 'detail-title';

    const deleteBtn = el('button', 'btn btn-danger', 'Delete');
    deleteBtn.type = 'button';
    deleteBtn.addEventListener('click', () => deleteGame(game));

    const editBtn = el('button', 'btn btn-blue', 'Edit');
    editBtn.type = 'button';
    editBtn.addEventListener('click', () => {
        detailDialog.close();
        openForm(game);
    });

    const closeBtn = el('button', 'btn btn-green', 'Close');
    closeBtn.type = 'button';
    closeBtn.addEventListener('click', () => detailDialog.close());

    const actions = el('div', 'modal-actions');
    actions.append(deleteBtn, editBtn, closeBtn);

    const body = el('div', 'detail-body');
    body.append(title, details, actions);

    detailContent.replaceChildren(makeCover(game, 'detail-cover'), body);
}

// Graceful 404 (and any other failure) inside the detail dialog
function renderDetailError(err) {
    const heading = el('h2', '', err.status === 404 ? 'Game not found' : 'Something went wrong');
    heading.id = 'detail-title';
    const message = el('p', 'error', err.message);
    const closeBtn = el('button', 'btn btn-green', 'Back to library');
    closeBtn.type = 'button';
    closeBtn.addEventListener('click', () => detailDialog.close());
    const actions = el('div', 'modal-actions');
    actions.appendChild(closeBtn);

    const body = el('div', 'detail-body');
    body.append(heading, message, actions);
    detailContent.replaceChildren(body);
}

// --- FORM (add / edit) ---
function openForm(game) {
    form.reset();
    formError.classList.add('hidden');
    $('game-id').value = game ? game.id : '';
    $('game-title').value = game ? game.title : '';
    $('game-genre').value = game ? game.genre : '';
    $('game-platform').value = game ? game.platform : '';
    $('game-year').value = game && game.releaseYear !== undefined ? game.releaseYear : '';
    $('game-rating').value = game && game.rating !== undefined ? game.rating : '';
    formTitle.textContent = game ? 'Edit game' : 'Add a game';
    submitBtn.textContent = game ? 'Save changes' : 'Add to library';
    formDialog.showModal();
}

$('add-btn').addEventListener('click', () => openForm(null));
$('cancel-btn').addEventListener('click', () => formDialog.close());
searchInput.addEventListener('input', renderList);

// Clicking the dark backdrop closes a dialog
[detailDialog, formDialog].forEach((dialog) => {
    dialog.addEventListener('click', (e) => {
        if (e.target === dialog) dialog.close();
    });
});

// Initial load
fetchGames();
