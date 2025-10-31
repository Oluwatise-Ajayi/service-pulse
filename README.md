# ServicePulse

ServicePulse is a robust application built with the Mastra framework, designed to provide intelligent services for service health monitoring and API testing. It leverages AI agents and specialized tools to deliver dynamic and efficient responses.

## Features

### Service Health Monitoring
The application includes a proactive service health monitoring system.
-   **Real-time Status Checks**: Monitors the "UP" or "DOWN" status of specified API endpoints.
-   **Intelligent Caching**: Utilizes a configurable time-to-live (TTL) cache to prevent excessive API calls, ensuring efficiency.
-   **Status Change Alerts**: Logs and reports any changes in service status.

### API Testing
ServicePulse provides an interactive assistant for API testing.
-   **Configurable Tests**: Users can define custom API tests, specifying the endpoint URL, HTTP method, headers, request body, and validation expectations (e.g., status code, response time, content).
-   **Guided Testing**: The API Testing Assistant guides users through the process of setting up comprehensive tests.
-   **Automated Testing**: Supports automated or scheduled API tests via programmatic configuration.

## Architecture

ServicePulse is built upon the **Mastra framework**, which facilitates the creation of AI-powered applications through a modular and extensible architecture.

### Agents
Agents are intelligent entities that process requests and utilize tools to achieve their goals.
-   **`Health Agent`**: Functions as the Service Status Manager, responsible for monitoring the health of external services, managing a cache, and logging status changes.
-   **`API Test Agent`**: Guides users through the process of setting up and executing API tests, leveraging the `apiTestTool` to perform the actual checks and report results.

### Workflows
Currently, there are no workflows configured in the main Mastra instance.

### Tools
Tools are specialized functionalities that agents can invoke.
-   **`Health Check Tool`**: Performs HTTP `GET` requests to a `targetUrl` to determine its operational status, incorporating an in-memory cache to optimize performance.
-   **`API Test Tool`**: Executes configurable API calls (GET, POST, PUT, DELETE, PATCH) to a specified `url` with custom `headers` and `body`, and validates the response against `expectations` (status code, response time, body content, etc.).

### Scorers
Currently, there are no scorers configured in the main Mastra instance.

### Storage
-   **`LibSQLStore`**: Used for persistent storage, enabling agents to retain memory across interactions. The in-memory option is used for rapid prototyping, while a file-based store (`file:../mastra.db`) is used for persistent agent memory.

### Logger
-   **`PinoLogger`**: Provides efficient and structured logging for the application, aiding in debugging and monitoring.

## Setup and Installation

To get ServicePulse up and running, follow these steps:

1.  **Clone the repository**:
    ```bash
    git clone [your-repository-url]
    cd service-pulse
    ```
2.  **Install dependencies**:
    ```bash
    npm install
    ```
3.  **Run the application**:
    ```bash
    npm start
    ```
    *(Note: Specific environment variables or further configuration might be required depending on your deployment setup.)*

##ENV
`GOOGLE_GENERATIVE_AI_API_KEY=toBeModified`


## Usage Examples

Here's how you might interact with the various agents (these are illustrative examples based on the agent instructions):

### Service Health Monitoring
```typescript
// Example of triggering a health check
import { triggerHealthCheck } from './src/mastra/agents/health-agent';
triggerHealthCheck('https://api.example.com/health');
```

### API Testing
```typescript
// Example of running an API test
import { runAPITest } from './src/mastra/agents/api-test-agent';

runAPITest({
  url: 'https://jsonplaceholder.typicode.com/posts',
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ title: 'foo', body: 'bar', userId: 1 }),
  expectations: {
    statusCode: 201,
    bodyContains: ['"id":'],
  },
});
```
