"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowRight, LockKeyhole, Mail, UserRound, AlertCircle, CheckCircle2, ShieldCheck } from "lucide-react";
import { getSupabase } from "@/lib/supabase";

export default function AuthForm({ mode }) {
  const isRegister = mode === "register";
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [answer, setAnswer] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const [challenge, setChallenge] = useState({ a: 3, b: 4 });
  useEffect(() => { setChallenge({ a: 2 + Math.floor(Math.random() * 7), b: 1 + Math.floor(Math.random() * 8) }); }, []);
  const router = useRouter();

  async function submit(e) {
    e.preventDefault(); setMessage(""); setSuccess(false);
    if (Number(answer) !== challenge.a + challenge.b) { setMessage("Mã kiểm tra chưa chính xác. Vui lòng thử lại."); return; }
    if (isRegister && password !== confirm) { setMessage("Mật khẩu nhập lại không khớp."); return; }
    const supabase = getSupabase();
    if (!supabase) { setMessage("Website chưa được cấu hình Supabase. Hãy làm theo hướng dẫn trong README."); return; }
    setBusy(true);
    if (isRegister) {
      const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { display_name: name.trim() } } });
      if (error) setMessage(error.message);
      else if (data.session) { setSuccess(true); setMessage("Tạo tài khoản thành công. Đang chuyển đến trang chủ..."); setTimeout(() => router.push("/"), 800); }
      else { setSuccess(true); setMessage("Đã tạo tài khoản. Hãy kiểm tra email để xác nhận trước khi đăng nhập."); }
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) setMessage("Email hoặc mật khẩu chưa chính xác.");
      else { setSuccess(true); setMessage("Đăng nhập thành công!"); setTimeout(() => router.push("/"), 500); }
    }
    setBusy(false);
  }

  return <section className="auth-page"><div className="auth-card">
    <div className="auth-brand"><span className="brand-mark large">LQA</span><div><b>LQA <span>STUDIO</span></b><small>FREE FIRE LAYOUT LIBRARY</small></div></div>
    <div className="auth-kicker"><ShieldCheck size={14}/> TÀI KHOẢN LQA STUDIO</div>
    <h1>{isRegister ? "Tạo tài khoản" : "Chào mừng trở lại"}</h1>
    <p className="auth-subtitle">{isRegister ? "Đăng ký để tham gia thư viện thiết kế LQA STUDIO." : "Đăng nhập để tiếp tục sử dụng thư viện layout."}</p>
    <form onSubmit={submit} className="auth-form">
      {isRegister && <label>Tên hiển thị<div className="input-wrap"><UserRound size={17}/><input value={name} onChange={(e) => setName(e.target.value)} placeholder="Tên của bạn" required minLength={2} maxLength={40}/></div></label>}
      <label>Email<div className="input-wrap"><Mail size={17}/><input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="ban@example.com" required autoComplete="email"/></div></label>
      <label>Mật khẩu<div className="input-wrap"><LockKeyhole size={17}/><input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={isRegister ? "Ít nhất 6 ký tự" : "Nhập mật khẩu"} required minLength={6} autoComplete={isRegister ? "new-password" : "current-password"}/></div></label>
      {isRegister && <label>Xác nhận mật khẩu<div className="input-wrap"><LockKeyhole size={17}/><input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Nhập lại mật khẩu" required minLength={6} autoComplete="new-password"/></div></label>}
      <label>Kiểm tra bảo mật <span className="math-challenge">{challenge.a} + {challenge.b} = ?</span><div className="input-wrap"><ShieldCheck size={17}/><input inputMode="numeric" value={answer} onChange={(e) => setAnswer(e.target.value)} placeholder="Nhập kết quả" required/></div></label>
      {message && <div className={`notice ${success ? "success" : "error"}`}>{success ? <CheckCircle2 size={17}/> : <AlertCircle size={17}/>}<span>{message}</span></div>}
      <button className="button button-primary auth-submit" disabled={busy}>{busy ? "Đang xử lý..." : isRegister ? "Tạo tài khoản" : "Đăng nhập"}<ArrowRight size={17}/></button>
    </form>
    <div className="auth-switch">{isRegister ? "Đã có tài khoản?" : "Chưa có tài khoản?"} <Link href={isRegister ? "/dang-nhap" : "/dang-ky"}>{isRegister ? "Đăng nhập" : "Đăng ký ngay"}</Link></div>
    <p className="auth-note">Tài khoản được xác thực và đồng bộ qua hệ thống LQA STUDIO.</p>
    <Link href="/" className="back-home">← Quay về trang chủ</Link>
  </div></section>;
}
