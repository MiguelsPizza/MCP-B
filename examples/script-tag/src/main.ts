// Super Simple MCP-B Script Tag Demo
// Just add one script tag and get AI superpowers!

// The @mcp-b/global package is loaded via script tag in the HTML
// This gives us window.mcp automatically when the page loads
// types.ts

import type { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';

declare global {
  interface Window {
    mcp: McpServer;
  }
}

import { z } from 'zod';

// Simple todo state
const todos = ['Learn MCP-B', 'Chat with AI', 'See it work!'];

// Show big popup when AI acts
function showAIAction(action: string, details: string) {
  const popup = document.createElement('div');
  popup.style.cssText = `
    position: fixed; top: 50%; left: 50%; transform: translate(-50%, -50%);
    background: #4CAF50; color: white; padding: 30px; border-radius: 20px;
    font-size: 20px; font-weight: bold; z-index: 9999; text-align: center;
    box-shadow: 0 20px 60px rgba(0,0,0,0.5); border: 4px solid white;
  `;
  popup.innerHTML = `🤖 ${action}<br><small>${details}</small>`;
  document.body.appendChild(popup);
  setTimeout(() => popup.remove(), 3000);
}

// Render todos
function renderTodos() {
  const list = document.getElementById('todos');
  if (!list) return;
  list.innerHTML = todos
    .map(
      (todo, i) =>
        `<div class="todo">${i + 1}. ${todo} <button onclick="deleteTodo(${i})">❌</button></div>`
    )
    .join('');
}

// Todo functions
function addTodo(text?: string) {
  if (!text) {
    const input = document.getElementById('input') as HTMLInputElement;
    text = input?.value.trim();
    if (input) input.value = '';
  }
  if (text) {
    todos.push(text);
    renderTodos();
    return text;
  }
  return null;
}

function deleteTodo(index: number) {
  const deleted = todos.splice(index, 1)[0];
  renderTodos();
  return deleted;
}

// Wait for MCP then register tools
function registerMCPTools() {
  // Add todo tool
  const test = window.mcp.registerTool(
    'addTodo',
    {
      title: 'Add Todo',
      description: 'Add a new todo item',
      inputSchema: { text: z.string().describe('Todo text to add') },
    },
    async ({ text }) => {
      showAIAction('Adding Todo', `"${text}"`);
      const result = addTodo(text);
      return { content: [{ type: 'text', text: result ? `✅ Added: "${result}"` : '❌ Failed' }] };
    }
  );
  console.log('test', test);

  // Get todos tool
  window.mcp.registerTool(
    'getTodos',
    {
      title: 'Get Todos',
      description: 'Get all current todos',
    },
    async () => {
      showAIAction('Getting Todos', `${todos.length} items`);
      return { content: [{ type: 'text', text: `📋 Todos: ${JSON.stringify(todos)}` }] };
    }
  );

  // Delete todo tool
  window.mcp.registerTool(
    'deleteTodo',
    {
      title: 'Delete Todo',
      description: 'Delete a todo by index (1-based)',
      inputSchema: { index: z.number().describe('Todo number (1, 2, 3...)') },
    },
    async ({ index }) => {
      const i = index - 1; // Convert to 0-based
      if (i >= 0 && i < todos.length) {
        const deleted = deleteTodo(i);
        showAIAction('Deleted Todo', `"${deleted}"`);
        return { content: [{ type: 'text', text: `🗑️ Deleted: "${deleted}"` }] };
      }
      return { content: [{ type: 'text', text: `❌ Todo ${index} not found` }] };
    }
  );

  // Simple calculator
  window.mcp.registerTool(
    'calculate',
    {
      title: 'Calculator',
      description: 'Do simple math calculations',
      inputSchema: { expression: z.string().describe('Math expression like "2+2" or "15*23"') },
    },
    async ({ expression }) => {
      showAIAction('Calculating', expression);
      try {
        const result = Function(`return ${expression}`)();
        return { content: [{ type: 'text', text: `🧮 ${expression} = ${result}` }] };
      } catch (e) {
        return { content: [{ type: 'text', text: `❌ Math error: ${e}` }] };
      }
    }
  );

  // Status update
  const status = document.getElementById('status');
  if (status) {
    status.innerHTML = '✅ MCP Ready! 4 AI tools active';
    status.style.background = '#d4edda';
    status.style.color = '#155724';
  }

  console.log('🎉 MCP tools ready!');
}

// Initialize
document.addEventListener('DOMContentLoaded', async () => {
  await new Promise((resolve) => setTimeout(resolve, 1000));
  renderTodos();
  registerMCPTools();
});
