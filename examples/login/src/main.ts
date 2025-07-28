import { setupAuthButtons } from './auth.ts';
import './style.css';

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div>
    <!-- Header with title on left and status/controls on right -->
    <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2rem; flex-wrap: wrap; gap: 1rem;">
      <div style="text-align: left;">
        <h1 style="background: linear-gradient(135deg, #6366f1, #8b5cf6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-size: 3rem; margin: 0;">
          🤖 My AI-Powered Website
        </h1>
        <p style="font-size: 1.2rem; color: #6b7280; margin: 0.5rem 0 0 0;">
          Built with MCP-B • AI tools that actually work in your browser
        </p>
      </div>
      
      <!-- Status and Controls in top right -->
      <div style="display: flex; align-items: center; gap: 1rem; background: #f8fafc; padding: 1rem 1.5rem; border-radius: 12px; border: 2px solid #e2e8f0;">
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <span id="status-indicator" class="status-indicator status-offline"></span>
          <span id="status-text" style="font-weight: 500; color: #1e293b;">Offline</span>
        </div>
        <div style="display: flex; gap: 0.5rem;">
          <button id="login-btn" type="button" class="login-btn">🔑 Login</button>
          <button id="logout-btn" type="button" class="logout-btn" disabled>🚪 Logout</button>
        </div>
      </div>
    </div>
    
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin: 2rem 0;">
      <div style="background: #f8fafc; padding: 1.5rem; border-radius: 12px; border: 2px solid #e2e8f0;">
        <h3 style="color: #1e293b; margin-top: 0;">🎯 How This Works</h3>
        <ol style="color: #475569; line-height: 1.6;">
          <li>Install the MCP-B browser extension</li>
          <li>Visit this page (you're here!)</li>
          <li>Click the 🔑 Login button to start the MCP Server</li>
          <li>Open the extension and see the tools</li>
          <li>Click the 🚪 Logout button to stop the MCP Server</li>
        </ol>
      </div>
      
      <div style="background: #f0f9ff; padding: 1.5rem; border-radius: 12px; border: 2px solid #bae6fd;">
        <h3 style="color: #0c4a6e; margin-top: 0;">🛠️ Available Tools</h3>
        <ul style="color: #0369a1; line-height: 1.6; font-size: 0.9rem;">
          <li><strong>updateMood</strong> - Change my mood</li>
          <li><strong>setCurrentProject</strong> - Update what I'm working on</li>
          <li><strong>addTodo</strong> - Add items to my todo list</li>
          <li><strong>changeFavoriteColor</strong> - Change the page theme</li>
          <li><strong>recordThought</strong> - Save a thought</li>
          <li><strong>getMyStatus</strong> - Get full status report</li>
        </ul>
      </div>
    </div>

    <!-- Personal Status Area - populated when logged in -->
    <div id="personal-status"></div>

  </div>
`;

setupAuthButtons(
  document.querySelector<HTMLButtonElement>('#login-btn')!,
  document.querySelector<HTMLButtonElement>('#logout-btn')!
);
