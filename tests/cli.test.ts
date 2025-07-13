/**
 * CLI Tests - Phase 6
 * 
 * Tests CLI functionality including file input, JSON input, and command validation
 */

import fs from 'fs/promises';
import { spawn } from 'child_process';
import path from 'path';

describe('CLI Functionality', () => {
  const testDir = path.join(process.cwd(), 'test-cli-files');
  const cliPath = path.join(process.cwd(), 'dist', 'cli.js');
  
  beforeAll(async () => {
    // Create test directory
    await fs.mkdir(testDir, { recursive: true });
  });
  
  afterAll(async () => {
    // Clean up test files
    try {
      await fs.rm(testDir, { recursive: true });
    } catch (error) {
      // Ignore cleanup errors
    }
  });
  
  beforeEach(async () => {
    // Ensure CLI is built
    try {
      await fs.access(cliPath);
    } catch {
      throw new Error('CLI not built. Run npm run build first.');
    }
  });
  
  describe('Configuration File Processing', () => {
    test('should generate example configuration', async () => {
      const outputFile = path.join(testDir, 'example.json');
      
      const result = await runCLI(['example', '--type', 'mixed', '--output', outputFile]);
      
      expect(result.code).toBe(0);
      expect(result.stdout).toContain('Example configuration written');
      
      const configContent = await fs.readFile(outputFile, 'utf-8');
      const config = JSON.parse(configContent);
      
      expect(config.tasks).toBeDefined();
      expect(config.options).toBeDefined();
      expect(Array.isArray(config.tasks)).toBe(true);
    });
    
    test('should validate configuration files', async () => {
      const validConfig = {
        tasks: [
          {
            id: 'test-task',
            name: 'Test HTTP Request',
            url: 'https://httpbin.org/get',
            method: 'GET'
          }
        ],
        options: {
          concurrency: 2,
          retries: 1,
          timeout: 5000
        }
      };
      
      const configFile = path.join(testDir, 'valid-config.json');
      await fs.writeFile(configFile, JSON.stringify(validConfig, null, 2));
      
      const result = await runCLI(['validate', configFile]);
      
      expect(result.code).toBe(0);
      expect(result.stdout).toContain('Configuration file is valid');
      expect(result.stdout).toContain('Found 1 tasks');
    });
    
    test('should reject invalid configuration files', async () => {
      const invalidConfig = {
        // Missing tasks array
        options: {
          concurrency: 2
        }
      };
      
      const configFile = path.join(testDir, 'invalid-config.json');
      await fs.writeFile(configFile, JSON.stringify(invalidConfig, null, 2));
      
      const result = await runCLI(['validate', configFile]);
      
      expect(result.code).toBe(1);
      expect(result.stderr).toContain('must contain a "tasks" array');
    });
  });
  
  describe('Task Execution', () => {
    test('should execute HTTP tasks from file', async () => {
      const config = {
        tasks: [
          {
            id: 'http-test',
            name: 'Test HTTP Request',
            url: 'https://httpbin.org/status/200',
            method: 'GET'
          }
        ],
        options: {
          concurrency: 1,
          timeout: 10000
        }
      };
      
      const configFile = path.join(testDir, 'http-tasks.json');
      await fs.writeFile(configFile, JSON.stringify(config, null, 2));
      
      const result = await runCLI(['run', '--file', configFile, '--verbose'], 15000);
      
      expect(result.code).toBe(0);
      expect(result.stdout).toContain('Starting async-task-runner CLI');
      expect(result.stdout).toContain('Running 1 tasks');
    });
    
    test('should execute shell command tasks', async () => {
      const config = {
        tasks: [
          {
            id: 'shell-test',
            name: 'Test Shell Command',
            command: 'echo "Hello CLI"'
          }
        ],
        options: {
          concurrency: 1,
          timeout: 5000
        }
      };
      
      const configFile = path.join(testDir, 'shell-tasks.json');
      await fs.writeFile(configFile, JSON.stringify(config, null, 2));
      
      const result = await runCLI(['run', '--file', configFile, '--verbose']);
      
      expect(result.code).toBe(0);
      expect(result.stdout).toContain('Successful tasks');
    });
    
    test('should handle script execution tasks', async () => {
      const config = {
        tasks: [
          {
            id: 'script-test',
            name: 'Test Script Execution',
            script: 'return { result: data.input * 2, processed: true };',
            data: { input: 21 }
          }
        ]
      };
      
      const configFile = path.join(testDir, 'script-tasks.json');
      await fs.writeFile(configFile, JSON.stringify(config, null, 2));
      
      const result = await runCLI(['run', '--file', configFile, '--verbose']);
      
      expect(result.code).toBe(0);
      expect(result.stdout).toContain('Successful tasks');
    });
  });
  
  describe('CLI Options', () => {
    test('should respect concurrency option', async () => {
      const config = {
        tasks: Array.from({ length: 4 }, (_, i) => ({
          id: `task-${i}`,
          name: `Task ${i + 1}`,
          script: 'return { taskId: data.id, timestamp: Date.now() };',
          data: { id: i }
        }))
      };
      
      const configFile = path.join(testDir, 'concurrency-test.json');
      await fs.writeFile(configFile, JSON.stringify(config, null, 2));
      
      const result = await runCLI([
        'run', 
        '--file', configFile, 
        '--concurrency', '2',
        '--verbose'
      ]);
      
      expect(result.code).toBe(0);
      expect(result.stdout).toContain('Concurrency: 2');
    });
    
    test('should respect retry options', async () => {
      const config = {
        tasks: [
          {
            id: 'retry-test',
            name: 'Failing Task',
            script: 'throw new Error("Always fails");'
          }
        ]
      };
      
      const configFile = path.join(testDir, 'retry-test.json');
      await fs.writeFile(configFile, JSON.stringify(config, null, 2));
      
      const result = await runCLI([
        'run', 
        '--file', configFile, 
        '--retries', '2',
        '--retry-delay', '100',
        '--verbose'
      ]);
      
      expect(result.code).toBe(1); // Should fail
      expect(result.stdout).toContain('Retries: 2');
    });
    
    test('should handle inline JSON input', async () => {
      const jsonConfig = JSON.stringify({
        tasks: [
          {
            id: 'inline-test',
            name: 'Inline JSON Test',
            script: 'return { message: "inline JSON works" };'
          }
        ]
      });
      
      const result = await runCLI([
        'run', 
        '--json', jsonConfig,
        '--verbose'
      ]);
      
      expect(result.code).toBe(0);
      expect(result.stdout).toContain('Successful tasks');
    });
  });
  
  describe('Error Handling', () => {
    test('should handle missing configuration', async () => {
      const result = await runCLI(['run']);
      
      expect(result.code).toBe(1);
      expect(result.stderr).toContain('Must specify either --file or --json');
    });
    
    test('should handle non-existent files', async () => {
      const result = await runCLI(['run', '--file', 'non-existent.json']);
      
      expect(result.code).toBe(1);
      expect(result.stderr).toContain('Failed to load tasks');
    });
    
    test('should handle malformed JSON', async () => {
      const malformedFile = path.join(testDir, 'malformed.json');
      await fs.writeFile(malformedFile, '{ invalid json }');
      
      const result = await runCLI(['run', '--file', malformedFile]);
      
      expect(result.code).toBe(1);
      expect(result.stderr).toContain('Failed to load tasks');
    });
  });
  
  describe('Output Formatting', () => {
    test('should show summary in non-verbose mode', async () => {
      const config = {
        tasks: [
          {
            id: 'summary-test',
            name: 'Summary Test',
            script: 'return { success: true };'
          }
        ]
      };
      
      const configFile = path.join(testDir, 'summary-test.json');
      await fs.writeFile(configFile, JSON.stringify(config, null, 2));
      
      const result = await runCLI(['run', '--file', configFile]);
      
      expect(result.code).toBe(0);
      expect(result.stdout).toContain('Task Execution Summary');
      expect(result.stdout).toContain('Successful: 1');
    });
    
    test('should handle --ignore-failures flag', async () => {
      const config = {
        tasks: [
          {
            id: 'failure-test',
            name: 'Failing Task',
            script: 'throw new Error("Intentional failure");'
          }
        ]
      };
      
      const configFile = path.join(testDir, 'failure-test.json');
      await fs.writeFile(configFile, JSON.stringify(config, null, 2));
      
      const result = await runCLI([
        'run', 
        '--file', configFile, 
        '--ignore-failures'
      ]);
      
      expect(result.code).toBe(0); // Should exit with 0 despite failures
      expect(result.stdout).toContain('Failed: 1');
    });
  });
});

// Helper function to run CLI commands
function runCLI(args: string[], timeout = 10000): Promise<{ code: number; stdout: string; stderr: string }> {
  return new Promise((resolve, reject) => {
    const cliPath = path.join(process.cwd(), 'dist', 'cli.js');
    const child = spawn('node', [cliPath, ...args], {
      stdio: 'pipe',
      timeout
    });
    
    let stdout = '';
    let stderr = '';
    
    child.stdout?.on('data', (data) => {
      stdout += data.toString();
    });
    
    child.stderr?.on('data', (data) => {
      stderr += data.toString();
    });
    
    child.on('close', (code) => {
      resolve({ code: code || 0, stdout, stderr });
    });
    
    child.on('error', (error) => {
      reject(error);
    });
  });
}