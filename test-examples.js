#!/usr/bin/env node

import { spawn } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function runExample(examplePath) {
  return new Promise((resolve, reject) => {
    console.log(`\n🧪 Testing ${examplePath}...`);
    console.log('='.repeat(50));
    
    const child = spawn('node', [examplePath], {
      cwd: __dirname,
      stdio: 'pipe',
      timeout: 60000 // 60 second timeout
    });
    
    let stdout = '';
    let stderr = '';
    
    child.stdout.on('data', (data) => {
      stdout += data.toString();
    });
    
    child.stderr.on('data', (data) => {
      stderr += data.toString();
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        console.log('✅ Example completed successfully');
        console.log('📊 Output summary:');
        const lines = stdout.split('\n');
        const summaryLines = lines.filter(line => 
          line.includes('✅') || 
          line.includes('📊') || 
          line.includes('🎯') ||
          line.includes('Success rate')
        ).slice(0, 5);
        summaryLines.forEach(line => console.log(`   ${line}`));
        resolve({ success: true, stdout, stderr });
      } else {
        console.log(`❌ Example failed with code ${code}`);
        if (stderr) console.log('Error:', stderr);
        resolve({ success: false, stdout, stderr, code });
      }
    });
    
    child.on('error', (error) => {
      console.log(`❌ Failed to run example: ${error.message}`);
      reject(error);
    });
  });
}

async function testAllExamples() {
  console.log('🚀 Testing async-task-runner Examples');
  console.log('='.repeat(50));
  
  const examples = [
    'examples/web-scraping.js',
    'examples/file-processing.js', 
    'examples/api-integration.js'
  ];
  
  const results = [];
  
  for (const example of examples) {
    try {
      const result = await runExample(example);
      results.push({ example, ...result });
    } catch (error) {
      results.push({ example, success: false, error: error.message });
    }
  }
  
  console.log('\n📈 Test Results Summary');
  console.log('='.repeat(30));
  
  const successful = results.filter(r => r.success);
  const failed = results.filter(r => !r.success);
  
  console.log(`✅ Successful: ${successful.length}/${results.length}`);
  successful.forEach(result => {
    console.log(`   ✓ ${result.example}`);
  });
  
  if (failed.length > 0) {
    console.log(`\n❌ Failed: ${failed.length}/${results.length}`);
    failed.forEach(result => {
      console.log(`   ✗ ${result.example}`);
      if (result.error) console.log(`     Error: ${result.error}`);
    });
  }
  
  console.log(`\n🎯 Overall Success Rate: ${(successful.length / results.length * 100).toFixed(1)}%`);
  
  return results;
}

if (import.meta.url === `file://${process.argv[1]}`) {
  testAllExamples()
    .then(results => {
      const allPassed = results.every(r => r.success);
      process.exit(allPassed ? 0 : 1);
    })
    .catch(error => {
      console.error('Test runner failed:', error);
      process.exit(1);
    });
}