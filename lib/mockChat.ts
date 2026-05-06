import type { ActionResult } from "@/lib/types/action";
import type { Source } from "@/lib/types/source";
import type { WebexSummaryItem } from "@/lib/types/webex";

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

type AgentBase = {
  id: string;
  role: "agent";
  sources?: Source[];
};

export type ChatMessage =
  | {
      id: string;
      role: "user";
      text: string;
    }
  | (AgentBase & {
      kind: "text";
      text: string;
    })
  | (AgentBase & {
      kind: "mentoring";
      intro: string;
      cards: MentoringCardData[];
    })
  | (AgentBase & {
      kind: "notice";
      intro: string;
      items: NoticeItem[];
    })
  | (AgentBase & {
      kind: "webex_summary";
      intro: string;
      items: WebexSummaryItem[];
    })
  | {
      id: string;
      role: "agent";
      kind: "action_result";
      results: ActionResult[];
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
    sources: [
      {
        id: "src-mentoring-list",
        type: "mentoring",
        title: "공식 멘토링 시스템 — 5월 멘토링 일정",
        url: "https://www.swmaestro.kr/mentoring",
        createdAt: "2026-05-01T01:00:00Z",
        collectedAt: "2026-05-06T08:00:00Z",
        official: true,
      },
    ],
  },
  {
    id: "ar-1",
    role: "agent",
    kind: "action_result",
    results: [
      {
        actionType: "MENTORING_APPLY",
        status: "success",
        message:
          "‘마이크로서비스 아키텍처 설계’ 멘토링 신청이 완료되었어요. 시작 30분 전 알림이 발송됩니다.",
        data: {
          application: {
            applySn: 480231,
            qustnrSn: 9912,
            mentoringId: "m-1",
            title: "마이크로서비스 아키텍처 설계",
            sessionStartedAt: "2026-05-08T05:00:00Z",
          },
          calendarInvite: {
            status: "created",
            eventId: "5d2f1c80-0b34-4f5a-9f84-1e5bf8ab1234",
          },
        },
        traceId: "trc-2026-05-06-0001",
      },
    ],
  },
  {
    id: "u-1b",
    role: "user",
    text: "데이터베이스 멘토링도 신청해줘",
  },
  {
    id: "ar-2",
    role: "agent",
    kind: "action_result",
    results: [
      {
        actionType: "MENTORING_APPLY",
        status: "success",
        message: "‘데이터베이스 최적화 실전’ 멘토링 신청은 완료됐어요.",
        data: {
          application: {
            applySn: 480255,
            qustnrSn: 9924,
            mentoringId: "m-2",
            title: "데이터베이스 최적화 실전",
            sessionStartedAt: "2026-05-10T01:00:00Z",
          },
          calendarInvite: {
            status: "failed",
            errorMessage: "Calendar API rate limit exceeded (HTTP 429)",
          },
        },
        traceId: "trc-2026-05-06-0002",
      },
    ],
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
    sources: [
      {
        id: "src-notice-week",
        type: "notice",
        title: "이번 주 주요 공지 모음",
        url: "https://www.swmaestro.kr/notice/2026-05",
        createdAt: "2026-04-30T05:00:00Z",
        collectedAt: "2026-05-06T08:00:00Z",
        official: true,
      },
      {
        id: "src-notice-pdf",
        type: "notice_pdf",
        title: "5월 워크숍 안내 (PDF)",
        url: "https://www.swmaestro.kr/files/workshop-2026-05.pdf",
        createdAt: "2026-04-29T10:00:00Z",
        official: true,
      },
    ],
  },
  {
    id: "u-3",
    role: "user",
    text: "Webex에서 ‘배포’ 관련 대화 찾아줘",
  },
  {
    id: "a-3",
    role: "agent",
    kind: "webex_summary",
    intro: "Webex 공유 스페이스에서 ‘배포’ 관련 대화를 룸별로 정리했어요:",
    items: [
      {
        id: "ws-1",
        roomId: "r-be",
        roomName: "SOMA 5기 · 백엔드 채널",
        topic: "AWS 배포 시 환경변수 관리",
        summary:
          ".env 파일이 깃에 올라가지 않도록 .gitignore 점검 + Secrets Manager 쪽으로 옮기자는 의견. 임시 토큰 노출 사례가 있어 모두 재발급 권장.",
        messageCount: 8,
        participants: ["이지훈", "김서현", "박준영"],
        startedAt: "2026-04-29T06:30:00Z",
        endedAt: "2026-04-29T06:55:00Z",
        highlights: [
          {
            id: "h-1",
            author: "이지훈",
            text: "AWS 배포 시 환경변수 설정 주의하세요. .env 파일 깃에 안 올라가게 .gitignore 한 번 더 봐주세요.",
            createdAt: "2026-04-29T06:42:00Z",
          },
          {
            id: "h-2",
            author: "박준영",
            text: "기존 토큰은 유출 가능성 있으니 일괄 재발급 권장합니다.",
            createdAt: "2026-04-29T06:48:00Z",
          },
        ],
        rawRefs: ["webex://room/r-be/messages/abc123"],
      },
      {
        id: "ws-2",
        roomId: "r-be",
        roomName: "SOMA 5기 · 백엔드 채널",
        topic: "Docker 배포 가이드 정리",
        summary:
          "Compose 기반 로컬 ↔ ECR + ECS 운영 환경 분리 가이드 공유. 이미지 태깅 컨벤션은 git short SHA + env 접두어로 통일.",
        messageCount: 5,
        participants: ["김서현", "이지훈"],
        startedAt: "2026-04-28T01:10:00Z",
        endedAt: "2026-04-28T01:35:00Z",
        highlights: [
          {
            id: "h-3",
            author: "김서현",
            text: "Docker 배포 가이드 공유합니다 👉 [링크]",
            createdAt: "2026-04-28T01:15:00Z",
          },
        ],
        rawRefs: ["webex://room/r-be/messages/def456"],
      },
      {
        id: "ws-3",
        roomId: "r-general",
        roomName: "SOMA 5기 · 일반 채널",
        topic: "5월 워크숍 배포 데모 일정 조율",
        summary:
          "워크숍에서 라이브 배포 데모를 진행할지 논의. 5월 6일 오후에 시연 30분 + Q&A 15분으로 잠정 확정.",
        messageCount: 12,
        participants: ["운영진", "이지훈", "최민호", "이서연"],
        startedAt: "2026-04-30T05:00:00Z",
        endedAt: "2026-04-30T05:45:00Z",
        highlights: [
          {
            id: "h-4",
            author: "운영진",
            text: "워크숍 라이브 데모는 5/6 14:30~15:15로 잠정합니다. 변경 시 채널 공지할게요.",
            createdAt: "2026-04-30T05:32:00Z",
          },
        ],
      },
    ],
    sources: [
      {
        id: "src-webex-room-be",
        type: "webex_summary",
        title: "SOMA 5기 · 백엔드 채널 — 배포 관련 클러스터",
        createdAt: "2026-04-29T07:00:00Z",
        collectedAt: "2026-05-06T08:00:00Z",
        official: false,
        rawRef: "webex://room/r-be",
      },
      {
        id: "src-webex-room-general",
        type: "webex_summary",
        title: "SOMA 5기 · 일반 채널 — 워크숍 데모",
        createdAt: "2026-04-30T06:00:00Z",
        collectedAt: "2026-05-06T08:00:00Z",
        official: false,
        rawRef: "webex://room/r-general",
      },
    ],
  },
];

export const MOCK_HISTORY = [
  { id: "h-1", title: "백엔드 멘토링 찾기", date: "오늘" },
  { id: "h-2", title: "이번 주 공지 요약", date: "오늘" },
  { id: "h-3", title: "Webex ‘배포’ 검색", date: "어제" },
  { id: "h-4", title: "프론트 멘토링 일정", date: "4월 28일" },
  { id: "h-5", title: "Google Calendar 연결", date: "4월 25일" },
];
