const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

class TaskDatabase {
    constructor(dbPath = './database/tasks.db') {
        this.dbPath = dbPath;
        this.db = null;
        this.isConnected = false;
    }

    /**
     * Initialize database connection and create tables
     */
    async connect() {
        return new Promise((resolve, reject) => {
            try {
                // Ensure database directory exists
                const dbDir = path.dirname(this.dbPath);
                if (!fs.existsSync(dbDir)) {
                    fs.mkdirSync(dbDir, { recursive: true });
                }

                this.db = new sqlite3.Database(this.dbPath, (err) => {
                    if (err) {
                        console.error('Error opening database:', err.message);
                        reject(err);
                        return;
                    }
                    
                    console.log('Connected to SQLite database');
                    this.isConnected = true;
                    this.initializeSchema()
                        .then(() => resolve())
                        .catch(reject);
                });
            } catch (error) {
                reject(error);
            }
        });
    }

    /**
     * Initialize database schema
     */
    async initializeSchema() {
        return new Promise((resolve, reject) => {
            const schemaPath = path.join(__dirname, 'schema.sql');
            
            try {
                const schema = fs.readFileSync(schemaPath, 'utf8');
                this.db.exec(schema, (err) => {
                    if (err) {
                        console.error('Error creating schema:', err.message);
                        reject(err);
                        return;
                    }
                    console.log('Database schema initialized');
                    resolve();
                });
            } catch (error) {
                console.error('Error reading schema file:', error.message);
                reject(error);
            }
        });
    }

    /**
     * Close database connection
     */
    async close() {
        return new Promise((resolve, reject) => {
            if (!this.db) {
                resolve();
                return;
            }

            this.db.close((err) => {
                if (err) {
                    console.error('Error closing database:', err.message);
                    reject(err);
                    return;
                }
                console.log('Database connection closed');
                this.isConnected = false;
                resolve();
            });
        });
    }

    /**
     * Validate task data
     */
    validateTask(task) {
        const errors = [];

        if (!task.title || task.title.trim().length === 0) {
            errors.push('Title is required');
        }

        if (task.title && task.title.length > 255) {
            errors.push('Title must be less than 255 characters');
        }

        if (task.priority && !['high', 'medium', 'low'].includes(task.priority)) {
            errors.push('Priority must be high, medium, or low');
        }

        if (task.status && !['pending', 'completed'].includes(task.status)) {
            errors.push('Status must be pending or completed');
        }

        if (task.due_date && isNaN(Date.parse(task.due_date))) {
            errors.push('Due date must be a valid date');
        }

        return errors;
    }

    /**
     * Create a new task
     */
    async createTask(task) {
        return new Promise((resolve, reject) => {
            if (!this.isConnected) {
                reject(new Error('Database not connected'));
                return;
            }

            // Validate task data
            const validationErrors = this.validateTask(task);
            if (validationErrors.length > 0) {
                reject(new Error(`Validation failed: ${validationErrors.join(', ')}`));
                return;
            }

            const sql = `
                INSERT INTO tasks (title, description, due_date, priority, status)
                VALUES (?, ?, ?, ?, ?)
            `;

            const params = [
                task.title.trim(),
                task.description || null,
                task.due_date || null,
                task.priority || 'medium',
                task.status || 'pending'
            ];

            this.db.run(sql, params, function(err) {
                if (err) {
                    console.error('Error creating task:', err.message);
                    reject(err);
                    return;
                }

                console.log(`Task created with ID: ${this.lastID}`);
                resolve({
                    task_id: this.lastID,
                    ...task,
                    created_at: new Date().toISOString(),
                    updated_at: new Date().toISOString()
                });
            });
        });
    }

    /**
     * Get a task by ID
     */
    async getTask(taskId) {
        return new Promise((resolve, reject) => {
            if (!this.isConnected) {
                reject(new Error('Database not connected'));
                return;
            }

            const sql = 'SELECT * FROM tasks WHERE task_id = ?';

            this.db.get(sql, [taskId], (err, row) => {
                if (err) {
                    console.error('Error retrieving task:', err.message);
                    reject(err);
                    return;
                }

                if (!row) {
                    reject(new Error(`Task with ID ${taskId} not found`));
                    return;
                }

                resolve(row);
            });
        });
    }

