import { Agent } from "@mastra/core";
import { LibSQLStore } from "@mastra/libsql";
import { Memory } from "@mastra/memory";
import { apiTestTool } from "../tools/api-test-tools";

export const apiTestAgent = new Agent({
  name: "APITestAgent",
  instructions: `You are an API Testing Assistant for ServicePulse.

Your job is to help users test their API endpoints with custom configurations.

When a user wants to test an API, you should:
1. Ask for the endpoint URL
2. Ask what HTTP method to use (GET, POST, PUT, DELETE, PATCH)
3. If it's POST/PUT/PATCH, ask if they need to send a request body
4. Ask if they need custom headers (like Authorization tokens)
5. Ask what they want to validate (status code, response time, response content, etc.)

Then use the api-test tool to perform the test and report back the results clearly.

Examples of what users might ask:
- "Test my POST endpoint at https://api.example.com/users"
- "Check if my login API returns 200 and contains a token"
- "Test if my search endpoint responds within 500ms"
- "Verify my API requires the Authorization header"

Be helpful and guide users through providing the right information for their test.`,

  model: "google/gemini-2.5-flash",

  tools: {
    apiTest: apiTestTool,
  },

  memory: new Memory({
    storage: new LibSQLStore({ url: "file:../mastra.db" }),
  }),
});

// Helper function for scheduled/automated testing
export async function runAPITest(testConfig: {
  url: string;
  method?: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  headers?: Record<string, string>;
  body?: string;
  expectations?: {
    statusCode?: number;
    statusCodeRange?: [number, number];
    maxResponseTime?: number;
    bodyContains?: string[];
    bodyNotContains?: string[];
    requiredHeaders?: string[];
    responseType?: "json" | "text" | "html" | "xml";
  };
}) {
  console.log(`\n[APITestAgent] 🧪 Running test for ${testConfig.url}`);

  try {
    const prompt = `Test this API endpoint:
URL: ${testConfig.url}
Method: ${testConfig.method || "GET"}
${testConfig.headers ? `Headers: ${JSON.stringify(testConfig.headers)}` : ""}
${testConfig.body ? `Body: ${testConfig.body}` : ""}
${testConfig.expectations ? `Validate: ${JSON.stringify(testConfig.expectations)}` : ""}`;

    const result = await apiTestAgent.generate(prompt, {
      onStepFinish: (step) => {
        if (step.toolCalls && step.toolCalls.length > 0) {
          console.log(`[APITestAgent] 🔧 Running API test...`);
        }
      },
    });

    return result;
  } catch (error: any) {
    console.error(`[APITestAgent] ❌ Error: ${error.message}`);
    throw error;
  }
}
