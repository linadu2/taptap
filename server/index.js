const express = require('express');
const cors = require('cors');
const fs = require('fs');
const https = require('https');
const sanitizeHtml = require('sanitize-html');
const crypto = require("crypto");

const app = express();
const port = process.env.PORT || 3000;

const { getScores, updateScore } = require('./db');

app.use(express.json());
app.use(cors({
    origin: "https://taptap.l1-1.ephec-ti.be", // the exact front-end origin
    credentials: true
}));

let hasHttps = false;
let options = {}

const functionPath = './function-hashes.json';

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

const sessionStore = {};

setInterval(() => {
    const now = Date.now();

    for (const gameSessionId in sessionStore) {
        const sessionData = sessionStore[gameSessionId];
        if (!sessionData) continue;

        const { createdAt, modes } = sessionData;

        const durationString = modes[1];

        const numericPart = parseInt(durationString);

        const durationMs = numericPart * 1000;

        // If current time - createdAt > durationMs, session is expired
        if (now - createdAt > durationMs) {
            //console.log(`Session ${gameSessionId} expired; deleting...`);
            delete sessionStore[gameSessionId];
        }
    }
}, 30_000); // runs every 30 seconds



app.post("/api/startGame", (req, res) => {
    // 1. Generate ephemeral key
    const ephemeralKey = crypto.randomBytes(32).toString("hex");

    // 2. Create a unique session ID
    const gameSessionId = crypto.randomBytes(16).toString("hex");


    // 3. Extract the time and mode from the request (if your client sends them here)
    const { modes } = req.body;
    if(!["Normal", "Sans Malus", '0 Vie'].includes(modes[0]) || !["10S", "30S", "60S"].includes(modes[1])){
        return res.status(403).json({"error": "No more clue"})
    }


    // 4. Store ephemeralKey, time, and mode in the session store
    sessionStore[gameSessionId] = {
        ephemeralKey,
        modes,
        "createdAt": Date.now()
    };

    // 5. Send sessionId and ephemeralKey to the client
    //    Usually, you’d want to wrap this in a JWT or at least
    //    only send it over HTTPS to protect the data in transit.
    res.json({gameSessionId, ephemeralKey});
})


// Route to update the high score
app.post("/api/submit-score", async (req, res) => {
    const gameSessionId = req.headers["x-session-id"];
    const clientSignature = req.headers["x-signature"];

    // Find ephemeralKey from in-memory store or DB
    const sessionData = sessionStore[gameSessionId];

    const now = Date.now();
    const { ephemeralKey, modes, createdAt } = sessionData;

    const durationString = modes[1];
    const numericPart = parseInt(durationString);
    const durationMs = numericPart * 1000 + 3500;

    //console.log(now - createdAt > durationMs + 500, now - createdAt < durationMs - 500)
    //console.log(now, createdAt, durationMs)
    if (now - createdAt  > durationMs + 1000 || now - createdAt < durationMs - 500) {
        delete sessionStore[gameSessionId];
        console.log('time expire')
        return res.status(400).json({ error : "No more clue"})
    }

    if (!gameSessionId || !clientSignature) {
        //return res.status(400).json({ error: "Missing session ID or signature" });
        console.log("Missing session ID or signature")
        return res.status(400).json({ error: "No more clue" });
    }

    if (!sessionData) {
        //return res.status(401).json({ error: "Invalid session" });
        console.log("Invalid session")
        return res.status(400).json({ error : "No more clue" });
    }


    // Recompute signature using the ephemeralKey
    const bodyString = JSON.stringify(req.body);
    const computedSignature = crypto
        .createHmac("sha256", ephemeralKey)
        .update(bodyString)
        .digest("base64");

    if (computedSignature !== clientSignature) {
        //return res.status(401).json({ error: "Signature mismatch, possible tampering" });
        console.log('Signature mismatch, possible tampering')
        return res.status(401).json({ error: "No more clue" });
    }

    // Now extract the data from req.body
    const { score, pseudo, gameMode, timeSelected, fnHash } = req.body;

    if(compareHash(fnHash)){
        console.log('hash mismatch')
        return res.status(400).json({ error : 'No more clue' })
    }

    // Validate the score
    if (typeof score !== 'number' || score < 0 || score > 250) {
        //return res.status(400).json({ error: "Invalid score value" });
        return res.status(400).json({ error: "No more clue" });
    }

    if(gameMode !== modes[0] || timeSelected !== modes[1]){
        //return res.status(400).json({message : "Mode different from start"})
        return res.status(400).json({message : "No more clue"})
    }
    // Sanitize pseudo
    const sanitized_pseudo = sanitizeHtml(pseudo, {
        allowedTags: [],
        allowedAttributes: {}
    });
    console.log(`Updating high score to: ${score}; ${sanitized_pseudo}; ${modes}`);
    await updateScore(sanitized_pseudo, score, modes);

    return res.json({ success: true, message: "Score accepted" });
});

app.get('/api/getFunction', async (req, res) => {
    try {
        // Read and parse the JSON file
        const rawData = fs.readFileSync(functionPath, 'utf8');
        const jsonData = JSON.parse(rawData);

        // Get all the top-level keys
        const keys = Object.keys(jsonData);

        return res.json(keys)
    } catch (err) {
        console.error('Error reading or parsing JSON:', err);
        return res.json({ error : 'error'})
    }
})


function compareHash(fnHash){
    const rawData = fs.readFileSync(functionPath, 'utf8');
    const jsonData = JSON.parse(rawData);

    for(const x in fnHash){
        if(fnHash[x] !== jsonData[x]){
            return true
        }
    }
    return false
}


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

