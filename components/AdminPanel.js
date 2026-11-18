
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

// ==================================================
// CẤU HÌNH UPLOAD
// ==================================================

const MAX_FILE_SIZE = 50 * 1024 * 1024;

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
  const [files, setFiles] = useState([]);

  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [actionId, setActionId] = useState(null);
  const [uploadProgress, setUploadProgress] = useState("");

  const [notice, setNotice] = useState("");
  const [ok, setOk] = useState(false);

  const formRef = useRef(null);
  const fileInputRef = useRef(null);

  // ==================================================
  // THÔNG BÁO
  // ==================================================

  function showMessage(message, success = false) {
    setNotice(message);
    setOk(success);
  }

  // ==================================================
  // TẢI DỮ LIỆU VÀ KIỂM TRA QUYỀN ADMIN
  // ==================================================

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

  // ==================================================
  // CHỌN ẢNH NHIỀU LẦN - KHÔNG MẤT ẢNH CŨ
  // ==================================================

  function handleFilesChange(e) {
    const selectedFiles = Array.from(e.target.files || []);

    if (selectedFiles.length === 0) return;

    setFiles((prev) => {
      const newFiles = selectedFiles.filter((file) => {
        return !prev.some(
          (old) =>
            old.name === file.name &&
            old.size === file.size &&
            old.lastModified === file.lastModified
        );
      });

      return [...prev, ...newFiles];
    });

    // Cho phép chọn lại file ở lần tiếp theo
    e.target.value = "";

    showMessage("");
  }

  // ==================================================
  // XÓA ẢNH ĐÃ CHỌN
  // ==================================================

  function removeSelectedFile(index) {
    if (busy) return;

    setFiles((prev) =>
      prev.filter((_, i) => i !== index)
    );
  }

  // ==================================================
  // TÁCH TÊN LAYOUT
  // ==================================================

  function titlesForDisplay(value) {
    return value
      .split(",")
      .map((item) => item.trim());
  }

  // ==================================================
  // TẠO TÊN FILE AN TOÀN
  // ==================================================

  function makeSafeFileName(name) {
    return name
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-zA-Z0-9._-]/g, "-")
      .replace(/-+/g, "-")
      .slice(-100) || "layout-image";
  }

  // ==================================================
  // THÊM MỘT HOẶC NHIỀU LAYOUT
  // ==================================================

  async function addLayout(e) {
    e.preventDefault();

    if (busy) return;

    showMessage("");

    const trimmedTitle = title.trim();

    if (!trimmedTitle) {
      showMessage("Vui lòng nhập tên layout.");
      return;
    }

    const titles = titlesForDisplay(trimmedTitle);

    if (titles.some((item) => !item)) {
      showMessage(
        "Tên layout không được để trống giữa các dấu phẩy."
      );
      return;
    }

    if (titles.some((item) => item.length > 80)) {
      showMessage(
        "Mỗi tên layout không được vượt quá 80 ký tự."
      );
      return;
    }

    if (!CATEGORIES.some((c) => c.slug === category)) {
      showMessage("Danh mục không hợp lệ.");
      return;
    }

    if (files.length === 0) {
      showMessage("Bạn chưa chọn ảnh layout.");
      return;
    }

    if (titles.length !== files.length) {
      showMessage(
        `Bạn nhập ${titles.length} tên nhưng chọn ${files.length} ảnh. Hai số lượng phải bằng nhau.`
      );
      return;
    }

    // Kiểm tra ảnh
    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      if (!ALLOWED_TYPES.includes(file.type)) {
        showMessage(
          `Ảnh thứ ${i + 1} không đúng định dạng. Chỉ hỗ trợ PNG, JPG, WEBP và GIF.`
        );
        return;
      }

      if (file.size > MAX_FILE_SIZE) {
        showMessage(
          `Ảnh thứ ${i + 1} vượt quá 50MB.`
        );
        return;
      }
    }

    const supabase = getSupabase();

    if (!supabase || !user) {
      showMessage(
        "Không tìm thấy phiên đăng nhập. Hãy tải lại trang."
      );
      return;
    }

    setBusy(true);

    const uploadedPaths = [];
    const rows = [];

    try {
      // Tải từng ảnh lên Storage
      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        setUploadProgress(
          `Đang tải ảnh ${i + 1}/${files.length}...`
        );

        const safeName = makeSafeFileName(file.name);

        const uploadedPath =
          `${category}/${Date.now()}-${i}-${safeName}`;

        const { error: uploadError } = await supabase.storage
          .from("layouts")
          .upload(uploadedPath, file, {
            cacheControl: "3600",
            upsert: false,
            contentType: file.type
          });

        if (uploadError) throw uploadError;

        uploadedPaths.push(uploadedPath);

        rows.push({
          title: titles[i],
          category,
          description: description.trim(),
          image_path: uploadedPath,
          is_published: true,
          sort_order: i,
          created_by: user.id
        });
      }

      // Lưu tất cả dữ liệu vào database
      setUploadProgress("Đang lưu dữ liệu...");

      const { error: insertError } = await supabase
        .from("layouts")
        .insert(rows);

      if (insertError) throw insertError;

      const totalUploaded = files.length;

      setTitle("");
      setDescription("");
      setFiles([]);

      formRef.current?.reset();

      setUploadProgress("");

      showMessage(
        `Đã đăng thành công ${totalUploaded} layout vào thư viện.`,
        true
      );

      await load();

    } catch (error) {
      console.error("Add layout error:", error);

      // Dọn ảnh nếu lưu database thất bại
      if (uploadedPaths.length > 0) {
        const { error: cleanupError } = await supabase.storage
          .from("layouts")
          .remove(uploadedPaths);

        if (cleanupError) {
          console.error("Storage cleanup error:", cleanupError);
        }
      }

      setUploadProgress("");

      showMessage(
        error.message || "Không thể thêm layout. Vui lòng thử lại."
      );

    } finally {
      setBusy(false);
    }
  }

  // ==================================================
  // ẨN / HIỆN LAYOUT
  // ==================================================

  async function togglePublish(item) {
    if (actionId || busy) return;

    const supabase = getSupabase();

    if (!supabase) return;

    setActionId(item.id);
    showMessage("");

    try {
      const { error } = await supabase
        .from("layouts")
        .update({
          is_published: !item.is_published
        })
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
      showMessage(
        error.message || "Không thể cập nhật layout."
      );

    } finally {
      setActionId(null);
    }
  }

  // ==================================================
  // SỬA TÊN LAYOUT
  // ==================================================

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
      showMessage(
        "Tên layout không được vượt quá 80 ký tự."
      );
      return;
    }

    const supabase = getSupabase();

    if (!supabase) return;

    setActionId(item.id);
    showMessage("");

    try {
      const { error } = await supabase
        .from("layouts")
        .update({
          title: trimmed
        })
        .eq("id", item.id);

      if (error) throw error;

      showMessage("Đã cập nhật tên layout.", true);

      await load();

    } catch (error) {
      showMessage(
        error.message || "Không thể sửa tên layout."
      );

    } finally {
      setActionId(null);
    }
  }

  // ==================================================
  // XÓA LAYOUT
  // ==================================================

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
      showMessage(
        error.message || "Không thể xóa layout."
      );

    } finally {
      setActionId(null);
    }
  }

  // ==================================================
  // GIAO DIỆN TRẠNG THÁI
  // ==================================================

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
          <p>
            {notice || "Đã xảy ra lỗi khi kết nối Supabase."}
          </p>

          <button
            className="button button-primary"
            onClick={load}
          >
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

          <Link
            className="button button-primary"
            href="/dang-nhap"
          >
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

  // ==================================================
  // GIAO DIỆN ADMIN
  // ==================================================

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
          {ok ? (
            <CheckCircle2 size={17} />
          ) : (
            <AlertCircle size={17} />
          )}

          <span>{notice}</span>
        </div>
      )}

      <div className="admin-grid">

        {/* THÊM LAYOUT */}

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
                placeholder="Ví dụ: 01,02,03"
                required
                maxLength={500}
              />

              <small>
                Nhập nhiều tên và ngăn cách bằng dấu phẩy.
              </small>
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

            {/* CHỌN ẢNH NHIỀU LẦN */}

            <div className="file-picker">
              <Upload size={20} />

              <span>
                {files.length > 0
                  ? `Đã chọn ${files.length} ảnh`
                  : "Chọn ảnh từ thiết bị"}
              </span>

              <small>
                PNG, JPG, WEBP, GIF · Tối đa 50MB/ảnh
              </small>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/gif"
                multiple
                onChange={handleFilesChange}
                disabled={busy}
              />

              <button
                type="button"
                className="button button-primary"
                disabled={busy}
                onClick={() => fileInputRef.current?.click()}
              >
                <ImagePlus size={16} />
                Chọn thêm ảnh
              </button>
            </div>

            {/* DANH SÁCH ẢNH ĐÃ CHỌN */}

            {files.length > 0 && (
              <div className="selected-files">
                <b>
                  Danh sách ảnh đã chọn ({files.length})
                </b>

                {files.map((file, index) => (
                  <div
                    key={`${file.name}-${file.size}-${file.lastModified}-${index}`}
                    className="selected-file-item"
                  >
                    <div>
                      <span>
                        {index + 1}. {file.name}
                      </span>

                      <small>
                        {titlesForDisplay(title)[index] || "Chưa có tên"}
                      </small>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeSelectedFile(index)}
                      disabled={busy}
                    >
                      <Trash2 size={15} />
                      Xóa
                    </button>
                  </div>
                ))}
              </div>
            )}

            {busy && (
              <div className="upload-progress">
                <div className="loader" />
                <span>{uploadProgress}</span>
              </div>
            )}

            <button
              className="button button-primary full-button"
              disabled={busy}
              type="submit"
            >
              {busy
                ? uploadProgress || "Đang tải lên..."
                : files.length > 1
                  ? `Đăng ${files.length} layout`
                  : "Đăng layout"}

              <Upload size={17} />
            </button>

          </form>
        </section>

        {/* DANH SÁCH LAYOUT */}

        <section className="admin-panel">

          <div className="panel-heading">
            <div>
              <div className="eyebrow">CONTENT LIBRARY</div>

              <h2>
                Layout hiện có{" "}
                <span className="count-pill">
                  {items.length}
                </span>
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
