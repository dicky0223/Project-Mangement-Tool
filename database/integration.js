const TaskDatabase = require('./database');

/**
 * Integration layer to connect SQLite database with the existing ProjectFlow application
 * This module provides methods to sync data between localStorage and SQLite
 */

class ProjectFlowIntegration {
    constructor() {
        this.db = new TaskDatabase();
        this.isInitialized = false;
    }

    /**
     * Initialize the database connection
     */
    async initialize() {
        try {
            await this.db.connect();
            this.isInitialized = true;
            console.log('ProjectFlow database integration initialized');
        } catch (error) {
            console.error('Failed to initialize database:', error.message);
            throw error;
        }
    }

    /**
     * Convert ProjectFlow task format to database format
     */
    convertToDbFormat(projectFlowTask) {
        return {
            title: projectFlowTask.title,
            description: projectFlowTask.description || '',
            due_date: projectFlowTask.dueDate || null,
            priority: projectFlowTask.priority || 'medium',
            status: projectFlowTask.status === 'completed' ? 'completed' : 'pending'
        };
    }

    /**
     * Convert database task format to ProjectFlow format
     */
    convertToProjectFlowFormat(dbTask) {
        return {
            id: `task-${dbTask.task_id}`,
            title: dbTask.title,
            description: dbTask.description || '',
            projectId: 'default-project', // You may want to add project mapping
            priority: dbTask.priority,
            status: dbTask.status === 'completed' ? 'completed' : 
                   dbTask.status === 'pending' ? 'todo' : 'in-progress',
            dueDate: dbTask.due_date,
            createdDate: dbTask.created_at ? dbTask.created_at.split('T')[0] : new Date().toISOString().split('T')[0]
        };
    }

    /**
     * Sync tasks from localStorage to SQLite database
     */
    async syncFromLocalStorage() {
        if (!this.isInitialized) {
            throw new Error('Database not initialized');
        }

        try {
            // Get tasks from localStorage (simulating the ProjectFlow data)
            const localStorageTasks = localStorage.getItem('projectflow_tasks');
            if (!localStorageTasks) {
                console.log('No tasks found in localStorage');
                return;
            }

            const tasks = JSON.parse(localStorageTasks);
            console.log(`Syncing ${tasks.length} tasks from localStorage to database`);

            for (const task of tasks) {
                try {
                    const dbTask = this.convertToDbFormat(task);
                    await this.db.createTask(dbTask);
                    console.log(`Synced task: ${task.title}`);
                } catch (error) {
                    console.error(`Failed to sync task ${task.title}:`, error.message);
                }
            }

            console.log('Sync from localStorage completed');
        } catch (error) {
            console.error('Error syncing from localStorage:', error.message);
            throw error;
        }
    }

    /**
     * Sync tasks from SQLite database to localStorage
     */
    async syncToLocalStorage() {
        if (!this.isInitialized) {
            throw new Error('Database not initialized');
        }

        try {
            const dbTasks = await this.db.getAllTasks();
            const projectFlowTasks = dbTasks.map(task => this.convertToProjectFlowFormat(task));

            // Update localStorage
            localStorage.setItem('projectflow_tasks', JSON.stringify(projectFlowTasks));
            console.log(`Synced ${projectFlowTasks.length} tasks to localStorage`);

            return projectFlowTasks;
        } catch (error) {
            console.error('Error syncing to localStorage:', error.message);
            throw error;
        }
    }

    /**
     * Create a new task in both database and localStorage
     */
    async createTask(taskData) {
        if (!this.isInitialized) {
            throw new Error('Database not initialized');
        }

        try {
            // Create in database
            const dbTask = this.convertToDbFormat(taskData);
            const createdTask = await this.db.createTask(dbTask);

            // Sync to localStorage
            await this.syncToLocalStorage();

            return this.convertToProjectFlowFormat(createdTask);
        } catch (error) {
            console.error('Error creating task:', error.message);
            throw error;
        }
    }

    /**
     * Update a task in both database and localStorage
     */
    async updateTask(taskId, updates) {
        if (!this.isInitialized) {
            throw new Error('Database not initialized');
        }

        try {
            // Extract numeric ID from ProjectFlow format
            const numericId = parseInt(taskId.replace('task-', ''));
            
            // Update in database
            const dbUpdates = this.convertToDbFormat(updates);
            await this.db.updateTask(numericId, dbUpdates);

            // Sync to localStorage
            await this.syncToLocalStorage();

            return { success: true, taskId };
        } catch (error) {
            console.error('Error updating task:', error.message);
            throw error;
        }
    }

    /**
     * Delete a task from both database and localStorage
     */
    async deleteTask(taskId) {
        if (!this.isInitialized) {
            throw new Error('Database not initialized');
        }

        try {
            // Extract numeric ID from ProjectFlow format
            const numericId = parseInt(taskId.replace('task-', ''));
            
            // Delete from database
            await this.db.deleteTask(numericId);

            // Sync to localStorage
            await this.syncToLocalStorage();

            return { success: true, taskId };
        } catch (error) {
            console.error('Error deleting task:', error.message);
            throw error;
        }
    }

    /**
     * Get all tasks with optional filtering
     */
    async getTasks(filters = {}) {
        if (!this.isInitialized) {
            throw new Error('Database not initialized');
        }

        try {
            const dbTasks = await this.db.getAllTasks(filters);
            return dbTasks.map(task => this.convertToProjectFlowFormat(task));
        } catch (error) {
            console.error('Error getting tasks:', error.message);
            throw error;
        }
    }

    /**
     * Search tasks
     */
    async searchTasks(searchTerm) {
        if (!this.isInitialized) {
            throw new Error('Database not initialized');
        }

        try {
            const dbTasks = await this.db.searchTasks(searchTerm);
            return dbTasks.map(task => this.convertToProjectFlowFormat(task));
        } catch (error) {
            console.error('Error searching tasks:', error.message);
            throw error;
        }
    }

    /**
     * Get task statistics
     */
    async getTaskStats() {
        if (!this.isInitialized) {
            throw new Error('Database not initialized');
        }

        try {
            return await this.db.getTaskStats();
        } catch (error) {
            console.error('Error getting task statistics:', error.message);
            throw error;
        }
    }

    /**
     * Close database connection
     */
    async close() {
        if (this.db) {
            await this.db.close();
            this.isInitialized = false;
        }
    }
}

module.exports = ProjectFlowIntegration;