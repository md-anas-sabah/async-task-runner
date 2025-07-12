/**
 * File Processing Example
 * 
 * This example demonstrates how to use async-task-runner for batch file processing.
 * It processes multiple files concurrently with progress tracking, error handling,
 * and comprehensive reporting.
 */

import { runTasksWithSummary, formatSummary } from '../dist/index.js';
import fs from 'fs/promises';
import path from 'path';

// Create test data
async function createTestFiles() {
  const testDir = 'test-files';
  const outputDir = 'processed-files';
  
  // Create directories
  await fs.mkdir(testDir, { recursive: true });
  await fs.mkdir(outputDir, { recursive: true });
  
  // Sample file contents
  const fileContents = [
    // Log file
    `2024-01-01 10:00:00 INFO Application started
2024-01-01 10:01:15 DEBUG Loading configuration
2024-01-01 10:01:20 INFO Configuration loaded successfully
2024-01-01 10:02:30 ERROR Database connection failed
2024-01-01 10:02:45 INFO Retrying database connection
2024-01-01 10:03:00 INFO Database connected successfully
2024-01-01 10:05:00 WARN Memory usage is high (85%)
2024-01-01 10:10:00 INFO Processing 1000 records
2024-01-01 10:15:00 INFO Processing completed`,

    // CSV data
    `name,email,age,city
John Doe,john@example.com,30,New York
Jane Smith,jane@example.com,25,Los Angeles
Bob Johnson,bob@example.com,35,Chicago
Alice Brown,alice@example.com,28,Houston
Charlie Davis,charlie@example.com,32,Phoenix`,

    // JSON data
    `{
  "users": [
    {"id": 1, "name": "John", "active": true, "score": 85},
    {"id": 2, "name": "Jane", "active": false, "score": 92},
    {"id": 3, "name": "Bob", "active": true, "score": 78}
  ],
  "metadata": {"version": "1.0", "created": "2024-01-01"}
}`,

    // Text content
    `Lorem ipsum dolor sit amet, consectetur adipiscing elit. 
Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.
Ut enim ad minim veniam, quis nostrud exercitation ullamco.
Duis aute irure dolor in reprehenderit in voluptate velit esse.
Excepteur sint occaecat cupidatat non proident, sunt in culpa.`,

    // Configuration file
    `# Application Configuration
database.host=localhost
database.port=5432
database.name=myapp
api.timeout=30000
api.retries=3
logging.level=INFO
cache.enabled=true
cache.ttl=3600`,

    // Code file
    `function calculateSum(numbers) {
  return numbers.reduce((sum, num) => sum + num, 0);
}

function processData(data) {
  const filtered = data.filter(item => item.active);
  const mapped = filtered.map(item => ({ ...item, processed: true }));
  return mapped;
}

export { calculateSum, processData };`
  ];

  const fileNames = [
    'application.log',
    'users.csv', 
    'data.json',
    'content.txt',
    'config.properties',
    'utils.js'
  ];

  // Create test files
  for (let i = 0; i < fileNames.length; i++) {
    const filePath = path.join(testDir, fileNames[i]);
    await fs.writeFile(filePath, fileContents[i]);
  }

  return { testDir, outputDir, files: fileNames };
}

// File processing functions
const processLogFile = (inputPath, outputPath) => async () => {
  const content = await fs.readFile(inputPath, 'utf-8');
  
  // Parse log entries and extract errors
  const lines = content.split('\\n').filter(line => line.trim());
  const logEntries = lines.map(line => {
    const match = line.match(/^(\\S+ \\S+) (\\w+) (.+)$/);
    if (match) {
      return {
        timestamp: match[1],
        level: match[2],
        message: match[3]
      };
    }
    return null;
  }).filter(Boolean);

  const errorCount = logEntries.filter(entry => entry.level === 'ERROR').length;
  const warnCount = logEntries.filter(entry => entry.level === 'WARN').length;

  const summary = {
    totalLines: lines.length,
    logEntries: logEntries.length,
    errors: errorCount,
    warnings: warnCount,
    processed: new Date().toISOString()
  };

  await fs.writeFile(outputPath, JSON.stringify(summary, null, 2));
  
  return {
    type: 'log',
    input: inputPath,
    output: outputPath,
    summary
  };
};

