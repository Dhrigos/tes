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
import { ChevronDown, LayoutGrid, type LucideIcon } from 'lucide-react';
import { useMemo } from 'react';
import AppLogo from './app-logo';

// Definisikan tipe menu
interface MenuItem {
    title: string;
    href?: string;
    icon?: LucideIcon;
    children?: MenuItem[];
    roles?: string[];
}

const mainNavItems: MenuItem[] = [
    {
        title: 'Dashboard',
        href: '/dashboard',
        icon: LayoutGrid,
        roles: [
            'Admin',
            'Pendaftaran',
            'Perawat',
            'Dokter',
            'Apoteker',
            'Kasir',
            'Manajemen',
            'Gudang',
            'Administrasi_sdm',
            'Administrasi_master_data',
        ],
    },
    {
        title: 'Pasien',
        href: '/pasien',
        icon: LayoutGrid,
        roles: ['Admin', 'Pendaftaran'],
    },
    {
        title: 'Pendaftaran',
        href: '/pendaftaran',
        icon: LayoutGrid,
        roles: ['Admin', 'Pendaftaran'],
    },
    {
        title: 'Pelayanan',
        icon: LayoutGrid,
        roles: ['Admin', 'Dokter', 'Perawat'],
        children: [
            {
                title: 'Dokter',
                href: '/pelayanan/soap-dokter',
                roles: ['Admin', 'Dokter'],
            },
            {
                title: 'Bidan',
                href: '/pelayanan/soap-bidan',
                roles: ['Admin', 'Dokter', 'Perawat'],
            },
            {
                title: 'Perawat',
                href: '/pelayanan/so-perawat',
                roles: ['Admin', 'Perawat'],
            },
        ],
    },
    {
        title: 'Apotek',
        icon: LayoutGrid,
        href: '/apotek',
        roles: ['Admin', 'Apoteker'],
    },
    {
        title: 'Kasir',
        icon: LayoutGrid,
        href: '/kasir',
        roles: ['Admin', 'Kasir'],
    },
    {
        title: 'Gudang',
        icon: LayoutGrid,
        roles: ['Admin', 'Gudang'],
        children: [
            {
                title: 'Stok Obat utama',
                href: '/gudang/stok-barang',
                roles: ['Admin', 'Gudang'],
            },
            {
                title: 'Stok Inventaris utama',
                href: '/gudang/stok-inventaris',
                roles: ['Admin', 'Gudang'],
            },
            {
                title: 'Stok Obat Klinik',
                href: '/gudang/stok-obat-klinik',
                roles: ['Admin', 'Gudang'],
            },
            {
                title: 'Stok Inventaris Klinik',
                href: '/gudang/stok-inventaris-klinik',
                roles: ['Admin', 'Gudang'],
            },
            {
                title: 'Daftar Permintaan Barang',
                href: '/gudang/daftar-permintaan-barang',
                roles: ['Admin', 'Gudang'],
            },
            {
                title: 'Permintaan Barang',
                href: '/gudang/permintaan-barang',
                roles: ['Admin', 'Gudang'],
            },
        ],
    },
    {
        title: 'Pembelian Barang',
        icon: LayoutGrid,
        href: '/pembelian',
        roles: ['Admin', 'Gudang'],
    },
    {
        title: 'SDM',
        icon: LayoutGrid,
        roles: ['Admin', 'Administrasi_sdm'],
        children: [
            {
                title: 'Dokter',
                href: '/sdm/dokter',
                roles: ['Admin', 'Administrasi_sdm'],
            },
            {
                title: 'Perawat',
                href: '/sdm/perawat',
                roles: ['Admin', 'Administrasi_sdm'],
            },
            {
                title: 'Staff',
                href: '/sdm/staff',
                roles: ['Admin', 'Administrasi_sdm'],
            },
        ],
    },
    {
        title: 'Laporan',
        icon: LayoutGrid,
        roles: ['Admin', 'Manajemen'],
        children: [
            { title: 'Apotek', href: '/laporan/apotek', roles: ['Admin', 'Manajemen'] },
            { title: 'Kasir', href: '/laporan/kasir', roles: ['Admin', 'Manajemen'] },
            { title: 'Antrian', href: '/laporan/antrian', roles: ['Admin', 'Manajemen'] },
            { title: 'Pendaftaran', href: '/laporan/pendaftaran', roles: ['Admin', 'Manajemen'] },
            { title: 'Trend Pendaftaran', href: '/laporan/trend-pendaftaran', roles: ['Admin', 'Manajemen'] },
            { title: 'Top ICD-10', href: '/laporan/top-icd10', roles: ['Admin', 'Manajemen'] },
            { title: 'Dokter', href: '/laporan/dokter', roles: ['Admin', 'Manajemen'] },
            { title: 'Perawat', href: '/laporan/perawat', roles: ['Admin', 'Manajemen'] },
            { title: 'Stok Penyesuaian', href: '/laporan/stok-penyesuaian', roles: ['Admin', 'Manajemen'] },
            { title: 'Pembelian', href: '/laporan/pembelian', roles: ['Admin', 'Manajemen'] },
        ],
    },
    {
        title: 'Data Master',
        icon: LayoutGrid,
        roles: ['Admin', 'Administrasi_master_data'],
        children: [
            {
                title: 'Gudang',
                roles: ['Admin', 'Administrasi_master_data'],
                children: [
                    { title: 'Satuan Barang', href: '/datamaster/gudang/satuan-barang', roles: ['Admin', 'Administrasi_master_data'] },
                    { title: 'Kategori Barang', href: '/datamaster/gudang/kategori-barang', roles: ['Admin', 'Administrasi_master_data'] },
                    { title: 'Supplier', href: '/datamaster/gudang/supplier', roles: ['Admin', 'Administrasi_master_data'] },
                    { title: 'Daftar Harga Jual', href: '/datamaster/gudang/daftar-harga-jual', roles: ['Admin', 'Administrasi_master_data'] },
                    {
                        title: 'Daftar Harga Jual Klinik',
                        href: '/datamaster/gudang/daftar-harga-jual-klinik',
                        roles: ['Admin', 'Administrasi_master_data'],
                    },
                    { title: 'Daftar Barang', href: '/datamaster/gudang/daftar-barang', roles: ['Admin', 'Administrasi_master_data'] },
                ],
            },
            {
                title: 'Manajemen',
                roles: ['Admin', 'Administrasi_master_data'],
                children: [{ title: 'Posisi Kerja', href: '/datamaster/manajemen/posker', roles: ['Admin', 'Administrasi_master_data'] }],
            },
            {
                title: 'Medis',
                roles: ['Admin', 'Administrasi_master_data'],
                children: [
                    { title: 'Alergi', href: '/datamaster/medis/alergi', roles: ['Admin', 'Administrasi_master_data'] },
                    { title: 'HTT Pemeriksaan', href: '/datamaster/medis/htt-pemeriksaan', roles: ['Admin', 'Administrasi_master_data'] },
                    { title: 'ICD-10', href: '/datamaster/medis/icd10', roles: ['Admin', 'Administrasi_master_data'] },
                    { title: 'ICD-9', href: '/datamaster/medis/icd9', roles: ['Admin', 'Administrasi_master_data'] },
                    { title: 'Instruksi Obat', href: '/datamaster/medis/instruksi-obat', roles: ['Admin', 'Administrasi_master_data'] },
                    { title: 'Jenis Diet', href: '/datamaster/medis/jenis-diet', roles: ['Admin', 'Administrasi_master_data'] },
                    {
                        title: 'Kategori Pemeriksaan & Tindakan',
                        href: '/datamaster/medis/kategori-tindakan',
                        roles: ['Admin', 'Administrasi_master_data'],
                    },
                    { title: 'Perawatan dan Tindakan', href: '/datamaster/medis/tindakan', roles: ['Admin', 'Administrasi_master_data'] },
                    { title: 'Laboratorium Bidang', href: '/datamaster/medis/laboratorium-bidang', roles: ['Admin', 'Administrasi_master_data'] },
                    { title: 'Nama Makanan', href: '/datamaster/medis/makanan', roles: ['Admin', 'Administrasi_master_data'] },
                    { title: 'Penggunaan Obat', href: '/datamaster/medis/penggunaan-obat', roles: ['Admin', 'Administrasi_master_data'] },
                    { title: 'Poli', href: '/datamaster/medis/poli', roles: ['Admin', 'Administrasi_master_data'] },
                    { title: 'Radiologi Jenis dan Pemeriksaan', href: '/datamaster/medis/radiologi', roles: ['Admin', 'Administrasi_master_data'] },
                    { title: 'Sarana', href: '/datamaster/medis/sarana', roles: ['Admin', 'Administrasi_master_data'] },
                    { title: 'Spesialis', href: '/datamaster/medis/spesialis', roles: ['Admin', 'Administrasi_master_data'] },
                ],
            },
            {
                title: 'Umum',
                roles: ['Admin', 'Administrasi_master_data'],
                children: [
                    { title: 'Agama', href: '/datamaster/umum/agama', roles: ['Admin', 'Administrasi_master_data'] },
                    { title: 'Asuransi', href: '/datamaster/umum/asuransi', roles: ['Admin', 'Administrasi_master_data'] },
                    { title: 'Bahasa', href: '/datamaster/umum/bahasa', roles: ['Admin', 'Administrasi_master_data'] },
                    { title: 'Bangsa', href: '/datamaster/umum/bangsa', roles: ['Admin', 'Administrasi_master_data'] },
                    { title: 'Bank', href: '/datamaster/umum/bank', roles: ['Admin', 'Administrasi_master_data'] },
                    { title: 'Golongan Darah', href: '/datamaster/umum/golongan-darah', roles: ['Admin', 'Administrasi_master_data'] },
                    { title: 'Jenis Kelamin', href: '/datamaster/umum/kelamin', roles: ['Admin', 'Administrasi_master_data'] },
                    { title: 'Loket', href: '/datamaster/umum/loket', roles: ['Admin', 'Administrasi_master_data'] },
                    { title: 'Pekerjaan', href: '/datamaster/umum/pekerjaan', roles: ['Admin', 'Administrasi_master_data'] },
                    { title: 'Pendidikan', href: '/datamaster/umum/pendidikan', roles: ['Admin', 'Administrasi_master_data'] },
                    { title: 'Penjamin', href: '/datamaster/umum/penjamin', roles: ['Admin', 'Administrasi_master_data'] },
                    { title: 'Pernikahan', href: '/datamaster/umum/pernikahan', roles: ['Admin', 'Administrasi_master_data'] },
                    { title: 'Suku', href: '/datamaster/umum/suku', roles: ['Admin', 'Administrasi_master_data'] },
                ],
            },
        ],
    },
];

