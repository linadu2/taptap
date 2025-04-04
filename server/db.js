const mariadb = require('mariadb');
const dotenv = require('dotenv')

const pool = mariadb.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
});

// Example: Acquire a connection and run a query
pool.getConnection()
    .then(conn => {
        return conn.query('SELECT 1 AS val')
            .then(rows => {
                console.log('Query result:', rows);
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
        const rows = await conn.query('select nom_joueur, points from score;');

        const highScores = {
            "1": {
                "10": { score: rows[0].points, player: rows[0].nom_joueur },
                "30": { score: rows[1].points, player: rows[1].nom_joueur },
                "60": { score: rows[2].points, player: rows[2].nom_joueur }
            },
            "2": {
                "10": { score: rows[3].points, player: rows[3].nom_joueur },
                "30": { score: rows[4].points, player: rows[4].nom_joueur },
                "60": { score: rows[5].points, player: rows[5].nom_joueur }
            },
            "3": {
                "10": { score: rows[6].points, player: rows[6].nom_joueur },
                "30": { score: rows[7].points, player: rows[7].nom_joueur },
                "60": { score: rows[8].points, player: rows[8].nom_joueur }
            }
        };

        console.log(highScores);

        return highScores;
    } catch (err) {
        console.error('Error getting scores:', err);
    } finally {
        if (conn) conn.release();
    }
}



module.exports = { getScores }
