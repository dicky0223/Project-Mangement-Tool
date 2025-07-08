# SQLite Task Management Database

A robust SQLite database implementation for task management with full CRUD operations, data validation, and error handling.

## Features

- ✅ **Complete CRUD Operations**: Create, Read, Update, Delete tasks
- 🔍 **Advanced Filtering**: Filter by status, priority, due date
- 🔎 **Full-Text Search**: Search tasks by title and description
- ✨ **Data Validation**: Comprehensive input validation and error handling
- 📊 **Statistics**: Get task statistics and analytics
- 🔄 **Auto-timestamps**: Automatic created_at and updated_at tracking
- 🛡️ **Error Handling**: Robust error handling for all operations
- 🔗 **Integration Ready**: Easy integration with existing applications

## Database Schema

```sql
CREATE TABLE tasks (
    task_id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT,
    due_date DATE,
    priority TEXT CHECK(priority IN ('high', 'medium', 'low')) DEFAULT 'medium',
    status TEXT CHECK(status IN ('pending', 'completed')) DEFAULT 'pending',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

## Installation

1. Install the required dependency:
```bash
npm install sqlite3
```

2. The database will be automatically created when you first connect.

## Quick Start

```javascript
const TaskDatabase = require('./database/database');

async function example() {
    const db = new TaskDatabase();
    
    // Connect to database
    await db.connect();
    
    // Create a new task
    const task = await db.createTask({
        title: 'Complete project documentation',
        description: 'Write comprehensive docs',
        due_date: '2025-02-15',
        priority: 'high',
        status: 'pending'
    });
    
    // Get all tasks
    const allTasks = await db.getAllTasks();
    
    // Filter tasks
    const highPriorityTasks = await db.getAllTasks({ priority: 'high' });
    
    // Update a task
    await db.updateTask(task.task_id, { status: 'completed' });
    
    // Search tasks
    const searchResults = await db.searchTasks('documentation');
    
    // Get statistics
    const stats = await db.getTaskStats();
    
    // Close connection
    await db.close();
}
```

## API Reference

### Constructor

```javascript
const db = new TaskDatabase(dbPath = './database/tasks.db');
```

### Connection Methods

#### `connect()`
Establishes database connection and initializes schema.

```javascript
await db.connect();
```

#### `close()`
Closes the database connection.

```javascript
await db.close();
```

### CRUD Operations

#### `createTask(task)`
Creates a new task.

**Parameters:**
- `task` (Object): Task data
  - `title` (string, required): Task title
  - `description` (string, optional): Task description
  - `due_date` (string, optional): Due date in YYYY-MM-DD format
  - `priority` (string, optional): 'high', 'medium', or 'low' (default: 'medium')
  - `status` (string, optional): 'pending' or 'completed' (default: 'pending')

**Returns:** Created task object with generated `task_id`

```javascript
const task = await db.createTask({
    title: 'Review code',
    description: 'Review pull request #123',
    due_date: '2025-01-20',
    priority: 'high',
    status: 'pending'
});
```

#### `getTask(taskId)`
Retrieves a single task by ID.

**Parameters:**
- `taskId` (number): Task ID

**Returns:** Task object

```javascript
const task = await db.getTask(1);
```

#### `getAllTasks(filters)`
Retrieves all tasks with optional filtering.

**Parameters:**
- `filters` (Object, optional): Filter criteria
  - `status` (string): Filter by status
  - `priority` (string): Filter by priority
  - `due_date_from` (string): Filter by due date from
  - `due_date_to` (string): Filter by due date to
  - `limit` (number): Limit number of results

**Returns:** Array of task objects

```javascript
// Get all tasks
const allTasks = await db.getAllTasks();

// Get pending tasks
const pendingTasks = await db.getAllTasks({ status: 'pending' });

// Get high priority tasks
const highPriorityTasks = await db.getAllTasks({ priority: 'high' });

// Get tasks due in January 2025
const januaryTasks = await db.getAllTasks({
    due_date_from: '2025-01-01',
    due_date_to: '2025-01-31'
});
```

#### `updateTask(taskId, updates)`
Updates an existing task.

**Parameters:**
- `taskId` (number): Task ID
- `updates` (Object): Fields to update

**Returns:** Update result object

```javascript
await db.updateTask(1, {
    status: 'completed',
    description: 'Updated description'
});
```

#### `deleteTask(taskId)`
Deletes a task.

**Parameters:**
- `taskId` (number): Task ID

**Returns:** Deletion result object

```javascript
await db.deleteTask(1);
```

### Search and Analytics

#### `searchTasks(searchTerm)`
Searches tasks by title or description.

**Parameters:**
- `searchTerm` (string): Search term

**Returns:** Array of matching task objects

```javascript
const results = await db.searchTasks('documentation');
```

#### `getTaskStats()`
Gets task statistics.

**Returns:** Statistics object with counts

```javascript
const stats = await db.getTaskStats();
// Returns: { total_tasks, pending_tasks, completed_tasks, high_priority_tasks, due_today }
```

## Data Validation

The database performs comprehensive validation:

- **Title**: Required, non-empty, max 255 characters
- **Priority**: Must be 'high', 'medium', or 'low'
- **Status**: Must be 'pending' or 'completed'
- **Due Date**: Must be valid date format

## Error Handling

All methods include proper error handling:

```javascript
try {
    const task = await db.createTask({ title: '' }); // Invalid
} catch (error) {
    console.error('Validation failed:', error.message);
}

try {
    const task = await db.getTask(999); // Non-existent
} catch (error) {
    console.error('Task not found:', error.message);
}
```

## Integration with ProjectFlow

Use the `ProjectFlowIntegration` class to sync with your existing application:

```javascript
const ProjectFlowIntegration = require('./database/integration');

const integration = new ProjectFlowIntegration();
await integration.initialize();

// Sync from localStorage to database
await integration.syncFromLocalStorage();

// Create task in both database and localStorage
const task = await integration.createTask({
    title: 'New task',
    priority: 'high'
});
```

## Testing

Run the test suite to verify functionality:

```bash
node database/test.js
```

## Examples

See comprehensive examples in:
- `database/examples.js` - Basic usage examples
- `database/test.js` - Test suite with all operations
- `database/integration.js` - ProjectFlow integration

## File Structure

```
database/
├── database.js      # Main database class
├── schema.sql       # Database schema
├── integration.js   # ProjectFlow integration
├── examples.js      # Usage examples
├── test.js         # Test suite
├── README.md       # This file
└── tasks.db        # SQLite database file (created automatically)
```

## Performance

The database includes optimized indexes for common queries:
- Status index for filtering by task status
- Priority index for filtering by priority
- Due date index for date-based queries
- Created date index for chronological sorting

## Data Persistence

All data is automatically persisted to the SQLite database file. The database will be created automatically on first connection and will persist between application sessions.

## License

This implementation is part of the ProjectFlow application. See the main project license for details.