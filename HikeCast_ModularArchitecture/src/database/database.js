// This file handles database connections and interactions.

const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'hikecast.db');

let db;

function initialize() {
    return new Promise((resolve, reject) => {
        db = new sqlite3.Database(dbPath, (err) => {
            if (err) {
                console.error('Error opening database:', err.message);
                reject(err);
            } else {
                console.log('Connected to the SQLite database.');
                resolve();
            }
        });
    });
}

function close() {
    return new Promise((resolve, reject) => {
        if (db) {
            db.close((err) => {
                if (err) {
                    console.error('Error closing database:', err.message);
                    reject(err);
                } else {
                    console.log('Database connection closed.');
                    resolve();
                }
            });
        } else {
            resolve();
        }
    });
}

function runQuery(query, params = []) {
    return new Promise((resolve, reject) => {
        db.run(query, params, function(err) {
            if (err) {
                console.error('Error running query:', err.message);
                reject(err);
            } else {
                resolve(this.lastID);
            }
        });
    });
}

function getQuery(query, params = []) {
    return new Promise((resolve, reject) => {
        db.get(query, params, (err, row) => {
            if (err) {
                console.error('Error getting data:', err.message);
                reject(err);
            } else {
                resolve(row);
            }
        });
    });
}

function allQuery(query, params = []) {
    return new Promise((resolve, reject) => {
        db.all(query, params, (err, rows) => {
            if (err) {
                console.error('Error getting data:', err.message);
                reject(err);
            } else {
                resolve(rows);
            }
        });
    });
}

module.exports = {
    initialize,
    close,
    runQuery,
    getQuery,
    allQuery
};