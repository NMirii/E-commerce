import { hasSupabaseEnv } from "@/lib/supabase/env";
import { getSession } from "@/lib/auth/session";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SupabaseSetupNotice from "@/components/SupabaseSetupNotice";

export default async function StoreShell({
  children,
}: {
  children: React.ReactNode;
}) {
  if (!hasSupabaseEnv()) {
    return (
      <div className="page-main">
        <Navbar session={null} configured={false} />
        <main className="flex-1">
          <SupabaseSetupNotice />
        </main>
        <Footer />
      </div>
    );
  }

  const session = await getSession();

  return (
    <div className="page-main">
      <Navbar session={session} configured />
      <main className="flex-1">{children}</main>
      <Footer />
    </div>
  );
}
