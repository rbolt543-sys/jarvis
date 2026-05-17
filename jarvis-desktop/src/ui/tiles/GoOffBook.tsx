import { Tile } from "@/ui/components/Tile";

export function GoOffBook() {
  return (
    <Tile title="Go Off Book">
      <div className="text-sm text-neutral-500">
        Active students, completion rate, recent purchases — populated once the
        Member Vault adapter is wired.
      </div>
    </Tile>
  );
}
