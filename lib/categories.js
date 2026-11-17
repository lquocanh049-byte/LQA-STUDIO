export const CATEGORIES = [
  {
    slug: "tinh-diem",
    name: "Tính Điểm",
    eyebrow: "BẢNG XẾP HẠNG",
    description: "Bảng tính điểm Free Fire của lệnh .tinhdiem. Nhấn vào layout để xem toàn màn hình và tải ảnh.",
    short: "Bảng xếp hạng Free Fire",
    count: 50,
    noun: "Bảng"
  },
  {
    slug: "tao-qr",
    name: "Tạo QR",
    eyebrow: "THANH TOÁN",
    description: "Layout mã QR chuyển khoản của lệnh .taoqr. Nhấn vào layout để xem toàn màn hình và tải ảnh.",
    short: "Mẫu QR chuyển khoản",
    count: 18,
    noun: "QR"
  },
  {
    slug: "lineup",
    name: "Lineup",
    eyebrow: "ĐỘI HÌNH",
    description: "Poster đội hình thi đấu của lệnh .lineup. Nhấn vào layout để xem toàn màn hình và tải ảnh.",
    short: "Poster đội hình thi đấu",
    count: 1,
    noun: "Lineup"
  },
  {
    slug: "profile",
    name: "Profile",
    eyebrow: "HỒ SƠ TUYỂN THỦ",
    description: "Hồ sơ tuyển thủ Free Fire của lệnh .profile. Nhấn vào layout để xem toàn màn hình và tải ảnh.",
    short: "Hồ sơ tuyển thủ Free Fire",
    count: 4,
    noun: "Profile"
  }
];

export function getCategory(slug) {
  return CATEGORIES.find((item) => item.slug === slug);
}
