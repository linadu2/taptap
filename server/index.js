const express = require('express');
const cors = require('cors');
const fs = require('fs');
const https = require('https');
const sanitizeHtml = require('sanitize-html');

const app = express();
const port = process.env.PORT || 3000;

const { getScores, updateScore } = require('./db');

app.use(express.json());

app.use(cors());

let hasHttps = false;

let options = {}

// check if certificate exist
if(fs.existsSync('/etc/letsencrypt/live/l1-1.ephec-ti.be/privkey.pem')){
    hasHttps = true;
    // Load certificate files from Let's Encrypt
    options = {
        key: fs.readFileSync('/etc/letsencrypt/live/l1-1.ephec-ti.be/privkey.pem'),
        cert: fs.readFileSync('/etc/letsencrypt/live/l1-1.ephec-ti.be/fullchain.pem')
    };
}


// Define a route
app.get('/api/getScore', async (req, res) => {
    res.json(await getScores());
    //res.json({"Normal": {"10S": { score: 0, player: "" },"30S": { score: 0, player: "" },"60S": { score: 0, player: "" }},"Sans Malus": {"10S": { score: 0, player: "" },"30S": { score: 0, player: "" },"60S": { score: 0, player: "" }},"0 Vie": {"10S": { score: 0, player: "" },"30S": { score: 0, player: "" },"60S": { score: 0, player: "" }}})
});



const validTokens = new Map();
const TOKEN_TTL = 1 * 1000; // 1 sec

// Clean up expired tokens periodically
setInterval(() => {
    const now = Date.now();
    for (const [token, expiry] of validTokens.entries()) {
        if (expiry < now) {
            validTokens.delete(token);
        }
    }
}, 5 * 1000); // Clean up 5 sec

// Route to initialize a game session and issue a token
app.post('/api/getSessionToken', (req, res) => {
    const token = Math.random().toString(36).substr(2);
    const expiry = Date.now() + TOKEN_TTL;
    validTokens.set(token, expiry);
    res.json({ token });
});

// Route to update the high score
app.put('/api/updateScore', async (req, res) => {
    const { token, score, pseudo, mode } = req.body;

    const now = Date.now();
    if(validTokens.get(token) < now){
        validTokens.delete(token)
    }

    // Check for a valid token
    if (!validTokens.has(token)) {
        console.log('Invalid token');
        return res.status(403).json({ error: 'Invalid or missing session token' });
    }

    // Validate the score (customize these rules as needed)
    if (typeof score !== 'number' || score < 0 || score > 250) {
        return res.status(400).json({ error: 'Invalid score value' });
    }

    const sanitized_pseudo = sanitizeHtml(pseudo, {
        allowedTags: [],
        allowedAttributes: {}
    });

    // Here, you would update the high score in your database
    console.log(`Updating high score to: ${score}; ${sanitized_pseudo}; ${mode}`);
    await updateScore(sanitized_pseudo, score, mode)

    //remove the token if it's meant for one-time use
    validTokens.delete(token);

    res.json({ message: 'Score updated successfully' });
});


if(hasHttps){
    // Create and start the HTTPS server
    https.createServer(options, app).listen(port, () => {
        console.log('HTTPS server running on port 3000');
    });
} else {
    app.listen(port, () => {
        console.log('HTTP server running on port 3000');
    })
}

