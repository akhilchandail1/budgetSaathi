import Link from "next/link";
import { Suspense } from "react";
import { signupAction } from "@/app/actions/auth";
import { AuthForm } from "@/components/auth/AuthForm";
import { Card } from "@/components/ui/card";

export default function SignupPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4">
      <Card className="w-full max-w-sm p-6">
        <h1 className="text-xl font-semibold text-zinc-900">Create your account</h1>
        <p className="mt-1 text-sm text-zinc-500">
          Start tracking your money in a couple of minutes.
        </p>
        <div className="mt-6">
          <Suspense fallback={null}>
            <AuthForm mode="signup" action={signupAction} />
          </Suspense>
        </div>
        <p className="mt-6 text-center text-sm text-zinc-500">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-zinc-900 underline">
            Log in
          </Link>
        </p>
      </Card>
    </div>
  );
}
