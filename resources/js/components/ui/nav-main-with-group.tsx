// resources/js/components/ui/nav-main-with-groups-animated.tsx

import {
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarGroup,
} from "@/components/ui/sidebar";
import { NavItem } from "@/types";
import { Link } from "@inertiajs/react";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { ChevronDown, ChevronRight } from "lucide-react";
import { useState } from "react";

type Props = {
  items: NavItem[];
  level?: number;
};

export function NavMainWithGroups({ items, level = 0 }: Props) {
  return (
    <SidebarMenu>
      {items.map((item, index) => (
        <AnimatedNavItem key={index} item={item} level={level} />
      ))}
    </SidebarMenu>
  );
}

function AnimatedNavItem({ item, level }: { item: NavItem; level: number }) {
  const [open, setOpen] = useState(false);
  const hasChildren = !!item.children?.length;

  const paddingLeft = `${level * 12}px`;

  if (hasChildren) {
    return (
      <Collapsible open={open} onOpenChange={setOpen}>
        <SidebarGroup>
            <Collapsible open={open} onOpenChange={setOpen}>
                <CollapsibleTrigger
                className="w-full flex items-center justify-between cursor-pointer"
                style={{ paddingLeft }}
                >
                <span className="flex items-center gap-2">
                    {item.icon ? <item.icon size={16} /> : null}
                    {item.title}
                </span>
                {open ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                </CollapsibleTrigger>

                <CollapsibleContent className="ml-2 transition-all data-[state=closed]:animate-slide-up data-[state=open]:animate-slide-down">
                <NavMainWithGroups items={item.children!} level={level + 1} />
                </CollapsibleContent>
            </Collapsible>
            </SidebarGroup>

      </Collapsible>
    );
  }

  return (
    <SidebarMenuItem style={{ paddingLeft }}>
      <SidebarMenuButton asChild>
        <Link href={item.href!} className="w-full text-left">
          {item.title}
        </Link>
      </SidebarMenuButton>
    </SidebarMenuItem>
  );
}
