# MCP-B: Browser-Native AI Tools for Developers

## What is MCP-B?

MCP-B (Model Context Protocol for Browsers) enables AI assistants to interact with your website through APIs instead of screen scraping. Your website exposes functionality as tools, and AI can call them directly.

## Why MCP-B vs Traditional Browser Automation?

| Traditional Automation | MCP-B |
|------------------------|-------|
| AI clicks buttons like a human | AI calls your APIs directly |
| Fragile - breaks when UI changes | Robust - APIs are stable |
| Slow - multiple screenshots | Fast - direct function calls |
| Black box - hard to debug | Transparent - see exactly what AI does |
| Limited to visible elements | Access to full application state |

## Quick Start (5 minutes)

### 1. Install Dependencies

This example runs in isolation from the monorepo. Install dependencies using:

```bash
cd examples/vanilla-ts
pnpm install --ignore-workspace
# or
npm install
```

Note: The example uses published versions of `@mcp-b/transports` from npm registry.

### 2. Add MCP Server to Your Website

```typescript
import { TabServerTransport } from '@mcp-b/transports';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';

// Create server (one per website)
const server = new McpServer({
  name: "my-website",
  version: "1.0.0"
});

// Add a simple tool
server.tool("getPageInfo", "Get information about current page", {}, async () => {
  return {
    content: [{ 
      type: "text", 
      text: JSON.stringify({
        title: document.title,
        url: window.location.href,
        userCount: document.querySelectorAll('.user').length
      })
    }]
  };
});

// Connect the server
await server.connect(new TabServerTransport({ allowedOrigins: ["*"] }));
```

### 3. Install MCP-B Extension

Install the MCP-B browser extension from the Chrome Web Store.

### 4. Run the Example

```bash
pnpm dev
# or
npm run dev
```

Then visit http://localhost:5173

### 5. Test It

1. Visit your website
2. Open the MCP-B extension  
3. See your tools appear automatically
4. Call `getPageInfo` and see the results

## Design Principles

### 1. Expose Intent, Not Implementation

❌ **Don't do this:**
```typescript
server.tool("clickButton", "Click the submit button", {}, async () => {
  document.getElementById('submit-btn').click();
});
```

✅ **Do this:**
```typescript
server.tool("submitForm", "Submit the contact form", {
  name: z.string(),
  email: z.string().email()
}, async ({ name, email }) => {
  await submitContactForm({ name, email });
  showSuccessMessage("Form submitted!");
});
```

### 2. Provide Visual Feedback

Always show users what the AI is doing:

```typescript
function showAIAction(message: string) {
  const notification = document.createElement('div');
  notification.className = 'ai-notification';
  notification.textContent = `🤖 ${message}`;
  document.body.appendChild(notification);
  
  setTimeout(() => notification.remove(), 3000);
}

server.tool("updateSettings", "Update user preferences", {
  theme: z.enum(["light", "dark"])
}, async ({ theme }) => {
  showAIAction(`Changed theme to ${theme}`);
  updateUserTheme(theme);
  return { content: [{ type: "text", text: `Theme updated to ${theme}` }] };
});
```

### 3. Work with Existing Architecture

MCP-B should integrate with your existing code, not replace it:

```typescript
// If you have existing functions, wrap them
async function updateUserProfile(data) {
  // Your existing logic
}

server.tool("updateProfile", "Update user profile information", {
  name: z.string().optional(),
  bio: z.string().optional()
}, async (updates) => {
  await updateUserProfile(updates); // Use existing function
  refreshProfileUI(); // Use existing UI update
  return { content: [{ type: "text", text: "Profile updated successfully" }] };
});
```

## Common Patterns

### State Management Integration

```typescript
// React/Redux example
server.tool("addTodo", "Add item to todo list", {
  text: z.string().describe("Todo item text")
}, async ({ text }) => {
  dispatch(addTodoAction({ text, completed: false }));
  return { content: [{ type: "text", text: `Added: ${text}` }] };
});

// Vue/Pinia example  
server.tool("updateCart", "Update shopping cart", {
  productId: z.string(),
  quantity: z.number()
}, async ({ productId, quantity }) => {
  const store = useCartStore();
  store.updateQuantity(productId, quantity);
  return { content: [{ type: "text", text: "Cart updated" }] };
});
```

### Authentication & Authorization

```typescript
server.tool("deletePost", "Delete a blog post", {
  postId: z.string()
}, async ({ postId }) => {
  const user = getCurrentUser();
  if (!user.canDelete(postId)) {
    return { content: [{ type: "text", text: "Access denied" }] };
  }
  
  await deletePost(postId);
  return { content: [{ type: "text", text: "Post deleted" }] };
});
```

### Error Handling

