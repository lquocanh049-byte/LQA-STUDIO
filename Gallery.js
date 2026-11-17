"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, X, ChevronLeft, ChevronRight, Download, Image as ImageIcon, AlertCircle } from "lucide-react";
import Link from "next/link";
import { getSupabase, getPublicImageUrl } from "@/lib/supabase";

function PlaceholderCard({ category, index }) {
  const label = `${category.noun} ${String(index + 1).padStart(2, "0")}`;
  return <div className="layout-card placeholder-card" aria-label={`${label} đang chờ ảnh`}>
    <div className={`layout-image-wrap placeholder-art placeholder-${category.slug}`}>
      <span className="placeholder-watermark">LQA</span>
      <span className="placeholder-art-title">{category.slug === "tinh-diem" ? "BẢNG XẾP HẠNG" : category.slug === "tao-qr" ? "QR PAYMENT" : category.slug === "lineup" ? "LINE UP THI ĐẤU" : "PLAYER PROFILE"}</span>
      <span className="placeholder-art-sub">LQA STUDIO · FREE FIRE</span>
      <span className="layout-number">#{String(index + 1).padStart(2, "0")}</span>
      <span className="placeholder-coming">CHỜ CẬP NHẬT ẢNH</span>
    </div>
    <div className="layout-card-info"><span>{label}</span><span><ImageIcon size={14}/></span></div>
  </div>;
}

export default function Gallery({ category }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(null);

  useEffect(() => {
    let alive = true;
    async function load() {
      const supabase = getSupabase();
      if (!supabase) { if (alive) setLoading(false); return; }
      const { data, error: err } = await supabase.from("layouts").select("id,title,category,image_path,description,created_at").eq("category", category.slug).eq("is_published", true).order("sort_order", { ascending: true }).order("created_at", { ascending: true });
      if (!alive) return;
      if (err) setError(err.message); else setItems(data || []);
      setLoading(false);
    }
    load();
    return () => { alive = false; };
  }, [category.slug]);

  const filtered = useMemo(() => items.filter((item) => item.title.toLowerCase().includes(query.toLowerCase())), [items, query]);
  const imageUrl = (item) => getPublicImageUrl(item.image_path);
  const currentIndex = active ? filtered.findIndex((item) => item.id === active.id) : -1;
  function move(delta) {
    if (!filtered.length) return;
    const next = (currentIndex + delta + filtered.length) % filtered.length;
    setActive(filtered[next]);
  }
  useEffect(() => {
    function onKey(e) {
      if (!active) return;
      if (e.key === "Escape") setActive(null);
      if (e.key === "ArrowRight") move(1);
      if (e.key === "ArrowLeft") move(-1);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [active, filtered, currentIndex]);

  const placeholderCount = Math.max(0, category.count - items.length);
  const showPlaceholders = !query;

  return <div className="container page-shell">
    <div className="page-intro">
      <div className="eyebrow">{category.eyebrow} · {category.count} LAYOUT</div>
      <h1>Layout <span>{category.name}</span></h1>
      <p>{category.description}</p>
    </div>
    <div className="gallery-toolbar">
      <div className="search-box"><Search size={18}/><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Tìm kiếm layout..." aria-label="Tìm kiếm layout"/></div>
      <span className="result-count">{query ? `${filtered.length} kết quả` : `${category.count} layout`}</span>
    </div>
    {loading ? <div className="empty-state"><div className="loader"/><p>Đang tải thư viện...</p></div> : error ? <div className="notice error"><AlertCircle size={18}/>{error}</div> : <>
      {filtered.length === 0 && query ? <div className="empty-state"><ImageIcon size={34}/><h3>Không tìm thấy layout</h3><p>Thử tìm bằng tên khác.</p></div> : <div className="gallery-grid">
        {filtered.map((item, index) => <button className="layout-card" key={item.id} onClick={() => setActive(item)}>
          <div className="layout-image-wrap"><img src={imageUrl(item)} alt={item.title} loading="lazy"/><span className="layout-number">#{String(index + 1).padStart(2, "0")}</span><span className="view-overlay">XEM ẢNH</span></div>
          <div className="layout-card-info"><span>{item.title}</span><span><ImageIcon size={14}/></span></div>
        </button>)}
        {showPlaceholders && Array.from({ length: placeholderCount }, (_, index) => <PlaceholderCard key={`placeholder-${category.slug}-${index}`} category={category} index={items.length + index}/>) }
      </div>}
      {showPlaceholders && placeholderCount > 0 && <div className="gallery-hint">Một số ô đang chờ Admin tải ảnh mẫu lên. Đăng nhập tài khoản Admin để hoàn thiện thư viện.</div>}
      {items.length === 0 && <div className="gallery-admin-link"><Link href="/dang-nhap">Đăng nhập quản trị →</Link></div>}
    </>}
    {active && <div className="lightbox" role="dialog" aria-modal="true" aria-label={`Xem ${active.title}`} onClick={() => setActive(null)}>
      <button className="lightbox-close" onClick={() => setActive(null)} aria-label="Đóng"><X/></button>
      <button className="lightbox-arrow prev" onClick={(e) => {e.stopPropagation(); move(-1);}} aria-label="Ảnh trước"><ChevronLeft/></button>
      <div className="lightbox-content" onClick={(e) => e.stopPropagation()}><img src={imageUrl(active)} alt={active.title}/><div className="lightbox-caption"><div><b>{active.title}</b><small>{currentIndex + 1} / {filtered.length}</small></div><a className="button button-primary" href={imageUrl(active)} download={`${active.title.replace(/[^a-z0-9-_ ]/gi, "")}.jpg`} target="_blank" rel="noreferrer"><Download size={16}/> Tải ảnh</a></div></div>
      <button className="lightbox-arrow next" onClick={(e) => {e.stopPropagation(); move(1);}} aria-label="Ảnh tiếp theo"><ChevronRight/></button>
    </div>}
  </div>;
}