const processCsvFile = (inputPath, outputPath) => async () => {
  const content = await fs.readFile(inputPath, 'utf-8');
  
  // Parse CSV and transform data
  const lines = content.trim().split('\\n');
  const headers = lines[0].split(',');
  const rows = lines.slice(1).map(line => {
    const values = line.split(',');
    const obj = {};
    headers.forEach((header, index) => {
      obj[header] = values[index];
    });
    return obj;
  });

  // Transform data (e.g., add computed fields)
  const transformedRows = rows.map(row => ({
    ...row,
    age: parseInt(row.age),
    emailDomain: row.email.split('@')[1],
    processed: true
  }));

  await fs.writeFile(outputPath, JSON.stringify(transformedRows, null, 2));
  
  return {
    type: 'csv',
    input: inputPath,
    output: outputPath,
    recordCount: rows.length
  };
};

const processJsonFile = (inputPath, outputPath) => async () => {
  const content = await fs.readFile(inputPath, 'utf-8');
  const data = JSON.parse(content);
  
  // Process JSON data
  if (data.users) {
    data.users = data.users.map(user => ({
      ...user,
      scoreCategory: user.score >= 90 ? 'excellent' : user.score >= 80 ? 'good' : 'needs_improvement',
      lastProcessed: new Date().toISOString()
    }));
  }

  data.metadata = {
    ...data.metadata,
    processedAt: new Date().toISOString(),
    processedBy: 'async-task-runner'
  };

  await fs.writeFile(outputPath, JSON.stringify(data, null, 2));
  
  return {
    type: 'json',
    input: inputPath,
    output: outputPath,
    userCount: data.users?.length || 0
  };
};

const processTextFile = (inputPath, outputPath) => async () => {
  const content = await fs.readFile(inputPath, 'utf-8');
  
  // Text analysis and processing
  const words = content.toLowerCase().split(/\\s+/).filter(word => word.length > 0);
  const wordCount = words.length;
  const uniqueWords = [...new Set(words)].length;
  const averageWordLength = words.reduce((sum, word) => sum + word.length, 0) / words.length;
  
  // Create word frequency map
  const wordFreq = {};
  words.forEach(word => {
    wordFreq[word] = (wordFreq[word] || 0) + 1;
  });

  const analysis = {
    wordCount,
    uniqueWords,
    averageWordLength: parseFloat(averageWordLength.toFixed(2)),
    topWords: Object.entries(wordFreq)
      .sort(([,a], [,b]) => b - a)
      .slice(0, 10)
      .map(([word, count]) => ({ word, count })),
    processedAt: new Date().toISOString()
  };

  await fs.writeFile(outputPath, JSON.stringify(analysis, null, 2));
  
  return {
    type: 'text',
    input: inputPath,
    output: outputPath,
    analysis
  };
};

const processConfigFile = (inputPath, outputPath) => async () => {
  const content = await fs.readFile(inputPath, 'utf-8');
  
  // Parse configuration file
  const config = {};
  const lines = content.split('\\n').filter(line => line.trim() && !line.startsWith('#'));
  
  lines.forEach(line => {
    const [key, value] = line.split('=');
    if (key && value) {
      config[key.trim()] = value.trim();
    }
  });

  // Convert to structured format
  const structured = {
    database: {},
    api: {},
    logging: {},
    cache: {}
  };

  Object.entries(config).forEach(([key, value]) => {
    const [section, property] = key.split('.');
    if (structured[section]) {
      structured[section][property] = value;
    }
  });

  await fs.writeFile(outputPath, JSON.stringify(structured, null, 2));
  
  return {
    type: 'config',
    input: inputPath,
    output: outputPath,
    configCount: Object.keys(config).length
  };
};

