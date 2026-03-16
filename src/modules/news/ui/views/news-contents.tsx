import { Separator } from "@/components/ui/separator";
import { announcements } from "@/config/constants";

interface Announcement {
  date: string;
  title: string;
}

interface GroupedAnnouncements {
  [key: string]: Announcement[];
}

const NewsContents: React.FC = () => {
  const groupedAnnouncements: GroupedAnnouncements =
    announcements.reduce<GroupedAnnouncements>((groups, announcement) => {
      const month: string = announcement.date.split(".")[1];
      if (!groups[month]) {
        groups[month] = [];
      }
      groups[month].push(announcement);
      return groups;
    }, {});

  return (
    <section className="mx-auto mt-6 max-w-4xl">
      {/* 公告內容 */}
      <div className="space-y-16">
        {Object.entries(groupedAnnouncements).map(
          ([month, items]: [string, Announcement[]]) => (
            <div key={month} className="flex flex-col gap-12 lg:flex-row">
              {/* 左側月份顯示 */}
              <div className="w-32 flex-shrink-0">
                <div className="text-6xl leading-none font-semibold text-neutral-300">
                  2025
                </div>
                <div className="mt-1 text-6xl leading-none font-semibold text-neutral-500">
                  {month}
                </div>
              </div>

              {/* 右側公告列表 */}
              <div className="flex-1 space-y-8">
                {items.map((announcement: Announcement, index: number) => (
                  <div key={index} className="group cursor-pointer">
                    <div className="mb-2 text-sm font-light text-neutral-500">
                      {announcement.date}
                    </div>
                    <div className="leading-relaxed text-neutral-800 transition-colors duration-200 group-hover:text-neutral-600">
                      {announcement.title}
                    </div>
                    {index < items.length - 1 && <Separator className="mt-4" />}
                  </div>
                ))}
              </div>
            </div>
          ),
        )}
      </div>
    </section>
  );
};

export default NewsContents;
