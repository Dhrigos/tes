'use client';

import AppLayout from '@/layouts/app-layout';
import { Head, usePage } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';

interface DaftarBarangItem {
    id: number;
    kode_barang: string;
    nama_barang: string;
    satuan_kecil?: string;
}

interface PageProps {
    title?: string;
    dabar?: DaftarBarangItem[];
    stok?: any[];
    flash?: { success?: string; error?: string };
    errors?: Record<string, string[]>;
}

export default function Index() {
    const pageProps = usePage().props as unknown as PageProps;
    const { title, dabar, flash, errors } = pageProps;

    useEffect(() => {
        if (flash?.success) toast.success(flash.success);
        if (flash?.error) toast.error(flash.error);
        if (errors)
            Object.values(errors)
                .flat()
                .forEach((e) => toast.error(e));
    }, [flash, errors]);

    const [aktifitas, setAktifitas] = useState<string>('');
    const [hargaAcuan, setHargaAcuan] = useState<string>('');
    const [obatNama, setObatNama] = useState<string>('');
    const [kodeObat, setKodeObat] = useState<string>('');
    const [satuanText, setSatuanText] = useState<string>('Satuan');
    const [keteranganQty, setKeteranganQty] = useState<string>('');
    const [qty, setQty] = useState<number>(0);
    const [alasan, setAlasan] = useState<string>('');
    const [expired, setExpired] = useState<string>('');

    const obatOptions = useMemo(() => (Array.isArray(dabar) ? dabar : []), [dabar]);

    const handleChangeObat = (value: string) => {
        setObatNama(value);
        const item = obatOptions.find((x) => x.nama_barang === value);
        if (item) {
            setSatuanText(item.satuan_kecil || 'Satuan');
            setKodeObat(item.kode_barang);
        } else {
            setSatuanText('Satuan');
            setKodeObat('');
        }
    };

    useEffect(() => {
        if (aktifitas === 'stok_opname') {
            setKeteranganQty('');
            setAlasan('Penyesuaian stok opname');
        } else {
            setAlasan('');
        }
    }, [aktifitas]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        const payload = {
            kode_obat: kodeObat,
            aktifitas_penyesuaian: aktifitas,
            harga_penyesuaian: hargaAcuan,
            obat_penyesuaian: obatNama,
            keterangan_qty_penyesuaian: keteranganQty,
            qty_penyesuaian: qty,
            alasan_penyesuaian: alasan,
            expired_penyesuaian: expired,
        } as Record<string, unknown>;

        try {
            const actionUrl = (window as any).route?.('stok_penyesuaian.store') || '/stok-penyesuaian';
            const res = await fetch(actionUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                    'X-CSRF-TOKEN': (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
                },
                body: JSON.stringify(payload),
            });

            const data = await res.json().catch(() => ({}));

            if (res.ok && data?.success) {
                toast.success(data.message || 'Berhasil menyimpan penyesuaian');
                window.location.reload();
            } else {
                toast.error(data?.message || 'Gagal menyimpan penyesuaian');
            }
        } catch (err) {
            toast.error('Terjadi kesalahan dalam menyimpan data!');
        }
    };

    return (
        <AppLayout
            breadcrumbs={[
                { title: 'Gudang', href: '' },
                { title: 'Penyesuaian Barang', href: '' },
            ]}
        >
            <Head title={title || 'Penyesuaian Barang'} />
            <div className="p-6">
                <div className="rounded-md bg-white shadow">
                    <div className="border-b px-6 py-4">
                        <h3 className="text-lg font-semibold">Penyesuaian Barang</h3>
                    </div>
                    <form onSubmit={handleSubmit} className="px-6 py-4" id="addFormPenyesuaian">
                        <input type="hidden" name="kode_obat" value={kodeObat} />

                        <div className="grid grid-cols-1 gap-4">
                            <div className="grid grid-cols-12 items-center gap-2">
                                <label className="col-span-2">Aktivitas</label>
                                <div className="col-span-6">
                                    <select
                                        className="w-full rounded border px-3 py-2"
                                        value={aktifitas}
                                        onChange={(e) => setAktifitas(e.target.value)}
                                        required
                                    >
                                        <option value="" disabled>
                                            -- Pilih Aktivitas --
                                        </option>
                                        <option value="stok_opname">Stok Opname</option>
                                        <option value="koreksi_manual">Koreksi Manual</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-12 items-center gap-2">
                                <label className="col-span-2">Harga Acuan</label>
                                <div className="col-span-6">
                                    <select
                                        className="w-full rounded border px-3 py-2"
                                        value={hargaAcuan}
                                        onChange={(e) => setHargaAcuan(e.target.value)}
                                        required
                                    >
                                        <option value="" disabled>
                                            -- Pilih Aktivitas --
                                        </option>
                                        <option value="harga_jual_1">Harga Jual 1 (BPJS)</option>
                                        <option value="harga_jual_2">Harga Jual 2 (Asuransi)</option>
                                        <option value="harga_jual_3">Harga Jual 3 (Umum)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-12 items-center gap-2">
                                <label className="col-span-2">Nama Obat</label>
                                <div className="col-span-6">
                                    <select
                                        className="w-full rounded border px-3 py-2"
                                        value={obatNama}
                                        onChange={(e) => handleChangeObat(e.target.value)}
                                        required
                                    >
                                        <option value="" disabled>
                                            -- Pilih Obat --
                                        </option>
                                        {obatOptions.map((o) => (
                                            <option key={o.id} value={o.nama_barang} data-satuan={o.satuan_kecil} data-kode={o.kode_barang}>
                                                {o.nama_barang}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-12 items-center gap-2">
                                <label className="col-span-2">Jumlah</label>
                                <div className="col-span-4">
                                    <select
                                        className="w-full rounded border px-3 py-2"
                                        value={keteranganQty}
                                        onChange={(e) => setKeteranganQty(e.target.value)}
                                        required
                                        disabled={aktifitas === 'stok_opname'}
                                    >
                                        <option value="" disabled>
                                            -- Ubah Sebanyak --
                                        </option>
                                        <option value="tambahkan">Tambahkan Sebanyak</option>
                                        <option value="kurangi">Kurangi Sebanyak</option>
                                    </select>
                                </div>
                                <div className="col-span-2">
                                    <input
                                        type="number"
                                        className="w-full rounded border px-3 py-2"
                                        min={0}
                                        value={qty}
                                        onChange={(e) => setQty(parseInt(e.target.value || '0'))}
                                    />
                                </div>
                                <span className="col-span-2">{satuanText}</span>
                            </div>

                            <div className="grid grid-cols-12 items-center gap-2">
                                <label className="col-span-2">Alasan</label>
                                <div className="col-span-6">
                                    <input
                                        type="text"
                                        className="w-full rounded border px-3 py-2"
                                        placeholder="Tulis alasan penyesuaian"
                                        value={alasan}
                                        onChange={(e) => setAlasan(e.target.value)}
                                        readOnly={aktifitas === 'stok_opname'}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-12 items-center gap-2">
                                <label className="col-span-2">Expired</label>
                                <div className="col-span-6">
                                    <input
                                        type="date"
                                        className="w-full rounded border px-3 py-2"
                                        value={expired}
                                        onChange={(e) => setExpired(e.target.value)}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="mt-6 text-right">
                            <button type="submit" className="inline-flex items-center rounded bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">
                                Simpan
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
}
