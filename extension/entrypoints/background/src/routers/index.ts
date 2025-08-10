// import { extensionRouter } from "./extensionRouter";
// import { t } from "./router";
import { t } from './router';
import { userScriptRouter } from './userScriptRouter';

export const BGSWRouter = t.router({
  userScripts: userScriptRouter,
});

export type BGSWRouterType = typeof BGSWRouter;
