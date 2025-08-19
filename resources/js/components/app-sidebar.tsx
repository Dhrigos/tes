'use client';

import { NavUser } from '@/components/nav-user';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import {
    Sidebar,
    SidebarContent,
    SidebarFooter,
    SidebarGroup,
    SidebarGroupContent,
    SidebarGroupLabel,
    SidebarHeader,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
} from '@/components/ui/sidebar';
import { Link, usePage } from '@inertiajs/react';
import { ChevronDown, LayoutGrid } from 'lucide-react';
import AppLogo from './app-logo';

// Definisi menu utama
const mainNavItems = [
    {
        title: 'Dashboard',
        href: '/dashboard',
        icon: LayoutGrid,
    },
    {
        title: 'Pasien',
        href: '/pasien',
        icon: LayoutGrid,
    },
    {
        title: 'Data Master',
        icon: LayoutGrid,
        children: [
            {
                title: 'Umum',
                children: [
                    { title: 'Agama', href: '/datamaster/umum/agama' },
                    { title: 'Asuransi', href: '/datamaster/umum/asuransi' },
                    { title: 'Bahasa', href: '/datamaster/umum/bahasa' },
                    { title: 'Bangsa', href: '/datamaster/umum/bangsa' },
                    { title: 'Bank', href: '/datamaster/umum/bank' },
                    { title: 'Golongan Darah', href: '/datamaster/umum/golongan-darah' },
                    { title: 'Jenis Kelamin', href: '/datamaster/umum/kelamin' },
                    { title: 'Loket', href: '/datamaster/umum/loket' },
                    { title: 'Pekerjaan', href: '/datamaster/umum/pekerjaan' },
                    { title: 'Pendidikan', href: '/datamaster/umum/pendidikan' },
                    { title: 'Penjamin', href: '/datamaster/umum/penjamin' },
                    { title: 'Pernikahan', href: '/datamaster/umum/pernikahan' },
                    { title: 'Suku', href: '/datamaster/umum/suku' },
                ],
            },
            {
                title: 'Medis',
                children: [{ title: 'Diagnosa', href: '/datamaster/medis/diagnosa' }],
            },
        ],
    },
];

// Recursive renderer untuk nested menu
function RenderMenu({ items }: { items: any[] }) {
    const { url } = usePage(); // current path dari inertia
    return (
        <>
            {items.map((item, index) =>
                item.children ? (
                    <Collapsible
                        key={index}
                        defaultOpen={item.children.some((child: any) => checkActive(child, url))} // auto buka kalau ada child aktif
                    >
                        <SidebarMenuItem>
                            <CollapsibleTrigger asChild>
                                <SidebarMenuButton className="group transition-all duration-200 ease-in-out hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
                                    {item.icon && <item.icon className="h-4 w-4" />}
                                    <span className="flex-1">{item.title}</span>
                                    <ChevronDown className="ml-auto h-4 w-4 transition-transform group-data-[state=open]:rotate-180" />
                                </SidebarMenuButton>
                            </CollapsibleTrigger>

                            <CollapsibleContent>
                                <div className="ml-3 border-l border-sidebar-border/70 pl-3">
                                    <SidebarMenu className="pl-3">
                                        <RenderMenu items={item.children} />
                                    </SidebarMenu>
                                </div>
                            </CollapsibleContent>
                        </SidebarMenuItem>
                    </Collapsible>
                ) : (
                    <SidebarMenuItem key={index}>
                        <SidebarMenuButton asChild isActive={url.startsWith(item.href!)}>
                            <Link href={item.href!} className="flex items-center gap-2">
                                {item.icon && <item.icon className="h-4 w-4" />}
                                <span>{item.title}</span>
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                ),
            )}
        </>
    );
}

// helper cek aktif
function checkActive(item: any, url: string): boolean {
    if (item.href && url.startsWith(item.href)) return true;
    if (item.children) {
        return item.children.some((child: any) => checkActive(child, url));
    }
    return false;
}

export function AppSidebar() {
    return (
        <Sidebar collapsible="icon" variant="inset">
            {/* Header Logo */}
            <SidebarHeader>
                <SidebarMenu>
                    <SidebarMenuItem>
                        <SidebarMenuButton size="lg" asChild>
                            <Link href="/dashboard" prefetch>
                                <AppLogo />
                            </Link>
                        </SidebarMenuButton>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            {/* Sidebar Menu Content */}
            <SidebarContent>
                {/* Playground group (items tanpa children) */}
                <SidebarGroup>
                    <SidebarGroupLabel>Dashboard</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            <RenderMenu items={mainNavItems.filter((i) => !i.children)} />
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
                {/* Data Master group (items dengan children) */}
                <SidebarGroup>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            <RenderMenu items={mainNavItems.filter((i) => i.children)} />
                        </SidebarMenu>
                    </SidebarGroupContent>
                </SidebarGroup>
            </SidebarContent>

            {/* Footer User Menu */}
            <SidebarFooter>
                <NavUser />
            </SidebarFooter>
        </Sidebar>
    );
}
