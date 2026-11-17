"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Upload, Trash2, Eye, EyeOff, ShieldCheck, ImagePlus, AlertCircle, CheckCircle2, RefreshCw, Pencil } from "lucide-react";
import { getSupabase, getPublicImageUrl } from "@/lib/supabase";
import { CATEGORIES } from "@/lib/categories";

export default function AdminPanel() {
  const [status, setStatus] = useState("checking");
  const [items, setItems] = useState([]);
  const [user, setUser] = useState(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0].slug);
  const [description, setDescription] = useState("");
  const [file, setFile] = useState(null);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [ok, setOk] = useState(false);

  async function load() {
    const supabase = getSupabase();
    if (!supabase) { setStatus("config"); return; }
    const { data: auth } = await supabase.auth.getUser();
    if (!auth.user) { setStatus("guest"); return; }
    setUser(auth.user);
    const { data: profile, error: profileError } = await supabase.from("profiles").select("role,display_name").eq("id", auth.user.id).maybeSingle();
    if (profileError || profile?.role !== "admin") { setStatus("forbidden"); return; }
    setStatus("admin");
    const { data, error } = await supabase.from("layouts").select("*").order("created_at", { ascending: false });
    if (error) setNotice(error.message); else setItems(data || []);
  }

  useEffect(() => { load(); }, []);

  async function addLayout(e) {
    e.preventDefault(); setNotice(""); setOk(false);
    if (!file) { setNotice("Bạn chưa chọn ảnh layout."); return; }
    if (!file.type.startsWith("image/")) { setNotice("Vui lòng chọn tệp hình ảnh."); return; }
    if (file.size > 10 * 1024 * 1024) { setNotice("Ảnh vượt quá 10MB. Hãy chọn ảnh nhỏ hơn."); return; }
    const supabase = getSupabase(); if (!supabase) return;
    setBusy(true);
    const safeName = file.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-zA-Z0-9._-]/g, "-");
    const path = `${category}/${Date.now()}-${safeName}`;
    const { error: uploadError } = await supabase.storage.from("layouts").upload(path, file, { cacheControl: "3600", upsert: false });
    if (uploadError) { setNotice(uploadError.message); setBusy(false); return; }
    const { error: insertError } = await supabase.from("layouts").insert({ title: title.trim(), category, description: description.trim(), image_path: path, is_published: true, sort_order: 0, created_by: user.id });
    if (insertError) {
      await supabase.storage.from("layouts").remove([path]);
      setNotice(insertError.message);
    } else {
      setTitle(""); setDescription(""); setFile(null); e.target.reset(); setOk(true); setNotice("Đã thêm layout vào thư viện."); await load();
    }
    setBusy(false);
  }

  async function togglePublish(item) {
    const supabase = getSupabase();
    const { error } = await supabase.from("layouts").update({ is_published: !item.is_published }).eq("id", item.id);
    if (error) { setNotice(error.message); setOk(false); } else await load();
  }

  async function editItem(item) {
    const nextTitle = window.prompt("Tên layout mới:", item.title);
    if (nextTitle === null) return;
    const trimmed = nextTitle.trim();
    if (!trimmed) { setNotice("Tên layout không được để trống."); setOk(false); return; }
    const supabase = getSupabase();
    const { error } = await supabase.from("layouts").update({ title: trimmed }).eq("id", item.id);
    if (error) { setNotice(error.message); setOk(false); }
    else { setNotice("Đã cập nhật tên layout."); setOk(true); await load(); }
  }

  async function removeItem(item) {
    if (!window.confirm(`Xóa layout “${item.title}”? Hành động này không thể hoàn tác.`)) return;
    const supabase = getSupabase();
    const { error } = await supabase.from("layouts").delete().eq("id", item.id);
    if (error) { setNotice(error.message); setOk(false); return; }
    await supabase.storage.from("layouts").remove([item.image_path]);
    setOk(true); setNotice("Đã xóa layout."); await load();
  }

  if (status === "checking") return <div className="container page-shell"><div className="empty-state"><div className="loader"/><p>Đang kiểm tra quyền quản trị...</p></div></div>;
  if (status === "config") return <div className="container page-shell"><div className="notice error">Chưa cấu hình Supabase. Hãy làm theo README.</div></div>;
  if (status === "guest") return <div className="container page-shell"><div className="empty-state"><ShieldCheck size={36}/><h2>Đăng nhập để tiếp tục</h2><p>Khu vực này chỉ dành cho quản trị viên.</p><Link className="button button-primary" href="/dang-nhap">Đăng nhập</Link></div></div>;
  if (status === "forbidden") return <div className="container page-shell"><div className="empty-state"><ShieldCheck size={36}/><h2>Bạn chưa có quyền Admin</h2><p>Tài khoản hiện tại là thành viên. Chủ website cần cấp quyền admin trong Supabase.</p><Link className="text-link" href="/">Quay về trang chủ</Link></div></div>;

  return <div className="container page-shell admin-shell"><div className="page-intro"><div className="eyebrow">CONTROL CENTER / LQA STUDIO</div><h1>Quản trị <span>thư viện</span></h1><p>Xin chào {user?.user_metadata?.display_name || user?.email}. Quản lý ảnh layout và nội dung hiển thị trên website.</p></div>
    {notice && <div className={`notice ${ok ? "success" : "error"}`}>{ok ? <CheckCircle2 size={17}/> : <AlertCircle size={17}/>}<span>{notice}</span></div>}
    <div className="admin-grid"><section className="admin-panel"><div className="panel-heading"><div><div className="eyebrow">NEW CONTENT</div><h2>Thêm layout</h2></div><ImagePlus/></div><form className="admin-form" onSubmit={addLayout}><label>Tên layout<input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Ví dụ: Bảng 01 - Đỏ đen" required maxLength={80}/></label><label>Danh mục<select value={category} onChange={(e) => setCategory(e.target.value)}>{CATEGORIES.map((c) => <option key={c.slug} value={c.slug}>{c.name}</option>)}</select></label><label>Mô tả (không bắt buộc)<textarea value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Mô tả ngắn về layout..." rows={3}/></label><label className="file-picker"><Upload size={20}/><span>{file ? file.name : "Chọn ảnh từ thiết bị"}</span><small>PNG, JPG, WEBP · Tối đa 10MB</small><input type="file" accept="image/png,image/jpeg,image/webp,image/gif" onChange={(e) => setFile(e.target.files?.[0] || null)}/></label><button className="button button-primary full-button" disabled={busy}>{busy ? "Đang tải lên..." : "Đăng layout"}<Upload size={17}/></button></form></section>
    <section className="admin-panel"><div className="panel-heading"><div><div className="eyebrow">CONTENT LIBRARY</div><h2>Layout hiện có <span className="count-pill">{items.length}</span></h2></div><button className="icon-button" onClick={load} aria-label="Tải lại"><RefreshCw size={17}/></button></div>{items.length === 0 ? <div className="empty-admin">Chưa có layout. Hãy thêm ảnh đầu tiên.</div> : <div className="admin-list">{items.map((item) => <div className="admin-item" key={item.id}><img src={getPublicImageUrl(item.image_path)} alt={item.title}/><div className="admin-item-text"><b>{item.title}</b><small>{CATEGORIES.find((c) => c.slug === item.category)?.name || item.category}</small><span className={item.is_published ? "published" : "unpublished"}>{item.is_published ? "Đang hiển thị" : "Đang ẩn"}</span></div><div className="admin-item-actions"><button className="icon-button" onClick={() => editItem(item)} title="Sửa tên layout"><Pencil size={16}/></button><button className="icon-button" onClick={() => togglePublish(item)} title={item.is_published ? "Ẩn layout" : "Hiện layout"}>{item.is_published ? <Eye size={17}/> : <EyeOff size={17}/>}</button><button className="icon-button danger-icon" onClick={() => removeItem(item)} title="Xóa layout"><Trash2 size={17}/></button></div></div>)}</div>}</section></div>
  </div>;
}
