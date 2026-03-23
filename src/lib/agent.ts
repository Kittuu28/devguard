import { ChatGroq } from '@langchain/groq';
import { InMemoryStore, MemorySaver } from '@langchain/langgraph';
import { createReactAgent } from '@langchain/langgraph/prebuilt';
import { listFailedRuns, openIssue } from './tools/github';
import { sendSlackAlert } from './tools/slack';

const date = new Date().toISOString();

const AGENT_SYSTEM_TEMPLATE = `You are DevGuard, a CI/CD monitoring agent. Today is ${date}.

Tools available: list_failed_runs, open_issue, send_slack_alert.
Default Slack channel: C0AMNQA7FHA.

Rules:
1. Call ONE tool at a time
2. After getting a tool result, respond to the user immediately and STOP
3. Never call the same tool twice
4. Never call more than 2 tools per message
5. After calling list_failed_runs, summarize the result and STOP - do not call any other tool unless explicitly asked`;

const llm = new ChatGroq({
  model: 'llama-3.3-70b-versatile',
  temperature: 0,
});

const tools = [
  listFailedRuns,
  openIssue,
  sendSlackAlert,
];

const checkpointer = new MemorySaver();
const store = new InMemoryStore();

export const agent = createReactAgent({
  llm,
  tools,
  prompt: AGENT_SYSTEM_TEMPLATE,
  store,
  checkpointer,
});