const processCodeFile = (inputPath, outputPath) => async () => {
  const content = await fs.readFile(inputPath, 'utf-8');
  
  // Basic code analysis
  const lines = content.split('\\n');
  const codeLines = lines.filter(line => line.trim() && !line.trim().startsWith('//'));
  const functions = content.match(/function\\s+\\w+/g) || [];
  const exports = content.match(/export\\s+{[^}]+}/g) || [];
  
  const analysis = {
    totalLines: lines.length,
    codeLines: codeLines.length,
    blankLines: lines.length - codeLines.length,
    functions: functions.length,
    exports: exports.length,
    processedAt: new Date().toISOString()
  };

  // Add code metadata
  const processedContent = {
    originalCode: content,
    analysis,
    metadata: {
      language: 'javascript',
      processed: true,
      processedBy: 'async-task-runner'
    }
  };

  await fs.writeFile(outputPath, JSON.stringify(processedContent, null, 2));
  
  return {
    type: 'code',
    input: inputPath,
    output: outputPath,
    analysis
  };
};

// Main file processing function
const createFileProcessor = (inputPath, outputPath) => {
  const ext = path.extname(inputPath);
  const basename = path.basename(inputPath, ext);
  
  // Determine processor based on file extension
  switch (ext) {
    case '.log':
      return processLogFile(inputPath, outputPath);
    case '.csv':
      return processCsvFile(inputPath, outputPath);
    case '.json':
      return processJsonFile(inputPath, outputPath);
    case '.txt':
      return processTextFile(inputPath, outputPath);
    case '.properties':
      return processConfigFile(inputPath, outputPath);
    case '.js':
      return processCodeFile(inputPath, outputPath);
    default:
      return async () => {
        // Generic text processing
        const content = await fs.readFile(inputPath, 'utf-8');
        const processedContent = content.toUpperCase();
        await fs.writeFile(outputPath, processedContent);
        return {
          type: 'generic',
          input: inputPath,
          output: outputPath,
          size: content.length
        };
      };
  }
};

async function fileProcessingDemo() {
  console.log('🚀 File Processing Demo with async-task-runner');
  console.log('='.repeat(50));
  
  // Create test files
  console.log('📁 Creating test files...');
  const { testDir, outputDir, files } = await createTestFiles();
  console.log(`✅ Created ${files.length} test files in ./${testDir}/`);
  console.log('');

  // Create processing tasks
  const processingTasks = files.map(filename => {
    const inputPath = path.join(testDir, filename);
    const outputPath = path.join(outputDir, `processed_${filename}.json`);
    return createFileProcessor(inputPath, outputPath);
  });

  console.log('⚙️  Processing Configuration:');
  console.log('   • Concurrency: 2 (process 2 files simultaneously)');
  console.log('   • Timeout: 10 seconds per file');
  console.log('   • Retries: 1 (retry failed operations)');
  console.log('   • Each file type has specialized processing logic');
  console.log('');

  // Process files with async-task-runner
  const summary = await runTasksWithSummary(processingTasks, {
    concurrency: 2,       // Process 2 files at once
    retries: 1,          // Retry failed operations
    timeout: 10000,      // 10 second timeout per file
    retryDelay: 1000     // 1 second delay before retry
  });

  console.log('📊 Processing Results:');
  console.log('='.repeat(30));

  // Display successful results
  const successfulResults = summary.results.filter(r => r.success);
  console.log(`✅ Successfully processed ${successfulResults.length} files:`);
  console.log('');

  successfulResults.forEach((result, index) => {
    const fileResult = result.result;
    console.log(`   ${index + 1}. ${path.basename(fileResult.input)} → ${path.basename(fileResult.output)}`);
    console.log(`      Type: ${fileResult.type} | Duration: ${result.duration.toFixed(0)}ms`);
    
    // Show specific details based on file type
    switch (fileResult.type) {
      case 'log':
        console.log(`      Logs: ${fileResult.summary.logEntries} entries, ${fileResult.summary.errors} errors`);
        break;
      case 'csv':
        console.log(`      Records: ${fileResult.recordCount} processed`);
        break;
      case 'json':
        console.log(`      Users: ${fileResult.userCount} processed`);
        break;
      case 'text':
        console.log(`      Words: ${fileResult.analysis.wordCount} (${fileResult.analysis.uniqueWords} unique)`);
        break;
      case 'config':
        console.log(`      Settings: ${fileResult.configCount} configuration items`);
        break;
      case 'code':
        console.log(`      Code: ${fileResult.analysis.functions} functions, ${fileResult.analysis.codeLines} lines`);
        break;
    }
    console.log('');
  });

  // Display failed results
  const failedResults = summary.results.filter(r => !r.success);
  if (failedResults.length > 0) {
    console.log(`❌ Failed to process ${failedResults.length} files:`);
    failedResults.forEach((result, index) => {
      console.log(`   ${index + 1}. Error: ${result.error}`);
      console.log(`      Attempts: ${result.attempts}`);
    });
    console.log('');
  }

  console.log('📈 Performance Summary:');
  console.log('='.repeat(30));
  console.log(formatSummary(summary));

  console.log('🎯 Key Benefits Demonstrated:');
  console.log('  • Concurrent file processing improves throughput');
  console.log('  • Specialized processors handle different file types');
  console.log('  • Automatic retry handles temporary I/O failures');
  console.log('  • Timeout prevents hanging on large files');
  console.log('  • Detailed reporting shows processing success/failure');
  console.log('  • Error handling ensures robust batch operations');

  // Cleanup
  console.log('\\n🧹 Cleaning up test files...');
  await fs.rm(testDir, { recursive: true });
  await fs.rm(outputDir, { recursive: true });
  console.log('✅ Cleanup completed');

  return summary;
}

