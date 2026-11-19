import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { settings } from "@/content/admin";

/**
 * Staff alert preferences — shown, but switched off and disabled.
 *
 * The service sends applicants their emails (confirmation, cost, payment,
 * decision) but has no staff alerts at all: nothing sends "new enquiry",
 * "deadline approaching" or a weekly digest. These switches used to save to
 * localStorage and read as working, which told staff they would be alerted
 * when they never were. Enable them in the same change that makes the service
 * send these emails and stores the preference server-side.
 */
export function NotificationSettings() {
  return (
    <div className="flex flex-col gap-4">
      <p className="text-[12.5px] text-muted-foreground" data-notifications-unavailable>
        {settings.notifications.unavailable}
      </p>
      <ul className="flex flex-col divide-y divide-border/60">
        {settings.notifications.items.map((item) => (
          <li
            key={item.key}
            className="flex items-center justify-between gap-6 py-4 first:pt-0 last:pb-0"
          >
            <div className="min-w-0">
              <Label htmlFor={`notify-${item.key}`} className="text-[13.5px]">
                {item.label}
              </Label>
              <p className="mt-0.5 text-[12.5px] text-muted-foreground">{item.hint}</p>
            </div>
            <Switch id={`notify-${item.key}`} checked={false} disabled />
          </li>
        ))}
      </ul>
    </div>
  );
}
