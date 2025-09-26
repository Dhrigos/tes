import { useState } from 'react';
import { NavItem } from '@/types';
import { ChevronDown, ChevronRight } from 'lucide-react';
import { Link } from '@inertiajs/react';

type Props = {
    items: NavItem[];
    level?: number; // untuk indentasi submenu
};

export default function SidebarMenu({ items, level = 0 }: Props) {
    return (
        <ul className="space-y-1">
            {items.map((item, index) => (
                <SidebarMenuItem key={index} item={item} level={level} />
            ))}
        </ul>
    );
}

function SidebarMenuItem({ item, level }: { item: NavItem; level: number }) {
    const [open, setOpen] = useState(false);
    const hasChildren = !!item.children?.length;

    return (
        <li>
            <div
                onClick={() => hasChildren && setOpen(!open)}
                className={`flex items-center px-3 py-2 cursor-pointer hover:bg-gray-800 transition ${
                    hasChildren ? 'justify-between' : ''
                }`}
                style={{ paddingLeft: `${level * 16 + 12}px` }} // indentasi berdasarkan level
            >
                <div className="flex items-center gap-2">
                    {item.icon && <item.icon size={16} />}
                    {item.href ? (
                        <Link href={item.href} className="text-sm text-white">
                            {item.title}
                        </Link>
                    ) : (
                        <span className="text-sm text-white">{item.title}</span>
                    )}
                </div>
                {hasChildren &&
                    (open ? <ChevronDown size={14} /> : <ChevronRight size={14} />)}
            </div>

            {hasChildren && open && (
                <div className="mt-1">
                    <SidebarMenu items={item.children!} level={level + 1} />
                </div>
            )}
        </li>
    );
}
