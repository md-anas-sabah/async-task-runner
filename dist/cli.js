#!/usr/bin/env node
import { Command } from 'commander';
import fs from 'fs/promises';
import { runTasksWithSummary, formatSummary } from './index.js';
const program = new Command();
function createTaskFromDefinition(taskDef) {
    return async () => {
        if (taskDef.url) {
            const method = taskDef.method || 'GET';
            const headers = taskDef.headers || {};
            const fetchOptions = {
                method,
                headers: {
                    'User-Agent': 'async-task-runner CLI',
                    ...headers
                }
            };
            if (taskDef.body && method !== 'GET') {
                fetchOptions.body = typeof taskDef.body === 'string' ? taskDef.body : JSON.stringify(taskDef.body);
                if (!headers['Content-Type']) {
                    fetchOptions.headers = {
                        ...fetchOptions.headers,
                        'Content-Type': 'application/json'
                    };
                }
            }
            const response = await fetch(taskDef.url, fetchOptions);
            const data = await response.text();
            return {
                id: taskDef.id || taskDef.url,
                name: taskDef.name || `${method} ${taskDef.url}`,
                status: response.status,
                statusText: response.statusText,
                data: data.length > 1000 ? data.substring(0, 1000) + '...' : data,
                headers: Object.fromEntries(response.headers.entries())
            };
        }
        if (taskDef.command) {
            const { exec } = await import('child_process');
            const { promisify } = await import('util');
            const execAsync = promisify(exec);
            try {
                const { stdout, stderr } = await execAsync(taskDef.command);
                return {
                    id: taskDef.id || taskDef.command,
                    name: taskDef.name || taskDef.command,
                    command: taskDef.command,
                    exitCode: 0,
                    stdout,
                    stderr
                };
            }
            catch (error) {
                return {
                    id: taskDef.id || taskDef.command,
                    name: taskDef.name || taskDef.command,
                    command: taskDef.command,
                    exitCode: error.code || 1,
                    stdout: error.stdout || '',
                    stderr: error.stderr || error.message
                };
            }
        }
        if (taskDef.script) {
            const scriptFunction = new Function('data', taskDef.script);
            const result = await scriptFunction(taskDef.data);
            return {
                id: taskDef.id || 'script',
                name: taskDef.name || 'Script execution',
                result
            };
        }
        if (taskDef.data) {
            return {
                id: taskDef.id || 'data-task',
                name: taskDef.name || 'Data processing',
                data: taskDef.data,
                processed: true,
                timestamp: new Date().toISOString()
            };
        }
        throw new Error('Invalid task definition: must specify url, command, script, or data');
    };
}
async function loadTasksFromFile(filePath) {
    try {
        const content = await fs.readFile(filePath, 'utf-8');
        const config = JSON.parse(content);
        if (!config.tasks || !Array.isArray(config.tasks)) {
            throw new Error('Invalid config file: must contain a "tasks" array');
        }
        return config;
    }
    catch (error) {
        if (error instanceof Error) {
            throw new Error(`Failed to load tasks from ${filePath}: ${error.message}`);
        }
        throw error;
    }
}
async function runTasksFromCLI(config, cliOptions) {
    const options = {
        concurrency: cliOptions.concurrency ?? config.options?.concurrency ?? 3,
        retries: cliOptions.retries ?? config.options?.retries ?? 0,
        retryDelay: cliOptions.retryDelay ?? config.options?.retryDelay ?? 1000,
        exponentialBackoff: cliOptions.exponentialBackoff ?? config.options?.exponentialBackoff ?? false,
        maxRetryDelay: cliOptions.maxRetryDelay ?? config.options?.maxRetryDelay ?? 30000,
        timeout: cliOptions.timeout ?? config.options?.timeout
    };
    console.log('🚀 Starting async-task-runner CLI');
    console.log(`📋 Running ${config.tasks.length} tasks with configuration:`);
    console.log(`   • Concurrency: ${options.concurrency}`);
    console.log(`   • Retries: ${options.retries}`);
    console.log(`   • Retry delay: ${options.retryDelay}ms`);
    console.log(`   • Exponential backoff: ${options.exponentialBackoff}`);
    if (options.timeout)
        console.log(`   • Timeout: ${options.timeout}ms`);
    console.log('');
    const tasks = config.tasks.map(createTaskFromDefinition);
    const startTime = Date.now();
    const summary = await runTasksWithSummary(tasks, options);
    const endTime = Date.now();
    console.log('📊 Execution Results:');
    console.log('='.repeat(50));
    if (cliOptions.verbose) {
        const successfulResults = summary.results.filter(r => r.success);
        if (successfulResults.length > 0) {
            console.log(`\\n✅ Successful tasks (${successfulResults.length}):`);
            successfulResults.forEach((result, index) => {
                const taskResult = result.result;
                console.log(`   ${index + 1}. ${taskResult.name || taskResult.id || 'Task'}`);
                console.log(`      Duration: ${(result.duration || 0).toFixed(0)}ms`);
                if (taskResult.status)
                    console.log(`      Status: ${taskResult.status} ${taskResult.statusText}`);
                if (taskResult.exitCode !== undefined)
                    console.log(`      Exit code: ${taskResult.exitCode}`);
            });
        }
        const failedResults = summary.results.filter(r => !r.success);
        if (failedResults.length > 0) {
            console.log(`\\n❌ Failed tasks (${failedResults.length}):`);
            failedResults.forEach((result, index) => {
                console.log(`   ${index + 1}. Error: ${result.error}`);
                console.log(`      Attempts: ${result.attempts}`);
            });
        }
    }
    console.log('\\n' + formatSummary(summary));
    console.log(`\\n⏱️  Total execution time: ${endTime - startTime}ms`);
    const hasFailures = summary.results.some(r => !r.success);
    process.exit(hasFailures && !cliOptions.ignoreFailures ? 1 : 0);
}
program
    .name('async-task-runner')
    .description('Run async tasks with concurrency control, retries, and timeouts')
    .version('1.0.0');
