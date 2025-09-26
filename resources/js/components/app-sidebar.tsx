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
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

import { SettingsDialog } from './dialog-content'; // ✅ import komponen baru

import { Link, usePage } from '@inertiajs/react';
import {
    Activity,
    Baby,
    BarChart3,
    BookOpen,
    Briefcase,
    Building,
    Building2,
    Calendar,
    ChevronDown,
    ClipboardCheck,
    ClipboardList,
    CreditCard,
    Database,
    DollarSign,
    Droplets,
    FileText,
    Flag,
    Globe,
    GraduationCap,
    Heart,
    HeartHandshake,
    Home,
    MapPin,
    Pill as Medicine,
    Microscope,
    Package,
    Pill,
    Scan,
    Settings,
    Shield,
    ShoppingBag,
    ShoppingCart,
    Stethoscope,
    Tag,
    TrendingUp,
    Truck,
    User,
    UserCheck,
    UserPlus,
    Users,
    Users2,
    Utensils,
    Warehouse,
    type LucideIcon,
} from 'lucide-react';
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
        icon: Home,
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
        icon: Users,
        roles: ['Admin', 'Pendaftaran'],
    },
    {
        title: 'Pendaftaran',
        href: '/pendaftaran',
        icon: UserPlus,
        roles: ['Admin', 'Pendaftaran'],
    },
    {
        title: 'Pelayanan',
        icon: Stethoscope,
        roles: ['Admin', 'Dokter', 'Perawat'],
        children: [
            {
                title: 'Dokter',
                href: '/pelayanan/soap-dokter',
                icon: UserCheck,
                roles: ['Admin', 'Dokter'],
            },
            {
                title: 'Bidan',
                href: '/pelayanan/soap-bidan',
                icon: Baby,
                roles: ['Admin', 'Dokter', 'Perawat'],
            },
            {
                title: 'Perawat',
                href: '/pelayanan/so-perawat',
                icon: Heart,
                roles: ['Admin', 'Perawat'],
            },
        ],
    },
    {
        title: 'Apotek',
        icon: Pill,
        href: '/apotek',
        roles: ['Admin', 'Apoteker'],
    },
    {
        title: 'Kasir',
        icon: ShoppingCart,
        href: '/kasir',
        roles: ['Admin', 'Kasir'],
    },
    {
        title: 'Gudang',
        icon: Warehouse,
        roles: ['Admin', 'Gudang'],
        children: [
            {
                title: 'Stok Obat utama',
                href: '/gudang/stok-barang',
                icon: Package,
                roles: ['Admin', 'Gudang'],
            },
            {
                title: 'Stok Inventaris utama',
                href: '/gudang/stok-inventaris',
                icon: Package,
                roles: ['Admin', 'Gudang'],
            },
            {
                title: 'Stok Obat Klinik',
                href: '/gudang/stok-obat-klinik',
                icon: Medicine,
                roles: ['Admin', 'Gudang'],
            },
            {
                title: 'Stok Inventaris Klinik',
                href: '/gudang/stok-inventaris-klinik',
                icon: Package,
                roles: ['Admin', 'Gudang'],
            },
            {
                title: 'Daftar Permintaan Barang',
                href: '/gudang/daftar-permintaan-barang',
                icon: ClipboardList,
                roles: ['Admin', 'Gudang'],
            },
            {
                title: 'Permintaan Barang',
                href: '/gudang/permintaan-barang',
                icon: FileText,
                roles: ['Admin', 'Gudang'],
            },
            {
                title: 'Pengeluaran Barang',
                href: '/gudang/pengeluaran-barang',
                icon: FileText,
                roles: ['Admin', 'Gudang'],
            },
        ],
    },
    {
        title: 'Pembelian Barang',
        icon: ShoppingBag,
        href: '/pembelian',
        roles: ['Admin', 'Gudang'],
    },
    {
        title: 'SDM',
        icon: Building2,
        roles: ['Admin', 'Administrasi_sdm'],
        children: [
            {
                title: 'Dokter',
                href: '/sdm/dokter',
                icon: UserCheck,
                roles: ['Admin', 'Administrasi_sdm'],
            },
            {
                title: 'Perawat',
                href: '/sdm/perawat',
                icon: Heart,
                roles: ['Admin', 'Administrasi_sdm'],
            },
            {
                title: 'Staff',
                href: '/sdm/staff',
                icon: User,
                roles: ['Admin', 'Administrasi_sdm'],
            },
        ],
    },
    {
        title: 'Laporan',
        icon: BarChart3,
        roles: ['Admin', 'Manajemen'],
        children: [
            { title: 'Apotek', href: '/laporan/apotek', icon: Pill, roles: ['Admin', 'Manajemen'] },
            { title: 'Kasir', href: '/laporan/kasir', icon: ShoppingCart, roles: ['Admin', 'Manajemen'] },
            { title: 'Antrian', href: '/laporan/antrian', icon: Calendar, roles: ['Admin', 'Manajemen'] },
            { title: 'Pendaftaran', href: '/laporan/pendaftaran', icon: UserPlus, roles: ['Admin', 'Manajemen'] },
            { title: 'Trend Pendaftaran', href: '/laporan/trend-pendaftaran', icon: TrendingUp, roles: ['Admin', 'Manajemen'] },
            { title: 'Top ICD-10', href: '/laporan/top-icd10', icon: Activity, roles: ['Admin', 'Manajemen'] },
            { title: 'Dokter', href: '/laporan/dokter', icon: UserCheck, roles: ['Admin', 'Manajemen'] },
            { title: 'Perawat', href: '/laporan/perawat', icon: Heart, roles: ['Admin', 'Manajemen'] },
            { title: 'Stok Penyesuaian', href: '/laporan/stok-penyesuaian', icon: Package, roles: ['Admin', 'Manajemen'] },
            { title: 'Pembelian', href: '/laporan/pembelian', icon: ShoppingBag, roles: ['Admin', 'Manajemen'] },
            { title: 'Pengeluaran Barang', href: '/laporan/pengeluaran-barang', icon: Truck, roles: ['Admin', 'Gudang'] },
        ],
    },
    {
        title: 'Data Master',
        icon: Database,
        roles: ['Admin', 'Administrasi_master_data'],
        children: [
            {
                title: 'Gudang',
                icon: Warehouse,
                roles: ['Admin', 'Administrasi_master_data'],
                children: [
                    { title: 'Satuan Barang', href: '/datamaster/gudang/satuan-barang', icon: Tag, roles: ['Admin', 'Administrasi_master_data'] },
                    { title: 'Kategori Barang', href: '/datamaster/gudang/kategori-barang', icon: Tag, roles: ['Admin', 'Administrasi_master_data'] },
                    { title: 'Supplier', href: '/datamaster/gudang/supplier', icon: Truck, roles: ['Admin', 'Administrasi_master_data'] },
                    {
                        title: 'Daftar Harga Jual',
                        href: '/datamaster/gudang/daftar-harga-jual',
                        icon: DollarSign,
                        roles: ['Admin', 'Administrasi_master_data'],
                    },
                    {
                        title: 'Daftar Harga Jual Klinik',
                        href: '/datamaster/gudang/daftar-harga-jual-klinik',
                        icon: DollarSign,
                        roles: ['Admin', 'Administrasi_master_data'],
                    },
                    { title: 'Daftar Barang', href: '/datamaster/gudang/daftar-barang', icon: Package, roles: ['Admin', 'Administrasi_master_data'] },
                ],
            },
            {
                title: 'Manajemen',
                icon: Settings,
                roles: ['Admin', 'Administrasi_master_data'],
                children: [
                    { title: 'Posisi Kerja', href: '/datamaster/manajemen/posker', icon: Briefcase, roles: ['Admin', 'Administrasi_master_data'] },
                ],
            },
            {
                title: 'Medis',
                icon: Stethoscope,
                roles: ['Admin', 'Administrasi_master_data'],
                children: [
                    { title: 'Alergi', href: '/datamaster/medis/alergi', icon: Shield, roles: ['Admin', 'Administrasi_master_data'] },
                    {
                        title: 'HTT Pemeriksaan',
                        href: '/datamaster/medis/htt-pemeriksaan',
                        icon: ClipboardCheck,
                        roles: ['Admin', 'Administrasi_master_data'],
                    },
                    { title: 'ICD-10', href: '/datamaster/medis/icd10', icon: BookOpen, roles: ['Admin', 'Administrasi_master_data'] },
                    { title: 'ICD-9', href: '/datamaster/medis/icd9', icon: BookOpen, roles: ['Admin', 'Administrasi_master_data'] },
                    {
                        title: 'Instruksi Obat',
                        href: '/datamaster/medis/instruksi-obat',
                        icon: FileText,
                        roles: ['Admin', 'Administrasi_master_data'],
                    },
                    { title: 'Jenis Diet', href: '/datamaster/medis/jenis-diet', icon: Utensils, roles: ['Admin', 'Administrasi_master_data'] },
                    {
                        title: 'Kategori Pemeriksaan & Tindakan',
                        href: '/datamaster/medis/kategori-tindakan',
                        icon: ClipboardCheck,
                        roles: ['Admin', 'Administrasi_master_data'],
                    },
                    {
                        title: 'Perawatan dan Tindakan',
                        href: '/datamaster/medis/tindakan',
                        icon: Stethoscope,
                        roles: ['Admin', 'Administrasi_master_data'],
                    },
                    {
                        title: 'Laboratorium Bidang',
                        href: '/datamaster/medis/laboratorium-bidang',
                        icon: Microscope,
                        roles: ['Admin', 'Administrasi_master_data'],
                    },
                    { title: 'Nama Makanan', href: '/datamaster/medis/makanan', icon: Utensils, roles: ['Admin', 'Administrasi_master_data'] },
                    { title: 'Penggunaan Obat', href: '/datamaster/medis/penggunaan-obat', icon: Pill, roles: ['Admin', 'Administrasi_master_data'] },
                    { title: 'Poli', href: '/datamaster/medis/poli', icon: Building, roles: ['Admin', 'Administrasi_master_data'] },
                    {
                        title: 'Radiologi Jenis dan Pemeriksaan',
                        href: '/datamaster/medis/radiologi',
                        icon: Scan,
                        roles: ['Admin', 'Administrasi_master_data'],
                    },
                    { title: 'Sarana', href: '/datamaster/medis/sarana', icon: MapPin, roles: ['Admin', 'Administrasi_master_data'] },
                    { title: 'Spesialis', href: '/datamaster/medis/spesialis', icon: UserCheck, roles: ['Admin', 'Administrasi_master_data'] },
                ],
            },
            {
                title: 'Umum',
                icon: Globe,
                roles: ['Admin', 'Administrasi_master_data'],
                children: [
                    { title: 'Agama', href: '/datamaster/umum/agama', icon: HeartHandshake, roles: ['Admin', 'Administrasi_master_data'] },
                    { title: 'Asuransi', href: '/datamaster/umum/asuransi', icon: Shield, roles: ['Admin', 'Administrasi_master_data'] },
                    { title: 'Bahasa', href: '/datamaster/umum/bahasa', icon: Globe, roles: ['Admin', 'Administrasi_master_data'] },
                    { title: 'Bangsa', href: '/datamaster/umum/bangsa', icon: Flag, roles: ['Admin', 'Administrasi_master_data'] },
                    { title: 'Bank', href: '/datamaster/umum/bank', icon: CreditCard, roles: ['Admin', 'Administrasi_master_data'] },
                    {
                        title: 'Golongan Darah',
                        href: '/datamaster/umum/golongan-darah',
                        icon: Droplets,
                        roles: ['Admin', 'Administrasi_master_data'],
                    },
                    { title: 'Jenis Kelamin', href: '/datamaster/umum/kelamin', icon: Users2, roles: ['Admin', 'Administrasi_master_data'] },
                    { title: 'Loket', href: '/datamaster/umum/loket', icon: MapPin, roles: ['Admin', 'Administrasi_master_data'] },
                    { title: 'Pekerjaan', href: '/datamaster/umum/pekerjaan', icon: Briefcase, roles: ['Admin', 'Administrasi_master_data'] },
                    { title: 'Pendidikan', href: '/datamaster/umum/pendidikan', icon: GraduationCap, roles: ['Admin', 'Administrasi_master_data'] },
                    { title: 'Penjamin', href: '/datamaster/umum/penjamin', icon: Shield, roles: ['Admin', 'Administrasi_master_data'] },
                    { title: 'Pernikahan', href: '/datamaster/umum/pernikahan', icon: Heart, roles: ['Admin', 'Administrasi_master_data'] },
                    { title: 'Suku', href: '/datamaster/umum/suku', icon: Flag, roles: ['Admin', 'Administrasi_master_data'] },
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
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <CollapsibleTrigger asChild>
                                        <SidebarMenuButton className="group transition-all duration-200 ease-in-out hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
                                            {item.icon && <item.icon className="h-4 w-4" />}
                                            <span className="flex-1 truncate">{item.title}</span>
                                            <ChevronDown className="ml-auto h-4 w-4 transition-transform duration-300 ease-in-out group-data-[state=open]:rotate-180" />
                                        </SidebarMenuButton>
                                    </CollapsibleTrigger>
                                </TooltipTrigger>
                                <TooltipContent side="right" className="max-w-xs">
                                    <p>{item.title}</p>
                                </TooltipContent>
                            </Tooltip>

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
                        <Tooltip>
                            <TooltipTrigger asChild>
                                <SidebarMenuButton asChild isActive={url === item.href}>
                                    <Link href={item.href!} className="flex items-center gap-2">
                                        {item.icon && <item.icon className="h-4 w-4" />}
                                        <span className="truncate">{item.title}</span>
                                    </Link>
                                </SidebarMenuButton>
                            </TooltipTrigger>
                            <TooltipContent side="right" className="max-w-xs">
                                <p>{item.title}</p>
                            </TooltipContent>
                        </Tooltip>
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
        <TooltipProvider>
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
        </TooltipProvider>
    );
}
