# Examples

This directory contains comprehensive examples demonstrating various use cases for `async-task-runner`.

## 📁 Available Examples

### 🕷️ [web-scraping.js](./web-scraping.js)
Demonstrates web scraping with rate limiting and error handling:
- Concurrent page scraping with controlled concurrency
- Retry logic for handling network failures
- Timeout protection for hanging requests
- Comprehensive error reporting and success tracking

**Key Features:**
- Simulated product data scraping
- Real-world HTTP error scenarios
- Rate limiting to respect server resources
- Detailed performance metrics

**Run:** `node examples/web-scraping.js`

### 📁 [file-processing.js](./file-processing.js) 
Shows batch file processing with specialized handlers:
- Process multiple file types concurrently
- Specialized processing logic for different formats (CSV, JSON, logs, etc.)
- Automatic retry for I/O failures
- Progress tracking and detailed reporting

**Key Features:**
- Log file analysis and error extraction
- CSV data transformation and validation
- JSON data processing and enrichment
- Text analysis and word frequency counting
- Configuration file parsing and structuring
- Code analysis and metadata extraction

**Run:** `node examples/file-processing.js`

### 🌐 [api-integration.js](./api-integration.js)
Comprehensive API batch processing scenarios:
- Multiple API endpoint processing
- User data enrichment pipelines
- Data source synchronization
- Rate limiting and authentication handling

**Key Features:**
- Simulated API calls with realistic failure rates
- User enrichment from multiple data sources
- Batch synchronization operations
- Error categorization and retry strategies

**Run:** `node examples/api-integration.js`

## 🚀 Running Examples

### Prerequisites
Make sure you have built the project:
```bash
npm run build
```

### Run Individual Examples
```bash
# Web scraping demo
node examples/web-scraping.js

# File processing demo  
node examples/file-processing.js

# API integration demo
node examples/api-integration.js
```

### Run All Examples
```bash
# Run all examples in sequence
for example in examples/*.js; do
  echo "Running $example..."
  node "$example"
  echo "---"
done
```

## 📊 What You'll Learn

### Concurrency Control
- How to limit concurrent operations to respect system resources
- Balancing throughput vs. resource constraints
- Managing different concurrency levels for different operation types

### Error Handling & Retries
- Implementing intelligent retry strategies
- Using exponential backoff to handle rate limits
- Categorizing and reporting different error types
- Graceful degradation for partial failures

### Timeout Management
- Preventing operations from hanging indefinitely
- Setting appropriate timeouts for different operation types
- Handling timeout errors in retry scenarios

### Performance Monitoring
- Tracking operation success/failure rates
- Measuring execution times and throughput
- Generating comprehensive performance reports
- Identifying bottlenecks and optimization opportunities

### Real-World Patterns
- Web scraping best practices
- Batch file processing workflows
- API integration and data synchronization
- Error recovery and resilience patterns

## 🎯 Use Case Scenarios

### Web Scraping
Perfect for:
- Product catalog scraping
- News article aggregation
- Price monitoring systems
- SEO audit tools
- Social media content collection

### File Processing
Ideal for:
- Log file analysis and monitoring
- Data transformation pipelines
- Batch image/document processing
- Configuration file management
- Code analysis and metrics

### API Integration
Great for:
- Data synchronization between systems
- User data enrichment workflows
- Webhook processing pipelines
- Third-party service integration
- Microservice orchestration

## 🔧 Customization

Each example includes:
- **Configurable parameters** - Adjust concurrency, timeouts, and retry settings
- **Realistic failure simulation** - See how the system handles various error conditions
- **Performance metrics** - Monitor execution time, success rates, and throughput
- **Extensible patterns** - Easy to adapt for your specific use cases

## 📈 Performance Tips

Based on the examples, here are key performance optimization strategies:

1. **Concurrency Tuning**
   - Start with moderate concurrency (2-5)
   - Monitor resource usage and adjust accordingly
   - Consider target system limitations (API rate limits, server capacity)

2. **Retry Strategy**
   - Use exponential backoff for rate-limited APIs
   - Set reasonable maximum retry delays
   - Implement different retry counts for different operation criticality

3. **Timeout Configuration**
   - Set timeouts based on expected operation duration
   - Use shorter timeouts for user-facing operations
   - Allow longer timeouts for complex batch operations

4. **Error Handling**
   - Categorize errors to apply appropriate retry strategies
   - Log detailed error information for debugging
   - Implement circuit breaker patterns for cascading failures

## 🤝 Contributing Examples

We welcome additional examples! When contributing:

1. **Follow the existing pattern**:
   - Clear documentation and comments
   - Realistic error simulation
   - Comprehensive logging and reporting
   - Real-world applicability

2. **Include**:
   - Header comment explaining the use case
   - Configuration examples
   - Error handling demonstrations
   - Performance metrics
   - Real-world code patterns

3. **Test thoroughly**:
   - Verify examples work with current package version
   - Test various failure scenarios
   - Ensure examples are educational and practical

## 📚 Additional Resources

- [Main README](../README.md) - Package overview and API reference
- [Source Code](../src/) - Implementation details
- [Tests](../test-*.js) - Unit tests and validation scripts
- [Development Log](../CLAUDE.md) - Development history and phase progression