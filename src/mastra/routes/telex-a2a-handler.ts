import { registerApiRoute } from '@mastra/core/server';
import { randomUUID } from 'crypto';

/**
 * This is your custom A2A (Agent-to-Agent) route handler.
 * It's specifically designed to understand the new Telex.im message format.
 */
export const telexA2AHandler = registerApiRoute('/a2a/agent/:agentId', {
  method: 'POST',
  handler: async (c) => {
    try {
      const mastra = c.get('mastra');
      const agentId = c.req.param('agentId');

      // 1. Parse the JSON-RPC request from Telex
      const body = await c.req.json();
      const { jsonrpc, id: requestId, method, params } = body;

      // 2. Validate the request
      if (jsonrpc !== '2.0' || !requestId) {
        return c.json({
          jsonrpc: '2.0',
          id: requestId || null,
          error: { code: -32600, message: 'Invalid Request: jsonrpc must be "2.0" and id is required' }
        }, 400);
      }

      // 3. Find the agent (e.g., 'apiTestAgent')
      const agent = mastra.getAgent(agentId);
      if (!agent) {
        return c.json({
          jsonrpc: '2.0',
          id: requestId,
          error: { code: -32602, message: `Agent '${agentId}' not found` }
        }, 404);
      }

      // 4. --- THIS IS THE CRITICAL NEW LOGIC ---
      // Telex now sends the main prompt in parts[0] and history in parts[1].
      // We ONLY want the main prompt from parts[0].
      // We will let Mastra's own Memory module handle the history.
      
      const { message, contextId, taskId } = params || {};
      const mainPrompt = message?.parts?.[0]?.text;

      if (!mainPrompt) {
        return c.json({
          jsonrpc: '2.0',
          id: requestId,
          error: { code: -32600, message: 'Invalid Request: Could not find main prompt in message.parts[0].text' }
        }, 400);
      }

      // 5. Execute the agent with just the clean, main prompt
      // Mastra will automatically fetch the history from its own database.
      console.log(`[Telex A2A] Executing ${agentId} with prompt: "${mainPrompt}"`);
      const response = await agent.generate(mainPrompt);
      const agentText = response.text || '';

      // 6. Build the successful A2A-compliant response
      const artifacts = [
        {
          artifactId: randomUUID(),
          name: `${agentId}Response`,
          parts: [{ kind: 'text', text: agentText }]
        }
      ];

      // Add tool results as artifacts (super useful for debugging)
      if (response.toolResults && response.toolResults.length > 0) {
        artifacts.push({
          artifactId: randomUUID(),
          name: 'ToolResults',
          parts: response.toolResults.map((result) => ({
            kind: 'text',
            text: JSON.stringify(result)
          }))
        });
      }

      return c.json({
        jsonrpc: '2.0',
        id: requestId,
        result: {
          id: taskId || randomUUID(),
          contextId: contextId || randomUUID(),
          status: {
            state: 'completed',
            timestamp: new Date().toISOString(),
            message: {
              messageId: randomUUID(),
              role: 'agent',
              parts: [{ kind: 'text', text: agentText }],
              kind: 'message'
            }
          },
          artifacts,
          history: [], // We let Mastra handle history
          kind: 'task'
        }
      });

    } catch (error: any) {
      console.error('[Telex A2A] Internal Error:', error);
      return c.json({
        jsonrpc: '2.0',
        id: null,
        error: {
          code: -32603,
          message: 'Internal error',
          data: { details: error.message }
        }
      }, 500);
    }
  }
});
