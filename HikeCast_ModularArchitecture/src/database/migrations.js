// This file manages database migrations, ensuring the database schema is up to date.

const db = require('./database');

// Function to run migrations
async function runMigrations() {
    try {
        // Example migration: Create a users table
        await db.run(`
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                locations TEXT NOT NULL,
                channels TEXT NOT NULL,
                telegram_chat_id TEXT,
                email TEXT,
                whatsapp TEXT,
                schedule TEXT,
                timezone TEXT,
                forecastDays TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);

        console.log('Migrations completed successfully.');
    } catch (error) {
        console.error('Error running migrations:', error);
    }
}

// Export the migration function
module.exports = {
    runMigrations,
};