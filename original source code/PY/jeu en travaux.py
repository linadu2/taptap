from flask import Flask, redirect
from gpiozero import *
from time import sleep
import random
app = Flask(__name__)
ledrouge1 = LED(13)
ledrouge2 = LED(19)
ledrouge3 = LED(6)
ledverte = LED(26)
boutonS = Button(5)

@app.route('/')
def index():
     return """

<!DOCTYPE html>
<html lang="fr">

<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Grille Aléatoire</title>

  <style>
      .buttons {
          display: flex;
          flex-direction: column;  /* Disposition des boutons l'un sur l'autre */
          gap: 20px;               /* Espace entre les boutons */
          margin-top: 30px;
          align-items: center;     /* Centrer les boutons */
      }

      .buttons button {
          padding: 15px 25px;
          font-size: 18px;
          font-weight: bold;
          border-radius: 10px;
          cursor: pointer;
          border: none;
          color: white;
          transition: background-color 0.3s, transform 0.2s, box-shadow 0.3s;
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
          width: 200px;  /* Largeur fixe pour chaque bouton */
      }

      .buttons .vert {
          background-color: #28a745;
      }

      .buttons .vert:hover {
          background-color: #218838;
          transform: scale(1.05);
          box-shadow: 0 8px 20px rgba(40, 167, 69, 0.3);
      }

      .buttons .rouge {
          background-color: #dc3545;
      }

      .buttons .rouge:hover {
          background-color: #c82333;
          transform: scale(1.05);
          box-shadow: 0 8px 20px rgba(220, 53, 69, 0.3);
      }
      body {
          display: flex;
          flex-direction: column;
          align-items: center;
          height: 100vh;
          background-color: #f4f4f4;
          font-family: Arial, sans-serif;
          margin: 0;
      }

      .top-bar {
          display: flex;
          justify-content: space-between;
          width: 90%;
          margin-top: 10px;
          padding: 10px;
          background-color: #343a40;
          color: white;
          border-radius: 10px;
      }

      .top-bar .chrono {
          font-size: 24px;
          font-weight: bold;
          color: #333;
      }

      .top-bar .time-select {
          display: flex;
          align-items: center;
      }

      .top-bar label {
          font-size: 18px;
          color: #fff;
          margin-right: 10px;
      }

      .buttons {
          display: flex;
          flex-direction: row;
          gap: 20px;
          margin-top: 30px;
      }

      .buttons button {
          padding: 15px 25px;
          font-size: 18px;
          font-weight: bold;
          border-radius: 10px;
          cursor: pointer;
          border: none;
          color: white;
          transition: background-color 0.3s, transform 0.2s;
          box-shadow: 0 5px 15px rgba(0, 0, 0, 0.1);
      }

      .buttons .vert {
          background-color: #28a745;
      }

      .buttons .vert:hover {
          background-color: #218838;
          transform: scale(1.1);
      }

      .buttons .rouge {
          background-color: #dc3545;
      }

      .buttons .rouge:hover {
          background-color: #c82333;
          transform: scale(1.1);
      }

      .grid {
          display: grid;
          grid-template-columns: repeat(3, 100px);
          grid-template-rows: repeat(3, 100px);
          gap: 10px;
          margin-top: 20px;
          transition: transform 0.3s;
      }

      .cell {
          width: 100px;
          height: 100px;
          background-color: #343a40;
          border-radius: 8px;
          transition: background-color 0.3s, transform 0.2s;
          cursor: pointer;
      }

      .cell:hover {
          transform: scale(1.1);
      }

      .cell.active {
          background-color: #ffc107;
          box-shadow: 0 0 10px rgba(255, 193, 7, 0.7);
      }

      .score {
          font-size: 24px;
          font-weight: bold;
          margin-top: 20px;
          color: #333;
      }

      select {
          padding: 10px;
          font-size: 16px;
          border-radius: 5px;
          border: 1px solid #ccc;
          margin-left: 10px;
      }

      label {
          font-size: 18px;
          color: #333;
      }

      .bad {
          background-color: red;
          animation: shake 0.5s ease-in-out infinite;
      }

      @keyframes shake {
          0% {
              transform: translateX(-5px);
          }

          25% {
              transform: translateX(5px);
          }

          50% {
              transform: translateX(-5px);
          }

          75% {
              transform: translateX(5px);
          }

          100% {
              transform: translateX(0);
          }
      }

      @keyframes clignote {
          0% {
              color: red;
              transform: scale(1);
          }

          50% {
              color: yellow;
              transform: scale(1.1);
          }

          100% {
              color: red;
              transform: scale(1);
          }
      }

      #chrono.clignote {
          animation: clignote 1s infinite;
      }

      #chrono {
          font-size: 45px;
          color: #DDD;
      }
      .modal {
          display: none;
          position: fixed;
          z-index: 1000;
          left: 0;
          top: 0;
          width: 100%;
          height: 100%;
          background-color: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
      }


      .modal-content {
          background-color: white;
          padding: 20px;
          border-radius: 10px;
          width: 50%;
          text-align: center;
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.2);
      }

      .close {
          color: red;
          float: right;
          font-size: 28px;
          font-weight: bold;
          cursor: pointer;
      }

      .leaderboard-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 10px;
      }

      .leaderboard-table th, .leaderboard-table td {
          border: 1px solid #ddd;
          padding: 10px;
          text-align: center;
      }

      .leaderboard-table th {
          background-color: #343a40;
          color: white;
      }
  </style>
</head>

<body id="body">
<div class="top-bar">
  <div>
    <label for="gameSelect">Choisir un jeu :</label>
    <select onchange="refresh()" id="gameSelect">
      <option value="1">Normal</option>
      <option value="2">Sans malus</option>
      <option value="3">0 Vie</option>
    </select>
  </div>
  <div class="chrono" id="chrono">0.00</div>
  <div class="time-select">
    <label for="timeSelect">Temps :</label>
    <select onchange="refresh()" id="timeSelect">
      <option value="10">10s</option>
      <option value="30">30s</option>
      <option value="60">1m</option>
    </select>
  </div>
</div>

<div class="buttons">
  <button class="vert" onclick="startGame()">Démarrer</button>
  <button class="rouge" onclick="stopGame()">Arrêter</button>
</div>

<div class="grid">
  <div onclick="badclick()" class="cell" id="cell-0"></div>
  <div onclick="badclick()" class="cell" id="cell-1"></div>
  <div onclick="badclick()" class="cell" id="cell-2"></div>
  <div onclick="badclick()" class="cell" id="cell-3"></div>
  <div onclick="badclick()" class="cell" id="cell-4"></div>
  <div onclick="badclick()" class="cell" id="cell-5"></div>
  <div onclick="badclick()" class="cell" id="cell-6"></div>
  <div onclick="badclick()" class="cell" id="cell-7"></div>
  <div onclick="badclick()" class="cell" id="cell-8"></div>
</div>
<div id="leaderboardModal" class="modal">
  <div class="modal-content">
    <span class="close" onclick="closeLeaderboard()">&times;</span>
    <h2>Leaderboard</h2>
    <div id="leaderboardContent"></div>
  </div>
</div>

<div class="score" id="score">Score: 0 | High Score: 0</div>
<div class="buttons">
  <button class="vert" onclick="showLeaderboard()">Afficher Leader board</button>
  <button class="rouge" onclick="confirmResetHighScores()">Réinitialiser High Scores</button>
</div>
<script>
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
      fetch('/ledR')
      if (document.getElementById("gameSelect").value == 3) {

        let audioDefaite = document.getElementById("audioDefaite");
        let fini = false
        fini = addBadClass(3);
        audioDefaite.play();
        while (fini =false)
        {}
        stopGame();
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

  function startGame() {
  fond.pause();
  let START = document.getElementById("START");
  START.play();
      fetch('/led')
          .then(response => {
              if (response.ok) {
                  // La requête a réussi, continuez l'exécution de startGame

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
              } else {
                  console.error('Erreur lors de la requête fetch:', response.statusText);
              }
          })
          .catch(error => {
              console.error('Erreur lors de la requête fetch:', error);
          });
  }


  function addBadClass(temps) {
    temps = temps * 1000;
    let body = document.getElementById("body");
    body.classList.add("bad");
    setTimeout(() => {
      body.classList.remove("bad");
    }, temps);
    return true
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
</script>

<audio id="audioDefaite" src="/static/perdu.mp3" preload="auto"></audio>
<audio id="audioRater" src="/static/rater.mp3" preload="auto"></audio>
<audio id="ok" src="/static/ok.mp3" preload="auto"></audio>
<audio id="fond" src="/static/fond.mp3" preload="auto"></audio>
<audio id="START" src="/static/START.mp3" preload="auto"></audio>

</body>


</html>
"""
@app.route('/led')
def led_page():
    ledrouge1.on()
    sleep(1)
    ledrouge2.on()
    sleep(1)
    ledrouge3.on()
    sleep(1)
    ledrouge1.off()
    ledrouge2.off()
    ledrouge3.off()
    ledverte.on()
    sleep(1)
    ledverte.off()
    return redirect('/')

@app.route('/ledR')
def led_R():
    ledrouge1.on()
    ledrouge2.on()
    ledrouge3.on()
    sleep(0.5)
    ledrouge1.off()
    ledrouge2.off()
    ledrouge3.off()
    return '', 200


boutonS.when_pressed = START

@app.route('/START')
def START():

    return '', 200

app.run(host='0.0.0.0', port=8000)