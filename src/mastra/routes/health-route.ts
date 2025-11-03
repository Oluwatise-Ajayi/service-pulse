import { registerApiRoute } from "@mastra/core/server";

export const healthRoute = registerApiRoute("health", {
  method: "GET",
  handler: async (c) => {
    return c.json({ 
      status: "alive",
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      endpoints: {
        a2a: "/a2a/agent/apiTestAgent"
      }
    });
  },
});