// Filter menu berdasarkan role user
// Role mapping:
// - Admin: full access
// - Pendaftaran: pasien dan pendaftaran
// - Perawat: perawat
// - Dokter: dokter
// - Apoteker: apotek
// - Kasir: kasir
// - Gudang: gudang dan pembelian
// - Administrasi_sdm: sdm
// - Administrasi_master_data: datamaster
// - Manajemen: laporan (sementara belum ada)
const filterMenuByRoles = (items: MenuItem[], userRoles: string[]): MenuItem[] => {
    return items
        .filter((item) => {
            // Jika tidak ada roles, tampilkan untuk semua user
            if (!item.roles) return true;
            // Cek apakah ada user role yang cocok dengan roles yang diizinkan
            return item.roles.some((role) => userRoles.includes(role));
        })
        .map((item) => {
            if (item.children) {
                const filteredChildren = filterMenuByRoles(item.children, userRoles);
                // Jika tidak ada children yang tersisa, jangan tampilkan parent
                if (filteredChildren.length === 0) {
                    return null;
                }
                return { ...item, children: filteredChildren };
            }
            return item;
        })
        .filter((item) => item !== null) as MenuItem[];
};

// Filter item Gudang berdasarkan status gudang utama
const filterGudangMenuBySetting = (items: MenuItem[], isGudangUtamaActive: boolean): MenuItem[] => {
    return items.map((item) => {
        if (item.title === 'Gudang' && item.children) {
            const children = isGudangUtamaActive
                ? item.children
                : item.children.filter(
                      (child) => !['/gudang/stok-barang', '/gudang/stok-inventaris', '/gudang/daftar-permintaan-barang'].includes(child.href || ''),
                  );
            return { ...item, children };
        }
        if (item.children) {
            return { ...item, children: filterGudangMenuBySetting(item.children, isGudangUtamaActive) };
        }
        return item;
    });
};

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
    const { props } = usePage<any>();
    const isGudangUtamaActive: boolean = Boolean(props?.web_setting?.is_gudangutama_active);
    const userRoles: string[] = props?.auth?.user?.roles; // Default ke Admin jika tidak ada roles

    const filteredNavItems = useMemo(() => {
        // Pertama filter berdasarkan role user
        const roleFilteredItems = filterMenuByRoles(mainNavItems, userRoles);
        // Kemudian filter berdasarkan setting gudang
        return filterGudangMenuBySetting(roleFilteredItems, isGudangUtamaActive);
    }, [userRoles, isGudangUtamaActive]);

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
                            <RenderMenu items={filteredNavItems} />
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
