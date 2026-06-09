import { StackServerApp } from "@stackframe/stack";

export const stackServerApp = new StackServerApp({
  tokenStore: "nextjs-cookie",
  projectId: process.env.NEXT_PUBLIC_HEXCLAVE_PROJECT_ID ?? process.env.NEXT_PUBLIC_STACK_PROJECT_ID!,
  publishableClientKey: process.env.NEXT_PUBLIC_HEXCLAVE_PROJECT_ID ?? process.env.NEXT_PUBLIC_STACK_PUBLISHABLE_CLIENT_KEY!,
  secretServerKey: process.env.HEXCLAVE_SECRET_SERVER_KEY ?? process.env.STACK_SECRET_SERVER_KEY!,
  urls: {
    afterSignIn:  "/dashboard",
    afterSignUp:  "/dashboard",
    afterSignOut: "/handler/sign-in",
  },
});