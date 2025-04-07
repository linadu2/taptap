window.onload = function () {
    getHighScores()
    closeLeaderboard()
    startSound()
    loadHypeTrainContributors()
};

let gameRunning = false;
let activeCell = null;
let nbTap = 0;

let sound = true

let highScores;

let mode, temps;


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
            // Process the JSON data here
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
            let audioDefaite = document.getElementById("audioDefaite");
            if(sound){
                audioDefaite.play();
            }

        } else {
            addBadClass(0.2);
            let score = document.getElementById("score");
            nbTap--;
            score.innerText = "Score: " + nbTap;
            let audioRater = document.getElementById("audioRater");
            if(sound){
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
    let ok = document.getElementById("ok");
    if(sound){
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

    let START = document.getElementById("START");
    if(sound){
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

    let table_conv = {'1' : 'Normal' , '2' : 'Sans Malus', '3' : '0 Vie'}
    // Récupère le mode de jeu et le temps sélectionnés
    const gameMode = table_conv[mode];
    const timeSelected = temps + 'S';

    // Vérifie si le score est un high score
    const currentHighScore = highScores[gameMode][timeSelected];

    if (nbTap > currentHighScore.score) {
        let playerName = prompt("Félicitations ! Nouveau meilleur score ! Entrez votre pseudo :");
        if (playerName) {
            update_score(nbTap, playerName, [gameMode, timeSelected])
            // Mise à jour de l'affichage du meilleur score après la partie
            document.getElementById("score").innerText =
                `Score: ${nbTap} | High Score: ${nbTap} (${playerName})`;
        }
    } else {
        // Si ce n'est pas un meilleur score, on ne met à jour que le score actuel
        document.getElementById("score").innerText = `Score: ${nbTap}`;    }

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

async function get_token() {
    try {
        const response = await fetch(`${getBaseUrl()}:3000/api/getSessionToken`, {
            method: 'POST',
        });

        if (!response.ok) {
            throw new Error('Failed to fetch the session token');
        }

        const data = await response.json();
        return data.token;
    } catch (error) {
        return '';
    }
}


async function update_score(score, pseudo, mode) {
    score = Number(score);

    const token = await get_token();

    if (!token) {
        return;
    }

    try {
        const response = await fetch(`${getBaseUrl()}:3000/api/updateScore`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ token, score, pseudo, mode })
        });

        if (!response.ok) {
            throw new Error('Network response was not ok');
        }

        const data = await response.json();
        console.log('Score updated successfully:', data);
        getHighScores();
    } catch (error) {
        console.error('Error updating score:', error);
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