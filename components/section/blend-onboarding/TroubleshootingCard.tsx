import type { Troubleshooting } from "@/lib/data/blend-50-50";

type TroubleshootingCardProps = { item: Troubleshooting };

export function TroubleshootingCard({ item }: TroubleshootingCardProps) {
  return (
    <div className="rounded-2xl border border-white/10 p-5 shadow-sm">
      <p className="text-sm font-medium text-[hsl(var(--primary))]">{item.question}</p>
      <p className="mt-2 text-sm text-[hsl(var(--secondary))]">{item.answer}</p>
    </div>
  );
}
