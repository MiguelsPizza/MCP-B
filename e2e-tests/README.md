---
name: Playwright E2e Testing
description: Setup end-to-end tests for an extension.
---

```sh
pnpm i
pnpm build
pnpm exec playwright install
pnpm e2e
pnpm e2e --ui
```

Before running E2E tests, you need to build the latest version of your extension.
