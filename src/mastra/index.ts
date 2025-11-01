import { Mastra } from "@mastra/core/mastra";
import { PinoLogger } from "@mastra/loggers";
import { LibSQLStore } from "@mastra/libsql";

import { healthAgent } from "./agents/health-agent";
import { apiTestAgent } from "./agents/api-test-agent";
import { telexA2AHandler } from "./routes/telex-a2a-handler";

export const mastra = new Mastra({
  workflows: {},
  agents: { healthAgent, apiTestAgent }, // Only Mastra agents here
  scorers: {},
  storage: new LibSQLStore({
    url: ":memory:",
  }),
  logger: new PinoLogger({
    name: "Mastra",
    level: "info",
  }),
  telemetry: {
    enabled: false,
  },
  observability: {
    default: { enabled: true },
  },
  server: {
    apiRoutes: [telexA2AHandler]
  }
});
