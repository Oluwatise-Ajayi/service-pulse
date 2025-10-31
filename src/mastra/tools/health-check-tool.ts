import { createTool } from '@mastra/core';
import { z } from 'zod';

// In-memory cache (simple object stored outside the tool)
const healthCache = {
  status: null as 'UP' | 'DOWN' | null,
  timestamp: null as number | null,
  lastError: null as string | null,
};

export const healthCheckTool = createTool({
  id: 'health-check',
  description: 'Checks if a service is UP or DOWN with intelligent caching',
  inputSchema: z.object({
    targetUrl: z.string().describe('The API endpoint to check (e.g., https://api.example.com/health)'),
    cacheTTL: z.number().default(300000).describe('Cache time-to-live in milliseconds (default: 300000 = 5 minutes)'),
  }),
  outputSchema: z.object({
    status: z.enum(['UP', 'DOWN']),
    cached: z.boolean(),
    timestamp: z.string(),
    cacheAge: z.number().optional(),
    httpStatus: z.number().optional(),
    statusChanged: z.boolean().optional(),
    error: z.string().optional(),
  }),
  execute: async ({ context }) => {
    const { targetUrl, cacheTTL } = context;
    const now = Date.now();

    // Step 1: Check if cache is fresh
    const cacheAge = healthCache.timestamp ? now - healthCache.timestamp : Infinity;
    const isCacheFresh = cacheAge < cacheTTL;

    if (isCacheFresh && healthCache.status !== null) {
      console.log(`[HealthAgent] ✅ Cache HIT - Status: ${healthCache.status} (age: ${Math.round(cacheAge / 1000)}s)`);
      return {
        status: healthCache.status as 'UP' | 'DOWN',
        cached: true,
        cacheAge: Math.round(cacheAge / 1000),
        timestamp: new Date(healthCache.timestamp!).toISOString(),
      };
    }

    // Step 2: Cache is stale or empty - make API call
    console.log(`[HealthAgent] 🔍 Cache MISS - Checking API: ${targetUrl}`);

    try {
      const response = await fetch(targetUrl, {
        method: 'GET',
        headers: { 'User-Agent': 'ServicePulse/1.0' },
        signal: AbortSignal.timeout(10000), // 10 second timeout
      });

      // Step 3: Determine status based on response
      const isUp = response.ok; // HTTP 200-299 = UP
      const newStatus = isUp ? 'UP' : 'DOWN';

      // Step 4: Update cache
      const statusChanged = healthCache.status !== null && healthCache.status !== newStatus;
      healthCache.status = newStatus;
      healthCache.timestamp = now;
      healthCache.lastError = null;

      // Step 5: Log result
      if (statusChanged) {
        console.log(`[HealthAgent] 🚨 STATUS CHANGE: ${healthCache.status} → ${newStatus}`);
      }
      console.log(`[HealthAgent] ${isUp ? '✅' : '❌'} API Response: ${response.status} - Status: ${newStatus}`);

      return {
        status: newStatus as 'UP' | 'DOWN',
        cached: false,
        httpStatus: response.status,
        timestamp: new Date(now).toISOString(),
        statusChanged,
      };
    } catch (error: any) {
      // Step 6: Handle errors (network issues, timeouts, etc.)
      console.error(`[HealthAgent] ❌ API Check FAILED: ${error.message}`);

      // Mark as DOWN on error
      const statusChanged = healthCache.status !== 'DOWN';
      healthCache.status = 'DOWN';
      healthCache.timestamp = now;
      healthCache.lastError = error.message;

      if (statusChanged) {
        console.log(`[HealthAgent] 🚨 STATUS CHANGE: Service is now DOWN (error)`);
      }

      return {
        status: 'DOWN' as const,
        cached: false,
        error: error.message,
        timestamp: new Date(now).toISOString(),
        statusChanged,
      };
    }
  },
});