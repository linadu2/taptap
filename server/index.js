const express = require('express');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 3000;

const { getScores, updateScore } = require('./db');

app.use(express.json());

app.use(cors());

// Define a route
app.get('/api/getScore', async (req, res) => {
    res.json(await getScores());
    //res.json({"1": {"10": { score: 0, player: "" },"30": { score: 0, player: "" },"60": { score: 0, player: "" }},"2": {"10": { score: 0, player: "" },"30": { score: 0, player: "" },"60": { score: 0, player: "" }},"3": {"10": { score: 0, player: "" },"30": { score: 0, player: "" },"60": { score: 0, player: "" }}})
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

const validTokens = new Set();

// Route to initialize a game session and issue a token
app.post('/api/getSessionToken', (req, res) => {
    // In production, generate a cryptographically secure token
    const token = Math.random().toString(36).substr(2);
    validTokens.add(token);
    res.json({ token });
});

// Route to update the high score
app.put('/api/updateScore', async (req, res) => {
    const { token, score, pseudo, mode } = req.body;

    // Check for a valid token
    if (!validTokens.has(token)) {
        console.log('Invalid token');
        return res.status(403).json({ error: 'Invalid or missing session token' });
    }

    // Validate the score (customize these rules as needed)
    if (typeof score !== 'number' || score < 0 || score > 1000000) {
        return res.status(400).json({ error: 'Invalid score value' });
    }

    // Here, you would update the high score in your database
    console.log(`Updating high score to: ${score}; ${pseudo}; ${mode}`);
    await updateScore(pseudo, score, mode)

    //remove the token if it's meant for one-time use
    validTokens.delete(token);

    res.json({ message: 'Score updated successfully' });
});

app.listen(3000, () => {
    console.log('Server listening on port 3000');
});
