# @mcp-b/mcp-react-hook-form

A headless integration library that enables AI agents to interact with your existing React Hook Form + Zod forms through the Model Context Protocol (MCP).

## Features

- 🔌 **One-line integration** - Add MCP capabilities to existing forms without changing them
- 🎨 **Completely headless** - No UI components, just functionality
- 🛡️ **Type-safe** - Full TypeScript support with Zod schema inference
- ✅ **Shared validation** - Both users and AI agents go through the same validation
- 🧩 **Flexible API** - Multiple integration patterns to fit your needs

## Installation

```bash
npm install @mcp-b/mcp-react-hook-form
# or
yarn add @mcp-b/mcp-react-hook-form
# or
pnpm add @mcp-b/mcp-react-hook-form
```

## Quick Start

Add MCP capabilities to your existing React Hook Form with just one line:

```tsx
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMcpToolFormDirect } from "@mcp-b/mcp-react-hook-form";
import { z } from "zod";

// Your existing form schema
const schema = z.object({
  email: z.string().email(),
  message: z.string().min(10)
});

function ContactForm({ mcpServer }) {
  // Your existing form - no changes needed!
  const form = useForm({
    resolver: zodResolver(schema)
  });

  // Add this one line to make it MCP-enabled
  useMcpToolFormDirect(mcpServer, "contactForm", form, schema);

  // Your existing submit handler - unchanged
  const onSubmit = async (data) => {
    await sendEmail(data);
  };

  // Your existing JSX - unchanged
  return (
    <form onSubmit={form.handleSubmit(onSubmit)}>
      {/* Your existing form fields */}
    </form>
  );
}
```

Now AI agents can discover and use your form:
- "Send a contact message to support about the billing issue"
- "Submit feedback about the new feature"

## Integration Options

### Option 1: Direct Integration (Recommended)

Pass the MCP server directly - no context provider needed:

```tsx
useMcpToolFormDirect(mcpServer, "myForm", form, schema, {
  title: "My Form",
  description: "Description for AI agents"
});
```

### Option 2: With Context Provider

Use the context provider for multiple forms:

```tsx
// In your app root
import { McpServerProvider } from "@mcp-b/mcp-react-hook-form";

function App() {
  return (
    <McpServerProvider server={mcpServer}>
      <YourApp />
    </McpServerProvider>
  );
}

// In your form component
import { useMcpToolForm } from "@mcp-b/mcp-react-hook-form";

function MyForm() {
  const form = useForm({ resolver: zodResolver(schema) });
  
  useMcpToolForm("myForm", form, schema);
  
  // Rest of your form...
}
```

### Option 3: Imperative API

For more control or non-hook usage:

```tsx
import { registerFormAsMcpTool } from "@mcp-b/mcp-react-hook-form";

const cleanup = registerFormAsMcpTool(
  mcpServer,
  "myForm",
  form,
  schema,
  options
);

// Later...
cleanup(); // Unregister the tool
```

## Advanced Usage

### Custom AI Behavior

Handle AI agent calls differently from user submissions:

```tsx
useMcpToolFormDirect(mcpServer, "orderForm", form, orderSchema, {
  title: "Order Form",
  description: "Create a new order",
  onToolCall: async (data) => {
    // This runs when an AI agent calls the tool
    // You can add AI-specific logic here
    
    // Validate business rules for AI
    if (data.quantity > 100) {
      throw new Error("AI agents cannot order more than 100 items");
    }
    
    // Call your API
    const order = await createOrder(data);
    
    // Return a response for the AI
    return `Order ${order.id} created successfully`;
  }
});
```

### Schema Requirements

The library requires Zod schemas to be `ZodObject` types:

```tsx
// ✅ Correct
const schema = z.object({
  name: z.string(),
  age: z.number()
});

// ❌ Won't work - not a ZodObject
const schema = z.string();
```

## API Reference

### `useMcpToolFormDirect`

```tsx
function useMcpToolFormDirect<T extends ZodObject<ZodRawShape>>(
  mcpServer: McpServer,
  toolName: string,
  form: UseFormReturn<z.infer<T>>,
  schema: T,
  options?: RegisterFormOptions
): void
```

### `useMcpToolForm`

```tsx
function useMcpToolForm<T extends ZodObject<ZodRawShape>>(
  toolName: string,
  form: UseFormReturn<z.infer<T>>,
  schema: T,
  options?: RegisterFormOptions
): void
```

### `registerFormAsMcpTool`

```tsx
function registerFormAsMcpTool<T extends ZodObject<ZodRawShape>>(
  mcpServer: McpServer,
  toolName: string,
  form: UseFormReturn<any>,
  schema: T,
  options?: RegisterFormOptions
): () => void
```

### Options

```tsx
interface RegisterFormOptions {
  title?: string;              // Display name for the tool
  description?: string;        // Description for AI agents
  onToolCall?: (data: any) => Promise<any> | any;  // Custom handler for AI calls
}
```

## License

MIT