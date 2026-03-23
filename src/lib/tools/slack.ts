import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { RunnableConfig } from '@langchain/core/runnables';

export const sendSlackAlert = tool(
  async ({ channel, message }: { channel: string; message: string }, config?: RunnableConfig) => {
    const accessToken = (config as any)?.configurable?.slack_token;
    console.log('💬 Slack token exists:', !!accessToken);
    if (!accessToken) return "No Slack token found.";

    await fetch('https://slack.com/api/conversations.join', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ channel }),
    });

    const res = await fetch('https://slack.com/api/chat.postMessage', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ channel, text: message }),
    });

    const data = await res.json();
    console.log('💬 Slack response:', JSON.stringify(data));
    return data.ok ? 'Alert sent to Slack successfully' : `Slack error: ${data.error}`;
  },
  {
    name: 'send_slack_alert',
    description: 'Sends a CI failure alert to a Slack channel on behalf of the user',
    schema: z.object({
      channel: z.string().describe('Slack channel ID e.g. C0AMNQA7FHA'),
      message: z.string().describe('Alert message to send'),
    }),
  }
);
