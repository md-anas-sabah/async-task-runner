# async-task-runner | Node.js Async Task Runner with Concurrency Control

[![npm version](https://badge.fury.io/js/%40md-anas-sabah%2Fasync-task-runner.svg)](https://badge.fury.io/js/%40md-anas-sabah%2Fasync-task-runner)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node.js CI](https://github.com/md-anas-sabah/async-task-runner/workflows/Node.js%20CI/badge.svg)](https://github.com/md-anas-sabah/async-task-runner/actions)
[![Downloads](https://img.shields.io/npm/dm/@md-anas-sabah/async-task-runner.svg)](https://www.npmjs.com/package/@md-anas-sabah/async-task-runner)

**The most powerful async task runner for Node.js** - Execute thousands of async tasks with intelligent concurrency control, automatic retries, exponential backoff, timeouts, and comprehensive reporting. Battle-tested for web scraping, API processing, file operations, data migration, ETL pipelines, and any bulk async operations.

> 🚀 **Perfect for**: Web scraping bots, API batch processing, file transformations, data migrations, parallel downloads, bulk operations, and high-performance async workflows.

## ✨ Features

- 🚀 **Concurrency Control**: Limit the number of tasks running simultaneously
- 🔄 **Smart Retry Logic**: Configurable retries with exponential backoff
- ⏰ **Timeout Support**: Automatic task cancellation with AbortController
- 📊 **Comprehensive Reporting**: Detailed execution summaries and error analysis
- 🔧 **TypeScript Ready**: Full TypeScript support with detailed type definitions
- 🎯 **Production Ready**: Battle-tested with extensive error handling
- 🪶 **Lightweight**: Zero dependencies, minimal footprint

## 📦 Installation

Install the most popular async task runner for Node.js:

```bash
npm install @md-anas-sabah/async-task-runner
```

```bash
yarn add @md-anas-sabah/async-task-runner
```

```bash
pnpm add @md-anas-sabah/async-task-runner
```

## 🚀 Quick Start

```typescript
import { runTasks } from '@md-anas-sabah/async-task-runner';

// Define your async tasks
const tasks = [
  () => fetch('https://api.example.com/data/1').then(r => r.json()),
  () => fetch('https://api.example.com/data/2').then(r => r.json()),
  () => fetch('https://api.example.com/data/3').then(r => r.json()),
];

// Run with concurrency control
const results = await runTasks(tasks, { 
  concurrency: 2,
  retries: 3,
  timeout: 5000 
});

console.log(results);
// [
//   { success: true, result: {...}, duration: 245.67, attempts: 1 },
//   { success: false, error: 'Request timeout', attempts: 4 },
//   { success: true, result: {...}, duration: 189.23, attempts: 2 }
// ]
```

## 📚 Usage Examples

### Basic Usage

```typescript
import { runTasks } from '@md-anas-sabah/async-task-runner';

const tasks = [
  () => new Promise(resolve => setTimeout(() => resolve('Task 1'), 1000)),
  () => new Promise(resolve => setTimeout(() => resolve('Task 2'), 500)),
  () => new Promise(resolve => setTimeout(() => resolve('Task 3'), 800)),
];

const results = await runTasks(tasks, { concurrency: 2 });
```

### With Retry Logic and Logging

```typescript
import { runTasksWithLogging } from '@md-anas-sabah/async-task-runner';

const results = await runTasksWithLogging(unreliableTasks, {
  concurrency: 3,
  retries: 3,
  retryDelay: 1000,
  exponentialBackoff: true,
  maxRetryDelay: 10000
});
```

### With Comprehensive Reporting

```typescript
import { runTasksWithSummary, formatSummary } from '@md-anas-sabah/async-task-runner';

const summary = await runTasksWithSummary(tasks, {
  concurrency: 5,
  retries: 2,
  timeout: 3000
});

console.log(formatSummary(summary));
// 📊 Task Execution Summary
// ✅ Successful: 8
// ❌ Failed: 2
// ⏰ Timed out: 1
// 🔄 Total retries: 4
// ...
```

### Advanced Configuration

```typescript
import { TaskRunner, DefaultLogger } from '@md-anas-sabah/async-task-runner';

// Custom logger
const logger = new DefaultLogger(true);

// Advanced configuration
const runner = new TaskRunner({
  concurrency: 5,
  retries: 3,
  retryDelay: 1000,
  exponentialBackoff: true,
  maxRetryDelay: 30000,
  timeout: 10000
}, logger);

const results = await runner.run(tasks);
```

## 🌐 Real-World Examples

### Web Scraping

```typescript
import { runTasksWithSummary } from 'async-task-runner';
import axios from 'axios';
import * as cheerio from 'cheerio';

// Scrape product data from multiple pages
const scrapeProduct = (url) => async () => {
  const response = await axios.get(url);
  const $ = cheerio.load(response.data);
  
  return {
    url,
    title: $('h1').text().trim(),
    price: $('.price').text().trim(),
    description: $('.description').text().trim()
  };
};

const productUrls = [
  'https://example.com/product/1',
  'https://example.com/product/2',
  // ... more URLs
];

const tasks = productUrls.map(scrapeProduct);

const summary = await runTasksWithSummary(tasks, {
  concurrency: 3,        // Don't overwhelm the server
  retries: 2,           // Retry failed requests
  timeout: 10000,       // 10 second timeout
  retryDelay: 2000,     // Wait 2s between retries
  exponentialBackoff: true
});

console.log(`Scraped ${summary.successCount} products successfully`);
```

### File Processing

```typescript
import { runTasks } from '@md-anas-sabah/async-task-runner';
import fs from 'fs/promises';
import path from 'path';

// Process multiple files concurrently
const processFile = (filePath) => async () => {
  const content = await fs.readFile(filePath, 'utf-8');
  
  // Process the file (e.g., transform, analyze, etc.)
  const processed = content
    .split('\\n')
    .filter(line => line.trim())
    .map(line => line.toUpperCase())
    .join('\\n');
  
  const outputPath = path.join('processed', path.basename(filePath));
  await fs.writeFile(outputPath, processed);
  
  return { input: filePath, output: outputPath, lines: processed.split('\\n').length };
};

const files = await fs.readdir('input-directory');
const tasks = files
  .filter(file => file.endsWith('.txt'))
  .map(file => processFile(path.join('input-directory', file)));

const results = await runTasks(tasks, {
  concurrency: 4,       // Process 4 files at once
  timeout: 30000        // 30 second timeout per file
});

console.log(`Processed ${results.filter(r => r.success).length} files`);
```

### API Batch Processing

```typescript
import { runTasksWithLogging } from '@md-anas-sabah/async-task-runner';

// Process user data through multiple API endpoints
const processUser = (user) => async () => {
  // Enrich user data from multiple sources
  const [profile, preferences, activity] = await Promise.all([
    fetch(`/api/users/${user.id}/profile`).then(r => r.json()),
    fetch(`/api/users/${user.id}/preferences`).then(r => r.json()),
    fetch(`/api/users/${user.id}/activity`).then(r => r.json())
  ]);
  
  return {
    ...user,
    profile,
    preferences,
    activityScore: activity.score
  };
};

const users = await fetch('/api/users').then(r => r.json());
const tasks = users.map(processUser);

const results = await runTasksWithLogging(tasks, {
  concurrency: 10,      // 10 concurrent API calls
  retries: 3,           // Retry failed calls
  timeout: 5000,        // 5 second timeout
  retryDelay: 1000,
  exponentialBackoff: true
});

console.log(`Processed ${results.filter(r => r.success).length}/${users.length} users`);
```

## 🔧 API Reference

### Functions

#### `runTasks(tasks, options?)`

Executes tasks with the specified configuration.

**Parameters:**
- `tasks: (() => Promise<any>)[]` - Array of async task functions
- `options?: TaskOptions` - Configuration options

**Returns:** `Promise<TaskResult[]>`

#### `runTasksWithLogging(tasks, options?)`

Same as `runTasks` but with verbose logging enabled.

#### `runTasksWithSummary(tasks, options?)`

Executes tasks and returns a comprehensive execution summary.

**Returns:** `Promise<TaskExecutionSummary>`

#### `formatSummary(summary)`

Formats a task execution summary into a human-readable string.

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `concurrency` | `number` | `3` | Maximum number of concurrent tasks |
| `retries` | `number` | `0` | Number of retry attempts for failed tasks |
| `retryDelay` | `number` | `1000` | Base delay between retries (milliseconds) |
| `exponentialBackoff` | `boolean` | `false` | Enable exponential backoff for retries |
| `maxRetryDelay` | `number` | `30000` | Maximum retry delay (milliseconds) |
| `timeout` | `number` | `undefined` | Maximum task duration (milliseconds) |

### Types

#### `TaskResult`

```typescript
interface TaskResult {
  success: boolean;
  result?: any;
  error?: string;
  taskIndex: number;
  attempts: number;
  duration: number;
  timedOut?: boolean;
  retryHistory?: Array<{
    attempt: number;
    error: string;
    delay: number;
    duration: number;
    timedOut?: boolean;
  }>;
}
```

#### `TaskExecutionSummary`

```typescript
interface TaskExecutionSummary {
  results: TaskResult[];
  successCount: number;
  failureCount: number;
  timeoutCount: number;
  totalRetries: number;
  performance: {
    totalDuration: number;
    averageDuration: number;
    executionTime: number;
    startTime: Date;
    endTime: Date;
  };
  errorBreakdown: Array<{
    error: string;
    count: number;
    tasks: number[];
    firstOccurrence: Date;
    lastOccurrence?: Date;
  }>;
  successRate: number;
}
```

## 🎯 Use Cases

### Perfect For:

- **Web Scraping**: Scrape multiple pages with rate limiting and retry logic
- **API Processing**: Batch process API calls with intelligent retry strategies
- **File Operations**: Process multiple files concurrently with progress tracking
- **Data Migration**: Migrate data between systems with error handling
- **Bulk Operations**: Any scenario requiring controlled parallel execution
- **ETL Pipelines**: Extract, transform, and load operations with monitoring

### Benefits:

- **Performance**: Optimal resource utilization with concurrency control
- **Reliability**: Automatic retries with exponential backoff
- **Observability**: Comprehensive logging and execution summaries
- **Developer Experience**: TypeScript support and intuitive API
- **Production Ready**: Battle-tested error handling and timeout management

## 🛠️ Development

```bash
# Clone the repository
git clone https://github.com/md-anas-sabah/async-task-runner.git

# Install dependencies
npm install

# Build the project
npm run build

# Run tests
npm test

# Run example tests
npm run test-package
npm run test-retry
npm run test-timeout
npm run test-summary
```

## 📝 License

MIT © [Md Anas Sabah](https://github.com/md-anas-sabah)

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📊 Examples Directory

Check out the `/examples` directory for more detailed use cases:

- `web-scraping.js` - Complete web scraping example
- `file-processing.js` - Batch file processing example
- `api-integration.js` - API batch processing example
- `real-world-scenarios.js` - Multiple production-ready examples

## 🔗 Related Projects

- [p-limit](https://github.com/sindresorhus/p-limit) - Simple concurrency limiting
- [p-retry](https://github.com/sindresorhus/p-retry) - Retry pattern implementation
- [p-timeout](https://github.com/sindresorhus/p-timeout) - Timeout utility

## ⭐ Support

If you find this package useful, please consider giving it a star on [GitHub](https://github.com/md-anas-sabah/async-task-runner)!