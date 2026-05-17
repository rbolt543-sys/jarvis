import { Header } from "@/ui/components/Header";
import { TodayPanel } from "@/ui/tiles/TodayPanel";
import { Inbox } from "@/ui/tiles/Inbox";
import { UpcomingGigs } from "@/ui/tiles/UpcomingGigs";
import { Money } from "@/ui/tiles/Money";
import { GoOffBook } from "@/ui/tiles/GoOffBook";

export function Dashboard() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 p-6 grid grid-cols-12 gap-4 max-w-[1600px] mx-auto w-full">
        <div className="col-span-12">
          <TodayPanel />
        </div>
        <div className="col-span-7 space-y-4">
          <Inbox />
          <UpcomingGigs />
        </div>
        <div className="col-span-5 space-y-4">
          <Money />
          <GoOffBook />
        </div>
      </main>
    </div>
  );
}
