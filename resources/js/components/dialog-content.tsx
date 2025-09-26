'use client';

import { Building2, CreditCard, Database, DollarSign, Settings, Stethoscope } from 'lucide-react';
import * as React from 'react';

import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@/components/ui/breadcrumb';
import { DialogContent, DialogDescription, DialogTitle } from '@/components/ui/dialog';
import {
    Sidebar,
    SidebarContent,
    SidebarGroup,
    SidebarGroupContent,
    SidebarMenu,
    SidebarMenuButton,
    SidebarMenuItem,
    SidebarProvider,
} from '@/components/ui/sidebar';
import { Advanced, ConfigBPJS, ConfigGudang, ConfigSatuSehat, HargaJual, Payment } from './dialog-content-main';

// Data menu
const data = {
    nav: [
        { name: 'Config Satu Sehat', icon: Stethoscope },
        { name: 'Config BPJS', icon: Building2 },
        { name: 'Config Fitur Gudang', icon: Database },
        { name: 'Setting Harga Jual', icon: DollarSign },
        { name: 'Payment', icon: CreditCard },
        { name: 'Advanced', icon: Settings },
    ],
};

// Mapping nama ke komponen
const pageComponents: Record<string, React.ReactNode> = {
    'Config Satu Sehat': <ConfigSatuSehat />,
    'Config BPJS': <ConfigBPJS />,
    'Config Fitur Gudang': <ConfigGudang />,
    'Setting Harga Jual': <HargaJual />,
    Payment: <Payment />,
    Advanced: <Advanced />,
};

export function SettingsDialog() {
    // State aktif menu
    const [activePage, setActivePage] = React.useState(data.nav[0].name);

    return (
        <DialogContent className="overflow-hidden p-0 md:max-h-[600px] md:max-w-[850px] lg:max-w-[950px]">
            <DialogTitle className="sr-only">Web Settings Configuration</DialogTitle>
            <DialogDescription className="sr-only">
                Configure your web application settings including BPJS, Satu Sehat, warehouse management, and pricing.
            </DialogDescription>

            <SidebarProvider className="items-start">
                {/* Sidebar */}
                <Sidebar collapsible="none" className="hidden md:flex">
                    <SidebarContent>
                        <SidebarGroup>
                            <SidebarGroupContent>
                                <SidebarMenu>
                                    {data.nav.map((item) => (
                                        <SidebarMenuItem key={item.name}>
                                            <SidebarMenuButton asChild isActive={activePage === item.name} onClick={() => setActivePage(item.name)}>
                                                <button className="flex w-full items-center gap-2 text-left">
                                                    <item.icon />
                                                    <span>{item.name}</span>
                                                </button>
                                            </SidebarMenuButton>
                                        </SidebarMenuItem>
                                    ))}
                                </SidebarMenu>
                            </SidebarGroupContent>
                        </SidebarGroup>
                    </SidebarContent>
                </Sidebar>

                {/* Main Content */}
                <main className="flex h-[600px] flex-1 flex-col overflow-hidden">
                    <header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
                        <Breadcrumb>
                            <BreadcrumbList>
                                <BreadcrumbItem className="hidden md:block">
                                    <BreadcrumbLink href="#">Settings</BreadcrumbLink>
                                </BreadcrumbItem>
                                <BreadcrumbSeparator className="hidden md:block" />
                                <BreadcrumbItem>
                                    <BreadcrumbPage>{activePage}</BreadcrumbPage>
                                </BreadcrumbItem>
                            </BreadcrumbList>
                        </Breadcrumb>
                    </header>
                    <div className="flex flex-1 flex-col gap-4 overflow-y-auto p-4 pt-0">{pageComponents[activePage]}</div>
                </main>
            </SidebarProvider>
        </DialogContent>
    );
}
