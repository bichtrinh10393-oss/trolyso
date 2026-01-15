
import { Mission, MissionStatus } from './types';

export const MISSIONS: Mission[] = [
  {
    id: 1,
    title: "Bảo vệ thông tin cá nhân",
    description: "Học cách giữ bí mật thông tin của mình trên mạng.",
    status: MissionStatus.NOT_STARTED,
    score: 0,
    icon: "🛡️",
    color: "blue",
    situations: [
      {
        id: "m1-s1",
        description: "Em đang chơi một trò chơi trực tuyến rất vui. Bỗng nhiên có một người bạn lạ mặt nhắn tin: 'Chào bạn, mình có bộ trang phục hiếm muốn tặng bạn, bạn cho mình mượn mật khẩu tài khoản để mình nạp vào giúp nhé!'",
        question: "Nếu là em, em sẽ làm gì?"
      },
      {
        id: "m1-s2",
        description: "Em thấy một trang web thông báo: 'Chúc mừng! Bạn đã trúng một chiếc máy tính bảng. Hãy nhập họ tên, địa chỉ nhà và số điện thoại của bố mẹ để nhận quà ngay!'",
        question: "Nếu là em, em sẽ làm gì?"
      }
    ]
  },
  {
    id: 2,
    title: "Ứng xử trong giao tiếp trực tuyến",
    description: "Học cách nhắn tin và trò chuyện lịch sự với bạn bè.",
    status: MissionStatus.NOT_STARTED,
    score: 0,
    icon: "💬",
    color: "purple",
    situations: [
      {
        id: "m2-s1",
        description: "Trong nhóm chat của lớp, các bạn đang cãi nhau rất gay gắt về một trận bóng đá. Một bạn bắt đầu dùng những từ ngữ không hay để nói về đội của bạn kia.",
        question: "Nếu là em, em sẽ làm gì?"
      }
    ]
  },
  {
    id: 3,
    title: "Tôn trọng quyền riêng tư và bản quyền",
    description: "Học cách sử dụng hình ảnh và nội dung số đúng cách.",
    status: MissionStatus.NOT_STARTED,
    score: 0,
    icon: "📜",
    color: "orange",
    situations: [
      {
        id: "m3-s1",
        description: "Em thấy một bức tranh rất đẹp của một bạn khác vẽ trên mạng. Em muốn đăng lại lên trang cá nhân của mình để khoe với mọi người.",
        question: "Nếu là em, em sẽ làm gì?"
      }
    ]
  },
  {
    id: 4,
    title: "Hỏi đáp cùng Trợ lý",
    description: "Em có thắc mắc gì về mạng Internet không? Hãy hỏi AI nhé!",
    status: MissionStatus.NOT_STARTED,
    score: 0,
    icon: "💡",
    color: "yellow",
    situations: [] // Nhiệm vụ đặc biệt: Chat tự do
  }
];