```typescript
server.tool("processPayment", "Process customer payment", {
  amount: z.number(),
  cardToken: z.string()
}, async ({ amount, cardToken }) => {
  try {
    const result = await processPayment({ amount, cardToken });
    showSuccessMessage("Payment processed!");
    return { content: [{ type: "text", text: `Payment of $${amount} successful` }] };
  } catch (error) {
    showErrorMessage(error.message);
    return { content: [{ type: "text", text: `Payment failed: ${error.message}` }] };
  }
});
```

## Advanced Features

### Dynamic Tool Registration

Tools can be added/removed based on application state:

```typescript
function registerUserTools() {
  const user = getCurrentUser();
  
  if (user.isAdmin) {
    server.tool("adminDashboard", "Access admin functions", {}, async () => {
      return { content: [{ type: "text", text: "Admin tools available" }] };
    });
  }
  
  if (user.hasSubscription) {
    server.tool("premiumFeature", "Use premium features", {}, async () => {
      return { content: [{ type: "text", text: "Premium feature activated" }] };
    });
  }
}

// Call when user state changes
onUserLogin(registerUserTools);
```

### Tool Composition

Build complex workflows from simple tools:

```typescript
server.tool("resetAccount", "Reset user account to defaults", {}, async () => {
  // Compose multiple operations
  await clearUserData();
  await resetUserPreferences();
  await sendWelcomeEmail();
  
  return { content: [{ type: "text", text: "Account reset complete" }] };
});
```

### Context-Aware Tools

Tools that adapt to current page/state:

```typescript
server.tool("smartAction", "Perform context-appropriate action", {}, async () => {
  const page = getCurrentPageType();
  
  switch (page) {
    case 'product':
      return await addToCart();
    case 'cart':
      return await proceedToCheckout();
    case 'profile':
      return await saveProfile();
    default:
      return { content: [{ type: "text", text: "No action available for this page" }] };
  }
});
```

## Best Practices

### 1. Tool Naming & Documentation
- Use clear, action-oriented names: `createUser`, `sendEmail`, `generateReport`
- Provide detailed descriptions that explain the purpose and effects
- Use Zod schemas to clearly define expected inputs

### 2. User Experience
- Always provide visual feedback when AI tools are called
- Use animations/notifications to show state changes
- Make it obvious when AI is taking actions

### 3. Security
- Apply the same authentication/authorization as your regular API
- Validate all inputs thoroughly
- Don't expose sensitive operations without proper checks

### 4. Performance  
- Keep tool responses fast (< 1 second when possible)
- Use async operations for heavy work
- Provide progress feedback for long-running operations

### 5. Debugging
- Log all tool calls for debugging
- Return meaningful error messages
- Use browser dev tools to inspect MCP communication

## Example: E-commerce Integration

```typescript
// Product page tools
server.tool("addToCart", "Add product to shopping cart", {
  productId: z.string(),
  quantity: z.number().min(1).default(1),
  variant: z.string().optional()
}, async ({ productId, quantity, variant }) => {
  const result = await cart.addItem({ productId, quantity, variant });
  showCartNotification(`Added ${quantity}x ${result.product.name}`);
  updateCartUI();
  return { content: [{ type: "text", text: `Added to cart: ${result.product.name}` }] };
});

// Cart page tools  
server.tool("applyDiscount", "Apply discount code", {
  code: z.string()
}, async ({ code }) => {
  const result = await cart.applyDiscount(code);
  if (result.success) {
    updateCartTotals();
    return { content: [{ type: "text", text: `Discount applied: ${result.discount}% off` }] };
  } else {
    return { content: [{ type: "text", text: `Invalid discount code: ${code}` }] };
  }
});

// Search tools
server.tool("searchProducts", "Search for products", {
  query: z.string(),
  category: z.string().optional(),
  priceRange: z.object({
    min: z.number(),
    max: z.number()
  }).optional()
}, async ({ query, category, priceRange }) => {
  const results = await searchAPI({ query, category, priceRange });
  updateSearchResults(results);
  return { 
    content: [{ 
      type: "text", 
      text: `Found ${results.length} products matching "${query}"` 
    }] 
  };
});
```

## Getting Started Checklist

- [ ] Clone/download this example and run `pnpm install --ignore-workspace`
- [ ] Run `pnpm dev` to start the development server
- [ ] Install the MCP-B browser extension
- [ ] Visit http://localhost:5173 and test the tools
- [ ] Modify the example to add your own tools
- [ ] Add visual feedback for tool calls
- [ ] Integrate with your existing application logic
- [ ] Add error handling and validation
- [ ] Document your tools clearly
- [ ] Test edge cases and error scenarios

## Resources

- [MCP-B Extension](https://chrome.google.com/webstore) - Browser extension
- [Example Code](./src/) - Working example in this directory
- [MCP Official Docs](https://modelcontextprotocol.io/) - Core MCP specification
- [TypeScript Types](https://www.npmjs.com/package/@mcp-b/transports) - Type definitions

---

**The future of browser automation is APIs, not pixels. Start building with MCP-B today!**