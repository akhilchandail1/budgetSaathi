import { Logo } from "@/components/layout/Logo";

export default function RootLoading() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-3 bg-zinc-50">
      <Logo className="h-8 w-8 animate-pulse" />
      <div className="h-1 w-24 overflow-hidden rounded-full bg-zinc-200">
        <div className="h-full w-1/3 animate-pulse rounded-full bg-zinc-900" />
      </div>
    </div>
  );
}
