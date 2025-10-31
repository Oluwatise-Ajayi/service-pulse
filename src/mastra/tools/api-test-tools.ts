import { createTool } from '@mastra/core';
import { z } from 'zod';

// Cache for test results
const testCache = new Map<string, {
  status: 'PASS' | 'FAIL';
  timestamp: number;
  responseTime: number;
  result: any;
}>();

export const apiTestTool = createTool({
  id: 'api-test',
  description: `Test any API endpoint with custom configuration. You can:
  - Test GET, POST, PUT, DELETE, PATCH requests
  - Send custom headers and body
  - Validate response status, body content, headers, and response time
  - Get detailed test results`,
  
  inputSchema: z.object({
    // Basic endpoint info
    url: z.string().describe('The API endpoint URL to test (e.g., https://api.example.com/users)'),
    method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']).default('GET').describe('HTTP method to use'),

    // Request configuration
    headers: z.record(z.string(), z.string()).optional().describe('Custom headers as key-value pairs (e.g., {"Authorization": "Bearer token", "Content-Type": "application/json"})'),
    body: z.string().optional().describe('Request body (JSON string for POST/PUT/PATCH)'),
    
    // Test validations (user can specify what to check)
    expectations: z.object({
      statusCode: z.number().optional().describe('Expected HTTP status code (e.g., 200, 201, 404)'),
      statusCodeRange: z.array(z.number()).min(2).max(2).optional().describe('Acceptable status code range (e.g., [200, 299] for any 2xx)'),
      maxResponseTime: z.number().optional().describe('Maximum acceptable response time in milliseconds'),
      bodyContains: z.array(z.string()).optional().describe('Text/values that should be in response body'),
      bodyNotContains: z.array(z.string()).optional().describe('Text/values that should NOT be in response body'),
      bodySchema: z.any().optional().describe('JSON schema to validate response body structure'),
      requiredHeaders: z.array(z.string()).optional().describe('Headers that must be present in response'),
      responseType: z.enum(['json', 'text', 'html', 'xml']).optional().describe('Expected response content type'),
    }).optional().describe('What to validate in the response'),
    
    // Cache & timeout
    cacheTTL: z.number().default(300000).describe('Cache duration in milliseconds (default: 5 minutes)'),
    timeout: z.number().default(10000).describe('Request timeout in milliseconds'),
  }),
  
  outputSchema: z.object({
    testStatus: z.enum(['PASS', 'FAIL']),
    cached: z.boolean(),
    timestamp: z.string(),
    
    // Request details
    request: z.object({
      method: z.string(),
      url: z.string(),
      headers: z.record(z.string(), z.string()).optional(),
    }),
    
    // Response details
    response: z.object({
      statusCode: z.number(),
      statusText: z.string(),
      headers: z.record(z.string(), z.string()),
      body: z.string().optional(),
      responseTime: z.number(),
    }).optional(),
    // Validation results
    validations: z.object({
      statusCode: z.object({ expected: z.any(), actual: z.number(), passed: z.boolean() }).optional(),
      responseTime: z.object({ maxAllowed: z.number(), actual: z.number(), passed: z.boolean() }).optional(),
      bodyContains: z.array(z.object({ text: z.string(), found: z.boolean() })).optional(),
      bodyNotContains: z.array(z.object({ text: z.string(), notFound: z.boolean() })).optional(),
      headers: z.array(z.object({ header: z.string(), present: z.boolean() })).optional(),
      responseType: z.object({ expected: z.string(), actual: z.string(), passed: z.boolean() }).optional(),
    }).optional(),
    
    // Summary
    totalChecks: z.number(),
    passedChecks: z.number(),
    failedChecks: z.number(),
    
    // Error info
    error: z.string().optional(),
  }),
  
  execute: async ({ context }) => {
    const {
      url,
      method,
      headers,
      body,
      expectations,
      cacheTTL,
      timeout,
    } = context;
    
    const now = Date.now();
    const cacheKey = `${method}:${url}:${JSON.stringify(body || {})}`;
    
    // Check cache
    const cached = testCache.get(cacheKey);
    const cacheAge = cached ? now - cached.timestamp : Infinity;
    const isCacheFresh = cacheAge < cacheTTL;
    
    if (isCacheFresh && cached) {
      console.log(`[APITest] ✅ Cache HIT - ${method} ${url} - ${cached.status} (age: ${Math.round(cacheAge / 1000)}s)`);
      return {
        ...cached.result,
        cached: true,
      };
    }
    
    // Perform the test
    console.log(`[APITest] 🔍 Testing ${method} ${url}...`);
    
    const startTime = Date.now();
    
    try {
      const fetchOptions: RequestInit = {
        method,
        headers: {
          'User-Agent': 'ServicePulse-APITest/1.0',
          ...headers,
        },
        signal: AbortSignal.timeout(timeout),
      };
      
      if (body && method !== 'GET' && method !== 'DELETE') {
        fetchOptions.body = body;
      }
      
      const response = await fetch(url, fetchOptions);
      const endTime = Date.now();
      const responseTime = endTime - startTime;
      
      // Get response body
      const contentType = response.headers.get('content-type') || '';
      let responseBody: string | undefined;
      
      try {
        if (contentType.includes('application/json')) {
          const jsonData = await response.json();
          responseBody = JSON.stringify(jsonData, null, 2);
        } else {
          responseBody = await response.text();
        }
      } catch (e) {
        responseBody = '[Unable to parse response body]';
      }
      
      // Collect response headers
      const responseHeaders: Record<string, string> = {};
      response.headers.forEach((value, key) => {
        responseHeaders[key] = value;
      });
      
      // Run validations
      const validations: any = {};
      let totalChecks = 0;
      let passedChecks = 0;
      
      if (expectations) {
        // Check status code
        if (expectations.statusCode !== undefined) {
          totalChecks++;
          const passed = response.status === expectations.statusCode;
          if (passed) passedChecks++;
          validations.statusCode = {
            expected: expectations.statusCode,
            actual: response.status,
            passed,
          };
        }
        
        // Check status code range
        if (expectations.statusCodeRange) {
          totalChecks++;
          const [min, max] = expectations.statusCodeRange;
          const passed = response.status >= min && response.status <= max;
          if (passed) passedChecks++;
          validations.statusCode = {
            expected: `${min}-${max}`,
            actual: response.status,
            passed,
          };
        }
        
        // Check response time
        if (expectations.maxResponseTime !== undefined) {
          totalChecks++;
          const passed = responseTime <= expectations.maxResponseTime;
          if (passed) passedChecks++;
          validations.responseTime = {
            maxAllowed: expectations.maxResponseTime,
            actual: responseTime,
            passed,
          };
        }
        
        // Check body contains
        if (expectations.bodyContains && responseBody) {
          validations.bodyContains = expectations.bodyContains.map(text => {
            totalChecks++;
            const found = responseBody!.includes(text);
            if (found) passedChecks++;
            return { text, found };
          });
        }
        
        // Check body NOT contains
        if (expectations.bodyNotContains && responseBody) {
          validations.bodyNotContains = expectations.bodyNotContains.map(text => {
            totalChecks++;
            const notFound = !responseBody!.includes(text);
            if (notFound) passedChecks++;
            return { text, notFound };
          });
        }
        
        // Check required headers
        if (expectations.requiredHeaders) {
          validations.headers = expectations.requiredHeaders.map(header => {
            totalChecks++;
            const present = response.headers.has(header.toLowerCase());
            if (present) passedChecks++;
            return { header, present };
          });
        }
        
        // Check response type
        if (expectations.responseType) {
          totalChecks++;
          const actualType = contentType.includes('json') ? 'json' :
                           contentType.includes('html') ? 'html' :
                           contentType.includes('xml') ? 'xml' : 'text';
          const passed = actualType === expectations.responseType;
          if (passed) passedChecks++;
          validations.responseType = {
            expected: expectations.responseType,
            actual: actualType,
            passed,
          };
        }
      }
      
      // If no expectations provided, just check if request succeeded
      if (totalChecks === 0) {
        totalChecks = 1;
        passedChecks = response.ok ? 1 : 0;
      }
      
      const testStatus = passedChecks === totalChecks ? 'PASS' : 'FAIL';
      
      const result = {
        testStatus: testStatus as 'PASS' | 'FAIL',
        cached: false,
        timestamp: new Date(now).toISOString(),
        request: {
          method,
          url,
          headers,
        },
        response: {
          statusCode: response.status,
          statusText: response.statusText,
          headers: responseHeaders,
          body: responseBody,
          responseTime,
        },
        validations,
        totalChecks,
        passedChecks,
        failedChecks: totalChecks - passedChecks,
      };
      
      // Cache the result
      testCache.set(cacheKey, {
        status: testStatus,
        timestamp: now,
        responseTime,
        result,
      });
      
      // Log results
      const icon = testStatus === 'PASS' ? '✅' : '❌';
      console.log(`[APITest] ${icon} ${method} ${url} - ${response.status} (${responseTime}ms) - ${passedChecks}/${totalChecks} checks passed`);
      
      return result;
      
    } catch (error: any) {
      console.error(`[APITest] ❌ Test FAILED: ${method} ${url} - ${error.message}`);
      
      const result = {
        testStatus: 'FAIL' as const,
        cached: false,
        timestamp: new Date(now).toISOString(),
        request: {
          method,
          url,
          headers,
        },
        totalChecks: 1,
        passedChecks: 0,
        failedChecks: 1,
        error: error.message,
      };
      
      // Cache the failure
      testCache.set(cacheKey, {
        status: 'FAIL',
        timestamp: now,
        responseTime: 0,
        result,
      });
      
      return result;
    }
  },
});