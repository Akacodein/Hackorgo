import { signIn } from "@/lib/auth";

export async function GET() {
  return signIn("google", {
    redirectTo: "/auth/bridge",
  });
}