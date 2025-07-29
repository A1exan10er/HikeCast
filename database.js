// database.js
const sqlite3 = require('sqlite3').verbose();
const fs = require('fs');
const path = require('path');

class UserDatabase {
  constructor(dbPath = 'hikecast.db') {
    this.dbPath = dbPath;
    this.db = null;
  }

  // Initialize database connection and create tables
  async initialize() {
    return new Promise((resolve, reject) => {
      this.db = new sqlite3.Database(this.dbPath, (err) => {
        if (err) {
          console.error('Error opening database:', err);
          reject(err);
        } else {
          console.log('Connected to SQLite database');
          this.createTables()
            .then(resolve)
            .catch(reject);
        }
      });
    });
  }

  // Create users table
  createTables() {
    return new Promise((resolve, reject) => {
      const createUsersTable = `
        CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT UNIQUE NOT NULL,
          locations TEXT NOT NULL,
          channels TEXT NOT NULL,
          telegram_chat_id TEXT,
          email TEXT,
          whatsapp TEXT,
          schedule TEXT DEFAULT '0 7 * * *',
          timezone TEXT DEFAULT 'UTC',
          forecast_days TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `;

      this.db.run(createUsersTable, (err) => {
        if (err) {
          console.error('Error creating users table:', err);
          reject(err);
        } else {
          console.log('Users table created or verified');
          resolve();
        }
      });
    });
  }

  // Migration: Import existing users.json data
  async migrateFromJSON() {
    try {
      if (fs.existsSync('users.json')) {
        console.log('Found existing users.json, migrating data...');
        const jsonData = fs.readFileSync('users.json', 'utf8');
        const users = JSON.parse(jsonData);
        
        for (const user of users) {
          try {
            await this.addUser(user);
            console.log(`✅ Migrated user: ${user.name}`);
          } catch (error) {
            if (error.message.includes('UNIQUE constraint failed')) {
              console.log(`⚠️ User ${user.name} already exists, skipping`);
            } else {
              console.error(`❌ Error migrating user ${user.name}:`, error.message);
            }
          }
        }
        
        // Backup original file
        const backupPath = `users.json.backup.${Date.now()}`;
        fs.copyFileSync('users.json', backupPath);
        console.log(`📁 Backed up original users.json to ${backupPath}`);
        
        return true;
      } else {
        console.log('No users.json found, starting with empty database');
        return false;
      }
    } catch (error) {
      console.error('Error during migration:', error);
      return false;
    }
  }

