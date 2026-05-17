import { Tile } from "@/ui/components/Tile";

const stats = [
  { label: "Revenue today", value: "$0", hint: "—" },
  { label: "Gigs today", value: "0", hint: "—" },
  { label: "New inquiries", value: "0", hint: "—" },
  { label: "New students", value: "0", hint: "—" },
];

export function TodayPanel() {
  return (
    <Tile title="Today">
      <div className="grid grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label}>
            <div className="text-xs text-neutral-500">{s.label}</div>
            <div className="text-2xl font-semibold mt-1">{s.value}</div>
            <div className="text-xs text-neutral-600 mt-1">{s.hint}</div>
          </div>
        ))}
      </div>
    </Tile>
  );
}
