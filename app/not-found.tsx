import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-[60vh] w-full max-w-md flex-col items-center justify-center gap-3 px-4 text-center">
      <p className="text-sm font-medium text-muted-foreground">404</p>
      <h1 className="text-lg font-semibold">Page not found</h1>
      <Link
        href="/"
        className="text-sm font-medium text-primary underline underline-offset-4"
      >
        Back to dashboard
      </Link>
    </main>
  );
}
