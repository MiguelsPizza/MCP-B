# API Keys

By default model chosen for the backend is claude-sonnet-4-20250514 

API Keys need to be provided in a .dev.vars file in the root directory (/mcp-b-backend)

```txt
ANTHROPIC_API_KEY="your api key"
ANTHROPIC_MODEL_NAME="claude-3-5-haiku-latest" <-- optional
```

# Chat Model Provider Selection
Open AI can be chosen as the model for the backend. 

This can be done by editing .dev.vars file

```txt
MODEL_PROVIDER="openai"
OPENAI_API_KEY="your api key"
OPENAI_MODEL_NAME="gpt-4o" <-- optional (default is "gpt-4o")
```

```txt
npm install
npm run dev
```

```txt
npm run deploy
```

[For generating/synchronizing types based on your Worker configuration run](https://developers.cloudflare.com/workers/wrangler/commands/#types):

```txt
npm run cf-typegen
```

Pass the `CloudflareBindings` as generics when instantiation `Hono`:

```ts
// src/index.ts
const app = new Hono<{ Bindings: CloudflareBindings }>()
```
