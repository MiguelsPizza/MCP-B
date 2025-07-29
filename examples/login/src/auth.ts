import { TabServerTransport } from '@mcp-b/transports';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

// Authentication state management
interface AuthState {
  isLoggedIn: boolean;
  username: string | null;
  server: McpServer | null;
  transport: TabServerTransport | null;
}

interface PersonalState {
  mood: string;
  currentProject: string;
  todoList: string[];
  favoriteColor: string;
  lastThought: string;
  visitCount: number;
}

const authState: AuthState = {
  isLoggedIn: false,
  username: null,
  server: null,
  transport: null,
};

const personalState: PersonalState = {
  mood: 'excited about MCP-B',
  currentProject: 'Building an AI-powered personal website',
  todoList: ['Learn MCP-B', 'Build cool tools', 'Show off to friends'],
  favoriteColor: '#6366f1',
  lastThought: 'This MCP-B thing is pretty amazing!',
  visitCount: 0,
};

// Show notification when AI calls a tool
function showNotification(
  message: string,
  type: 'success' | 'info' | 'warning' | 'error' = 'success'
) {
  const notification = document.createElement('div');
  notification.style.cssText = `
    position: fixed;
    top: 20px;
    right: 20px;
    background: ${type === 'success' ? '#22c55e' : type === 'error' ? '#ef4444' : type === 'warning' ? '#f59e0b' : '#3b82f6'};
    color: white;
    padding: 1rem 1.5rem;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    z-index: 1000;
    font-weight: 500;
    animation: slideIn 0.3s ease-out;
  `;

  // Add animation keyframes
  if (!document.querySelector('#notification-styles')) {
    const style = document.createElement('style');
    style.id = 'notification-styles';
    style.textContent = `
      @keyframes slideIn {
        from { transform: translateX(100%); opacity: 0; }
        to { transform: translateX(0); opacity: 1; }
      }
      @keyframes slideOut {
        from { transform: translateX(0); opacity: 1; }
        to { transform: translateX(100%); opacity: 0; }
      }
    `;
    document.head.appendChild(style);
  }

  notification.textContent = message;
  document.body.appendChild(notification);

  setTimeout(() => {
    notification.style.animation = 'slideOut 0.3s ease-in';
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

// Update the UI based on authentication state
function updateUI() {
  const loginBtn = document.querySelector<HTMLButtonElement>('#login-btn');
  const logoutBtn = document.querySelector<HTMLButtonElement>('#logout-btn');
  const statusIndicator = document.querySelector<HTMLSpanElement>('#status-indicator');
  const statusText = document.querySelector<HTMLSpanElement>('#status-text');
  const statusElement = document.getElementById('personal-status');

  if (!loginBtn || !logoutBtn || !statusIndicator || !statusText) {
    return;
  }

  if (authState.isLoggedIn) {
    loginBtn.disabled = true;
    logoutBtn.disabled = false;

    statusIndicator.className = 'status-indicator status-online';
    statusText.textContent = 'Online';
  } else {
    loginBtn.disabled = false;
    logoutBtn.disabled = true;

    statusIndicator.className = 'status-indicator status-offline';
    statusText.textContent = 'Offline';
    if (statusElement) {
      statusElement.innerHTML = ''; // Clear personal status when logged out
    }
  }
}

// Authentication logic
export async function performLogin(username?: string) {
  if (authState.isLoggedIn) {
    showNotification('Already logged in!', 'warning');
    return;
  }

  // Simulate login process
  const user = username || `user_${Math.floor(Math.random() * 1000)}`;

  authState.isLoggedIn = true;
  authState.username = user;

  await setupMcpServer();
  updateUI();
  showNotification(`Successfully logged in as ${user}`, 'success');

  console.log('Login successful:', {
    username: authState.username,
  });
}

export function performLogout() {
  if (!authState.isLoggedIn) {
    showNotification('Not currently logged in!', 'warning');
    return;
  }

  const previousUser = authState.username;

  // Clear auth state
  authState.isLoggedIn = false;
  authState.username = null;

  stopMcpServer();
  updateUI();
  showNotification(`Successfully logged out ${previousUser}`, 'success');

  console.log('Logout successful for user:', previousUser);
}

export function getAuthStatus() {
  return {
    ...authState,
  };
}

// Set up the authentication buttons
export function setupAuthButtons(
  loginElement: HTMLButtonElement,
  logoutElement: HTMLButtonElement
) {
  loginElement.addEventListener('click', () => performLogin());
  logoutElement.addEventListener('click', () => performLogout());

  // Initial UI update
  updateUI();
}

async function stopMcpServer() {
  if (!authState.server || !authState.transport) {
    console.warn('MCP Server is not running.');
    return;
  }

  // Notify that the server is shutting down
  console.log('[MCP Server] Shutting down...');

  await authState.transport.close();
  await authState.server.close();

  authState.server = null;
  authState.transport = null;
  authState.isLoggedIn = false;
  authState.username = null;

  personalState.mood = 'excited about MCP-B';
  personalState.currentProject = 'Building an AI-powered personal website';
  personalState.todoList = ['Learn MCP-B', 'Build cool tools', 'Show off to friends'];
  personalState.favoriteColor = '#6366f1';
  personalState.lastThought = 'This MCP-B thing is pretty amazing!';
  personalState.visitCount = 0;
}

export async function setupMcpServer() {
  if (authState.server) {
    console.warn('MCP Server is already set up.');
    return;
  }

  authState.transport = new TabServerTransport({ allowedOrigins: ['*'] });

  // Create a new MCP server instance
  authState.server = new McpServer(
    {
      name: 'PersonalAIWebsite',
      version: '1.0.0',
    },
    {
      capabilities: { tools: { listChanged: true } },
    }
  );

  authState.server.tool('ping', () => ({
    content: [{ type: 'text', text: 'pong' }],
  }));

  // Personal AI tools
  authState.server.tool(
    'updateMood',
    'Update my current mood and see it reflect on the page',
    {
      mood: z.string().describe("Your new mood (e.g., 'excited', 'focused', 'creative')"),
    },
    async ({ mood }) => {
      showNotification(`Updated mood to: ${mood}`);
      personalState.mood = mood;
      updatePersonalStatus();
      return {
        content: [
          { type: 'text', text: `Mood updated to: ${mood}. You can see it reflected on the page!` },
        ],
      };
    }
  );

  authState.server.tool(
    'addTodo',
    'Add a new item to my todo list',
    {
      item: z.string().describe('Todo item to add'),
    },
    async ({ item }) => {
      showNotification(`Added todo: ${item}`);
      personalState.todoList.push(item);
      updatePersonalStatus();
      return {
        content: [
          {
            type: 'text',
            text: `Added "${item}" to todo list. Total items: ${personalState.todoList.length}`,
          },
        ],
      };
    }
  );

  authState.server.tool(
    'recordThought',
    'Record my latest thought or insight',
    {
      thought: z.string().describe('Your current thought or insight'),
    },
    async ({ thought }) => {
      showNotification(`Recorded new thought`);
      personalState.lastThought = thought;
      updatePersonalStatus();
      return {
        content: [{ type: 'text', text: `Thought recorded: "${thought}"` }],
      };
    }
  );

  authState.server.tool(
    'setCurrentProject',
    'Update the current project I am working on',
    {
      project: z.string().describe('Name of the current project'),
    },
    async ({ project }) => {
      showNotification(`Updated current project to: ${project}`);
      personalState.currentProject = project;
      updatePersonalStatus();
      return {
        content: [{ type: 'text', text: `Current project updated to: ${project}` }],
      };
    }
  );

  authState.server.tool(
    'changeFavoriteColor',
    'Change my favorite color and update the page theme',
    {
      color: z.string().describe('New favorite color in hex format (e.g., #ff5733)'),
    },
    async ({ color }) => {
      showNotification(`Changed favorite color to: ${color}`);
      personalState.favoriteColor = color;
      document.documentElement.style.setProperty('--favorite-color', color);
      updatePersonalStatus();
      return {
        content: [{ type: 'text', text: `Favorite color changed to: ${color}` }],
      };
    }
  );

  authState.server.tool(
    'getMyStatus',
    'Get a complete overview of my current status',
    {},
    async () => {
      showNotification(`Generated status report`, 'info');
      return {
        content: [
          {
            type: 'text',
            text: `Current Status Report:
  🎭 Mood: ${personalState.mood}
  🚀 Project: ${personalState.currentProject}  
  📋 Todos: ${personalState.todoList.length} items (${personalState.todoList.join(', ')})
  🎨 Favorite Color: ${personalState.favoriteColor}
  💭 Last Thought: "${personalState.lastThought}"
  👀 Visits Today: ${personalState.visitCount}`,
          },
        ],
      };
    }
  );

  await authState.server.connect(authState.transport);
}

function updatePersonalStatus() {
  const statusElement = document.getElementById('personal-status');
  if (statusElement) {
    // Add some animation when updating
    statusElement.style.transform = 'scale(0.98)';
    statusElement.style.transition = 'all 0.3s ease';

    setTimeout(() => {
      statusElement.innerHTML = `
        <div style="background: linear-gradient(135deg, ${personalState.favoriteColor}20, #ffffff); padding: 20px; border-radius: 12px; margin: 20px 0; border: 2px solid ${personalState.favoriteColor}40; box-shadow: 0 4px 20px ${personalState.favoriteColor}20;">
          <h3 style="color: ${personalState.favoriteColor}; margin-top: 0;">🤖 My AI Assistant Status</h3>
          <div style="display: grid; gap: 12px;">
            <div style="background: white; padding: 12px; border-radius: 8px; border-left: 4px solid ${personalState.favoriteColor};">
              <strong>Current Mood:</strong> <span style="color: ${personalState.favoriteColor}; font-weight: bold;">${personalState.mood}</span>
            </div>
            <div style="background: white; padding: 12px; border-radius: 8px; border-left: 4px solid #10b981;">
              <strong>Working on:</strong> ${personalState.currentProject}
            </div>
            <div style="background: white; padding: 12px; border-radius: 8px; border-left: 4px solid #f59e0b;">
              <strong>Visits today:</strong> <span style="font-size: 1.2em; font-weight: bold;">${personalState.visitCount}</span>
            </div>
            <div style="background: white; padding: 12px; border-radius: 8px; border-left: 4px solid #8b5cf6;">
              <strong>Last thought:</strong> <em>"${personalState.lastThought}"</em>
            </div>
            <div style="background: white; padding: 12px; border-radius: 8px; border-left: 4px solid #ef4444;">
              <strong>Todo List (${personalState.todoList.length} items):</strong> 
              <ul style="margin: 8px 0 0 0; padding-left: 20px;">
                ${personalState.todoList
                  .map(
                    (item, _index) => `
                  <li style="margin: 4px 0; padding: 4px 8px; background: #f9fafb; border-radius: 4px;">
                    ${item}
                  </li>
                `
                  )
                  .join('')}
              </ul>
            </div>
          </div>
          <div style="margin-top: 16px; text-align: center; font-size: 0.9em; color: #6b7280;">
            🔄 Last updated: ${new Date().toLocaleTimeString()}
          </div>
        </div>
      `;
      statusElement.style.transform = 'scale(1)';
    }, 150);
  }
}
