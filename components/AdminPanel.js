
"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import {
  Upload,
  Trash2,
  Eye,
  EyeOff,
  ShieldCheck,
  ImagePlus,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  Pencil
} from "lucide-react";

import { getSupabase, getPublicImageUrl } from "@/lib/supabase";
import { CATEGORIES } from "@/lib/categories";

const MAX_FILE_SIZE = 100 * 1024 * 1024;
const ALLOWED_TYPES = [
  "image/png",
  "image/jpeg",
  "image/webp",
  "image/gif"
];

export default function AdminPanel() {
  const [status, setStatus] = useState("checking");
  const [items, setItems] = useState([]);
  const [user, setUser] = useState(null);

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0].slug);
  const [description, setDescription] = useState("");
  const [file, setFile] = useState(null);

  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [actionId, setActionId] = useState(null);

  const [notice, setNotice] = useState("");
  const [ok, setOk] = useState(false);

  const formRef = useRef(null);

  function showMessage(message, success = false) {
    setNotice(message);
    setOk(success);
  }

  async function load() {
    const supabase = getSupabase();

    if (!supabase) {
      setStatus("config");
      return;
    }

    setLoading(true);

    try {
      const { data: auth, error: authError } =
        await supabase.auth.getUser();

      if (authError) throw authError;

      if (!auth.user) {
        setUser(null);
        setStatus("guest");
        setItems([]);
        return;
      }

      setUser(auth.user);

      const { data: profile, error: profileError } =
        await supabase
          .from("profiles")
          .select("role")
          .eq("id", auth.user.id)
          .maybeSingle();

      if (profileError) throw profileError;

      if (!profile || profile.role !== "admin") {
        setStatus("forbidden");
        setItems([]);
        return;
      }

      setStatus("admin");

      const { data, error } = await supabase
        .from("layouts")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setItems(data || []);
    } catch (error) {
      console.error("Admin load error:", error);
      setStatus("error");
      showMessage(
        error.message || "Không thể tải dữ liệu từ Supabase."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function addLayout(e) {
    e.preventDefault();

    if (busy) return;

    showMessage("");

    const trimmedTitle = title.trim();

    if (!trimmedTitle) {
      showMessage("Vui lòng nhập tên layout.");
      return;
    }

    if (!CATEGORIES.some((c) => c.slug === category)) {
      showMessage("Danh mục không hợp lệ.");
      return;
    }

    if (!file) {
      showMessage("Bạn chưa chọn ảnh layout.");
      return;
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      showMessage("Chỉ hỗ trợ PNG, JPG, WEBP và GIF.");
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      showMessage("Ảnh vượt quá 10MB. Hãy chọn ảnh nhỏ hơn.");
      return;
    }

    const supabase = getSupabase();

    if (!supabase || !user) {
      showMessage("Không tìm thấy phiên đăng nhập. Hãy tải lại trang.");
      return;
    }

    setBusy(true);

    let uploadedPath = null;

    try {
      const safeName = file.name
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[^a-zA-Z0-9._-]/g, "-")
        .replace(/-+/g, "-")
        .slice(-100);

      const fileName = safeName || "layout-image";
      uploadedPath = `${category}/${Date.now()}-${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("layouts")
        .upload(uploadedPath, file, {
          cacheControl: "3600",
          upsert: false,
          contentType: file.type
        });

      if (uploadError) throw uploadError;

      const { error: insertError } = await supabase
        .from("layouts")
        .insert({
          title: trimmedTitle,
          category,
          description: description.trim(),
          image_path: uploadedPath,
          is_published: true,
          sort_order: 0,
          created_by: user.id
        });

      if (insertError) throw insertError;

      setTitle("");
      setDescription("");
      setFile(null);
      formRef.current?.reset();

      showMessage("Đã thêm layout vào thư viện.", true);

      await load();
    } catch (error) {
      console.error("Add layout error:", error);

      if (uploadedPath) {
        const { error: cleanupError } = await supabase.storage
          .from("layouts")
          .remove([uploadedPath]);

        if (cleanupError) {
          console.error("Storage cleanup error:", cleanupError);
        }
      }

      showMessage(
        error.message || "Không thể thêm layout. Vui lòng thử lại."
      );
    } finally {
      setBusy(false);
    }
  }

  async function togglePublish(item) {
    if (actionId || busy) return;

    const supabase = getSupabase();
    if (!supabase) return;

    setActionId(item.id);
    showMessage("");

    try {
      const { error } = await supabase
        .from("layouts")
        .update({ is_published: !item.is_published })
        .eq("id", item.id);

      if (error) throw error;

      showMessage(
        item.is_published
          ? "Đã ẩn layout khỏi thư viện."
          : "Đã hiển thị layout trên website.",
        true
      );

      await load();
    } catch (error) {
      showMessage(error.message || "Không thể cập nhật layout.");
    } finally {
      setActionId(null);
    }
  }

  async function editItem(item) {
    if (actionId || busy) return;

    const nextTitle = window.prompt(
      "Tên layout mới:",
      item.title
    );

    if (nextTitle === null) return;

    const trimmed = nextTitle.trim();

    if (!trimmed) {
      showMessage("Tên layout không được để trống.");
      return;
    }

    if (trimmed.length > 80) {
      showMessage("Tên layout không được vượt quá 80 ký tự.");
      return;
    }

    const supabase = getSupabase();
    if (!supabase) return;

    setActionId(item.id);
    showMessage("");

    try {
      const { error } = await supabase
        .from("layouts")
        .update({ title: trimmed })
        .eq("id", item.id);

      if (error) throw error;

      showMessage("Đã cập nhật tên layout.", true);
      await load();
    } catch (error) {
      showMessage(error.message || "Không thể sửa tên layout.");
    } finally {
      setActionId(null);
    }
  }

  async function removeItem(item) {
    if (actionId || busy) return;

    const confirmed = window.confirm(
      `Xóa layout "${item.title}"? Hành động này không thể hoàn tác.`
    );

    if (!confirmed) return;

    const supabase = getSupabase();
    if (!supabase) return;

    setActionId(item.id);
    showMessage("");

    try {
      const { error: deleteError } = await supabase
        .from("layouts")
        .delete()
        .eq("id", item.id);

      if (deleteError) throw deleteError;

      const { error: storageError } = await supabase.storage
        .from("layouts")
        .remove([item.image_path]);

      if (storageError) {
        console.error("Storage delete error:", storageError);
        showMessage(
          "Đã xóa dữ liệu layout nhưng chưa xóa được ảnh trong Storage.",
          false
        );
      } else {
        showMessage("Đã xóa layout thành công.", true);
      }

      await load();
    } catch (error) {
      showMessage(error.message || "Không thể xóa layout.");
    } finally {
      setActionId(null);
    }
  }

  if (status === "checking") {
    return (
      <div className="container page-shell">
        <div className="empty-state">
          <div className="loader" />
          <p>Đang kiểm tra quyền quản trị...</p>
        </div>
      </div>
    );
  }

  if (status === "config") {
    return (
      <div className="container page-shell">
        <div className="notice error">
          Chưa cấu hình Supabase. Hãy kiểm tra file môi trường.
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="container page-shell">
        <div className="empty-state">
          <AlertCircle size={36} />
          <h2>Không thể tải dữ liệu</h2>
          <p>{notice || "Đã xảy ra lỗi khi kết nối Supabase."}</p>
          <button className="button button-primary" onClick={load}>
            <RefreshCw size={16} /> Thử lại
          </button>
        </div>
      </div>
    );
  }

  if (status === "guest") {
    return (
      <div className="container page-shell">
        <div className="empty-state">
          <ShieldCheck size={36} />
          <h2>Đăng nhập để tiếp tục</h2>
          <p>Khu vực này chỉ dành cho quản trị viên.</p>
          <Link className="button button-primary" href="/dang-nhap">
            Đăng nhập
          </Link>
        </div>
      </div>
    );
  }

  if (status === "forbidden") {
    return (
      <div className="container page-shell">
        <div className="empty-state">
          <ShieldCheck size={36} />
          <h2>Bạn chưa có quyền Admin</h2>
          <p>
            Tài khoản hiện tại chưa được cấp quyền quản trị.
          </p>
          <Link className="text-link" href="/">
            Quay về trang chủ
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container page-shell admin-shell">
      <div className="page-intro">
        <div className="eyebrow">
          CONTROL CENTER / LQA STUDIO
        </div>

        <h1>
          Quản trị <span>thư viện</span>
        </h1>

        <p>
          Xin chào{" "}
          {user?.user_metadata?.display_name || user?.email}.
          Quản lý ảnh layout và nội dung hiển thị trên website.
        </p>
      </div>

      {notice && (
        <div className={`notice ${ok ? "success" : "error"}`}>
          {ok ? <CheckCircle2 size={17} /> : <AlertCircle size={17} />}
          <span>{notice}</span>
        </div>
      )}

      <div className="admin-grid">
        <section className="admin-panel">
          <div className="panel-heading">
            <div>
              <div className="eyebrow">NEW CONTENT</div>
              <h2>Thêm layout</h2>
            </div>
            <ImagePlus />
          </div>

          <form
            ref={formRef}
            className="admin-form"
            onSubmit={addLayout}
          >
            <label>
              Tên layout
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Ví dụ: Bảng 01 - Đỏ đen"
                required
                maxLength={80}
              />
            </label>

            <label>
              Danh mục
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                {CATEGORIES.map((c) => (
                  <option key={c.slug} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>

            <label>
              Mô tả (không bắt buộc)
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Mô tả ngắn về layout..."
                rows={3}
              />
            </label>

            <label className="file-picker">
              <Upload size={20} />
              <span>
                {file ? file.name : "Chọn ảnh từ thiết bị"}
              </span>
              <small>PNG, JPG, WEBP, GIF · Tối đa 10MB</small>
              <input
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                onChange={(e) =>
                  setFile(e.target.files?.[0] || null)
                }
              />
            </label>

            <button
              className="button button-primary full-button"
              disabled={busy}
              type="submit"
            >
              {busy ? "Đang tải lên..." : "Đăng layout"}
              <Upload size={17} />
            </button>
          </form>
        </section>

        <section className="admin-panel">
          <div className="panel-heading">
            <div>
              <div className="eyebrow">CONTENT LIBRARY</div>
              <h2>
                Layout hiện có{" "}
                <span className="count-pill">{items.length}</span>
              </h2>
            </div>

            <button
              className="icon-button"
              type="button"
              onClick={load}
              disabled={loading || !!actionId || busy}
              aria-label="Tải lại"
              title="Tải lại danh sách"
            >
              <RefreshCw
                size={17}
                className={loading ? "loader-icon" : ""}
              />
            </button>
          </div>

          {loading ? (
            <div className="empty-admin">
              <div className="loader" />
              <p>Đang tải danh sách...</p>
            </div>
          ) : items.length === 0 ? (
            <div className="empty-admin">
              Chưa có layout. Hãy thêm ảnh đầu tiên.
            </div>
          ) : (
            <div className="admin-list">
              {items.map((item) => (
                <div className="admin-item" key={item.id}>
                  <img
                    src={getPublicImageUrl(item.image_path)}
                    alt={item.title}
                    loading="lazy"
                  />

                  <div className="admin-item-text">
                    <b>{item.title}</b>

                    <small>
                      {CATEGORIES.find(
                        (c) => c.slug === item.category
                      )?.name || item.category}
                    </small>

                    <span
                      className={
                        item.is_published
                          ? "published"
                          : "unpublished"
                      }
                    >
                      {item.is_published
                        ? "Đang hiển thị"
                        : "Đang ẩn"}
                    </span>
                  </div>

                  <div className="admin-item-actions">
                    <button
                      className="icon-button"
                      type="button"
                      disabled={!!actionId || busy}
                      onClick={() => editItem(item)}
                      title="Sửa tên layout"
                    >
                      <Pencil size={16} />
                    </button>

                    <button
                      className="icon-button"
                      type="button"
                      disabled={!!actionId || busy}
                      onClick={() => togglePublish(item)}
                      title={
                        item.is_published
                          ? "Ẩn layout"
                          : "Hiện layout"
                      }
                    >
                      {item.is_published ? (
                        <Eye size={17} />
                      ) : (
                        <EyeOff size={17} />
                      )}
                    </button>

                    <button
                      className="icon-button danger-icon"
                      type="button"
                      disabled={!!actionId || busy}
                      onClick={() => removeItem(item)}
                      title="Xóa layout"
                    >
                      <Trash2 size={17} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
