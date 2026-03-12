import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Toaster } from "@/components/ui/sonner";
import { NavBar } from "@/components/layout/nav-bar";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  const userName = session.user.name ?? session.user.email ?? "";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex items-center gap-6">
          <span className="text-xl font-display font-semibold text-thai-gold shrink-0">
            SeeYou AroundTown
          </span>
          <NavBar userName={userName} />
        </div>
      </header>
      <main className="container mx-auto px-4 py-6">{children}</main>
      <Toaster richColors position="top-right" />
    </div>
  );
}
