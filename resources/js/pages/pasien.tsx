import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { User, UserCheck, UserX, Users } from 'lucide-react';

const breadcrumbs: BreadcrumbItem[] = [
    {
        title: 'Pasien',
        href: '/pasien',
    },
    {
        title: 'Pendaftaran',
        href: '/pasien/pendaftaran',
    },
];

export default function PendaftaranPasien() {
    const stats = [
        { label: 'Total Pasien Lama', value: 0, icon: User, color: 'bg-cyan-500' },
        { label: 'Total Pasien Baru Bulan Ini', value: 3, icon: UserCheck, color: 'bg-green-500' },
        { label: 'Total Pasien', value: 3, icon: Users, color: 'bg-yellow-500' },
        { label: 'Pasien Belum Verifikasi', value: 1, icon: UserX, color: 'bg-red-500' },
    ];

    const pasien = [
        { no: '000003', nama: 'Syahril', tgl: '1963-10-07', bpjs: '0002051350288', telp: '081223123633', status: 'Belum' },
        { no: '000001', nama: 'ISWANI', tgl: '1938-07-01', bpjs: '0002083686006', telp: '082324778785', status: 'Sudah' },
        { no: '000002', nama: 'RAHMADI IBRAHIM', tgl: '1985-02-25', bpjs: '0002051145055', telp: '082369452787', status: 'Sudah' },
    ];

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <div className="space-y-6 p-6">
                <h1 className="text-2xl font-bold">📋 Modul Pendaftaran Pasien</h1>

                {/* Stats */}
                <div className="grid grid-cols-1 gap-4 md:grid-cols-4">
                    {stats.map((s, i) => (
                        <Card key={i} className="rounded-2xl shadow-md">
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                                <CardTitle className="text-sm font-medium">{s.label}</CardTitle>
                                <s.icon className={`h-6 w-6 rounded-md p-1 text-white ${s.color}`} />
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold">{s.value}</div>
                            </CardContent>
                        </Card>
                    ))}
                </div>

                {/* Table */}
                <Card className="rounded-2xl shadow-md">
                    <CardHeader>
                        <CardTitle>Daftar Pasien</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Status</TableHead>
                                    <TableHead>No. RM</TableHead>
                                    <TableHead>Nama</TableHead>
                                    <TableHead>Tanggal Lahir</TableHead>
                                    <TableHead>No. Kartu BPJS</TableHead>
                                    <TableHead>No. Telepon</TableHead>
                                    <TableHead>Tindakan</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {pasien.map((p, i) => (
                                    <TableRow key={i}>
                                        <TableCell>
                                            {p.status === 'Sudah' ? (
                                                <Badge variant="success">Sudah Verifikasi</Badge>
                                            ) : (
                                                <Badge variant="destructive">Belum Verifikasi</Badge>
                                            )}
                                        </TableCell>
                                        <TableCell>{p.no}</TableCell>
                                        <TableCell>{p.nama}</TableCell>
                                        <TableCell>{p.tgl}</TableCell>
                                        <TableCell>{p.bpjs}</TableCell>
                                        <TableCell>{p.telp}</TableCell>
                                        <TableCell>
                                            {p.status === 'Sudah' ? (
                                                <Button variant="outline" size="sm">
                                                    Edit
                                                </Button>
                                            ) : (
                                                <Button size="sm">Lengkapi</Button>
                                            )}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
