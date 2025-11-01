# ServicePulse - AI-Powered API Testing & Monitoring Agent

ServicePulse is an intelligent AI agent built with the [Mastra framework](https://mastra.ai) and integrated with [Telex.im](https://telex.im) via the A2A (Agent-to-Agent) protocol. It provides interactive API testing and service health monitoring directly through conversational chat.

🔗 **Live Demo on Telex.im**: [Test it here](#) <!-- Add your Telex channel link -->

## 🎯 What It Does

ServicePulse helps developers and teams:

- **Test APIs interactively** through natural conversation
- **Configure comprehensive API tests** with custom headers, methods, and validation rules
- **Get instant feedback** on API responses with formatted results
- **Monitor service health** proactively with intelligent caching
- **Validate responses** against expectations (status codes, timing, content)

### Example Conversation

You: "Test my API at https://api.example.com/users with POST method"
ServicePulse: "I'll help you test that! What data should I send in the request body?"
You: "Send {"name": "John", "email": "john@example.com"} and expect status 201"
ServicePulse:
✅ Test Result: PASSED
Request Details:

URL: https://api.example.com/users
Method: POST
Response Time: 245ms
Status: 201 Created
{
"id": "user_123",
"name": "John",
"email": "john@example.com",
"created_at": "2025-11-01T15:30:00Z"
}

```

**Validations:** 1/1 passed
```

## 🚀 Features

### API Testing Assistant

- ✅ **Multiple HTTP Methods**: GET, POST, PUT, DELETE, PATCH
- ✅ **Custom Headers**: Authorization tokens, Content-Type, etc.
- ✅ **Request Body Support**: JSON payloads for POST/PUT/PATCH
- ✅ **Comprehensive Validation**:
  - Status code checking
  - Response time monitoring
  - Content validation (body contains/not contains)
  - Header verification
  - Response type validation (JSON, XML, HTML, text)
- ✅ **Intelligent Caching**: Prevents duplicate tests with configurable TTL
- ✅ **Formatted Results**: Clean, readable test reports

### Service Health Monitoring

- ✅ **Real-time Status Checks**: Monitor "UP" or "DOWN" status of endpoints
- ✅ **Status Change Alerts**: Automatic logging of status changes
- ✅ **Efficient Caching**: TTL-based cache to prevent excessive API calls

## 🏗️ Architecture

ServicePulse is built on the **Mastra framework** with a modular, extensible design.

### Tech Stack

- **Framework**: [Mastra](https://mastra.ai)
- **Language**: TypeScript
- **AI Model**: Google Gemini 2.5 Flash
- **Protocol**: A2A (Agent-to-Agent) via JSON-RPC 2.0
- **Integration**: Telex.im
- **Storage**: LibSQL (for agent memory)
- **Logging**: Pino

### Components

#### 🤖 Agents

**1. API Test Agent** (`apiTestAgent`)

- Guides users through setting up API tests
- Validates inputs and provides intelligent suggestions
- Executes tests using the API Test Tool
- Formats and presents results clearly

**2. Health Agent** (`healthAgent`)

- Monitors service health status
- Manages caching for efficiency
- Reports status changes

#### 🛠️ Tools

**1. API Test Tool** (`apiTestTool`)

- Executes HTTP requests with configurable parameters
- Supports all major HTTP methods
- Validates responses against user-defined expectations
- Returns structured results with detailed metrics

**2. Health Check Tool** (`healthCheckTool`)

- Performs HTTP GET requests to check endpoint status
- Implements in-memory caching with TTL
- Reports service availability

#### 🔄 A2A Integration

Custom route handler (`a2aAgentRoute`) that:

- Receives JSON-RPC 2.0 formatted requests from Telex.im
- Validates request structure
- Routes to appropriate Mastra agent
- Returns A2A-compliant responses with artifacts and history
- Handles errors gracefully

## 📦 Project Structure

```
service-pulse/
├── src/
│   ├── mastra/
│   │   ├── agents/
│   │   │   ├── api-test-agent.ts    # API testing agent definition
│   │   │   └── health-agent.ts      # Service health monitoring agent
│   │   ├── tools/
│   │   │   ├── api-test-tools.ts    # API testing tool implementation
│   │   │   └── health-check-tool.ts # Health check tool
│   │   ├── routes/
│   │   │   └── a2a-agent-route.ts   # A2A protocol handler
│   │   └── mastra.ts                # Main Mastra configuration
│   └── index.ts
├── README.md
├── package.json
└── tsconfig.json
```

## 🔧 Setup and Installation

### Prerequisites

- Node.js 18 or higher
- npm or pnpm
- Mastra CLI (`npm install -g @mastra/cli`)
- Telex.im account
- Google AI API key

### Installation Steps

1. **Clone the repository**:

```bash
   git clone https://github.com/yourusername/service-pulse.git
   cd service-pulse
```

2. **Install dependencies**:

```bash
   npm install
   # or
   pnpm install
```

3. **Configure environment variables**:
   Create a `.env` file in the root directory:

```env
   GOOGLE_GENERATIVE_AI_API_KEY=your_google_ai_api_key_here
```

4. **Build the project**:

```bash
   npm run build
```

5. **Run locally** (optional):

```bash
   npm start
```

6. **Deploy to Mastra Cloud**:

```bash
   mastra deploy
```

After deployment, you'll get a unique endpoint URL like:

```
   https://your-deployment.mastra.cloud/a2a/agent/apiTestAgent
```

## 🔗 Telex.im Integration

### Workflow Configuration

To integrate ServicePulse with Telex.im, create a new AI Co-Worker with the following workflow JSON:

```json
{
  "active": true,
  "category": "utilities",
  "description": "An intelligent assistant for API testing and validation",
  "id": "servicepulse_apitest",
  "name": "ServicePulse API Tester",
  "long_description": "\n      You are ServicePulse, an expert API testing assistant that helps users configure, execute, and validate API tests.\n\n      Your primary functions include:\n      - Guiding users through setting up comprehensive API tests\n      - Configuring endpoint URLs, HTTP methods (GET, POST, PUT, DELETE, PATCH), headers, and request bodies\n      - Setting up validation expectations including status codes, response times, and content validation\n      - Providing automated and scheduled API testing capabilities\n      - Analyzing test results and providing actionable insights\n      - Troubleshooting failed API tests and suggesting fixes\n\n      When interacting with users:\n      - Ask clarifying questions if test parameters are incomplete\n      - Provide step-by-step guidance for complex test setups\n      - Explain validation rules and best practices\n      - Keep responses clear, technical but accessible\n      - Always confirm test configurations before execution\n",
  "short_description": "Interactive assistant for comprehensive API testing and validation",
  "nodes": [
    {
      "id": "apitest_agent",
      "name": "ServicePulse API Testing Agent",
      "parameters": {
        "blocking": true
      },
      "position": [816, -112],
      "type": "a2a/mastra-a2a-node",
      "typeVersion": 1,
      "url": "https://your-deployment.mastra.cloud/a2a/agent/apiTestAgent"
    }
  ],
  "pinData": {},
  "settings": {
    "executionOrder": "v1"
  }
}
```

**Important**: Replace `https://your-deployment.mastra.cloud` with your actual Mastra deployment URL.

### How It Works

1. **User sends message** on Telex.im (e.g., "Test my API at https://api.example.com")
2. **Telex constructs A2A request** using JSON-RPC 2.0 format
3. **ServicePulse receives request** via the A2A handler
4. **Agent processes** the request and executes the API test
5. **Tool returns results** with detailed metrics and validation
6. **Agent formats response** in a user-friendly way
7. **Telex displays** the formatted response to the user

### A2A Protocol Details

ServicePulse implements the A2A protocol using JSON-RPC 2.0:

**Request Format:**

```json
{
  "jsonrpc": "2.0",
  "id": "request-001",
  "method": "message/send",
  "params": {
    "message": {
      "kind": "message",
      "role": "user",
      "parts": [{ "kind": "text", "text": "Test my API..." }],
      "messageId": "msg-001",
      "taskId": "task-001"
    },
    "configuration": {
      "blocking": true
    }
  }
}
```

**Response Format:**

```json
{
  "jsonrpc": "2.0",
  "id": "request-001",
  "result": {
    "id": "task-001",
    "contextId": "context-uuid",
    "status": {
      "state": "completed",
      "timestamp": "2025-11-01T15:30:00.000Z",
      "message": {
        "messageId": "response-uuid",
        "role": "agent",
        "parts": [{"kind": "text", "text": "Test results..."}],
        "kind": "message"
      }
    },
    "artifacts": [...],
    "history": [...]
  }
}
```

## 💻 Usage Examples

### Interactive Testing (via Telex.im)

Simply chat with ServicePulse on Telex.im:

```
"Test my login endpoint at https://api.myapp.com/auth/login"

"Make a POST request to https://api.example.com/users with this body:
{
  "name": "Alice",
  "email": "alice@example.com"
}
Expected status: 201"

"Check if https://api.service.com/health responds within 500ms"
```

### Programmatic Testing (TypeScript)

You can also use ServicePulse programmatically:

```typescript
import { runAPITest } from "./src/mastra/agents/api-test-agent";

// Example: Test a POST endpoint
await runAPITest({
  url: "https://jsonplaceholder.typicode.com/posts",
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    Authorization: "Bearer your-token",
  },
  body: JSON.stringify({
    title: "Test Post",
    body: "Test content",
    userId: 1,
  }),
  expectations: {
    statusCode: 201,
    maxResponseTime: 1000,
    bodyContains: ['"id":'],
    requiredHeaders: ["content-type"],
    responseType: "json",
  },
});

// Example: Test a GET endpoint
await runAPITest({
  url: "https://api.github.com/users/octocat",
  method: "GET",
  expectations: {
    statusCode: 200,
    maxResponseTime: 2000,
    bodyContains: ["login", "octocat"],
  },
});
```

### Service Health Monitoring

```typescript
import { triggerHealthCheck } from "./src/mastra/agents/health-agent";

// Monitor an endpoint
await triggerHealthCheck("https://api.example.com/health");
```

## 🧪 Testing

To test the A2A endpoint directly:

```bash
curl -X POST https://your-deployment.mastra.cloud/a2a/agent/apiTestAgent \
  -H "Content-Type: application/json" \
  -d '{
    "jsonrpc": "2.0",
    "id": "test-001",
    "method": "message/send",
    "params": {
      "message": {
        "kind": "message",
        "role": "user",
        "parts": [
          {
            "kind": "text",
            "text": "Test my API at https://jsonplaceholder.typicode.com/posts/1"
          }
        ],
        "messageId": "msg-001",
        "taskId": "task-001"
      },
      "configuration": {
        "blocking": true
      }
    }
  }'
```

## 🐛 Debugging

### View Agent Logs

To view interaction logs on Telex.im:

```
https://api.telex.im/agent-logs/{channel-id}.txt
```

### Common Issues

**Issue**: Agent not responding

- ✅ Check that agent name matches exactly: `apiTestAgent`
- ✅ Verify deployment is active on Mastra Cloud
- ✅ Check Mastra logs for errors

**Issue**: "Agent not found" error

- ✅ Ensure URL in workflow JSON matches deployment URL
- ✅ Verify agent is registered in `mastra.ts`

**Issue**: Response formatting issues

- ✅ Check that tool results are properly formatted
- ✅ Verify agent instructions include formatting rules

## 🎯 API Reference

### Agent Endpoints

**Base URL**: `https://your-deployment.mastra.cloud`

**Endpoint**: `/a2a/agent/:agentId`

**Method**: POST

**Agents Available**:

- `apiTestAgent` - API testing assistant
- `healthAgent` - Service health monitor

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 🔗 Links

- **Live Demo**: [Telex.im Channel](#) <!-- Add your channel -->
- **Blog Post**: [Read about the development process](#) <!-- Add your blog post -->
- **Mastra Documentation**: https://docs.mastra.ai
- **Telex.im**: https://telex.im
- **A2A Protocol**: https://docs.telex.im/a2a

## 👨‍💻 Author

**Oluwatise Ajayi**

- GitHub: [@yourusername](https://github.com/yourusername)
- Telex.im: [Your profile]
- Twitter: [@yourhandle](https://twitter.com/yourhandle)

---

Built with ❤️ using [Mastra](https://mastra.ai) for the HNG Internship Stage 3 Backend Challenge.

**Tags**: #AI #APITesting #Mastra #TelexIM #HNGInternship #AgentToAgent #A2A
