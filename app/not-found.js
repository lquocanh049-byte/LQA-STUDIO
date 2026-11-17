import Link from "next/link";
export default function NotFound() {
  return <div className="container page-shell"><div className="empty-state"><h2>Không tìm thấy trang</h2><p>Danh mục hoặc đường dẫn này không tồn tại.</p><Link className="button button-primary" href="/">Về trang chủ</Link></div></div>;
}
