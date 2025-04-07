window.onload = function () {
    const storedName = localStorage.getItem('playerName');
    if (storedName) {
        playerName = storedName;
    } else {
        const enteredName = prompt("Enter your pseudo for the game:");
        playerName = enteredName ? enteredName.trim() : "Guest";
        localStorage.setItem('playerName', playerName);
    }

    getHighScores();
    closeLeaderboard();
    startSound();
    loadHypeTrainContributors();
};


let gameRunning = false;
let activeCell = null;
let nbTap = 0;
let playerName = null;
let sessionData = {}
let sound = true

let highScores, mode, temps;



function getHighScores() {
    fetch(`${getBaseUrl()}:3000/api/getScore`, { method: 'GET' })
        .then(response => {
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            return response.json();
        })
        .then(data => {
            console.log('Score data:', data);
            highScores = data
            refresh();
        })
        .catch(error => {
            console.error('Error fetching score:', error);
        });
}

function getRandomCell() {
    return document.getElementById(`cell-${Math.floor(Math.random() * 9)}`);
}

function activateRandomCell() {
    if (!gameRunning) return;
    if (activeCell) return;

    document.querySelectorAll(".cell").forEach((cell) => {
        cell.onclick = badclick;
    });

    activeCell = getRandomCell();
    activeCell.classList.add("active");

    activeCell.onclick = function () {
        clic();
        this.classList.remove("active");
        this.onclick = null;
        activeCell = null;
        setTimeout(activateRandomCell, 5);
    };
}
function timer(timeLeftInSeconds) {
    const totalDuration = timeLeftInSeconds * 1000;
    const startTime = performance.now();

    const afficheTemps = document.getElementById("chrono");

    const interval = setInterval(() => {
        if (!gameRunning) {
            clearInterval(interval);
            afficheTemps.innerText = (0).toFixed(2);
            stopGame();
            return;
        }

        const elapsed = performance.now() - startTime;
        const remaining = totalDuration - elapsed;

        if (remaining <= 0) {
            clearInterval(interval);
            afficheTemps.innerText = (0).toFixed(2);
            stopGame();
            return;
        }

        afficheTemps.innerText = (remaining / 1000).toFixed(2);

        if (remaining <= totalDuration * 0.50 &&
            !afficheTemps.classList.contains("clignote")) {
            afficheTemps.classList.add("clignote");
        }
    }, 10);
}


function badclick() {
    if (gameRunning && mode != 2) {
        if (mode == 3) {
            gameRunning = false
            addBadClass(3);
            if(sound){
                let audioDefaite = document.getElementById("audioDefaite");
                audioDefaite.play();
            }

        } else {
            addBadClass(0.2);
            let score = document.getElementById("score");
            nbTap--;
            score.innerText = "Score: " + nbTap;
            if(sound){
                let audioRater = document.getElementById("audioRater");
                audioRater.play();
            }
        }
    }
}
function showLeaderboard() {
    let leaderboardHTML = "<table class='leaderboard-table'><tr><th>Mode</th><th>Temps</th><th>Joueur</th><th>Score</th></tr>";
    for (let mode in highScores) {
        for (let time in highScores[mode]) {
            let entry = highScores[mode][time];
            leaderboardHTML += `<tr><td>${mode}</td><td>${time}</td><td>${entry.player || 'N/A'}</td><td>${entry.score || 'N/A'}</td></tr>`;
        }
    }

    leaderboardHTML += "</table>";
    document.getElementById("leaderboardContent").innerHTML = leaderboardHTML;
    document.getElementById("leaderboardModal").style.display = "flex";
}

function closeLeaderboard() {
    document.getElementById("leaderboardModal").style.display = "none";
}
function clic() {
    if(sound){
        let ok = document.getElementById("ok");
        ok.play();
    }
    let score = document.getElementById("score");
    nbTap++;
    score.innerText = "Score: " + nbTap
}

async function startGame() {
    if (gameRunning) {
        return;
    }
    gameRunning = true;
    mode = document.getElementById("gameSelect").value;
    temps = document.getElementById("timeSelect").value;

    let table_conv = { '1': 'Normal', '2': 'Sans Malus', '3': '0 Vie' };

    try {
        const response = await fetch(`${getBaseUrl()}:3000/api/startGame`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            // You can pass mode + time if your server wants it stored in the session
            body: JSON.stringify({ modes : [table_conv[mode], temps + 'S']})
        });
        const data = await response.json();

        // Store them globally so we can sign requests
        sessionData.ephemeralKey = data.ephemeralKey;
        sessionData.gameSessionId = data.gameSessionId;
    } catch (err) {
        console.error("Error starting game session:", err);
        gameRunning = false;
        return;
    }

    if(sound){
        let START = document.getElementById("START");
        START.play();
    }

    // Attendre 3 secondes avant de continuer
    await attendre(3500);



    // Réinitialise le chrono et enlève l'animation
    let afficheTemps = document.getElementById("chrono");
    afficheTemps.classList.remove("clignote"); // Enlève l'animation de clignotement
    afficheTemps.style.transform = "scale(1)"; // Réinitialise la taille
    afficheTemps.style.color = "#DDD"; // Réinitialise la couleur

    nbTap = 0;
    document.getElementById("score").innerText = "Score: 0";
    activateRandomCell();
    timer(temps);
}

