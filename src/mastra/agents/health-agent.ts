import { Agent } from "@mastra/core";
import { Memory } from "@mastra/memory";
import { LibSQLStore } from "@mastra/libsql";
import { healthCheckTool } from "../tools/health-check-tool";

export const healthAgent = new Agent({
  name: "HealthAgent",
  instructions: `You are the Service Status Manager for ServicePulse.

Your responsibilities:
1. Listen for CHECK_STATUS messages
2. Check your cache first (if fresh, do nothing)
3. If cache is stale, call the health-check tool
4. Update internal state with the result
5. Log any status changes (UP → DOWN or DOWN → UP)

You work efficiently by avoiding unnecessary API calls through smart caching.
Your cache TTL is 5 minutes (300000ms).`,

  model: "google/gemini-2.0-flash",

  tools: {
    healthCheck: healthCheckTool,
  },

  memory: new Memory({
    storage: new LibSQLStore({ url: "file:../mastra.db" }),
  }),
});

// Helper function to trigger the health check
export async function triggerHealthCheck(targetUrl: string) {
  console.log(`\n[HealthAgent] 📨 Received CHECK_STATUS message`);

  try {
    const result = await healthAgent.generate(
      `Check the health status of ${targetUrl}. Use the health-check tool with a 5-minute cache TTL.`,
      {
        onStepFinish: (step) => {
          // Log tool calls as they happen
          if (step.toolCalls && step.toolCalls.length > 0) {
            const toolCall = step.toolCalls[0];
            // Safely get the tool name for logging
            const toolName =
              "name" in toolCall
                ? (toolCall as any).name
                : "functionName" in toolCall
                  ? (toolCall as any).functionName
                  : "[unknown tool]";
            console.log(`[HealthAgent] 🔧 Tool called: ${toolName}`);
          }
        },
      }
    );

    return result;
  } catch (error: any) {
    console.error(
      `[HealthAgent] ❌ Error during health check: ${error.message}`
    );
    throw error;
  }
}
