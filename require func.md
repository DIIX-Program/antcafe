Phần A – Push Notification (bắt buộc)
Công nghệ gợi ý: expo-notifications + Expo Push Service, hoặc Firebase Cloud Messaging (FCM).

Xin quyền nhận thông báo, lấy push token và gửi token lên server gắn với tài khoản người dùng.
Server tự động gửi thông báo khi xảy ra ít nhất 2 sự kiện nghiệp vụ khác nhau (không chấp nhận chỉ gửi thử bằng công cụ test).
Xử lý thông báo ở 3 trạng thái: foreground, background và đã tắt ứng dụng.
Nhấn vào thông báo thì điều hướng đến đúng màn hình liên quan (dựa vào trường data trong payload).
Có ít nhất 1 thông báo cục bộ được lên lịch (nhắc lịch, nhắc deadline…).
Có màn hình lịch sử thông báo (đã đọc/chưa đọc) hoặc tùy chọn bật/tắt từng loại thông báo.

Server Node.js + socket.io; client socket.io-client.

Xây dựng server Socket.IO; xác thực kết nối bằng token đăng nhập (middleware xác thực khi handshake).
Cài đặt ít nhất 2 sự kiện realtime hai chiều (emit/on) gắn với nghiệp vụ đề tài.
Sử dụng room để chỉ gửi dữ liệu đến đúng nhóm người dùng (theo lớp, đơn hàng, dự án…).
Giao diện cập nhật tức thời không cần tải lại; minh họa bằng 2 thiết bị/giả lập chạy song song.
Hiển thị trạng thái kết nối, tự động kết nối lại; hủy lắng nghe sự kiện khi rời màn hình hoặc đăng xuất.


Lưu ý: từ Expo SDK 53, Expo Go trên Android không hỗ trợ remote push notification; cần tạo development build và kiểm thử trên thiết bị thật.