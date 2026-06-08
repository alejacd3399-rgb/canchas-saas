import { redirect } from "next/navigation";
import { stackServerApp } from "@/lib/stack";

export default async function HomePage() {
  const user = await stackServerApp.getUser();

  if (user) {
    redirect("/dashboard");
  } else {
    redirect("/handler/sign-in");
  }
}