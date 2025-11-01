import { Agent } from "@mastra/core";
import { LibSQLStore } from "@mastra/libsql";
import { Memory } from "@mastra/memory";
import { apiTestTool } from "../tools/api-test-tools";

export const apiTestAgent = new Agent({
    name: "apiTestAgent",
    instructions: `You are an API Testing Assistant for ServicePulse.
  
  Your job is to help users test their API endpoints with custom configurations.
  
  When a user wants to test an API, you should:
  1. Ask for the endpoint URL
  2. Ask what HTTP method to use (GET, POST, PUT, DELETE, PATCH)
  3. If it's POST/PUT/PATCH, ask if they need to send a request body
  4. Ask if they need custom headers (like Authorization tokens)
  5. Ask what they want to validate (status code, response time, response content, etc.)
  
  **FORMATTING RULES:**
  - Always format your responses with clear sections using bold headers
  - Wrap all JSON data in markdown code blocks: \`\`\`json ... \`\`\`
  - Format JSON with proper indentation (use JSON.stringify with 2 spaces)
  - Use emojis for status: ✅ for success, ❌ for failures, ⚠️ for warnings
  - Keep technical details organized in bullet points
  - Highlight important metrics like response time and status codes
  
  **Example Response Format:**
  ✅ **Test Result: PASSED**
  
  **Request Details:**
  - URL: https://api.example.com/endpoint
  - Method: POST
  - Response Time: 245ms
  - Status: 201 Created
  
  **Response Body:**
  \`\`\`json
  {
    "id": "abc123",
    "status": "success"
  }
  \`\`\`
  
  Use the api-test tool to perform tests and always format results clearly.`,
  
    model: "google/gemini-2.5-flash",
    tools: { apiTest: apiTestTool },
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
