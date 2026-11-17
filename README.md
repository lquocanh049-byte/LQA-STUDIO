# LQA STUDIO

Website thư viện layout Free Fire được xây dựng theo cấu trúc và trải nghiệm tham khảo từ DHD Studio, đổi thương hiệu sang **LQA STUDIO**. Gồm 4 danh mục: Tính Điểm (50 ô mẫu), Tạo QR (18 ô mẫu), Lineup (1 ô mẫu), Profile (4 ô mẫu), cùng đăng ký/đăng nhập và trang quản trị.

> Lưu ý về hình ảnh: mã nguồn không sao chép ảnh thiết kế từ website tham khảo. Các ô thư viện ban đầu là placeholder mang thương hiệu LQA. Admin cần tải lên ảnh mà mình sở hữu hoặc được phép sử dụng để thay thế các ô chờ cập nhật.

## Công nghệ

- Next.js 14 / React 18
- Supabase Auth, PostgreSQL, Storage và Row Level Security
- Vercel deployment

## 1. Tạo Supabase

1. Tạo project tại https://supabase.com/.
2. Mở **SQL Editor → New query**.
3. Sao chép toàn bộ file `supabase/schema.sql`, dán vào SQL Editor và chạy.
4. Vào **Project Settings → API** để lấy Project URL và anon/publishable key.

## 2. Cấu hình môi trường

Tạo file `.env.local` tại thư mục gốc, dựa trên `.env.example`:

```env
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT_ID.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_SUPABASE_ANON_KEY
```

Không đưa `service_role` key vào website hoặc GitHub.

## 3. Chạy website

Cần Node.js 18.17 trở lên.

```bash
npm install
npm run dev
```

Mở `http://localhost:3000`.

## 4. Tạo tài khoản Admin đầu tiên

1. Mở website và đăng ký tài khoản.
2. Nếu Supabase yêu cầu xác nhận email, hãy xác nhận trước.
3. Vào Supabase → SQL Editor, chạy lệnh sau và thay email bằng email tài khoản của bạn:

```sql
update public.profiles
set role = 'admin'
where id = (select id from auth.users where email = 'EMAIL_CUA_BAN');
```

4. Đăng xuất rồi đăng nhập lại. Menu **Quản trị** sẽ xuất hiện.

Tài khoản đăng ký mới mặc định là `member`, không thể tự nâng quyền Admin.

## 5. Tải ảnh layout lên

1. Đăng nhập bằng tài khoản Admin.
2. Mở `/admin` hoặc chọn **Quản trị** trên thanh menu.
3. Chọn tên layout, danh mục và ảnh PNG/JPG/WEBP/GIF (tối đa 10MB).
4. Nhấn **Đăng layout**. Ảnh được lưu vào Supabase Storage và hiển thị ở thư viện tương ứng.
5. Admin có thể đổi tên, ẩn/hiện hoặc xóa layout.

Các ô placeholder được đánh số theo số lượng tham khảo. Khi ảnh thật được tải lên, chúng sẽ được thay bằng ảnh trong thư viện. Nếu cần khớp hoàn toàn danh sách mẫu gốc, hãy tải đủ ảnh hợp lệ cho từng danh mục.

## 6. Đưa website lên Vercel

1. Tải mã nguồn lên repository GitHub.
2. Vào https://vercel.com/ và import repository.
3. Thêm hai Environment Variables giống `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. Deploy.
5. Trong Supabase → Authentication → URL Configuration, đặt Site URL thành domain Vercel và thêm domain đó vào Redirect URLs.

## 7. Cấu trúc

```text
lqa-studio/
├── app/                 # Trang chủ, danh mục, đăng nhập, đăng ký, admin
├── components/          # Header, gallery, auth, admin
├── lib/                 # Supabase client và danh mục
├── supabase/schema.sql  # Database, RLS, Storage policies
├── .env.example
└── package.json
```

## Ghi chú

- Website cần cấu hình Supabase mới có thể đăng ký/đăng nhập và lưu ảnh.
- Các ô thư viện mặc định là placeholder; chưa chứa 73 ảnh gốc từ website tham khảo.
- Bucket `layouts` là public để khách xem ảnh. Chỉ Admin mới được upload, sửa hoặc xóa thông qua RLS policies.
- Không chia sẻ khóa `service_role` hoặc mật khẩu Supabase.
