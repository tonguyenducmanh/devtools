export const TDMockMySQLFormatter = {
  inputSource: `SELECT kh.hoten AS ten_khach_hang,sp.ten_san_pham,SUM(don.so_luong) AS tong_so_luong_mua, AVG(don.gia_ban) AS gia_trung_binh, MAX(don.ngay_dat_hang) AS lan_mua_gan_nhat FROM khach_hang kh JOIN don_hang don ON kh.id = don.khach_hang_id JOIN san_pham sp ON don.san_pham_id = sp.id WHERE don.ngay_dat_hang >= '2025-01-01' AND sp.danh_muc IN ('Điện tử', 'Gia dụng') AND kh.tinh_thanh = 'Hà Nội' GROUP BY kh.id, sp.id HAVING tong_so_luong_mua > 3 AND gia_trung_binh < 10000000 ORDER BY tong_so_luong_mua DESC, lan_mua_gan_nhat DESC LIMIT 10;`,
};
