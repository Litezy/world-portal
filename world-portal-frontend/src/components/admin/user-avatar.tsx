import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { cn, initials } from "@/lib/utils";

type Props = React.ComponentProps<typeof Avatar> & {
  user: { name: string; avatar?: string };
};

export function UserAvatar({ user, className, ...props }: Props) {
  return (
    <Avatar className={cn("border border-border/80 shadow-xs ring-1 ring-primary/20 shrink-0", className)} {...props}>
      {user.avatar ? <AvatarImage src={user.avatar} alt={user.name} /> : null}
      <AvatarFallback className="bg-gradient-to-br from-brand-600 to-cyan-600 text-white font-bold tracking-wider text-[11px] uppercase">
        {initials(user.name)}
      </AvatarFallback>
    </Avatar>
  );
}
