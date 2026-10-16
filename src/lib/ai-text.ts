/** Pull plain text out of a Responses API result. */
export function responseText(res: unknown): string {
  const r = res as { output_text?: string; output?: Array<{ content?: Array<{ type?: string; text?: string }> }> };
  if (typeof r.output_text === "string" && r.output_text) return r.output_text;
  return (r.output ?? [])
    .flatMap((o) => o.content ?? [])
    .filter((c) => c.type === "output_text" && typeof c.text === "string")
    .map((c) => c.text)
    .join("");
}

export function friendlyAiError(e: unknown): string {
  const err = e as { name?: string; httpStatus?: number; message?: string };
  if (err?.httpStatus === 429 || err?.name === "RateLimitError") return "The AI is busy right now. Please wait a moment and try again.";
  if (err?.httpStatus === 402 || err?.name === "PaymentRequiredError") return "AI credits have run out. Add credits in your workspace to continue.";
  return "The AI couldn't process that request. Please try again.";
}
