import { AppShell } from "@/components/layout/app-shell";

/** Persistent dashboard chrome (sidebar + top bar) wrapping every page. */
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell>{children}</AppShell>;
}
