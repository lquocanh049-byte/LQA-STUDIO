import Link from "next/link";
import { ArrowUpRight, Trophy, QrCode, Users, UserRound, ShieldCheck, Image as ImageIcon, Download } from "lucide-react";
import { CATEGORIES } from "@/lib/categories";
import HomeLogin from "@/components/HomeLogin";

const icons = { "tinh-diem": Trophy, "tao-qr": QrCode, lineup: Users, profile: UserRound };

export default function HomePage() {
  return <>
    <section className="home-hero">
      <div className="home-hero-bg" />
      <div className="container home-hero-grid">
        <div className="home-showcase">
          <div className="eyebrow">FREE FIRE · DESIGN COLLECTION</div>
          <h1>LQA <span>STUDIO</span></h1>
          <p>Thư viện layout dành cho cộng đồng Free Fire. Khám phá mẫu thiết kế, xem ảnh toàn màn hình và tải về dễ dàng.</p>
          <div className="hero-actions"><Link className="button button-primary" href="/tinh-diem">Khám phá layout <ArrowUpRight size={17}/></Link><Link className="button button-ghost" href="/dang-ky">Tạo tài khoản</Link></div>
          <div className="home-stats"><span><b>73</b><small>LAYOUT MẪU</small></span><i/><span><b>04</b><small>DANH MỤC</small></span><i/><span><b>24/7</b><small>TRUY CẬP</small></span></div>
          <div className="showcase-collage">
            <div className="showcase-tile tile-rank"><span>01 / RANKING</span><b>BẢNG<br/>XẾP HẠNG</b><small>FREE FIRE</small></div>
            <div className="showcase-tile tile-qr"><span>02 / PAYMENT</span><b>QR<br/>DESIGN</b><small>SCAN & PAY</small></div>
            <div className="showcase-tile tile-team"><span>03 / TEAM</span><b>LINEUP</b><small>YOUR SQUAD</small></div>
          </div>
        </div>
        <div className="home-login-panel">
          <div className="panel-topline"><span className="panel-dot"/> MEMBER AREA <span className="panel-code">LQA / 001</span></div>
          <div className="login-emblem">LQA</div>
          <div className="eyebrow">WELCOME TO LQA STUDIO</div>
          <h2>Chào mừng<br/><span>trở lại</span></h2>
          <p>Đăng nhập tài khoản để tiếp tục sử dụng thư viện.</p>
          <HomeLogin />
          <div className="home-register-line">Chưa có tài khoản? <Link href="/dang-ky">Đăng ký ngay</Link></div>
          <div className="panel-foot"><ShieldCheck size={14}/> MEMBER ACCESS · LQA STUDIO</div>
        </div>
      </div>
    </section>

    <section className="container section" id="dich-vu">
      <div className="section-heading"><div><div className="eyebrow">DỊCH VỤ / COLLECTIONS</div><h2>Danh mục <span>layout</span></h2></div><p>Chọn danh mục bạn muốn xem. Mỗi mẫu đều có chế độ xem ảnh lớn và tải về.</p></div>
      <div className="category-grid">
        {CATEGORIES.map((item, index) => {
          const Icon = icons[item.slug];
          return <Link href={`/${item.slug}`} className="category-card" key={item.slug}>
            <div className="category-top"><span className="category-index">0{index + 1} / {item.count} LAYOUT</span><span className="category-icon"><Icon size={22}/></span></div>
            <div><h3>{item.name}</h3><p>{item.short}</p></div>
            <div className="category-bottom"><span>XEM THƯ VIỆN</span><ArrowUpRight size={18}/></div>
          </Link>;
        })}
      </div>
    </section>

    <section className="feature-band"><div className="container feature-inner"><div><div className="eyebrow">LQA STUDIO / FEATURES</div><h2>Chọn mẫu nhanh.<br/><span>Tải về dễ dàng.</span></h2></div><div className="feature-list"><div><ImageIcon/><span><b>Thư viện trực quan</b><small>Sắp xếp theo từng danh mục rõ ràng.</small></span></div><div><Download/><span><b>Xem và tải ảnh</b><small>Mở ảnh lớn, chuyển mẫu và lưu về thiết bị.</small></span></div><div><ShieldCheck/><span><b>Tài khoản thành viên</b><small>Đăng nhập và quản lý nội dung theo quyền.</small></span></div></div></div></section>
  </>;
}
