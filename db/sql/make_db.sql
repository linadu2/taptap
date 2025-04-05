CREATE DATABASE taptapdb;

USE taptapdb;

create table modes (
    modesID INT AUTO_INCREMENT PRIMARY KEY,
    modes VARCHAR(50) NOT null);

create table temps (
    tempsID INT AUTO_INCREMENT PRIMARY KEY,
    temps VARCHAR(50) NOT NULL);

CREATE TABLE leaderboard (
modesID INT NOT NULL,
tempsID INT NOT NULL,
pseudo VARCHAR(255),
score INT,
FOREIGN KEY (modesID) REFERENCES modes(modesID),
FOREIGN KEY (tempsID) REFERENCES temps(tempsID)
);

INSERT INTO modes (modes) VALUES ('Normal'), ('Sans Malus'), ('0 Vie');


INSERT INTO temps (temps) VALUES ('10S'), ('30S'), ('60S');

INSERT INTO leaderboard (modesID, tempsID) VALUES (1, 1), (1, 2), (1, 3), (2, 1), (2, 2), (2, 3), (3, 1), (3, 2), (3, 3);

