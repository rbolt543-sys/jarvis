import { Tile } from "@/ui/components/Tile";

export function Inbox() {
  return (
    <Tile title="Inbox">
      <div className="text-sm text-neutral-500">
        No inquiries yet. Connect BookLive and GigSalad to populate this view.
      </div>
    </Tile>
  );
}
