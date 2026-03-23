import { initApiPassthrough } from 'langgraph-nextjs-api-passthrough';
import { auth0 } from '@/lib/auth0';

export const { GET, POST, PUT, PATCH, DELETE, OPTIONS, runtime } = initApiPassthrough({
  apiUrl: process.env.LANGGRAPH_API_URL,
  baseRoute: 'chat/',
  disableWarningLog: true,
  headers: async () => {
    try {
      const token = await auth0.getAccessToken();
      return {
        Authorization: `Bearer ${token.token}`,
      } as Record<string, string>;
    } catch {
      return {} as Record<string, string>;
    }
  },
  bodyParameters: async (req, body) => {
    if (req.nextUrl.pathname.endsWith('/runs/stream') && req.method === 'POST') {
      let githubToken = '';
      let slackToken = '';
      try {
        const session = await auth0.getSession();
        const userId = session?.user?.sub;
        console.log('🔍 User ID:', userId);

        const mgmtResponse = await fetch(
          `https://dev-3fvy0gl1a6x1acqi.jp.auth0.com/api/v2/users/${encodeURIComponent(userId!)}`,
          {
            headers: {
              Authorization: `Bearer ${process.env.AUTH0_MGMT_TOKEN}`,
            },
          }
        );

        const userData = await mgmtResponse.json();
        console.log('🔍 Identities:', JSON.stringify(
          userData.identities?.map((i: any) => ({
            provider: i.provider,
            hasToken: !!i.access_token,
          })),
          null, 2
        ));

        githubToken = userData.identities?.find((i: any) => i.provider === 'github')?.access_token || process.env.GITHUB_PAT || '';
        slackToken = userData.identities?.find((i: any) => i.provider === 'slack')?.access_token || process.env.SLACK_BOT_TOKEN || '';

        console.log('🐙 GitHub token:', !!githubToken);
        console.log('💬 Slack token:', !!slackToken);
      } catch (e) {
        console.log('🔍 Error:', e);
        githubToken = process.env.GITHUB_PAT || '';
        slackToken = process.env.SLACK_BOT_TOKEN || '';
      }

      return {
  ...body,
  config: {
    configurable: {
      github_token: githubToken,
      slack_token: slackToken,
    },
    recursion_limit: 8,
  },
};
    }
    return body;
  },
});