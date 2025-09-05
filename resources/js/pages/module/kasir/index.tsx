import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
import React from 'react';

type AnyRecord = Record<string, any>;

interface Props {
    title: string;
    apotek: AnyRecord[];
    tindakan: AnyRecord[];
}

const formatCurrency = (n: number | string) => {
    const num = typeof n === 'string' ? Number(n || 0) : Number(n || 0);
    return `Rp ${num.toLocaleString('id-ID')}`;
};

export default function KasirIndex({ title, apotek = [], tindakan = [] }: Props) {
    const [previewRows, setPreviewRows] = React.useState<Array<{ nama: string; harga: number; qty: number | string; subtotal: number }>>([]);
    const [activeKey, setActiveKey] = React.useState<string | null>(null);
    const [showDetailModal, setShowDetailModal] = React.useState(false);
    const [detailTitle, setDetailTitle] = React.useState('Detail');

    const csrfToken = (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '';

    const openDetailModalApotek = (row: AnyRecord) => {
        const key = `apotek:${row.kode_faktur}`;
        setActiveKey(key);
        setDetailTitle(`Detail Faktur ${row.kode_faktur || ''}`);
        const rows: Array<{ nama: string; harga: number; qty: number | string; subtotal: number }> = [];

        const detailTindakan = row?.detail_tindakan || [];
        for (const item of detailTindakan) {
            let hargaList: number[] = [];
            if (typeof item.harga === 'string' && item.harga.includes(',')) {
                hargaList = item.harga.split(',').map((h: string) => parseInt(h.trim(), 10));
            } else {
                hargaList = [parseInt(String(item.harga || 0), 10)];
            }
            const totalHarga = hargaList.reduce((sum: number, v: number) => sum + (Number.isFinite(v) ? v : 0), 0);
            rows.push({
                nama: item.Jenis_tindakan || item.jenis_tindakan || '-',
                harga: totalHarga,
                qty: item.jenis_pelaksana || '-',
                subtotal: totalHarga,
            });
        }

        const detailObat = row?.detail_obat || [];
        for (const item of detailObat) {
            const harga = Number(item.harga || 0);
            const qty = Number(item.qty || 0);
            const subtotal = Number(item.total || harga * qty);
            rows.push({ nama: item.nama_obat_alkes || '-', harga, qty, subtotal });
        }

        setPreviewRows(rows);
        setShowDetailModal(true);
    };

    const openDetailModalTindakan = async (row: AnyRecord) => {
        const key = `tindakan:${row.no_rawat}`;
        setActiveKey(key);
        setDetailTitle(`Detail Tindakan ${row.no_rawat || ''}`);
        try {
            const res = await fetch('/api/kasir/previewData', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-CSRF-TOKEN': csrfToken },
                body: JSON.stringify({ no_rawat: row.no_rawat }),
            });
            const data: AnyRecord[] = await res.json();
            const rows: Array<{ nama: string; harga: number; qty: number | string; subtotal: number }> = [];
            for (const item of data || []) {
                let hargaList: number[] = [];
                if (typeof item.harga === 'string' && item.harga.includes(',')) {
                    hargaList = item.harga.split(',').map((h: string) => parseInt(h.trim(), 10));
                } else {
                    hargaList = [parseInt(String(item.harga || 0), 10)];
                }
                const totalHarga = hargaList.reduce((sum: number, v: number) => sum + (Number.isFinite(v) ? v : 0), 0);
                rows.push({ nama: item.jenis_tindakan || '-', harga: totalHarga, qty: item.jenis_pelaksana || '-', subtotal: totalHarga });
            }
            setPreviewRows(rows);
            setShowDetailModal(true);
        } catch (e) {
            setPreviewRows([]);
        }
    };

    const computeApotekGrandTotal = (row: AnyRecord) => {
        const base = Number(row.total || 0);
        const detailTindakan = row?.detail_tindakan || [];
        let totalTindakan = 0;
        for (const t of detailTindakan) {
            const hargaList = String(t.harga || '0')
                .split(',')
                .map((h: string) => parseInt(h.trim(), 10));
            totalTindakan += hargaList.reduce((s: number, v: number) => s + (Number.isFinite(v) ? v : 0), 0);
        }
        return base + totalTindakan;
    };

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Dashboard', href: '/dashboard' },
                { title: 'Kasir', href: '/kasir' },
            ]}
        >
            <Head title={title || 'Kasir'} />
            <div className="space-y-6 p-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Pendataan Faktur Masuk Kasir</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-1 gap-4 md:grid-cols-12">
                            <div className="md:col-span-12">
                                <div className="overflow-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow>
                                                <TableHead className="text-center">No</TableHead>
                                                <TableHead className="text-center">Kode Faktur</TableHead>
                                                <TableHead className="text-center">No RM</TableHead>
                                                <TableHead className="text-center">Nama</TableHead>
                                                <TableHead className="text-center">Poli</TableHead>
                                                <TableHead className="text-center">Total</TableHead>
                                                <TableHead className="text-center">Tanggal</TableHead>
                                                <TableHead className="text-center">Pilihan</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {(apotek || []).map((a: AnyRecord, idx: number) => {
                                                const no = idx + 1;
                                                const grandTotal = computeApotekGrandTotal(a);
                                                const active = activeKey === `apotek:${a.kode_faktur}`;
                                                return (
                                                    <TableRow key={`apotek-${a.kode_faktur}-${idx}`} className={active ? 'bg-muted/40' : ''}>
                                                        <TableCell className="text-center">{no}</TableCell>
                                                        <TableCell className="text-center">{a.kode_faktur}</TableCell>
                                                        <TableCell className="text-center">{a.no_rm}</TableCell>
                                                        <TableCell className="text-center">{a.nama}</TableCell>
                                                        <TableCell className="text-center">{a.poli}</TableCell>
                                                        <TableCell className="text-center">{grandTotal.toLocaleString('id-ID')}</TableCell>
                                                        <TableCell className="text-center">{a.tanggal}</TableCell>
                                                        <TableCell className="text-center">
                                                            <Button
                                                                size="sm"
                                                                className="mr-2"
                                                                variant="outline"
                                                                onClick={() => openDetailModalApotek(a)}
                                                            >
                                                                Detail
                                                            </Button>
                                                            <Button size="sm">
                                                                <a
                                                                    href={`/kasir/pembayaran/${encodeURIComponent(a.kode_faktur || '')}?no_rawat=${encodeURIComponent(a.no_rawat || '')}`}
                                                                >
                                                                    {' '}
                                                                    Bayar{' '}
                                                                </a>
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })}

                                            {(tindakan || []).map((t: AnyRecord, i: number) => {
                                                const no = (apotek?.length || 0) + i + 1;
                                                // Sum of harga string like "100,200"
                                                const sumHarga = String(t.harga || '0')
                                                    .split(',')
                                                    .map((h: string) => parseInt(h.trim(), 10))
                                                    .reduce((s: number, v: number) => s + (Number.isFinite(v) ? v : 0), 0);
                                                const active = activeKey === `tindakan:${t.no_rawat}`;
                                                return (
                                                    <TableRow key={`tindakan-${t.no_rawat}-${i}`} className={active ? 'bg-muted/40' : ''}>
                                                        <TableCell className="text-center">{no}</TableCell>
                                                        <TableCell className="text-center">{t.kode_faktur}</TableCell>
                                                        <TableCell className="text-center">{t.nomor_rm}</TableCell>
                                                        <TableCell className="text-center">{t.nama}</TableCell>
                                                        <TableCell className="text-center">{t?.data_soap?.pendaftaran?.poli?.nama || '-'}</TableCell>
                                                        <TableCell className="text-center">{sumHarga.toLocaleString('id-ID')}</TableCell>
                                                        <TableCell className="text-center">{(t.created_at || '').slice(0, 10)}</TableCell>
                                                        <TableCell className="text-center">
                                                            <Button size="sm" className="mr-2" onClick={() => openDetailModalTindakan(t)}>
                                                                Detail
                                                            </Button>
                                                            <a
                                                                className="inline-flex items-center rounded bg-blue-500 px-2 py-1 text-xs text-white"
                                                                href={`/kasir/pembayaran/${encodeURIComponent(t.kode_faktur || '')}?no_rawat=${encodeURIComponent(t.no_rawat || '')}`}
                                                            >
                                                                Bayar
                                                            </a>
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                </div>
                            </div>

                            {/* Right preview removed in favor of modal */}
                        </div>
                    </CardContent>
                </Card>
                <Dialog open={showDetailModal} onOpenChange={setShowDetailModal}>
                    <DialogContent className="max-w-3xl sm:max-w-5xl">
                        <DialogHeader>
                            <DialogTitle>{detailTitle}</DialogTitle>
                        </DialogHeader>
                        <div className="max-h-[70vh] overflow-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow>
                                        <TableHead>Nama</TableHead>
                                        <TableHead>Harga</TableHead>
                                        <TableHead>Qty</TableHead>
                                        <TableHead>SubTot</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {previewRows.length ? (
                                        previewRows.map((r, idx) => (
                                            <TableRow key={idx}>
                                                <TableCell>{r.nama}</TableCell>
                                                <TableCell>{formatCurrency(r.harga)}</TableCell>
                                                <TableCell>{r.qty}</TableCell>
                                                <TableCell>{formatCurrency(r.subtotal)}</TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={4} className="text-center text-muted-foreground">
                                                Belum ada data
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}
