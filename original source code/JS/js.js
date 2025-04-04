window.onload = function () {
    refresh();
};

let gameRunning = false;
let activeCell = null;
let nbTap = 0;

let highScores = {
    "1": {
        "10": { score: 0, player: "" },
        "30": { score: 0, player: "" },
        "60": { score: 0, player: "" }
    },
    "2": {
        "10": { score: 0, player: "" },
        "30": { score: 0, player: "" },
        "60": { score: 0, player: "" }
    },
    "3": {
        "10": { score: 0, player: "" },
        "30": { score: 0, player: "" },
        "60": { score: 0, player: "" }
    }
};

// Chargement des scores depuis localStorage
const storedHighScores = localStorage.getItem("highScores");
if (storedHighScores) {
    highScores = JSON.parse(storedHighScores);
}

// Fonction pour réinitialiser les high scores
function resetHighScores() {
    if (confirm("Êtes-vous sûr de vouloir réinitialiser les high scores ?")) {
        // Réinitialiser les scores à 0
        highScores = {
            "1": {
                "10": { score: 0, player: "" },
                "30": { score: 0, player: "" },
                "60": { score: 0, player: "" }
            },
            "2": {
                "10": { score: 0, player: "" },
                "30": { score: 0, player: "" },
                "60": { score: 0, player: "" }
            },
            "3": {
                "10": { score: 0, player: "" },
                "30": { score: 0, player: "" },
                "60": { score: 0, player: "" }
            }
        };

        // Sauvegarder les nouveaux high scores dans localStorage
        localStorage.setItem("highScores", JSON.stringify(highScores));

        // Mettre à jour l'affichage
        refresh();
        alert("High scores réinitialisés !");
    }
}

// Fonction pour demander confirmation avant réinitialisation
function confirmResetHighScores() {
    resetHighScores();
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
        setTimeout(activateRandomCell, 10);
    };
}

function timer(timeLeft) {
    let initialTime = timeLeft; // Sauvegarde le temps initial
    timeLeft = timeLeft * 100;
    let afficheTemps = document.getElementById("chrono");
    afficheTemps.innerText = timeLeft;
    var interval = setInterval(() => {
        if (timeLeft > 0 && gameRunning === true) {
            timeLeft -= 1;
            afficheTemps.innerText = (timeLeft / 100).toFixed(2);

            // Vérifie si le temps est à 25% et applique l'animation
            if (timeLeft <= initialTime * 0.50 * 100 && !afficheTemps.classList.contains("clignote")) {
                afficheTemps.classList.add("clignote"); // Ajoute l'animation
            }

        } else {
            clearInterval(interval);
            timeLeft = 0;
            afficheTemps.innerText = (0).toFixed(2);
            stopGame();
            return;
        }
    }, 10);
}

function badclick() {
    if (gameRunning == true && document.getElementById("gameSelect").value != 2) {
        if (document.getElementById("gameSelect").value == 3) {
            stopGame();
            addBadClass(3);
            let audioDefaite = document.getElementById("audioDefaite");
            audioDefaite.play();
        } else {
            addBadClass(0.2);
            let score = document.getElementById("score");
            nbTap--;
            score.innerText = "Score: " + nbTap + " | High Score: " + highScores["1"]["10"].score;
            let audioRater = document.getElementById("audioRater");
            audioRater.play();
        }
    }
}
function showLeaderboard() {
    let leaderboardHTML = "<table class='leaderboard-table'><tr><th>Mode</th><th>Temps</th><th>Joueur</th><th>Score</th></tr>";

    const modeNames = {
        "1": "Normal",
        "2": "Sans Malus",
        "3": "0 Vie"
    };

    for (let mode in highScores) {
        for (let time in highScores[mode]) {
            let entry = highScores[mode][time];
            leaderboardHTML += `<tr><td>${modeNames[mode] || mode}</td><td>${time}s</td><td>${entry.player || 'N/A'}</td><td>${entry.score}</td></tr>`;
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
    ok.play();
    let score = document.getElementById("score");
    nbTap++;
    score.innerText = "Score: " + nbTap
}

async function startGame() {
    let START = document.getElementById("START");
    START.play();
    fond.pause();

    // Attendre 3 secondes avant de continuer
    await attendre(3500);

    if (gameRunning == true) {
        return;
    }

    // Réinitialise le chrono et enlève l'animation
    let afficheTemps = document.getElementById("chrono");
    afficheTemps.classList.remove("clignote"); // Enlève l'animation de clignotement
    afficheTemps.style.transform = "scale(1)"; // Réinitialise la taille
    afficheTemps.style.color = "#DDD"; // Réinitialise la couleur

    nbTap = 0;
    document.getElementById("score").innerText = "Score: 0";
    gameRunning = true;
    activateRandomCell();
    timer(document.getElementById("timeSelect").value);
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
    fond.play();
    // Réinitialise le chrono et enlève l'animation
    let afficheTemps = document.getElementById("chrono");
    afficheTemps.classList.remove("clignote"); // Enlève l'animation de clignotement
    afficheTemps.style.transform = "scale(1)"; // Réinitialise la taille
    afficheTemps.style.color = "#DDD"; // Réinitialise la couleur

    gameRunning = false;

    // Récupère le mode de jeu et le temps sélectionnés
    const gameMode = document.getElementById("gameSelect").value;
    const timeSelected = document.getElementById("timeSelect").value;

    // Vérifie si le score est un high score
    const currentHighScore = highScores[gameMode][timeSelected];

    if (nbTap > currentHighScore.score) {
        let playerName = prompt("Félicitations ! Nouveau meilleur score ! Entrez votre pseudo :");
        if (playerName) {
            highScores[gameMode][timeSelected] = { score: nbTap, player: playerName };
            localStorage.setItem("highScores", JSON.stringify(highScores)); // Sauvegarde dans le localStorage

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
closeLeaderboard()
function refresh() {

    let timeSelect = document.getElementById("timeSelect");
    let chronoDisplay = document.getElementById("chrono");
    let timeValue = timeSelect.value; // Récupère la valeur sélectionnée

    // Met à jour le chrono avec la nouvelle valeur
    chronoDisplay.innerText = timeValue + ".00"; // Format pour afficher le chrono

    // Affichage du meilleur score pour la combinaison actuelle de mode et de temps
    const gameMode = document.getElementById("gameSelect").value;
    const timeSelected = document.getElementById("timeSelect").value;
    const currentHighScore = highScores[gameMode][timeSelected];
    document.getElementById("score").innerText = `Score: 0 | High Score: ${currentHighScore.score} (${currentHighScore.player})`;
}