  // Add new user
  addUser(userData) {
    return new Promise((resolve, reject) => {
      const stmt = this.db.prepare(`
        INSERT INTO users (name, locations, channels, telegram_chat_id, email, whatsapp, schedule, timezone, forecast_days)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const locations = Array.isArray(userData.locations) ? JSON.stringify(userData.locations) : userData.locations;
      const channels = Array.isArray(userData.channels) ? JSON.stringify(userData.channels) : userData.channels;
      const forecastDays = userData.forecastDays ? JSON.stringify(userData.forecastDays) : null;

      stmt.run([
        userData.name,
        locations,
        channels,
        userData.telegram_chat_id || null,
        userData.email || null,
        userData.whatsapp || null,
        userData.schedule || '0 7 * * *',
        userData.timezone || 'UTC',
        forecastDays
      ], function(err) {
        if (err) {
          reject(err);
        } else {
          resolve({ 
            id: this.lastID, 
            ...userData,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });
        }
      });

      stmt.finalize();
    });
  }

  // Get all users
  getAllUsers() {
    return new Promise((resolve, reject) => {
      this.db.all('SELECT * FROM users ORDER BY name', (err, rows) => {
        if (err) {
          reject(err);
        } else {
          const users = rows.map(row => this.parseUserRow(row));
          resolve(users);
        }
      });
    });
  }

  // Get user by identifier (name, email, or telegram_chat_id)
  getUserByIdentifier(identifier) {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT * FROM users 
        WHERE name = ? OR email = ? OR telegram_chat_id = ?
        LIMIT 1
      `;
      
      this.db.get(query, [identifier, identifier, identifier], (err, row) => {
        if (err) {
          reject(err);
        } else if (row) {
          resolve(this.parseUserRow(row));
        } else {
          resolve(null);
        }
      });
    });
  }

  // Update user
  updateUser(identifier, updateData) {
    return new Promise((resolve, reject) => {
      // First, get the current user
      this.getUserByIdentifier(identifier)
        .then(currentUser => {
          if (!currentUser) {
            reject(new Error('User not found'));
            return;
          }

          // Merge current data with updates
          const updatedUser = { ...currentUser, ...updateData };
          
          const locations = Array.isArray(updatedUser.locations) ? JSON.stringify(updatedUser.locations) : updatedUser.locations;
          const channels = Array.isArray(updatedUser.channels) ? JSON.stringify(updatedUser.channels) : updatedUser.channels;
          const forecastDays = updatedUser.forecastDays ? JSON.stringify(updatedUser.forecastDays) : null;

          const stmt = this.db.prepare(`
            UPDATE users SET
              name = ?, locations = ?, channels = ?, telegram_chat_id = ?, 
              email = ?, whatsapp = ?, schedule = ?, timezone = ?, 
              forecast_days = ?, updated_at = CURRENT_TIMESTAMP
            WHERE id = ?
          `);

          stmt.run([
            updatedUser.name,
            locations,
            channels,
            updatedUser.telegram_chat_id,
            updatedUser.email,
            updatedUser.whatsapp,
            updatedUser.schedule,
            updatedUser.timezone,
            forecastDays,
            currentUser.id
          ], function(err) {
            if (err) {
              reject(err);
            } else if (this.changes === 0) {
              reject(new Error('No user was updated'));
            } else {
              resolve(updatedUser);
            }
          });

          stmt.finalize();
        })
        .catch(reject);
    });
  }

  // Delete user
  deleteUser(identifier) {
    return new Promise((resolve, reject) => {
      // First get the user to return info about what was deleted
      this.getUserByIdentifier(identifier)
        .then(user => {
          if (!user) {
            reject(new Error('User not found'));
            return;
          }

          const stmt = this.db.prepare(`
            DELETE FROM users 
            WHERE name = ? OR email = ? OR telegram_chat_id = ?
          `);

          stmt.run([identifier, identifier, identifier], function(err) {
            if (err) {
              reject(err);
            } else if (this.changes === 0) {
              reject(new Error('No user was deleted'));
            } else {
              resolve(user);
            }
          });

          stmt.finalize();
        })
        .catch(reject);
    });
  }

  // Helper method to parse database row into user object
  parseUserRow(row) {
    return {
      id: row.id,
      name: row.name,
      locations: JSON.parse(row.locations),
      channels: JSON.parse(row.channels),
      telegram_chat_id: row.telegram_chat_id,
      email: row.email,
      whatsapp: row.whatsapp,
      schedule: row.schedule,
      timezone: row.timezone,
      forecastDays: row.forecast_days ? JSON.parse(row.forecast_days) : null,
      created_at: row.created_at,
      updated_at: row.updated_at
    };
  }

  // Get user statistics
  async getStats() {
    return new Promise((resolve, reject) => {
      const queries = {
        totalUsers: 'SELECT COUNT(*) as count FROM users',
        telegramUsers: 'SELECT COUNT(*) as count FROM users WHERE telegram_chat_id IS NOT NULL',
        emailUsers: 'SELECT COUNT(*) as count FROM users WHERE email IS NOT NULL',
        whatsappUsers: 'SELECT COUNT(*) as count FROM users WHERE whatsapp IS NOT NULL'
      };

      const stats = {};
      let completed = 0;
      const total = Object.keys(queries).length;

      Object.entries(queries).forEach(([key, query]) => {
        this.db.get(query, (err, row) => {
          if (err) {
            reject(err);
            return;
          }
          
          stats[key] = row.count;
          completed++;
          
          if (completed === total) {
            resolve(stats);
          }
        });
      });
    });
  }

  // Close database connection
  close() {
    return new Promise((resolve, reject) => {
      if (this.db) {
        this.db.close((err) => {
          if (err) {
            reject(err);
          } else {
            console.log('Database connection closed');
            resolve();
          }
        });
      } else {
        resolve();
      }
    });
  }

  // Backup database
  async backup() {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupPath = `hikecast_backup_${timestamp}.db`;
    
    return new Promise((resolve, reject) => {
      fs.copyFile(this.dbPath, backupPath, (err) => {
        if (err) {
          reject(err);
        } else {
          console.log(`Database backed up to ${backupPath}`);
          resolve(backupPath);
        }
      });
    });
  }
}

module.exports = UserDatabase;