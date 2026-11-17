import "./globals.css";
import Header from "@/components/Header";

export const metadata = {
  title: "LQA STUDIO | Free Fire Layout Library",
  description: "Thư viện layout Free Fire - Tính điểm, Tạo QR, Lineup và Profile."
};

export default function RootLayout({ children }) {
  return (
    <html lang="vi">
      <body>
        <Header />
        <main>{children}</main>
        <footer className="footer">
          <div className="container footer-inner">
            <div><strong>LQA <span>STUDIO</span></strong><p>FREE FIRE LAYOUT LIBRARY</p></div>
            <p>© {new Date().getFullYear()} LQA STUDIO. All rights reserved.</p>
          </div>
        </footer>
      </body>
    </html>
  );
}
