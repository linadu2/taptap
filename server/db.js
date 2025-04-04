const mariadb = require('mariadb');
const dotenv = require('dotenv')

const pool = mariadb.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
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
    return {'test': 'test'}
}

module.exports = { getScores}
