import { runTasks } from './src/index.js';

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

async function main() {
  console.log('🚀 Starting async-task-runner example...\n');

  const tasks = [
    async () => {
      await delay(1000);
      return { id: 1, data: 'Task 1 completed' };
    },
    async () => {
      await delay(500);
      return { id: 2, data: 'Task 2 completed' };
    },
    async () => {
      await delay(1500);
      return { id: 3, data: 'Task 3 completed' };
    },
    async () => {
      await delay(800);
      throw new Error('Task 4 failed!');
    },
    async () => {
      await delay(300);
      return { id: 5, data: 'Task 5 completed' };
    },
  ];

  console.log(`Running ${tasks.length} tasks with concurrency limit of 3...\n`);
  
  const startTime = Date.now();
  const results = await runTasks(tasks, { concurrency: 3 });
  const endTime = Date.now();

  console.log('📊 Results:');
  results.forEach((result, index) => {
    if (result.success) {
      console.log(`✅ Task ${index + 1}: ${JSON.stringify(result.result)}`);
    } else {
      console.log(`❌ Task ${index + 1}: ${result.error?.message}`);
    }
  });

  console.log(`\n⏱️  Total execution time: ${endTime - startTime}ms`);
  
  const successCount = results.filter(r => r.success).length;
  const failureCount = results.filter(r => !r.success).length;
  
  console.log(`📈 Summary: ${successCount} successful, ${failureCount} failed`);
}

main().catch(console.error);