    /**
     * Get all tasks with optional filtering
     */
    async getAllTasks(filters = {}) {
        return new Promise((resolve, reject) => {
            if (!this.isConnected) {
                reject(new Error('Database not connected'));
                return;
            }

            let sql = 'SELECT * FROM tasks WHERE 1=1';
            const params = [];

            // Apply filters
            if (filters.status) {
                sql += ' AND status = ?';
                params.push(filters.status);
            }

            if (filters.priority) {
                sql += ' AND priority = ?';
                params.push(filters.priority);
            }

            if (filters.due_date_from) {
                sql += ' AND due_date >= ?';
                params.push(filters.due_date_from);
            }

            if (filters.due_date_to) {
                sql += ' AND due_date <= ?';
                params.push(filters.due_date_to);
            }

            // Add ordering
            sql += ' ORDER BY created_at DESC';

            // Add limit if specified
            if (filters.limit) {
                sql += ' LIMIT ?';
                params.push(filters.limit);
            }

            this.db.all(sql, params, (err, rows) => {
                if (err) {
                    console.error('Error retrieving tasks:', err.message);
                    reject(err);
                    return;
                }

                resolve(rows || []);
            });
        });
    }

    /**
     * Update a task
     */
    async updateTask(taskId, updates) {
        return new Promise((resolve, reject) => {
            if (!this.isConnected) {
                reject(new Error('Database not connected'));
                return;
            }

            // Validate updates
            const validationErrors = this.validateTask(updates);
            if (validationErrors.length > 0) {
                reject(new Error(`Validation failed: ${validationErrors.join(', ')}`));
                return;
            }

            // Build dynamic update query
            const updateFields = [];
            const params = [];

            if (updates.title !== undefined) {
                updateFields.push('title = ?');
                params.push(updates.title.trim());
            }

            if (updates.description !== undefined) {
                updateFields.push('description = ?');
                params.push(updates.description);
            }

            if (updates.due_date !== undefined) {
                updateFields.push('due_date = ?');
                params.push(updates.due_date);
            }

            if (updates.priority !== undefined) {
                updateFields.push('priority = ?');
                params.push(updates.priority);
            }

            if (updates.status !== undefined) {
                updateFields.push('status = ?');
                params.push(updates.status);
            }

            if (updateFields.length === 0) {
                reject(new Error('No valid fields to update'));
                return;
            }

            // Add updated_at timestamp
            updateFields.push('updated_at = CURRENT_TIMESTAMP');
            params.push(taskId);

            const sql = `UPDATE tasks SET ${updateFields.join(', ')} WHERE task_id = ?`;

            this.db.run(sql, params, function(err) {
                if (err) {
                    console.error('Error updating task:', err.message);
                    reject(err);
                    return;
                }

                if (this.changes === 0) {
                    reject(new Error(`Task with ID ${taskId} not found`));
                    return;
                }

                console.log(`Task ${taskId} updated successfully`);
                resolve({ task_id: taskId, changes: this.changes });
            });
        });
    }

    /**
     * Delete a task
     */
    async deleteTask(taskId) {
        return new Promise((resolve, reject) => {
            if (!this.isConnected) {
                reject(new Error('Database not connected'));
                return;
            }

            const sql = 'DELETE FROM tasks WHERE task_id = ?';

            this.db.run(sql, [taskId], function(err) {
                if (err) {
                    console.error('Error deleting task:', err.message);
                    reject(err);
                    return;
                }

                if (this.changes === 0) {
                    reject(new Error(`Task with ID ${taskId} not found`));
                    return;
                }

                console.log(`Task ${taskId} deleted successfully`);
                resolve({ task_id: taskId, deleted: true });
            });
        });
    }

    /**
     * Get task statistics
     */
    async getTaskStats() {
        return new Promise((resolve, reject) => {
            if (!this.isConnected) {
                reject(new Error('Database not connected'));
                return;
            }

            const sql = `
                SELECT 
                    COUNT(*) as total_tasks,
                    SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_tasks,
                    SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_tasks,
                    SUM(CASE WHEN priority = 'high' THEN 1 ELSE 0 END) as high_priority_tasks,
                    SUM(CASE WHEN due_date = date('now') THEN 1 ELSE 0 END) as due_today
                FROM tasks
            `;

            this.db.get(sql, [], (err, row) => {
                if (err) {
                    console.error('Error retrieving task statistics:', err.message);
                    reject(err);
                    return;
                }

                resolve(row);
            });
        });
    }

    /**
     * Search tasks by title or description
     */
    async searchTasks(searchTerm) {
        return new Promise((resolve, reject) => {
            if (!this.isConnected) {
                reject(new Error('Database not connected'));
                return;
            }

            if (!searchTerm || searchTerm.trim().length === 0) {
                reject(new Error('Search term is required'));
                return;
            }

            const sql = `
                SELECT * FROM tasks 
                WHERE title LIKE ? OR description LIKE ?
                ORDER BY created_at DESC
            `;

            const searchPattern = `%${searchTerm.trim()}%`;

            this.db.all(sql, [searchPattern, searchPattern], (err, rows) => {
                if (err) {
                    console.error('Error searching tasks:', err.message);
                    reject(err);
                    return;
                }

                resolve(rows || []);
            });
        });
    }
}

module.exports = TaskDatabase;