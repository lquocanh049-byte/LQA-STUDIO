"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Menu, X, LogIn, UserPlus, LayoutDashboard, LogOut } from "lucide-react";
import { getSupabase } from "@/lib/supabase";
import { CATEGORIES } from "@/lib/categories";

export default function Header() {
  const [open, setOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [admin, setAdmin] = useState(false);
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) return;
    let alive = true;
    supabase.auth.getSession().then(async ({ data }) => {
      if (!alive) return;
      const current = data.session?.user ?? null;
      setUser(current);
      if (current) {
        const { data: profile } = await supabase.from("profiles").select("role").eq("id", current.id).maybeSingle();
        if (alive) setAdmin(profile?.role === "admin");
      }
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!alive) return;
      const current = session?.user ?? null;
      setUser(current);
      if (!current) setAdmin(false);
      else supabase.from("profiles").select("role").eq("id", current.id).maybeSingle().then(({ data }) => { if (alive) setAdmin(data?.role === "admin"); });
    });
    return () => { alive = false; listener.subscription.unsubscribe(); };
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  async function logout() {
    const supabase = getSupabase();
    if (supabase) await supabase.auth.signOut();
    setUser(null); setAdmin(false); router.push("/");
  }

  return (
    <header className="site-header">
      <div className="container nav-wrap">
        <Link href="/" className="brand" aria-label="LQA Studio trang chủ">
          <span className="brand-mark">LQA</span>
          <span className="brand-text">LQA <b>STUDIO</b><small>FREE FIRE LAYOUT LIBRARY</small></span>
        </Link>
        <button className="mobile-menu" onClick={() => setOpen(!open)} aria-label="Mở menu">{open ? <X /> : <Menu />}</button>
        <nav className={`nav-links ${open ? "is-open" : ""}`}>
          <div className="nav-group-label">DỊCH VỤ</div>
          <Link href="/" className={pathname === "/" ? "active" : ""}>Trang chủ</Link>
          {CATEGORIES.map((item) => <Link key={item.slug} href={`/${item.slug}`} className={pathname === `/${item.slug}` ? "active" : ""}>{item.name} <small>{item.count}</small></Link>)}
          <span className="nav-divider" />
          <div className="nav-group-label">TÀI KHOẢN</div>
          {admin && <Link href="/admin" className={pathname === "/admin" ? "active" : ""}><LayoutDashboard size={14}/> Quản trị</Link>}
          {user ? <button className="nav-action subtle" onClick={logout}><LogOut size={14}/> Đăng xuất</button> : <>
            <Link href="/dang-nhap" className="nav-action subtle"><LogIn size={14}/> Đăng nhập</Link>
            <Link href="/dang-ky" className="nav-action primary"><UserPlus size={14}/> Đăng ký</Link>
          </>}
        </nav>
      </div>
    </header>
  );
}
