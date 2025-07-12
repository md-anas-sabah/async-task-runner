/**
 * Web Scraping Example
 * 
 * This example demonstrates how to use async-task-runner for web scraping.
 * It scrapes product information from multiple URLs with rate limiting,
 * retry logic, and comprehensive error handling.
 */

import { runTasksWithSummary, formatSummary } from '../dist/index.js';

// Simulate web scraping (in real use, you'd use axios + cheerio)
const scrapeUrl = (url) => async () => {
  console.log(`🕷️  Scraping: ${url}`);
  
  // Simulate HTTP request with potential failures
  const delay = Math.random() * 2000 + 500; // 500-2500ms
  const shouldFail = Math.random() < 0.2; // 20% failure rate
  
  await new Promise(resolve => setTimeout(resolve, delay));
  
  if (shouldFail) {
    const errors = [
      'Network timeout',
      'Rate limit exceeded',
      'Server returned 500',
      'Connection refused'
    ];
    throw new Error(errors[Math.floor(Math.random() * errors.length)]);
  }
  
  // Simulate scraped data
  const products = [
    'Wireless Headphones',
    'Gaming Mouse',
    'Mechanical Keyboard',
    'USB-C Cable',
    'Phone Case',
    'Laptop Stand'
  ];
  
  return {
    url,
    title: products[Math.floor(Math.random() * products.length)],
    price: `$${(Math.random() * 200 + 10).toFixed(2)}`,
    rating: (Math.random() * 2 + 3).toFixed(1),
    reviews: Math.floor(Math.random() * 1000 + 10),
    inStock: Math.random() > 0.1,
    scrapedAt: new Date().toISOString()
  };
};

async function webScrapingDemo() {
  console.log('🚀 Web Scraping Demo with async-task-runner');
  console.log('=' .repeat(50));
  
  // URLs to scrape (in real scenario, these would be actual product URLs)
  const urls = [
    'https://example-store.com/products/laptop-1',
    'https://example-store.com/products/laptop-2',
    'https://example-store.com/products/laptop-3',
    'https://example-store.com/products/phone-1',
    'https://example-store.com/products/phone-2',
    'https://example-store.com/products/tablet-1',
    'https://example-store.com/products/tablet-2',
    'https://example-store.com/products/watch-1',
    'https://example-store.com/products/headphones-1',
    'https://example-store.com/products/headphones-2',
    'https://example-store.com/products/camera-1',
    'https://example-store.com/products/camera-2'
  ];
  
  // Create scraping tasks
  const scrapingTasks = urls.map(scrapeUrl);
  
  console.log(`📋 Scraping ${urls.length} product pages...`);
  console.log('⚙️  Configuration:');
  console.log('   • Concurrency: 3 (don\'t overwhelm the server)');
  console.log('   • Retries: 2 (retry failed requests)');
  console.log('   • Timeout: 5 seconds per request');
  console.log('   • Retry delay: 1 second with exponential backoff');
  console.log('');
  
  const startTime = Date.now();
  
  // Run scraping with intelligent configuration
  const summary = await runTasksWithSummary(scrapingTasks, {
    concurrency: 3,           // Don't overwhelm the target server
    retries: 2,              // Retry failed requests
    timeout: 5000,           // 5 second timeout per request
    retryDelay: 1000,        // 1 second base delay
    exponentialBackoff: true, // Increase delay for subsequent retries
    maxRetryDelay: 10000     // Cap the maximum delay
  });
  
  const endTime = Date.now();
  
  console.log('📊 Scraping Results:');
  console.log('=' .repeat(30));
  
  // Display successful results
  const successfulResults = summary.results.filter(r => r.success);
  console.log(`✅ Successfully scraped ${successfulResults.length} products:`);
  
  successfulResults.forEach((result, index) => {
    const product = result.result;
    console.log(`   ${index + 1}. ${product.title}`);
    console.log(`      Price: ${product.price} | Rating: ${product.rating}⭐ | Reviews: ${product.reviews}`);
    console.log(`      In Stock: ${product.inStock ? '✅' : '❌'} | Duration: ${result.duration.toFixed(0)}ms`);
    console.log('');
  });
  
  // Display failed results
  const failedResults = summary.results.filter(r => !r.success);
  if (failedResults.length > 0) {
    console.log(`❌ Failed to scrape ${failedResults.length} products:`);
    failedResults.forEach((result, index) => {
      console.log(`   ${index + 1}. ${urls[result.taskIndex]}`);
      console.log(`      Error: ${result.error}`);
      console.log(`      Attempts: ${result.attempts}`);
      console.log('');
    });
  }
  
  console.log('📈 Performance Summary:');
  console.log('=' .repeat(30));
  console.log(formatSummary(summary));
  
  console.log('🎯 Key Benefits Demonstrated:');
  console.log('  • Rate limiting prevents server overload');
  console.log('  • Automatic retries handle temporary failures');
  console.log('  • Timeout prevents hanging requests');
  console.log('  • Detailed reporting shows success/failure breakdown');
  console.log('  • Exponential backoff reduces server pressure');
  
  return summary;
}

// Real-world web scraping example using actual HTTP requests
async function realWorldExample() {
  console.log('\\n🌐 Real-World Example (commented out - requires axios + cheerio)');
  console.log('=' .repeat(50));
  
  const exampleCode = `
// npm install axios cheerio
import axios from 'axios';
import * as cheerio from 'cheerio';

const scrapeProductPage = (url) => async () => {
  const response = await axios.get(url, {
    headers: {
      'User-Agent': 'Mozilla/5.0 (compatible; ProductScraper/1.0)',
      'Accept': 'text/html,application/xhtml+xml',
    },
    timeout: 10000
  });
  
  const $ = cheerio.load(response.data);
  
  return {
    url,
    title: $('h1.product-title').text().trim(),
    price: $('.price .current').text().trim(),
    originalPrice: $('.price .original').text().trim(),
    rating: $('.rating .stars').attr('data-rating'),
    reviewCount: $('.reviews-count').text().trim(),
    description: $('.product-description p').first().text().trim(),
    images: $('.product-images img').map((i, el) => $(el).attr('src')).get(),
    availability: $('.availability').text().includes('In Stock'),
    specifications: $('.specs li').map((i, el) => $(el).text()).get()
  };
};

const productUrls = [
  'https://example-store.com/laptops/macbook-pro',
  'https://example-store.com/phones/iphone-15',
  // ... more URLs
];

const results = await runTasksWithSummary(
  productUrls.map(scrapeProductPage),
  {
    concurrency: 2,        // Be respectful to the server
    retries: 3,           // Retry failed requests
    timeout: 15000,       // 15 second timeout
    retryDelay: 2000,     // 2 second delay between retries
    exponentialBackoff: true,
    maxRetryDelay: 30000  // Max 30 second delay
  }
);
  `;
  
  console.log(exampleCode);
}

// Run the demo
if (import.meta.url === `file://${process.argv[1]}`) {
  webScrapingDemo()
    .then(() => realWorldExample())
    .catch(console.error);
}