program
    .command('run')
    .description('Run tasks from a configuration file or inline JSON')
    .option('-f, --file <path>', 'Path to JSON configuration file')
    .option('-j, --json <json>', 'Inline JSON task configuration')
    .option('-c, --concurrency <number>', 'Maximum concurrent tasks', (val) => parseInt(val))
    .option('-r, --retries <number>', 'Number of retry attempts', (val) => parseInt(val))
    .option('-d, --retry-delay <ms>', 'Base retry delay in milliseconds', (val) => parseInt(val))
    .option('-e, --exponential-backoff', 'Enable exponential backoff for retries')
    .option('-m, --max-retry-delay <ms>', 'Maximum retry delay in milliseconds', (val) => parseInt(val))
    .option('-t, --timeout <ms>', 'Task timeout in milliseconds', (val) => parseInt(val))
    .option('-v, --verbose', 'Show detailed task results')
    .option('--ignore-failures', 'Exit with code 0 even if some tasks fail')
    .action(async (options) => {
    try {
        let config;
        if (options.file) {
            config = await loadTasksFromFile(options.file);
        }
        else if (options.json) {
            config = JSON.parse(options.json);
        }
        else {
            console.error('❌ Error: Must specify either --file or --json option');
            process.exit(1);
        }
        await runTasksFromCLI(config, options);
    }
    catch (error) {
        console.error('❌ Error:', error instanceof Error ? error.message : error);
        process.exit(1);
    }
});
program
    .command('validate')
    .description('Validate a task configuration file')
    .argument('<file>', 'Path to JSON configuration file')
    .action(async (file) => {
    try {
        const config = await loadTasksFromFile(file);
        console.log('✅ Configuration file is valid');
        console.log(`📋 Found ${config.tasks.length} tasks`);
        if (config.options) {
            console.log('⚙️  Default options:');
            Object.entries(config.options).forEach(([key, value]) => {
                console.log(`   • ${key}: ${value}`);
            });
        }
        console.log('\\n🧪 Task summary:');
        config.tasks.forEach((task, index) => {
            const type = task.url ? 'HTTP' : task.command ? 'Shell' : task.script ? 'Script' : 'Data';
            const name = task.name || task.id || `Task ${index + 1}`;
            console.log(`   ${index + 1}. ${name} (${type})`);
        });
    }
    catch (error) {
        console.error('❌ Validation failed:', error instanceof Error ? error.message : error);
        process.exit(1);
    }
});
program
    .command('example')
    .description('Generate example configuration files')
    .option('-t, --type <type>', 'Example type: http, shell, script, mixed', 'mixed')
    .option('-o, --output <file>', 'Output file path', 'tasks.json')
    .action(async (options) => {
    const examples = {
        http: {
            tasks: [
                {
                    id: 'api-1',
                    name: 'Get user data',
                    url: 'https://jsonplaceholder.typicode.com/users/1',
                    method: 'GET'
                },
                {
                    id: 'api-2',
                    name: 'Get posts',
                    url: 'https://jsonplaceholder.typicode.com/posts',
                    method: 'GET'
                }
            ],
            options: {
                concurrency: 2,
                retries: 3,
                timeout: 5000
            }
        },
        shell: {
            tasks: [
                {
                    id: 'disk-usage',
                    name: 'Check disk usage',
                    command: 'df -h'
                },
                {
                    id: 'memory-info',
                    name: 'Check memory',
                    command: 'free -h'
                }
            ],
            options: {
                concurrency: 1,
                timeout: 10000
            }
        },
        script: {
            tasks: [
                {
                    id: 'math-task',
                    name: 'Calculate factorial',
                    script: 'const n = data.number; let result = 1; for(let i = 1; i <= n; i++) result *= i; return { input: n, factorial: result };',
                    data: { number: 5 }
                }
            ],
            options: {
                concurrency: 3
            }
        },
        mixed: {
            tasks: [
                {
                    id: 'web-request',
                    name: 'Fetch API data',
                    url: 'https://api.github.com/repos/microsoft/typescript',
                    method: 'GET'
                },
                {
                    id: 'system-info',
                    name: 'Get system info',
                    command: 'uname -a'
                },
                {
                    id: 'data-processing',
                    name: 'Process data',
                    script: 'return { processed: true, timestamp: new Date().toISOString(), data };',
                    data: { message: 'Hello from CLI!' }
                }
            ],
            options: {
                concurrency: 2,
                retries: 2,
                retryDelay: 1000,
                exponentialBackoff: true,
                timeout: 8000
            }
        }
    };
    const example = examples[options.type];
    if (!example) {
        console.error('❌ Invalid example type. Available types: http, shell, script, mixed');
        process.exit(1);
    }
    try {
        await fs.writeFile(options.output, JSON.stringify(example, null, 2));
        console.log(`✅ Example configuration written to ${options.output}`);
        console.log(`🚀 Run with: async-task-runner run --file ${options.output}`);
    }
    catch (error) {
        console.error('❌ Failed to write example file:', error);
        process.exit(1);
    }
});
program.on('command:*', () => {
    console.error('❌ Invalid command. Use --help for available commands.');
    process.exit(1);
});
if (process.argv.length <= 2) {
    program.help();
}
else {
    program.parse();
}
//# sourceMappingURL=cli.js.map