const TaskDatabase = require('./database');

/**
 * Test suite for the TaskDatabase class
 * Run this file to test all database operations
 */

async function runTests() {
    const db = new TaskDatabase('./database/test.db'); // Use separate test database
    let testsPassed = 0;
    let testsTotal = 0;

    function assert(condition, message) {
        testsTotal++;
        if (condition) {
            console.log(`✅ ${message}`);
            testsPassed++;
        } else {
            console.log(`❌ ${message}`);
        }
    }

    try {
        console.log('🧪 Starting database tests...\n');

        // Test 1: Database connection
        console.log('Test 1: Database Connection');
        await db.connect();
        assert(db.isConnected, 'Database should be connected');
        console.log('');

        // Test 2: Create task with valid data
        console.log('Test 2: Create Task - Valid Data');
        const validTask = {
            title: 'Test Task',
            description: 'This is a test task',
            due_date: '2025-02-01',
            priority: 'high',
            status: 'pending'
        };
        const createdTask = await db.createTask(validTask);
        assert(createdTask.task_id > 0, 'Created task should have valid ID');
        assert(createdTask.title === validTask.title, 'Created task should have correct title');
        console.log('');

        // Test 3: Create task with minimal data
        console.log('Test 3: Create Task - Minimal Data');
        const minimalTask = { title: 'Minimal Task' };
        const createdMinimalTask = await db.createTask(minimalTask);
        assert(createdMinimalTask.task_id > 0, 'Minimal task should be created');
        assert(createdMinimalTask.priority === 'medium', 'Default priority should be medium');
        assert(createdMinimalTask.status === 'pending', 'Default status should be pending');
        console.log('');

        // Test 4: Validation - Empty title
        console.log('Test 4: Validation - Empty Title');
        try {
            await db.createTask({ title: '' });
            assert(false, 'Should reject empty title');
        } catch (error) {
            assert(error.message.includes('Title is required'), 'Should validate title requirement');
        }
        console.log('');

        // Test 5: Validation - Invalid priority
        console.log('Test 5: Validation - Invalid Priority');
        try {
            await db.createTask({ title: 'Test', priority: 'invalid' });
            assert(false, 'Should reject invalid priority');
        } catch (error) {
            assert(error.message.includes('Priority must be'), 'Should validate priority values');
        }
        console.log('');

        // Test 6: Get task by ID
        console.log('Test 6: Get Task by ID');
        const retrievedTask = await db.getTask(createdTask.task_id);
        assert(retrievedTask.task_id === createdTask.task_id, 'Retrieved task should have correct ID');
        assert(retrievedTask.title === createdTask.title, 'Retrieved task should have correct title');
        console.log('');

        // Test 7: Get non-existent task
        console.log('Test 7: Get Non-existent Task');
        try {
            await db.getTask(99999);
            assert(false, 'Should reject non-existent task ID');
        } catch (error) {
            assert(error.message.includes('not found'), 'Should handle non-existent task');
        }
        console.log('');

        // Test 8: Get all tasks
        console.log('Test 8: Get All Tasks');
        const allTasks = await db.getAllTasks();
        assert(Array.isArray(allTasks), 'Should return array of tasks');
        assert(allTasks.length >= 2, 'Should return at least 2 tasks');
        console.log('');

        // Test 9: Filter tasks by status
        console.log('Test 9: Filter Tasks by Status');
        const pendingTasks = await db.getAllTasks({ status: 'pending' });
        assert(Array.isArray(pendingTasks), 'Should return array of pending tasks');
        assert(pendingTasks.every(task => task.status === 'pending'), 'All tasks should be pending');
        console.log('');

        // Test 10: Update task
        console.log('Test 10: Update Task');
        const updateResult = await db.updateTask(createdTask.task_id, {
            title: 'Updated Test Task',
            status: 'completed'
        });
        assert(updateResult.changes === 1, 'Should update one task');
        
        const updatedTask = await db.getTask(createdTask.task_id);
        assert(updatedTask.title === 'Updated Test Task', 'Task title should be updated');
        assert(updatedTask.status === 'completed', 'Task status should be updated');
        console.log('');

        // Test 11: Update non-existent task
        console.log('Test 11: Update Non-existent Task');
        try {
            await db.updateTask(99999, { title: 'Updated' });
            assert(false, 'Should reject update of non-existent task');
        } catch (error) {
            assert(error.message.includes('not found'), 'Should handle non-existent task update');
        }
        console.log('');

        // Test 12: Search tasks
        console.log('Test 12: Search Tasks');
        const searchResults = await db.searchTasks('Test');
        assert(Array.isArray(searchResults), 'Should return array of search results');
        assert(searchResults.length > 0, 'Should find tasks containing "Test"');
        console.log('');

        // Test 13: Search with empty term
        console.log('Test 13: Search with Empty Term');
        try {
            await db.searchTasks('');
            assert(false, 'Should reject empty search term');
        } catch (error) {
            assert(error.message.includes('Search term is required'), 'Should validate search term');
        }
        console.log('');

        // Test 14: Get task statistics
        console.log('Test 14: Get Task Statistics');
        const stats = await db.getTaskStats();
        assert(typeof stats.total_tasks === 'number', 'Should return total tasks count');
        assert(typeof stats.pending_tasks === 'number', 'Should return pending tasks count');
        assert(typeof stats.completed_tasks === 'number', 'Should return completed tasks count');
        console.log('');

        // Test 15: Delete task
        console.log('Test 15: Delete Task');
        const deleteResult = await db.deleteTask(createdMinimalTask.task_id);
        assert(deleteResult.deleted === true, 'Should confirm task deletion');
        
        try {
            await db.getTask(createdMinimalTask.task_id);
            assert(false, 'Deleted task should not be found');
        } catch (error) {
            assert(error.message.includes('not found'), 'Deleted task should not exist');
        }
        console.log('');

        // Test 16: Delete non-existent task
        console.log('Test 16: Delete Non-existent Task');
        try {
            await db.deleteTask(99999);
            assert(false, 'Should reject deletion of non-existent task');
        } catch (error) {
            assert(error.message.includes('not found'), 'Should handle non-existent task deletion');
        }
        console.log('');

    } catch (error) {
        console.error('Unexpected error during tests:', error.message);
    } finally {
        // Clean up
        await db.close();
        
        // Remove test database file
        const fs = require('fs');
        try {
            fs.unlinkSync('./database/test.db');
            console.log('Test database cleaned up');
        } catch (error) {
            // Ignore cleanup errors
        }
    }

    // Test summary
    console.log('\n📊 Test Results:');
    console.log(`✅ Passed: ${testsPassed}`);
    console.log(`❌ Failed: ${testsTotal - testsPassed}`);
    console.log(`📈 Success Rate: ${Math.round((testsPassed / testsTotal) * 100)}%`);
    
    if (testsPassed === testsTotal) {
        console.log('🎉 All tests passed!');
    } else {
        console.log('⚠️  Some tests failed. Please review the implementation.');
    }
}

// Run tests if this file is executed directly
if (require.main === module) {
    runTests();
}

module.exports = { runTests };