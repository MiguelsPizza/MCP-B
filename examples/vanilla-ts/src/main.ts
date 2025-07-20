import { setupCounter } from './counter.ts';
import './mcp';
import './style.css';
import typescriptLogo from './typescript.svg';
import viteLogo from '/vite.svg';

document.querySelector<HTMLDivElement>('#app')!.innerHTML = `
  <div>
    <div style="text-align: center; margin-bottom: 2rem;">
      <h1 style="background: linear-gradient(135deg, #6366f1, #8b5cf6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; font-size: 3rem; margin: 1rem 0;">
        🤖 My AI-Powered Website
      </h1>
      <p style="font-size: 1.2rem; color: #6b7280; margin-bottom: 2rem;">
        Built with MCP-B • AI tools that actually work in your browser
      </p>
    </div>
    
    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 2rem; margin: 2rem 0;">
      <div style="background: #f8fafc; padding: 1.5rem; border-radius: 12px; border: 2px solid #e2e8f0;">
        <h3 style="color: #1e293b; margin-top: 0;">🎯 How This Works</h3>
        <ol style="color: #475569; line-height: 1.6;">
          <li>Install the MCP-B browser extension</li>
          <li>Visit this page (you're here!)</li>
          <li>Open the extension and see my tools</li>
          <li>Try calling them and watch the page update</li>
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

    <div class="card">
      <button id="counter" type="button"></button>
      <p style="margin-top: 1rem; color: #6b7280; font-size: 0.9rem;">
        ↑ Traditional button (click to count) vs AI tools (use extension) ↓
      </p>
    </div>
  </div>
`;

setupCounter(document.querySelector<HTMLButtonElement>('#counter')!);
