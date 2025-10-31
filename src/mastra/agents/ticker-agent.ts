import { triggerHealthCheck } from './health-agent';

export class TickerAgent {
  private intervalId: NodeJS.Timeout | null = null;
  private targetUrl: string;
  private intervalMs: number;
  private isRunning: boolean = false;

  constructor(targetUrl: string, intervalMs: number = 60000) {
    this.targetUrl = targetUrl;
    this.intervalMs = intervalMs;
  }

  // Start the ticker
  start() {
    if (this.isRunning) {
      console.log('[TickerAgent] ⚠️  Already running');
      return;
    }

    console.log(`[TickerAgent] ⏰ Starting... (interval: ${this.intervalMs / 1000}s)`);
    console.log(`[TickerAgent] 🎯 Target: ${this.targetUrl}\n`);

    this.isRunning = true;

    // Fire immediately on start
    this.tick();

    // Then fire at regular intervals
    this.intervalId = setInterval(() => {
      this.tick();
    }, this.intervalMs);
  }

  // Stop the ticker
  stop() {
    if (!this.isRunning) {
      console.log('[TickerAgent] ⚠️  Not running');
      return;
    }

    console.log('[TickerAgent] 🛑 Stopping...');
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    this.isRunning = false;
  }

  // The actual "tick" - sends CHECK_STATUS message
  private async tick() {
    const timestamp = new Date().toISOString();
    console.log(`[TickerAgent] ⏰ TICK at ${timestamp}`);
    console.log(`[TickerAgent] 📤 Sending CHECK_STATUS to HealthAgent...`);

    try {
      // Fire and forget - send message to HealthAgent
      await triggerHealthCheck(this.targetUrl);
    } catch (error: any) {
      console.error(`[TickerAgent] ❌ Failed to trigger health check: ${error.message}`);
    }

    console.log(`[TickerAgent] ✅ Message sent\n${'='.repeat(80)}\n`);
  }

  // Get current status
  getStatus() {
    return {
      running: this.isRunning,
      targetUrl: this.targetUrl,
      intervalMs: this.intervalMs,
      intervalSeconds: this.intervalMs / 1000,
    };
  }
}