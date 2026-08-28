import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn, initials } from "@/lib/utils";

type Props = React.ComponentProps<typeof Avatar> & {
  user: { name: string; avatar?: string };
};

export function UserAvatar({ user, className, ...props }: Props) {
  return (
    <Avatar className={cn("ring-2 ring-white/70", className)} {...props}>
      {user.avatar ? <AvatarImage src={user.avatar} alt="" /> : null}
      <AvatarFallback className="bg-primary/25 text-[12px] font-semibold text-ink-900">
        {initials(user.name)}
      </AvatarFallback>
    </Avatar>
  );
}
