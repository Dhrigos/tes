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

import { Dialog, DialogTrigger } from '@/components/ui/dialog';

import { SettingsDialog } from './dialog-content'; // ✅ import komponen baru

import { Link, usePage } from '@inertiajs/react';
import { ChevronDown, LayoutGrid } from 'lucide-react';
import AppLogo from './app-logo';

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
        title: 'Pendaftaran',
        href: '/pendaftaran',
        icon: LayoutGrid,
    },
    {
        title: 'Pelayanan',
        icon: LayoutGrid,
        children: [
            {
                title: 'Dokter',
                href: '/pelayanan/soap-dokter',
            },
            {
                title: 'Perawat',
                href: '/pelayanan/so-perawat',
            },
        ],
    },
    {
        title: 'Pembelian',
        icon: LayoutGrid,
        href: '/pembelian',
    },
    {
        title: 'Gudang',
        icon: LayoutGrid,
        children: [
            {
                title: 'Stok Obat utama',
                href: '/gudang/stok-barang',
            },
            {
                title: 'Stok Inventaris utama',
                href: '/gudang/stok-inventaris',
            },
            {
                title: 'Stok Obat Klinik',
                href: '/gudang/stok-obat-klinik',
            },
            {
                title: 'Stok Inventaris Klinik',
                href: '/gudang/stok-inventaris-klinik',
            },
            {
                title: 'Daftar Permintaan Barang',
                href: '/gudang/daftar-permintaan-barang',
            },
            {
                title: 'Permintaan Barang',
                href: '/gudang/permintaan-barang',
            },
        ],
    },
    {
        title: 'SDM',
        icon: LayoutGrid,
        children: [
            {
                title: 'Dokter',
                href: '/sdm/dokter',
            },
            {
                title: 'Perawat',
                href: '/sdm/perawat',
            },
            {
                title: 'Staff',
                href: '/sdm/staff',
            },
        ],
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
                title: 'Manajemen',
                children: [{ title: 'Posisi Kerja', href: '/datamaster/manajemen/posker' }],
            },
            {
                title: 'Medis',
                children: [
                    { title: 'Alergi', href: '/datamaster/medis/alergi' },
                    { title: 'HTT Pemeriksaan', href: '/datamaster/medis/htt-pemeriksaan' },
                    { title: 'ICD-10', href: '/datamaster/medis/icd10' },
                    { title: 'ICD-9', href: '/datamaster/medis/icd9' },
                    { title: 'Instruksi Obat', href: '/datamaster/medis/instruksi-obat' },
                    { title: 'Jenis Diet', href: '/datamaster/medis/jenis-diet' },
                    { title: 'Laboratorium Bidang', href: '/datamaster/medis/laboratorium-bidang' },
                    { title: 'Nama Makanan', href: '/datamaster/medis/makanan' },
                    { title: 'Penggunaan Obat', href: '/datamaster/medis/penggunaan-obat' },
                    { title: 'Poli', href: '/datamaster/medis/poli' },
                    { title: 'Perawatan dan Tindakan', href: '/datamaster/medis/tindakan' },
                    { title: 'Radiologi Jenis dan Pemeriksaan', href: '/datamaster/medis/radiologi' },
                    { title: 'Sarana', href: '/datamaster/medis/sarana' },
                    { title: 'Spesialis', href: '/datamaster/medis/spesialis' },
                ],
            },
            {
                title: 'Gudang',
                children: [
                    { title: 'Satuan Barang', href: '/datamaster/gudang/satuan-barang' },
                    { title: 'Kategori Barang', href: '/datamaster/gudang/kategori-barang' },
                    { title: 'Supplier', href: '/datamaster/gudang/supplier' },
                    { title: 'Daftar Harga Jual', href: '/datamaster/gudang/daftar-harga-jual' },
                    { title: 'Daftar Harga Jual Klinik', href: '/datamaster/gudang/daftar-harga-jual-klinik' },
                    { title: 'Daftar Barang', href: '/datamaster/gudang/daftar-barang' },
                ],
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
                                    <ChevronDown className="ml-auto h-4 w-4 transition-transform duration-300 ease-in-out group-data-[state=open]:rotate-180" />
                                </SidebarMenuButton>
                            </CollapsibleTrigger>

                            <CollapsibleContent className="data-[state=closed]:slide-up-1 data-[state=open]:slide-down-1 overflow-hidden transition-all duration-300 ease-in-out data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:animate-in data-[state=open]:fade-in-0">
                                <div className="ml-3 border-l border-sidebar-border/70 pl-3 transition-all duration-200 ease-in-out">
                                    <SidebarMenu className="pl-3">
                                        <RenderMenu items={item.children} />
                                    </SidebarMenu>
                                </div>
                            </CollapsibleContent>
                        </SidebarMenuItem>
                    </Collapsible>
                ) : (
                    <SidebarMenuItem key={index}>
                        <SidebarMenuButton asChild isActive={url === item.href}>
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
    if (item.href && url === item.href) return true; // Gunakan exact match untuk menu tanpa children
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
                        <Dialog>
                            {/* Trigger: tombol di sidebar */}
                            <DialogTrigger asChild>
                                <SidebarMenuButton size="lg" className="flex items-center gap-2">
                                    <AppLogo />
                                </SidebarMenuButton>
                            </DialogTrigger>
                            <SettingsDialog />
                        </Dialog>
                    </SidebarMenuItem>
                </SidebarMenu>
            </SidebarHeader>

            {/* Sidebar Menu Content */}
            <SidebarContent className="scrollbar-none">
                {/* Playground group (items tanpa children) */}
                <SidebarGroup>
                    <SidebarGroupLabel>Menu</SidebarGroupLabel>
                    <SidebarGroupContent>
                        <SidebarMenu>
                            <RenderMenu items={mainNavItems} />
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