// Fonction pour attendre un certain nombre de millisecondes
function attendre(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function addBadClass(temps) {
    temps = temps * 1000;
    let body = document.getElementById("body");
    body.classList.add("bad");
    setTimeout(() => {
        body.classList.remove("bad");
    }, temps);
}

function stopGame() {
    // Réinitialise le chrono et enlève l'animation
    let afficheTemps = document.getElementById("chrono");
    afficheTemps.classList.remove("clignote"); // Enlève l'animation de clignotement
    afficheTemps.style.transform = "scale(1)"; // Réinitialise la taille
    afficheTemps.style.color = "#DDD"; // Réinitialise la couleur

    gameRunning = false;
    let table_conv = { '1': 'Normal', '2': 'Sans Malus', '3': '0 Vie' };
    const gameMode = table_conv[mode];
    const timeSelected = temps + 'S';

    const currentHighScore = highScores[gameMode][timeSelected];

    if (nbTap > currentHighScore.score) {
        // We already got `playerName` on page load
        const userName = playerName || "Guest";

        // We call the function that does the HMAC-signed POST
        update_score(nbTap, userName, [gameMode, timeSelected])
            .then(() => {
                // After updating, reflect new high score in the UI
                document.getElementById("score").innerText =
                    `Score: ${nbTap} | High Score: ${nbTap} (${userName})`;
                getHighScores()
            })
            .catch(err => {
                console.error("Error submitting score:", err);
            });
    } else {
        // If no new high score, just show the final score
        document.getElementById("score").innerText = `Score: ${nbTap}`;
    }

    // Clean up the active cell
    if (activeCell) {
        activeCell.classList.remove("active");
        activeCell.onclick = null;
        activeCell = null;
    }
}

function refresh() {
    let table_conv = {'1' : 'Normal' , '2' : 'Sans Malus', '3' : '0 Vie'}

    let timeSelect = document.getElementById("timeSelect").value;
    let chronoDisplay = document.getElementById("chrono");
    let timeValue = timeSelect; // Récupère la valeur sélectionnée

    // Met à jour le chrono avec la nouvelle valeur
    chronoDisplay.innerText = timeValue + ".00"; // Format pour afficher le chrono

    // Affichage du meilleur score pour la combinaison actuelle de mode et de temps
    const gameMode = table_conv[document.getElementById('gameSelect').value];
    const currentHighScore = highScores[gameMode][timeSelect + 'S'];
    document.getElementById("score").innerText = `Score: 0 | High Score: ${currentHighScore.score} (${currentHighScore.player})`;
}

function toggle_sound(e){
    //console.log("toggle sound");
    if(e.src.includes('image/son')){
        e.src = "image/pas-de-son.png";
        sound = false
    }
    else{
        e.src = "image/son.png";
        sound = true
    }
    localStorage.setItem('sound', sound);
}

function startSound(){
    sound = (localStorage.getItem('sound') === 'true');
    if (!sound){
        document.getElementById('soundSelect').src = "image/pas-de-son.png"
    }
}



function getBaseUrl() {
    const { protocol, hostname } = window.location;
    return `${protocol}//${hostname}`;
}

function loadHypeTrainContributors() {
      const url = 'https://api.github.com/repos/linadu2/taptap/contributors';
      
      fetch(url)
        .then(response => response.json())
        .then(contributors => {
          // Extract just the 'login' names
          const contributorLogins = contributors.map(item => item.login);
          const trainTrack = document.getElementById('train-track');

          if (contributorLogins.length === 0) {
            trainTrack.textContent = 'No contributors found.';
            return;
          }

          // Create a "car" for each contributor
          contributorLogins.forEach(login => {
            const car = document.createElement('div');
            car.classList.add('train-car');
            car.textContent = login;
            trainTrack.appendChild(car);
          });

          // Duplicate the logins so we get a seamless infinite loop
          contributorLogins.forEach(login => {
            const car = document.createElement('div');
            car.classList.add('train-car');
            car.textContent = login;
            trainTrack.appendChild(car);
          });
        })
        .catch(error => {
          console.error('Error fetching contributors:', error);
          document.getElementById('train-track').textContent = 'Error loading contributors.';
        });
}

async function generateHmac(secretKey, payload) {
    const enc = new TextEncoder();
    const secret = enc.encode(secretKey);
    const msg = enc.encode(payload);

    // Import the key for HMAC-SHA256
    const cryptoKey = await window.crypto.subtle.importKey(
        "raw",
        secret,
        { name: "HMAC", hash: { name: "SHA-256" } },
        false,
        ["sign"]
    );
    // Sign the payload
    const signatureBuffer = await window.crypto.subtle.sign("HMAC", cryptoKey, msg);

    // Convert ArrayBuffer -> base64 string
    return btoa(String.fromCharCode(...new Uint8Array(signatureBuffer)));
}

async function update_score(score, pseudo, [gameMode, timeSelected]) {
    const { ephemeralKey, gameSessionId } = sessionData;
    if (!ephemeralKey || !gameSessionId) {
        throw new Error("Missing ephemeralKey or gameSessionId - did you call startGame first?");
    }

    // Build the payload
    const payloadObject = {
        score,
        pseudo,
        gameMode,
        timeSelected,
        timestamp: Date.now()
    };
    console.log(payloadObject)
    const payloadString = JSON.stringify(payloadObject);

    // Generate the HMAC signature
    const signature = await generateHmac(ephemeralKey, payloadString);

    // Send to server
    const response = await fetch(`${getBaseUrl()}:3000/api/submit-score`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-Session-Id": gameSessionId,
            "X-Signature": signature
        },
        body: payloadString
    });

    const result = await response.json();
    console.log("Score submission result:", result);
    if (!response.ok) {
        throw new Error(result.error || "Error submitting score");
    }
}
