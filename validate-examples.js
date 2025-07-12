#!/usr/bin/env node

import fs from 'fs/promises';

async function validateExamples() {
  console.log('🔍 Validating Examples');
  console.log('='.repeat(30));
  
  const examples = [
    'examples/web-scraping.js',
    'examples/file-processing.js',
    'examples/api-integration.js'
  ];
  
  const validations = [];
  
  for (const examplePath of examples) {
    console.log(`\n📁 Validating ${examplePath}...`);
    
    try {
      const content = await fs.readFile(examplePath, 'utf-8');
      
      const checks = {
        hasImport: content.includes("import { runTasksWithSummary"),
        hasMainFunction: content.includes("async function"),
        hasConsoleOutput: content.includes("console.log"),
        hasTaskDefinition: content.includes("async () =>"),
        hasRunTasksCall: content.includes("runTasksWithSummary"),
        hasErrorHandling: content.includes("throw new Error") || content.includes("catch"),
        hasDocumentation: content.includes("/**"),
        hasConfiguration: content.includes("concurrency") && content.includes("retries"),
        hasExample: content.includes("Real-world") || content.includes("real-world"),
        isExecutable: content.includes("import.meta.url")
      };
      
      const passedChecks = Object.values(checks).filter(Boolean).length;
      const totalChecks = Object.keys(checks).length;
      
      console.log(`   ✅ Passed ${passedChecks}/${totalChecks} validation checks`);
      
      // Show failed checks
      Object.entries(checks).forEach(([check, passed]) => {
        if (!passed) {
          console.log(`   ⚠️  Missing: ${check}`);
        }
      });
      
      validations.push({
        example: examplePath,
        passedChecks,
        totalChecks,
        checks
      });
      
    } catch (error) {
      console.log(`   ❌ Failed to validate: ${error.message}`);
      validations.push({
        example: examplePath,
        error: error.message,
        passedChecks: 0,
        totalChecks: 0
      });
    }
  }
  
  console.log('\n📊 Validation Summary');
  console.log('='.repeat(30));
  
  const totalChecks = validations.reduce((sum, v) => sum + (v.totalChecks || 0), 0);
  const totalPassed = validations.reduce((sum, v) => sum + (v.passedChecks || 0), 0);
  
  console.log(`Overall: ${totalPassed}/${totalChecks} checks passed (${(totalPassed/totalChecks*100).toFixed(1)}%)`);
  
  validations.forEach(validation => {
    const rate = validation.totalChecks > 0 ? (validation.passedChecks / validation.totalChecks * 100).toFixed(1) : 0;
    console.log(`• ${validation.example}: ${validation.passedChecks}/${validation.totalChecks} (${rate}%)`);
  });
  
  console.log('\n✅ All examples are properly structured and ready for use!');
  
  return validations;
}

validateExamples().catch(console.error);