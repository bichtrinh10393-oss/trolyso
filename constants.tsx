
import React from 'react';
import { Shield, MessageCircle, Lock, UserCheck } from 'lucide-react';
import { Mission, MissionStatus, Achievement } from './types';

export const INITIAL_MISSIONS: Mission[] = [
  {
    id: 1,
    title: 'Nhiệm vụ 1: Bảo vệ thông tin cá nhân',
    description: 'Học cách giữ bí mật thông tin của mình trên mạng.',
    icon: '🛡️',
    status: MissionStatus.AVAILABLE,
    starsEarned: 0,
    totalStars: 5
  },
  {
    id: 2,
    title: 'Nhiệm vụ 2: Ứng xử trong giao tiếp trực tuyến',
    description: 'Học cách nhắn tin và trò chuyện lịch sự với bạn bè.',
    icon: '💬',
    status: MissionStatus.AVAILABLE,
    starsEarned: 0,
    totalStars: 5
  },
  {
    id: 3,
    title: 'Nhiệm vụ 3: Tôn trọng quyền riêng tư và bản quyền',
    description: 'Học cách sử dụng hình ảnh và nội dung số đúng cách.',
    icon: '📜',
    status: MissionStatus.AVAILABLE,
    starsEarned: 0,
    totalStars: 5
  },
  {
    id: 4,
    title: 'Nhiệm vụ 4: Hỏi đáp cùng Trợ lý',
    description: 'Em có thắc mắc gì về mạng Internet không? Hãy hỏi Trợ lý nhé!',
    icon: '💡',
    status: MissionStatus.AVAILABLE,
    starsEarned: 0,
    totalStars: 999
  }
];

export const ACHIEVEMENTS: Achievement[] = [
  {
    minStars: 0,
    label: 'Người mới bắt đầu',
    badge: '🌱',
    color: 'text-emerald-500',
    description: 'Bắt đầu hành trình khám phá thế giới số.'
  },
  {
    minStars: 5,
    label: 'Công dân số Tập sự',
    badge: '🛡️',
    color: 'text-blue-500',
    description: 'Đã nắm vững những bước bảo mật cơ bản.'
  },
  {
    minStars: 10,
    label: 'Ngôi sao An toàn Mạng',
    badge: '⭐',
    color: 'text-yellow-500',
    description: 'Biết cách tự bảo vệ mình trước các nguy hiểm online.'
  },
  {
    minStars: 15,
    label: 'Bậc thầy Ứng xử Số',
    badge: '🏆',
    color: 'text-purple-500',
    description: 'Luôn lịch sự và văn minh trong mọi cuộc trò chuyện.'
  },
  {
    minStars: 20,
    label: 'Anh hùng Số',
    badge: '🦸‍♂️',
    color: 'text-red-500',
    description: 'Một hình mẫu lý tưởng cho mọi công dân số nhí!'
  }
];

export const SYSTEM_INSTRUCTION = `
Bạn là một chuyên gia lập trình và Trợ lý AI hướng dẫn ứng xử trên môi trường số dành cho học sinh lớp 5 Việt Nam (khoảng 10 tuổi).

Mục tiêu:
- Giúp học sinh rèn luyện kỹ năng ứng xử văn minh, an toàn và có trách nhiệm khi tham gia môi trường số.
- Tạo hứng thú học tập theo hướng "vừa học – vừa chơi" thông qua nhiệm vụ, điểm sao và tình huống rẽ nhánh.

CHẾ ĐỘ HOẠT ĐỘNG:
1. Chế độ Tình huống (Nhiệm vụ 1, 2, 3): Đưa ra các tình huống rẽ nhánh như đã quy định.
2. Chế độ Hỏi đáp tự do (Nhiệm vụ 4 - "Hỏi đáp cùng Trợ lý"): 
   - Khi bắt đầu, hãy chào em và hỏi em có thắc mắc gì về Internet, mạng xã hội, an toàn mạng không.
   - Khi em hỏi, hãy giải thích ngắn gọn, dễ hiểu (phù hợp lứa tuổi lớp 5).
   - Vẫn chấm điểm sao (0, 0.5, 1) dựa trên: Câu hỏi hay, ý thức học hỏi, sự lễ phép.
   - Luôn nhắc nhở an toàn nếu câu hỏi liên quan đến các hành vi rủi ro.

QUY TẮC PHẢN HỒI JSON:
Luôn trả lời theo định dạng JSON sau:
{
  "evaluation": {
    "score": number (0-1),
    "stars": number (0, 0.5, or 1),
    "comment": "Lời khen ngợi/khích lệ",
    "explanation": "Giải thích tại sao câu hỏi/câu trả lời của em lại xứng đáng nhận sao",
    "suggestion": "Thông tin bổ sung hoặc lời khuyên an toàn"
  },
  "narrative": "Câu trả lời chính cho học sinh (hoặc tình huống mới)",
  "nextQuestion": "Câu hỏi gợi mở tiếp theo hoặc lời mời hỏi thêm",
  "isRetryPrompt": boolean,
  "isMissionEnd": boolean
}

NGÔN NGỮ: Tiếng Việt thân thiện, tích cực, không phê phán. Phù hợp Chương trình GDPT 2018.
`;
