import type { ReviewTopic, Sentiment } from "@/types/dashboard";

const negativeWords = ["\u6389\u5e27", "\u663e\u5b58", "\u52a0\u8f7d", "\u5361\u987f", "\u529d\u9000"];
const positiveWords = ["\u60ca\u8273", "\u6210\u5c31\u611f", "\u65b0\u610f", "\u503c\u5f97", "\u5f88\u5f3a"];

export type ReviewClassification = {
  topic: ReviewTopic;
  sentiment: Sentiment;
  confidence: number;
};

export function classifyReview(content: string): ReviewClassification {
  const topic = inferTopic(content);
  const sentiment = inferSentiment(content);

  return {
    topic,
    sentiment,
    confidence: sentiment === "neutral" ? 0.68 : 0.82,
  };
}

function inferTopic(content: string): ReviewTopic {
  if (content.includes("Boss") || content.includes("\u68cd\u52bf") || content.includes("\u95ea\u907f")) {
    return "\u6218\u6597\u4f53\u9a8c";
  }

  if (content.includes("\u573a\u666f") || content.includes("\u5efa\u6a21") || content.includes("\u4e1c\u65b9")) {
    return "\u7f8e\u672f\u573a\u666f";
  }

  if (content.includes("\u897f\u6e38") || content.includes("\u7ae0\u8282") || content.includes("\u5267\u60c5")) {
    return "\u5267\u60c5\u53d9\u4e8b";
  }

  if (content.includes("\u6389\u5e27") || content.includes("\u663e\u5b58") || content.includes("\u52a0\u8f7d")) {
    return "\u6027\u80fd\u4f18\u5316";
  }

  return "\u96be\u5ea6\u66f2\u7ebf";
}

function inferSentiment(content: string): Sentiment {
  if (negativeWords.some((word) => content.includes(word))) {
    return "negative";
  }

  if (positiveWords.some((word) => content.includes(word))) {
    return "positive";
  }

  return "neutral";
}
