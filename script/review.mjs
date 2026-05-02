// script/review.mjs
import fs from "node:fs";

async function runReview() {
  const apiKey = process.env.GEMINI_API_KEY;
  const prDiff = fs.readFileSync("pr_diff.txt", "utf-8");
  const styleGuide = fs.readFileSync(".github/styleguide.md", "utf-8");

  if (!prDiff.trim()) {
    console.log("변경된 코드가 없어 리뷰를 생략합니다.");
    return;
  }

  // 제미나이에게 보낼 프롬프트 조립
  const prompt = `
    당신은 시니어 프론트엔드 개발자입니다. 다음 스타일 가이드를 엄격히 지켜서 아래 변경된 코드를 리뷰해주세요.
    
    [스타일 가이드]
    ${styleGuide}
    
    [변경된 코드 (Git Diff)]
    ${prDiff}
  `;

  // Gemini API 호출 (최신 1.5 Pro 모델 사용)
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-pro:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
      }),
    },
  );

  const data = await response.json();
  const reviewComment = data.candidates[0].content.parts[0].text;

  // 리뷰 결과를 텍스트 파일로 저장 (GitHub Actions에서 댓글로 달기 위함)
  fs.writeFileSync("review_result.txt", reviewComment);
}

runReview().catch(console.error);
