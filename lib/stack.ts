import { StackServerApp } from "@stackframe/stack";

export const stackServerApp = new StackServerApp({
  tokenStore: "nextjs-cookie",
  projectId: "0aa78963-49b3-427c-9380-f044b037067b",
  publishableClientKey: "0aa78963-49b3-427c-9380-f044b037067b",
  secretServerKey: process.env.HEXCLAVE_SECRET_SERVER_KEY ?? process.env.STACK_SECRET_SERVER_KEY!,
  urls: {
    afterSignIn:  "/dashboard",
    afterSignUp:  "/dashboard",
    afterSignOut: "/handler/sign-in",
  },
});