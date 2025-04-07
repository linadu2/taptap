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
        return res.status(403).json({"message": "invalid mode or temps"})
    }

    console.log(modes)

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

    if (!gameSessionId || !clientSignature) {
        return res.status(400).json({ error: "Missing session ID or signature" });
    }

    // Find ephemeralKey from in-memory store or DB
    const sessionData = sessionStore[gameSessionId];
    if (!sessionData) {
        return res.status(401).json({ error: "Invalid session" });
    }

    const { ephemeralKey, modes } = sessionData;

    // Recompute signature using the ephemeralKey
    const bodyString = JSON.stringify(req.body);
    const computedSignature = crypto
        .createHmac("sha256", ephemeralKey)
        .update(bodyString)
        .digest("base64");

    if (computedSignature !== clientSignature) {
        return res.status(401).json({ error: "Signature mismatch, possible tampering" });
    }

    // Now extract the data from req.body
    const { score, pseudo, gameMode, timeSelected } = req.body;

    // Validate the score
    if (typeof score !== 'number' || score < 0 || score > 250) {
        return res.status(400).json({ error: "Invalid score value" });
    }

    if(gameMode !== modes[0] || timeSelected !== modes[1]){
        return res.status(400).json({message : "Mode different from start"})
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

