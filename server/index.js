const express = require('express');
const cors = require('cors');
const fs = require('fs');
const https = require('https');

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
    //res.json({"1": {"10": { score: 0, player: "" },"30": { score: 0, player: "" },"60": { score: 0, player: "" }},"2": {"10": { score: 0, player: "" },"30": { score: 0, player: "" },"60": { score: 0, player: "" }},"3": {"10": { score: 0, player: "" },"30": { score: 0, player: "" },"60": { score: 0, player: "" }}})
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
}, 0.5 * 1000); // Clean up 0.5 sec

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

