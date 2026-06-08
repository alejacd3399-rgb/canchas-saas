import { StackServerApp } from "@stackframe/stack";

export const stackServerApp = new StackServerApp({
  tokenStore: "nextjs-cookie",
  publishableClientKey: "2f4517c0-9899-4a10-a874-ea4ea5b5d9de",
  urls: {
    afterSignIn:  "/dashboard",
    afterSignUp:  "/dashboard",
    afterSignOut: "/handler/sign-in",
  },
});