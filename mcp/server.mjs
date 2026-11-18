import Anthropic from '@anthropic-ai/sdk';
import { McpServer } from '@modelcontextprotocol/server';
import { serveStdio } from '@modelcontextprotocol/server/stdio';
import * as z from 'zod/v4';

const server = new McpServer({ name: 'amtrak-prototype-claude', version: '1.0.0' });

server.registerTool(
  'ask_claude',
  {
    description:
      'Send a prompt to Claude through the Anthropic API. Use this for an independent Claude response or analysis; include relevant prototype context in the prompt.',
    inputSchema: z.object({
      prompt: z.string().min(1).max(20000).describe('The question or instruction for Claude.'),
      context: z
        .string()
        .max(20000)
        .optional()
        .describe('Optional relevant project context to include with the prompt.'),
    }),
  },
  async ({ prompt, context }) => {
    const model = process.env.CLAUDE_MODEL;
    if (!model) {
      return {
        content: [{ type: 'text', text: 'Configuration error: set CLAUDE_MODEL in mcp/.env.' }],
        isError: true,
      };
    }

    try {
      const client = new Anthropic();
      const message = await client.messages.create({
        model,
        max_tokens: 2048,
        messages: [
          {
            role: 'user',
            content: context ? `Context:\n${context}\n\nRequest:\n${prompt}` : prompt,
          },
        ],
      });
      const answer = message.content
        .filter((block) => block.type === 'text')
        .map((block) => block.text)
        .join('\n');

      return { content: [{ type: 'text', text: answer || '(Claude returned no text.)' }] };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown Anthropic API error.';
      return { content: [{ type: 'text', text: `Claude API request failed: ${message}` }], isError: true };
    }
  },
);

// MCP uses stdout for its protocol; diagnostics must go to stderr.
void serveStdio(server).catch((error) => {
  console.error('Claude MCP server failed to start:', error);
  process.exitCode = 1;
});
