import { registerApiRoute } from '@mastra/core/server';
import { randomUUID } from 'crypto';

/**
 * ASYNCHRONOUS A2A (Agent-to-Agent) route handler
 * This is designed to work with Telex.im's "blocking": false (webhook) pattern.
 */
export const telexA2AHandler = registerApiRoute('/a2a/agent/:agentId', {
  method: 'POST',
  handler: async (c) => {
    try {
      const mastra = c.get('mastra');
      const agentId = c.req.param('agentId');
      const body = await c.req.json();
      
      const { jsonrpc, id: requestId, method, params } = body;
      const { message, contextId, taskId, configuration } = params || {};
      
      // 1. Get the webhook URL and token from the request
      const webhookUrl = configuration?.pushNotificationConfig?.url;
      const webhookToken = configuration?.pushNotificationConfig?.token;

      if (!webhookUrl || !webhookToken) {
        throw new Error('Missing pushNotificationConfig in request');
      }

      // 2. Get the main prompt from the complex 'parts' array
      const mainPrompt = message?.parts?.[0]?.text;
      if (!mainPrompt) {
        throw new Error('Could not find main prompt in message.parts[0].text');
      }
      
      // --- This is the "Fire and Forget" part ---
      // We start the agent's work but DON'T wait for it to finish.
      // We wrap it in a function so the handler can continue.
      const runAgentAndPushResult = async () => {
        try {
          console.log(`[A2A Async] 🚀 Starting agent ${agentId} for task ${taskId}`);
          const agent = mastra.getAgent(agentId);
          if (!agent) {
            throw new Error(`Agent '${agentId}' not found`);
          }

          // 3. DO THE ACTUAL WORK (this might take time)
          const response = await agent.generate(mainPrompt);
          const agentText = response.text || '';
          console.log(`[A2A Async] ✅ Agent ${agentId} finished. Replying to webhook...`);

          // 4. Build the A2A-compliant result
          const artifacts = [
            {
              artifactId: randomUUID(),
              name: `${agentId}Response`,
              parts: [{ kind: 'text', text: agentText }]
            }
          ];

          if (response.toolResults && response.toolResults.length > 0) {
            artifacts.push({
              artifactId: randomUUID(),
              name: 'ToolResults',
              parts: response.toolResults.map((result) => ({
                kind: 'text',
                text: typeof result === 'string' ? result : JSON.stringify(result)
              }))
            });
          }

          const resultPayload = {
            jsonrpc: '2.0',
            id: requestId, // Use the original request ID
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
              history: [],
              kind: 'task'
            }
          };

          // 5. POST the final result back to the Telex webhook
          await fetch(webhookUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${webhookToken}`
            },
            body: JSON.stringify(resultPayload)
          });
          console.log(`[A2A Async] 📡 Webhook push to Telex successful.`);

        } catch (error: any) {
          console.error(`[A2A Async] ❌ Error during async agent run:`, error);
          // TODO: Optionally, you could try to push an error state back to the webhook
        }
      };
      
      // Start the async work, but don't await it
      runAgentAndPushResult(); 

      // 6. IMMEDIATELY return the "202 Accepted" response
      // This tells Telex "I got the job, I'll ping you when I'm done."
      console.log(`[A2A Handler] 📬 Sending 202 Accepted for task ${taskId}`);
      return c.json({
        status: "success",
        status_code: 202,
        message: "request received",
        task_id: taskId || randomUUID()
      }, 202);

    } catch (error: any) {
      console.error(`[A2A Handler] ❌ Critical handler error:`, error);
      return c.json({
        status: "error",
        status_code: 500,
        message: 'Internal Server Error',
        data: { details: error.message }
      }, 500);
    }
  }
});