"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, AlertCircle, CheckCircle2, LockKeyhole, Mail, ShieldCheck } from "lucide-react";
import { getSupabase } from "@/lib/supabase";

export default function HomeLogin() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [answer, setAnswer] = useState("");
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [busy, setBusy] = useState(false);
  const [challenge, setChallenge] = useState({ a: 3, b: 4 });
  useEffect(() => { setChallenge({ a: 2 + Math.floor(Math.random() * 7), b: 1 + Math.floor(Math.random() * 8) }); }, []);
  const router = useRouter();

  async function submit(e) {
    e.preventDefault(); setMessage(""); setSuccess(false);
    if (Number(answer) !== challenge.a + challenge.b) { setMessage("Mã kiểm tra chưa chính xác."); return; }
    const supabase = getSupabase();
    if (!supabase) { setMessage("Website chưa cấu hình Supabase. Xem hướng dẫn README."); return; }
    setBusy(true);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setMessage("Email hoặc mật khẩu chưa chính xác.");
    else { setSuccess(true); setMessage("Đăng nhập thành công. Đang chuyển trang..."); setTimeout(() => router.push("/"), 450); }
    setBusy(false);
  }

  return <form className="home-login-form" onSubmit={submit}>
    <label>Email<div className="input-wrap"><Mail size={16}/><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ban@example.com" autoComplete="email" required/></div></label>
    <label>Mật khẩu<div className="input-wrap"><LockKeyhole size={16}/><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Nhập mật khẩu" autoComplete="current-password" required/></div></label>
    <label>Kiểm tra bảo mật <span className="math-challenge">{challenge.a} + {challenge.b} = ?</span><div className="input-wrap"><ShieldCheck size={16}/><input inputMode="numeric" value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="Nhập mã" required/></div></label>
    {message && <div className={`notice ${success ? "success" : "error"}`}>{success ? <CheckCircle2 size={16}/> : <AlertCircle size={16}/>}<span>{message}</span></div>}
    <button className="button button-primary full-button" disabled={busy}>{busy ? "Đang đăng nhập..." : "Đăng nhập"}<ArrowRight size={16}/></button>
  </form>;
}
