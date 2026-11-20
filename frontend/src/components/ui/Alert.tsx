type Tone = "error" | "success" | "info";

const tones: Record<Tone, string> = {
  error: "border-danger text-danger",
  success: "border-success text-success",
  info: "border-border text-text",
};

export function Alert({ tone, children }: { tone: Tone; children: string }) {
  return (
    <p
      role={tone === "error" ? "alert" : "status"}
      className={`rounded-card border bg-surface px-3 py-3 text-sm ${tones[tone]}`}
    >
      {children}
    </p>
  );
}
