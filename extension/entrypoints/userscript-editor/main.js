// entrypoints/userscript-editor/main.js
import { lazy, Workspace } from 'modern-monaco';

let currentDoc = null;

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
    // Load the userscript content
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
      theme: 'dark-plus',
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

    // Open the userscript file so a TextDocument exists
    try {
      currentDoc = await workspace.openTextDocument('userscript.js');
    } catch (_) {
      // ignore
    }

    // Hide loading overlay
    loadingOverlay.style.display = 'none';

    // Enable save button
    saveBtn.disabled = false;

    // Track changes
    let hasUnsavedChanges = false;

    // Track changes via model's onDidChangeContent event
    if (currentDoc && typeof currentDoc.onDidChangeContent === 'function') {
      currentDoc.onDidChangeContent(() => {
        hasUnsavedChanges = true;
        saveBtn.textContent = 'Save*';
      });
    }

    // Handle save button
    saveBtn.addEventListener('click', async () => {
      saveBtn.disabled = true;
      saveBtn.textContent = 'Saving...';

      try {
        // Get content from the text model using getValue()
        let content =
          currentDoc && typeof currentDoc.getValue === 'function'
            ? currentDoc.getValue()
            : undefined;
        if (content == null) {
          try {
            // Re-open the document if needed
            currentDoc = await workspace.openTextDocument('userscript.js');
            content = currentDoc?.getValue?.();
          } catch (_) {}
        }
        if (content) {
          await saveUserscript(scriptId, content);
          hasUnsavedChanges = false;
          saveBtn.textContent = 'Saved!';
          setTimeout(() => {
            saveBtn.textContent = 'Save';
          }, 2000);
        } else {
          saveBtn.textContent = 'No Content';
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
        // Update the model content using setValue() instead of updateTextDocument
        if (currentDoc && typeof currentDoc.setValue === 'function') {
          currentDoc.setValue(content);
        } else {
          // If no current doc, write to filesystem and re-open
          await workspace.fs.writeFile('userscript.js', content);
          currentDoc = await workspace.openTextDocument('userscript.js');
        }
        hasUnsavedChanges = false;
        saveBtn.textContent = 'Save';
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

// Load userscript content from chrome.storage.local if present, else template
async function loadUserscript(id) {
  const storageKey = `webmcp:userscripts:${id}`;
  try {
    const stored = await chrome.storage.local.get(storageKey);
    const payload = stored?.[storageKey];
    if (typeof payload === 'string') return payload;
    if (payload && typeof payload.content === 'string') return payload.content;
  } catch (e) {
    // ignore
  }
  return `// ==UserScript==
// @name         ${id}
// @description  Userscript for ${id}
// @match        *://*/*
// @grant        none
// ==/UserScript==

(function() {
  'use strict';
  console.log('Userscript loaded: ${id}');
})();`;
}

// Save userscript content into chrome.storage.local
async function saveUserscript(id, content) {
  const storageKey = `webmcp:userscripts:${id}`;
  try {
    await chrome.storage.local.set({ [storageKey]: content });
    // Also persist a pointer to the last saved script for convenience
    await chrome.storage.local.set({
      'webmcp:userscripts:last': { id, content, savedAt: Date.now() },
    });
  } catch (e) {
    console.error('Failed to persist userscript', e);
    throw e;
  }
}
