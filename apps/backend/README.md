# Backend model selection

By default the model used for the backend is claude-sonnet-4-20250514.

The api key can be configured in a .dev.vars file in apps/backend

```txt
ANTHROPIC_API_KEY="your key here"
```

# MODEL_PROVIDER in .dev.vars

The MODEL_PROVIDER property can be 2 values "openai" and "anthropic"

MODEL_PROVIDER="openai"
Will configure the backend to use open ai model with gpt-4o-mini as the default

The OPENAI_MODEL_NAME will allow configuration of of different open ai model
OPENAI_MODEL_NAME="gpt-4o" <-- allows choice of openai models (see OpenAIResponsesModelId)

MODEL_PROVIDER="anthropic"
Will configure the backend to use anthropic ai model

The ANTHROPIC_MODEL_NAME will allow configuration of different anthropic models
ANTHROPIC_MODEL_NAME="claude-sonnet-4-20250514" <-- allows choice of anthropic models (see AnthropicMessagesModelId), optional


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
