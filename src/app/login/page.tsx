import Link from "next/link";
import { Suspense } from "react";
import { loginAction } from "@/app/actions/auth";
import { AuthForm } from "@/components/auth/AuthForm";
import { Card } from "@/components/ui/card";

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
      <Card className="w-full max-w-sm p-6">
        <h1 className="text-xl font-semibold text-zinc-900">Log in</h1>
        <p className="mt-1 text-sm text-zinc-500">Welcome back to BudgetSaathi.</p>
        <div className="mt-6">
          <Suspense fallback={null}>
            <AuthForm mode="login" action={loginAction} />
          </Suspense>
        </div>
        <p className="mt-6 text-center text-sm text-zinc-500">
          No account?{" "}
          <Link href="/signup" className="font-medium text-zinc-900 underline">
            Sign up
          </Link>
        </p>
      </Card>
    </div>
  );
}
