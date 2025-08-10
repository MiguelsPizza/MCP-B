// entrypoints/userscript-editor/main.js
import { lazy, Workspace } from 'modern-monaco';

// Get the userscript ID from URL parameters
const params = new URLSearchParams(window.location.search);
const scriptId = params.get('id');

// Update UI with script ID
const scriptIdElement = document.getElementById('script-id');
const saveBtn = document.getElementById('save-btn');
const reloadBtn = document.getElementById('reload-btn');
const loadingOverlay = document.getElementById('loading');

if (!scriptId) {
  // Show error if no ID provided
  loadingOverlay.innerHTML = `
    <div class="error-message">
      <h2>No Script ID Provided</h2>
      <p>Please provide a script ID in the URL parameters (e.g., ?id=my-script)</p>
    </div>
  `;
} else {
  scriptIdElement.textContent = `#${scriptId}`;

  // Initialize the workspace
  initializeEditor();
}

async function initializeEditor() {
  try {
    // Load the userscript content (placeholder for now)
    const scriptContent = await loadUserscript(scriptId);

    // Create a workspace with the userscript
    const workspace = new Workspace({
      name: `userscript-${scriptId}`,
      initialFiles: {
        'userscript.js': scriptContent,
        // Add a basic tsconfig for better type checking
        'tsconfig.json': JSON.stringify(
          {
            compilerOptions: {
              target: 'ES2020',
              module: 'ESNext',
              lib: ['ES2020', 'DOM', 'DOM.Iterable'],
              strict: true,
              noUnusedLocals: true,
              noUnusedParameters: true,
              noImplicitReturns: true,
              allowJs: true,
              checkJs: true,
            },
          },
          null,
          2
        ),
      },
      entryFile: 'userscript.js',
    });

    // Initialize Monaco editor lazily
    await lazy({
      workspace,
      theme: 'vs-dark',
      langs: ['javascript', 'typescript', 'json'],
      lsp: {
        typescript: {
          compilerOptions: {
            allowJs: true,
            checkJs: true,
            noEmit: true,
            target: 'ES2020',
            module: 'ESNext',
            lib: ['ES2020', 'DOM', 'DOM.Iterable'],
          },
        },
      },
    });

    // Hide loading overlay
    loadingOverlay.style.display = 'none';

    // Enable save button
    saveBtn.disabled = false;

    // Track changes
    let hasUnsavedChanges = false;

    // Listen for changes in the workspace
    workspace.onDidChangeTextDocument(() => {
      hasUnsavedChanges = true;
      saveBtn.textContent = 'Save*';
    });

    // Handle save button
    saveBtn.addEventListener('click', async () => {
      saveBtn.disabled = true;
      saveBtn.textContent = 'Saving...';

      try {
        const content = workspace.getTextDocument('userscript.js')?.getText();
        if (content) {
          await saveUserscript(scriptId, content);
          hasUnsavedChanges = false;
          saveBtn.textContent = 'Saved!';
          setTimeout(() => {
            saveBtn.textContent = 'Save';
          }, 2000);
        }
      } catch (error) {
        console.error('Failed to save:', error);
        saveBtn.textContent = 'Save Failed';
        setTimeout(() => {
          saveBtn.textContent = hasUnsavedChanges ? 'Save*' : 'Save';
        }, 2000);
      } finally {
        saveBtn.disabled = false;
      }
    });

    // Handle reload button
    reloadBtn.addEventListener('click', async () => {
      if (hasUnsavedChanges) {
        const confirmed = confirm('You have unsaved changes. Are you sure you want to reload?');
        if (!confirmed) return;
      }

      reloadBtn.disabled = true;
      reloadBtn.textContent = 'Reloading...';

      try {
        const content = await loadUserscript(scriptId);
        const doc = workspace.getTextDocument('userscript.js');
        if (doc) {
          // Update the document content
          workspace.updateTextDocument('userscript.js', content);
          hasUnsavedChanges = false;
          saveBtn.textContent = 'Save';
        }
      } catch (error) {
        console.error('Failed to reload:', error);
        alert('Failed to reload the userscript');
      } finally {
        reloadBtn.disabled = false;
        reloadBtn.textContent = 'Reload';
      }
    });

    // Warn before leaving with unsaved changes
    window.addEventListener('beforeunload', (e) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
      }
    });
  } catch (error) {
    console.error('Failed to initialize editor:', error);
    loadingOverlay.innerHTML = `
      <div class="error-message">
        <h2>Failed to Load Editor</h2>
        <p>${error.message || 'An unexpected error occurred'}</p>
      </div>
    `;
  }
}

// Placeholder function to load userscript
async function loadUserscript(id) {
  // TODO: Implement actual loading logic
  // This would typically fetch from storage.local or your backend

  // For now, return a sample userscript
  return `// ==UserScript==
// @name         ${id}
// @namespace    http://tampermonkey.net/
// @version      1.0
// @description  A sample userscript
// @author       You
// @match        https://*/*
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    // Your userscript code here
    console.log('Userscript loaded: ${id}');

})();`;
}

// Placeholder function to save userscript
async function saveUserscript(id, content) {
  // TODO: Implement actual saving logic
  // This would typically save to storage.local or your backend

  console.log(`Saving userscript ${id}:`, content);

  // Simulate async save
  return new Promise((resolve) => {
    setTimeout(resolve, 500);
  });
}
