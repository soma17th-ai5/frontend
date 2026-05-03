"use client";

import {
  ArrowRight,
  Bot,
  CalendarCheck,
  Loader2,
  MessagesSquare,
  Sparkles,
  TriangleAlert,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { GoogleIcon } from "@/components/ui/GoogleIcon";

const FEATURE_BULLETS = [
  {
    icon: CalendarCheck,
    title: "멘토링·일정",
    description: "Google Calendar와 연동해 신청부터 알림까지 자동으로 처리합니다.",
  },
  {
    icon: MessagesSquare,
    title: "Webex 공유 스페이스",
    description: "팀 공유 스페이스에서 키워드로 대화 맥락을 빠르게 찾아 요약합니다.",
  },
  {
    icon: Sparkles,
    title: "공식 공지 요약",
    description: "공지·튜토 글을 한 번에 모아 핵심만 정리해 드립니다.",
  },
];

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;

    setError(null);

    if (!email.trim() || !password.trim()) {
      setError("이메일과 비밀번호를 모두 입력해 주세요.");
      return;
    }

    setIsSubmitting(true);
    try {
      // TODO(api): 실제 인증 API 연동 시 fetch/Server Action 호출로 교체.
      await new Promise((resolve) => setTimeout(resolve, 600));
      router.push("/chat");
    } catch {
      setError("로그인에 실패했습니다. 잠시 후 다시 시도해 주세요.");
      setIsSubmitting(false);
    }
  };

  return (
    <main className="grid min-h-dvh grid-cols-1 bg-white lg:grid-cols-[1.05fr_1fr]">
      <section className="relative hidden overflow-hidden bg-gradient-to-br from-blue-600 via-indigo-600 to-violet-700 px-12 py-16 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute inset-0 opacity-30">
          <div className="absolute -left-24 top-12 h-72 w-72 rounded-full bg-white/30 blur-3xl" />
          <div className="absolute -bottom-24 right-0 h-80 w-80 rounded-full bg-cyan-300/40 blur-3xl" />
        </div>

        <div className="relative">
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-2xl bg-white/15 backdrop-blur">
              <Bot className="h-6 w-6" />
            </span>
            <div>
              <p className="text-lg font-semibold tracking-tight">SomaAgent</p>
              <p className="text-xs text-white/70">AI 생활 비서 · for SOMA 5th</p>
            </div>
          </div>

          <h1 className="mt-16 max-w-md text-4xl font-bold leading-tight tracking-tight">
            반복되는 신청·검색·요약,
            <br />
            <span className="text-cyan-200">한 번의 대화</span>로 끝내세요.
          </h1>
          <p className="mt-5 max-w-md text-base leading-relaxed text-white/80">
            멘토링 신청, Webex 공유 스페이스 검색, 공지 요약까지. SomaAgent가
            연수 기간 내내 옆에서 거듭니다.
          </p>
        </div>

        <ul className="relative mt-10 grid gap-4">
          {FEATURE_BULLETS.map(({ icon: Icon, title, description }) => (
            <li
              key={title}
              className="flex gap-4 rounded-2xl border border-white/15 bg-white/10 p-4 backdrop-blur"
            >
              <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-white/20">
                <Icon className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-semibold">{title}</p>
                <p className="text-sm text-white/75">{description}</p>
              </div>
            </li>
          ))}
        </ul>

        <p className="relative text-xs text-white/60">
          © {new Date().getFullYear()} SomaAgent. SOMA 5기 임시 디자인 시안.
        </p>
      </section>

      <section className="flex flex-col justify-center px-6 py-12 sm:px-12 lg:px-16">
        <div className="mx-auto w-full max-w-md">
          <div className="lg:hidden">
            <div className="mb-8 flex items-center gap-3">
              <span className="grid h-10 w-10 place-items-center rounded-xl bg-blue-600 text-white">
                <Bot className="h-5 w-5" />
              </span>
              <div>
                <p className="text-base font-semibold">SomaAgent</p>
                <p className="text-xs text-slate-500">AI 생활 비서</p>
              </div>
            </div>
          </div>

          <h2 className="text-2xl font-semibold tracking-tight text-slate-900">
            로그인
          </h2>
          <p className="mt-2 text-sm text-slate-500">
            SOMA 계정으로 로그인하면 멘토링·공지·Webex 데이터에 바로 연결돼요.
          </p>

          <button
            type="button"
            disabled={isSubmitting}
            className="mt-8 flex w-full items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <GoogleIcon className="h-5 w-5" />
            Google 계정으로 계속하기
          </button>

          <div className="my-6 flex items-center gap-3 text-xs text-slate-400">
            <div className="h-px flex-1 bg-slate-200" />
            또는 이메일로 로그인
            <div className="h-px flex-1 bg-slate-200" />
          </div>

          <form className="space-y-4" onSubmit={handleSubmit} noValidate>
            <div className="space-y-1.5">
              <label
                htmlFor="email"
                className="text-xs font-medium text-slate-600"
              >
                이메일
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="name@swmaestro.kr"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-50"
                autoComplete="email"
                disabled={isSubmitting}
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="password"
                  className="text-xs font-medium text-slate-600"
                >
                  비밀번호
                </label>
                <button
                  type="button"
                  className="text-xs font-medium text-blue-600 hover:text-blue-700"
                >
                  비밀번호를 잊으셨나요?
                </button>
              </div>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-4 focus:ring-blue-100 disabled:bg-slate-50"
                autoComplete="current-password"
                disabled={isSubmitting}
              />
            </div>

            {error && (
              <div
                role="alert"
                className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-700"
              >
                <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:bg-blue-400"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  로그인 중…
                </>
              ) : (
                <>
                  로그인하고 시작하기
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </button>
          </form>

          <p className="mt-6 text-center text-xs text-slate-500">
            아직 계정이 없으신가요?{" "}
            <button
              type="button"
              className="font-semibold text-blue-600 hover:text-blue-700"
            >
              사용 신청하기
            </button>
          </p>
        </div>
      </section>
    </main>
  );
}
