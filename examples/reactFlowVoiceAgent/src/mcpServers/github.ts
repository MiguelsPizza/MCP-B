import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';



// Helper functions
async function makeGitHubRequest(url: string) {
  try {
    const response = await fetch(url, {
      headers: {
        'Accept': 'application/vnd.github.v3+json',
        'User-Agent': 'MCP-GitHub-Client/1.0'
      }
    });
    
    if (!response.ok) {
      console.error(`GitHub API error: ${response.status} ${response.statusText}`);
      return null;
    }
    
    return await response.json();
  } catch (error) {
    console.error('Error making GitHub request:', error);
    return null;
  }
}



// GITHUB MCP SERVER
export function createMcpServer(): McpServer {
  const server = new McpServer({
    name: "github-mcp",
    version: "1.0.0",
    capabilities: {
      tools: {},
      resources: {},
      prompts: {},
    },
  });

  // Get repository information
  server.tool(
    'get_repo_info',
    {
      owner: z.string().describe('GitHub username or organization name'),
      repo: z.string().describe('Repository name')
    },
    async ({ owner, repo }) => {
      console.log(`📁 GitHub: Getting repo info for ${owner}/${repo}`);
      
      const repoData = await makeGitHubRequest(`https://api.github.com/repos/${owner}/${repo}`);
      
      if (!repoData) {
        return {
          content: [{
            type: 'text',
            text: `❌ Could not find repository "${owner}/${repo}". Make sure the repository exists and is public.`
          }]
        };
      }

      const repoInfo = [
        `📁 **${repoData.full_name}**`,
        `📝 Description: ${repoData.description || 'No description'}`,
        `🌟 Stars: ${repoData.stargazers_count}`,
        `🍴 Forks: ${repoData.forks_count}`,
        `📊 Language: ${repoData.language || 'Not specified'}`,
        `📅 Created: ${new Date(repoData.created_at).toLocaleDateString()}`,
        `🔗 URL: ${repoData.html_url}`,
        `📦 Size: ${repoData.size} KB`,
        `${repoData.private ? '🔒 Private' : '🌍 Public'}`
      ].join('\n');

      return {
        content: [{
          type: 'text',
          text: repoInfo
        }]
      };
    }
  );

  // List user repositories
  server.tool(
    'list_user_repos',
    {
      username: z.string().describe('GitHub username to list repositories for')
    },
    async ({ username }) => {
      console.log(`📚 GitHub: Listing repos for user ${username}`);
      
      const reposData = await makeGitHubRequest(`https://api.github.com/users/${username}/repos?sort=updated&per_page=10`);
      
      if (!reposData || !Array.isArray(reposData)) {
        return {
          content: [{
            type: 'text',
            text: `❌ Could not find user "${username}" or failed to fetch repositories.`
          }]
        };
      }

      if (reposData.length === 0) {
        return {
          content: [{
            type: 'text',
            text: `📚 User "${username}" has no public repositories.`
          }]
        };
      }

      const reposList = reposData.map((repo: any) => 
        `📁 **${repo.name}** (⭐ ${repo.stargazers_count}) - ${repo.description || 'No description'}`
      ).join('\n');

      return {
        content: [{
          type: 'text',
          text: `📚 Recent repositories for ${username}:\n\n${reposList}`
        }]
      };
    }
  );

  // Get repository issues
  server.tool(
    'get_repo_issues',
    {
      owner: z.string().describe('GitHub username or organization name'),
      repo: z.string().describe('Repository name'),
      state: z.enum(['open', 'closed', 'all']).optional().describe('Issue state filter (default: open)')
    },
    async ({ owner, repo, state = 'open' }) => {
      console.log(`🐛 GitHub: Getting ${state} issues for ${owner}/${repo}`);
      
      const issuesData = await makeGitHubRequest(`https://api.github.com/repos/${owner}/${repo}/issues?state=${state}&per_page=10`);
      
      if (!issuesData || !Array.isArray(issuesData)) {
        return {
          content: [{
            type: 'text',
            text: `❌ Could not fetch issues for "${owner}/${repo}". Repository may not exist or be private.`
          }]
        };
      }

      if (issuesData.length === 0) {
        return {
          content: [{
            type: 'text',
            text: `🎉 No ${state} issues found for "${owner}/${repo}".`
          }]
        };
      }

      const issuesList = issuesData.map((issue: any) => {
        const labels = issue.labels.map((label: any) => label.name).join(', ');
        return [
          `🐛 **#${issue.number}: ${issue.title}**`,
          `👤 By: ${issue.user.login}`,
          `📅 Created: ${new Date(issue.created_at).toLocaleDateString()}`,
          `🏷️ Labels: ${labels || 'None'}`,
          `🔗 ${issue.html_url}`,
          '---'
        ].join('\n');
      }).join('\n');

      return {
        content: [{
          type: 'text',
          text: `🐛 ${state.charAt(0).toUpperCase() + state.slice(1)} issues for ${owner}/${repo}:\n\n${issuesList}`
        }]
      };
    }
  );

  // Search repositories
  server.tool(
    'search_repos',
    {
      query: z.string().describe('Search query for repositories (e.g., "react typescript")')
    },
    async ({ query }) => {
      console.log(`🔍 GitHub: Searching repositories for "${query}"`);
      
      const encodedQuery = encodeURIComponent(query);
      const searchData = await makeGitHubRequest(`https://api.github.com/search/repositories?q=${encodedQuery}&sort=stars&order=desc&per_page=5`);
      
      if (!searchData || !searchData.items || !Array.isArray(searchData.items)) {
        return {
          content: [{
            type: 'text',
            text: `❌ Failed to search repositories for "${query}".`
          }]
        };
      }

      if (searchData.items.length === 0) {
        return {
          content: [{
            type: 'text',
            text: `🔍 No repositories found for "${query}".`
          }]
        };
      }

      const reposList = searchData.items.map((repo: any) => 
        `📁 **${repo.full_name}** (⭐ ${repo.stargazers_count})\n📝 ${repo.description || 'No description'}\n🔗 ${repo.html_url}`
      ).join('\n\n---\n\n');

      return {
        content: [{
          type: 'text',
          text: `🔍 Top repositories for "${query}":\n\n${reposList}`
        }]
      };
    }
  );

  return server;
}