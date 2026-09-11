import Link from "next/link";
import { Suspense } from "react";
import { loginAction, startDemo } from "@/app/actions/auth";
import { AuthForm } from "@/components/auth/AuthForm";
import { Card } from "@/components/ui/card";
import { GITHUB_REPOSITORY_URL } from "@/lib/project.constants";

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
        <form action={startDemo} className="mt-3">
          <button type="submit" className="w-full text-center text-sm font-medium text-zinc-700 underline">
            Explore the read-only demo
          </button>
        </form>
        <p className="mt-6 border-t border-zinc-200 pt-4 text-center text-xs text-zinc-500">
          BudgetSaathi is open source.{" "}
          <a
            href={GITHUB_REPOSITORY_URL}
            target="_blank"
            rel="noreferrer"
            className="font-medium text-zinc-700 underline"
          >
            View it on GitHub
          </a>
        </p>
      </Card>
    </div>
  );
}
