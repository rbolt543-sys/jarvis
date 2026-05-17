import { Tile } from "@/ui/components/Tile";

export function Money() {
  return (
    <Tile title="Money">
      <div className="text-sm text-neutral-500">
        Stripe revenue split (gigs vs Go Off Book vs other) goes here once the
        Stripe adapter connects.
      </div>
    </Tile>
  );
}
