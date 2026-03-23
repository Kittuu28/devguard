import { tool } from '@langchain/core/tools';
import { z } from 'zod';
import { RunnableConfig } from '@langchain/core/runnables';

export const listFailedRuns = tool(
  async ({ owner, repo }: { owner: string; repo: string }, config?: RunnableConfig) => {
    console.log('🔧 RAW INPUT:', JSON.stringify({ owner, repo }));
    const accessToken = (config as any)?.configurable?.github_token;
    console.log('🔧 token exists:', !!accessToken);
    if (!accessToken) return "No GitHub token found.";

    const res = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/actions/runs?status=failure&per_page=5`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'User-Agent': 'DevGuard-Agent',
        },
      }
    );

    console.log('🐙 GitHub API status:', res.status);
    const responseText = await res.text();
    console.log('🐙 GitHub API response:', responseText.substring(0, 300));

    if (!res.ok) return `GitHub API error: ${res.status} - ${responseText.substring(0, 100)}`;

    const parsed = JSON.parse(responseText);
    const runs = parsed.workflow_runs?.map((r: any) => ({
      id: r.id,
      name: r.name,
      branch: r.head_branch,
      url: r.html_url,
      conclusion: r.conclusion,
    }));

    if (!runs || runs.length === 0) {
      return "No failed CI runs found in this repository.";
    }

    return JSON.stringify(runs);
  },
  {
    name: 'list_failed_runs',
    description: 'Lists recent failed GitHub Actions runs for a repo',
    schema: z.object({
      owner: z.string().describe('GitHub org or username'),
      repo: z.string().describe('Repository name'),
    }),
  }
);

export const openIssue = tool(
  async ({ owner, repo, title, body }: {
    owner: string;
    repo: string;
    title: string;
    body: string;
  }, config?: RunnableConfig) => {
    console.log('🔧 openIssue INPUT:', JSON.stringify({ owner, repo, title, body }));
    const accessToken = (config as any)?.configurable?.github_token;
    console.log('🔧 token exists:', !!accessToken);
    if (!accessToken) return "No GitHub token found.";

    const res = await fetch(
      `https://api.github.com/repos/${owner}/${repo}/issues`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'User-Agent': 'DevGuard-Agent',
        },
        body: JSON.stringify({ title, body }),
      }
    );

    console.log('🐙 GitHub issue API status:', res.status);
    if (!res.ok) {
      const errText = await res.text();
      return `GitHub API error: ${res.status} - ${errText.substring(0, 100)}`;
    }
    const issue = await res.json();
    return `Created issue #${issue.number}: ${issue.html_url}`;
  },
  {
    name: 'open_issue',
    description: 'Opens a GitHub issue to track a CI failure',
    schema: z.object({
      owner: z.string(),
      repo: z.string(),
      title: z.string(),
      body: z.string(),
    }),
  }
);