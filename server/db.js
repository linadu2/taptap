const mariadb = require('mariadb');
const dotenv = require('dotenv')

dotenv.config();

//console.log(process.env);

const pool = mariadb.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    connectionLimit: 5
});

// Example: Acquire a connection and run a query
pool.getConnection()
    .then(conn => {
        return conn.query('SELECT 1 AS val')
            .then(rows => {
                conn.release();  // Release the connection back to the pool
            })
            .catch(err => {
                console.error('Query error:', err);
                conn.release();
            });
    })
    .catch(err => {
        console.error('Connection error:', err);
    });


async function getScores(){
    let conn;
     try {
        conn = await pool.getConnection();

        const query = `
          SELECT pseudo, score, modes , temps
          FROM leaderboard join modes join temps
        `;

        const rows = await conn.query(query);

        const highScores = {};

        rows.forEach(row => {
          const mode = row.modes;
          const temps = row.temps;

          // Assure que la clé du mode existe
          if (!highScores[mode]) {
            highScores[mode] = {};
          }

          highScores[mode][temps] = {
            score: row.score,
            player: row.pseudo
          };
        });

        return highScores;
      } catch (err) {
        console.error('Erreur lors de la récupération des scores :', err);
        throw err;
      } finally {
        if (conn) conn.release();
      }
    }

async function updateScore(pseudo, score, mode) {
  let conn;

  try {
    conn = await pool.getConnection();

    const updateQuery = `
        UPDATE leaderboard as l
        JOIN modes as m
        JOIN temps as t
        SET l.pseudo = ?, l.score = ?
        WHERE m.modes = ? AND t.temps = ? ;
    `;

    const result = await conn.query(updateQuery, [pseudo, score, mode[0], mode[1]]);

    return result;

  } catch (err) {
    console.error('Erreur lors de la mise à jour du score :', err);
    throw err;
  } finally {
    if (conn) conn.release();
  }
}

module.exports = {
  getScores,
  updateScore
};

