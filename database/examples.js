const TaskDatabase = require('./database');

/**
 * Example usage of the TaskDatabase class
 * This file demonstrates all the available operations
 */

async function runExamples() {
    const db = new TaskDatabase();

    try {
        // Connect to database
        console.log('🔌 Connecting to database...');
        await db.connect();

        // Example 1: Create new tasks
        console.log('\n📝 Creating new tasks...');
        
        const task1 = await db.createTask({
            title: 'Complete project documentation',
            description: 'Write comprehensive documentation for the new feature',
            due_date: '2025-02-15',
            priority: 'high',
            status: 'pending'
        });
        console.log('Created task 1:', task1);

        const task2 = await db.createTask({
            title: 'Review code changes',
            description: 'Review pull requests from team members',
            due_date: '2025-01-20',
            priority: 'medium',
            status: 'pending'
        });
        console.log('Created task 2:', task2);

        const task3 = await db.createTask({
            title: 'Update dependencies',
            description: 'Update all npm packages to latest versions',
            due_date: '2025-01-25',
            priority: 'low',
            status: 'completed'
        });
        console.log('Created task 3:', task3);

        // Example 2: Get a specific task
        console.log('\n🔍 Retrieving specific task...');
        const retrievedTask = await db.getTask(task1.task_id);
        console.log('Retrieved task:', retrievedTask);

        // Example 3: Get all tasks
        console.log('\n📋 Getting all tasks...');
        const allTasks = await db.getAllTasks();
        console.log('All tasks:', allTasks);

        // Example 4: Filter tasks by status
        console.log('\n🔽 Filtering tasks by status (pending)...');
        const pendingTasks = await db.getAllTasks({ status: 'pending' });
        console.log('Pending tasks:', pendingTasks);

        // Example 5: Filter tasks by priority
        console.log('\n🔥 Filtering tasks by priority (high)...');
        const highPriorityTasks = await db.getAllTasks({ priority: 'high' });
        console.log('High priority tasks:', highPriorityTasks);

        // Example 6: Filter tasks by date range
        console.log('\n📅 Filtering tasks by date range...');
        const tasksInRange = await db.getAllTasks({
            due_date_from: '2025-01-15',
            due_date_to: '2025-01-31'
        });
        console.log('Tasks due in January 2025:', tasksInRange);

        // Example 7: Update a task
        console.log('\n✏️ Updating a task...');
        const updateResult = await db.updateTask(task2.task_id, {
            status: 'completed',
            description: 'Code review completed successfully'
        });
        console.log('Update result:', updateResult);

        // Example 8: Search tasks
        console.log('\n🔍 Searching tasks...');
        const searchResults = await db.searchTasks('documentation');
        console.log('Search results for "documentation":', searchResults);

        // Example 9: Get task statistics
        console.log('\n📊 Getting task statistics...');
        const stats = await db.getTaskStats();
        console.log('Task statistics:', stats);

        // Example 10: Error handling - try to get non-existent task
        console.log('\n❌ Testing error handling...');
        try {
            await db.getTask(999);
        } catch (error) {
            console.log('Expected error for non-existent task:', error.message);
        }

        // Example 11: Validation error
        try {
            await db.createTask({
                title: '', // Empty title should fail validation
                priority: 'invalid' // Invalid priority should fail validation
            });
        } catch (error) {
            console.log('Expected validation error:', error.message);
        }

        // Example 12: Delete a task
        console.log('\n🗑️ Deleting a task...');
        const deleteResult = await db.deleteTask(task3.task_id);
        console.log('Delete result:', deleteResult);

        // Verify deletion
        const remainingTasks = await db.getAllTasks();
        console.log('Remaining tasks after deletion:', remainingTasks.length);

    } catch (error) {
        console.error('Error in examples:', error.message);
    } finally {
        // Always close the database connection
        await db.close();
        console.log('\n✅ Examples completed and database connection closed');
    }
}

// Run examples if this file is executed directly
if (require.main === module) {
    runExamples();
}

module.exports = { runExamples };