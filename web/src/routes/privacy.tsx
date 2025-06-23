import { createFileRoute } from '@tanstack/react-router';
import { Card, CardContent } from '@/components/ui/card';

export const Route = createFileRoute('/privacy')({
  component: PrivacyRoute,
});

function PrivacyRoute() {
  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Card>
        <CardContent className="prose prose-neutral dark:prose-invert max-w-none p-8">
          <h1>Privacy Policy for MCP-B</h1>
          <p className="text-muted-foreground">Last updated: {new Date().toLocaleDateString()}</p>

          <h2>Overview</h2>
          <p>
            MCP-B ("we", "our", or "the Service") is committed to protecting your privacy. 
            This privacy policy explains how our browser extension and web application handle your data.
          </p>

          <h2>Data Collection and Usage</h2>
          
          <h3>What We Don't Collect</h3>
          <ul>
            <li>We do NOT collect any personal information without your explicit consent</li>
            <li>We do NOT track your browsing activity</li>
            <li>We do NOT sell or share your data with third parties</li>
          </ul>

          <h3>Browser Extension Data</h3>
          <p>The MCP-B browser extension stores the following data locally in your browser:</p>
          <ul>
            <li>User preferences and settings</li>
            <li>AI provider configuration (API keys are encrypted)</li>
            <li>Chat history (stored locally, never transmitted to our servers)</li>
            <li>MCP server configurations</li>
          </ul>

          <h3>Web Application Data</h3>
          <p>When using the MCP-B web application, we may store:</p>
          <ul>
            <li>Account information (username) if you create an account</li>
            <li>Todo items and tasks you create</li>
            <li>Chat conversations with AI assistants</li>
          </ul>

          <h2>Browser Extension Permissions</h2>
          <p>Our browser extension requires certain permissions to function:</p>
          
          <ul>
            <li><strong>Host Permissions (&lt;all_urls&gt;)</strong>: Used only when you explicitly request the AI to interact with a webpage</li>
            <li><strong>Storage</strong>: Saves your settings and chat history locally in your browser</li>
            <li><strong>Tabs & Tab Groups</strong>: Allows the AI assistant to manage browser tabs when requested</li>
            <li><strong>Side Panel</strong>: Provides the chat interface for interacting with the AI</li>
            <li><strong>Web Navigation</strong>: Helps the AI understand page navigation context</li>
            <li><strong>Bookmarks</strong>: Accessed only when you ask the AI to search or manage bookmarks</li>
            <li><strong>Windows</strong>: Used for window management features when requested</li>
            <li><strong>History</strong>: Searched only when you explicitly ask the AI to look through browsing history</li>
          </ul>

          <h2>Third-Party Services</h2>
          <p>When you configure an AI provider (OpenAI, Google AI, etc.):</p>
          <ul>
            <li>Your queries are sent directly to your chosen AI provider</li>
            <li>We do not intercept or store API responses beyond the chat interface</li>
            <li>You are subject to the privacy policy of your chosen AI provider</li>
          </ul>

          <h2>Data Security</h2>
          <ul>
            <li>All sensitive data (like API keys) is encrypted before storage</li>
            <li>We use secure HTTPS connections for all data transmission</li>
            <li>The browser extension runs entirely in your browser with minimal server communication</li>
            <li>Web application data is stored securely in our database with encryption at rest</li>
          </ul>

          <h2>Your Rights</h2>
          <p>You have the right to:</p>
          <ul>
            <li>Access your personal data</li>
            <li>Request deletion of your data</li>
            <li>Export your data in a portable format</li>
            <li>Opt-out of any data collection</li>
            <li>Clear all stored data through the extension settings</li>
          </ul>

          <h2>Data Retention</h2>
          <ul>
            <li>Browser extension data: Retained until you clear it or uninstall the extension</li>
            <li>Web application data: Retained while your account is active</li>
            <li>Deleted data is permanently removed within 30 days</li>
          </ul>

          <h2>Children's Privacy</h2>
          <p>
            Our Service is not intended for use by children under 13 years of age. 
            We do not knowingly collect personal information from children under 13.
          </p>

          <h2>Changes to This Policy</h2>
          <p>
            We may update this privacy policy from time to time. We will notify you of any 
            changes by posting the new privacy policy on this page and updating the "Last updated" date.
          </p>

          <h2>Contact Us</h2>
          <p>
            If you have any questions about this privacy policy or our data practices, please contact us at:
          </p>
          <ul>
            <li>Email: privacy@mcp-b.example.com</li>
            <li>GitHub: <a href="https://github.com/yourusername/mcp-b/issues" target="_blank" rel="noopener noreferrer">Submit an issue</a></li>
          </ul>

          <h2>Consent</h2>
          <p>
            By using MCP-B, you consent to this privacy policy and agree to its terms.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}