// Real-world file processing examples
async function realWorldExamples() {
  console.log('\\n🌐 Real-World File Processing Examples');
  console.log('='.repeat(50));
  
  const examples = `
// Image Processing Pipeline
import sharp from 'sharp';

const processImage = (inputPath) => async () => {
  const outputPath = inputPath.replace(/\\.(jpg|png)$/, '_processed.$1');
  
  await sharp(inputPath)
    .resize(800, 600)
    .jpeg({ quality: 85 })
    .toFile(outputPath);
    
  const stats = await fs.stat(outputPath);
  return { input: inputPath, output: outputPath, size: stats.size };
};

// CSV Data Processing
const processDataFile = (csvPath) => async () => {
  const content = await fs.readFile(csvPath, 'utf-8');
  const records = parseCSV(content);
  
  // Data validation and transformation
  const processed = records
    .filter(record => record.email && record.age > 0)
    .map(record => ({
      ...record,
      age: parseInt(record.age),
      emailDomain: record.email.split('@')[1],
      processedAt: new Date().toISOString()
    }));
    
  const outputPath = csvPath.replace('.csv', '_processed.json');
  await fs.writeFile(outputPath, JSON.stringify(processed, null, 2));
  
  return { processed: processed.length, output: outputPath };
};

// Log File Analysis
const analyzeLogFile = (logPath) => async () => {
  const content = await fs.readFile(logPath, 'utf-8');
  const lines = content.split('\\n');
  
  const analysis = {
    totalLines: lines.length,
    errors: lines.filter(line => line.includes('ERROR')).length,
    warnings: lines.filter(line => line.includes('WARN')).length,
    timeRange: extractTimeRange(lines),
    topErrors: extractTopErrors(lines)
  };
  
  return analysis;
};

// Batch processing
const files = await fs.readdir('./data-directory');
const tasks = files
  .filter(file => file.endsWith('.csv'))
  .map(file => processDataFile(path.join('./data-directory', file)));

const results = await runTasksWithSummary(tasks, {
  concurrency: 4,
  retries: 2,
  timeout: 30000
});
  `;
  
  console.log(examples);
}

// Run the demo
if (import.meta.url === \`file://\${process.argv[1]}\`) {
  fileProcessingDemo()
    .then(() => realWorldExamples())
    .catch(console.error);
}