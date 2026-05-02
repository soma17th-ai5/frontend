export type SourceTone = "neutral" | "warm";

export type ChatSource = {
  label: string;
  date: string;
  href?: string;
  tone?: SourceTone;
};

export type MentoringCardData = {
  id: string;
  title: string;
  mentor: string;
  tag: string;
  date: string;
  time: string;
  status: "open" | "closed";
};

export type NoticeItem = {
  id: string;
  text: string;
};

export type WebexReply = {
  id: string;
  author: string;
  time: string;
  text: string;
  badge?: string;
};

export type ChatMessage =
  | {
      id: string;
      role: "user";
      text: string;
    }
  | {
      id: string;
      role: "agent";
      kind: "text";
      text: string;
      source?: ChatSource;
    }
  | {
      id: string;
      role: "agent";
      kind: "mentoring";
      intro: string;
      cards: MentoringCardData[];
      source?: ChatSource;
    }
  | {
      id: string;
      role: "agent";
      kind: "notice";
      intro: string;
      items: NoticeItem[];
      source?: ChatSource;
    }
  | {
      id: string;
      role: "agent";
      kind: "webex";
      intro: string;
      replies: WebexReply[];
      source?: ChatSource;
    }
  | {
      id: string;
      role: "system";
      kind: "status";
      text: string;
      detail: string;
    };

export const MOCK_MESSAGES: ChatMessage[] = [
  {
    id: "u-1",
    role: "user",
    text: "백엔드 멘토링 찾아줘",
  },
  {
    id: "a-1",
    role: "agent",
    kind: "mentoring",
    intro: "백엔드 관련 멘토링 3건을 찾았습니다.",
    cards: [
      {
        id: "m-1",
        title: "마이크로서비스 아키텍처 설계",
        mentor: "박준영 멘토",
        tag: "백엔드",
        date: "2026년 5월 8일",
        time: "14:00 - 15:30",
        status: "open",
      },
      {
        id: "m-2",
        title: "데이터베이스 최적화 실전",
        mentor: "이서연 멘토",
        tag: "백엔드",
        date: "2026년 5월 10일",
        time: "10:00 - 11:30",
        status: "open",
      },
      {
        id: "m-3",
        title: "Spring Boot 심화",
        mentor: "최민호 멘토",
        tag: "백엔드",
        date: "2026년 5월 7일",
        time: "16:00 - 17:00",
        status: "closed",
      },
    ],
    source: {
      label: "공식 멘토링 시스템",
      date: "2026.05.01",
      href: "#",
    },
  },
  {
    id: "s-1",
    role: "system",
    kind: "status",
    text: "신청 완료",
    detail:
      "‘마이크로서비스 아키텍처 설계’ 멘토링 신청이 완료되었고, Google Calendar에 등록되었습니다.",
  },
  {
    id: "u-2",
    role: "user",
    text: "이번 주 공지사항 요약해줘",
  },
  {
    id: "a-2",
    role: "agent",
    kind: "notice",
    intro: "이번 주 주요 공지사항입니다:",
    items: [
      { id: "n-1", text: "5월 3일(토) 중간평가 발표 자료 제출 마감" },
      { id: "n-2", text: "5월 6일(화) 전체 워크숍 - 온라인 참여 필수" },
      { id: "n-3", text: "멘토링 신청 시스템 점검: 5월 4일 22:00-23:00" },
    ],
    source: {
      label: "공식 공지사항",
      date: "2026.04.30",
      href: "#",
    },
  },
  {
    id: "u-3",
    role: "user",
    text: "Webex에서 ‘배포’ 관련 대화 찾아줘",
  },
  {
    id: "a-3",
    role: "agent",
    kind: "webex",
    intro: "Webex 공유 스페이스에서 ‘배포’ 관련 대화 2건을 찾았습니다:",
    replies: [
      {
        id: "w-1",
        author: "이지훈",
        time: "4월 29일 15:42",
        text: "“AWS 배포 시 환경변수 설정 주의하세요. .env 파일 깃에 안 올라가게…”",
      },
      {
        id: "w-2",
        author: "김서현",
        time: "4월 28일 10:15",
        text: "“Docker 배포 가이드 공유합니다 👉 [링크]”",
      },
    ],
    source: {
      label: "Webex 공유 스페이스",
      date: "2026.04.29",
      href: "#",
      tone: "warm",
    },
  },
];

export const MOCK_HISTORY = [
  { id: "h-1", title: "백엔드 멘토링 찾기", date: "오늘" },
  { id: "h-2", title: "이번 주 공지 요약", date: "오늘" },
  { id: "h-3", title: "Webex ‘배포’ 검색", date: "어제" },
  { id: "h-4", title: "프론트 멘토링 일정", date: "4월 28일" },
  { id: "h-5", title: "Google Calendar 연결", date: "4월 25일" },
];
