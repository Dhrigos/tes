import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { router } from '@inertiajs/react';
import React from 'react';
import { toast } from 'sonner';

interface StokTerbukaModalProps {
    open: boolean;
    onClose: () => void;
    mode: 'create' | 'edit';
    stokTerbuka?: any;
    obatList: any[];
}

export default function StokTerbukaModal({ open, onClose, mode, stokTerbuka, obatList }: StokTerbukaModalProps) {
    const [kodeObat, setKodeObat] = React.useState('');
    const [namaObat, setNamaObat] = React.useState('');
    const [volume, setVolume] = React.useState<number | ''>('');
    const [ukuran, setUkuran] = React.useState<number | ''>('');
    const [satuan, setSatuan] = React.useState('');
    const [tanggalKadaluarsa, setTanggalKadaluarsa] = React.useState('');
    const [loading, setLoading] = React.useState(false);

    // Filter only BHP items
    const bhpObatList = React.useMemo(() => {
        const filtered = obatList.filter(obat => {
            // Check various possible values for bhp field
            const bhpValue = obat.bhp;
            return bhpValue === 1 || 
                   bhpValue === '1' || 
                   bhpValue === true || 
                   bhpValue === 'true';
        });
        
        // Debug: log if no BHP items found
        if (filtered.length === 0) {
            console.log('No BHP items found. Total obat:', obatList.length);
            console.log('Sample obat data:', obatList.slice(0, 3));
        }
        
        return filtered;
    }, [obatList]);

    React.useEffect(() => {
        if (open && stokTerbuka && mode === 'edit') {
            setKodeObat(stokTerbuka.kode_obat || '');
            setNamaObat(stokTerbuka.nama_obat || '');
            setVolume(stokTerbuka.volume || '');
            setUkuran(stokTerbuka.ukuran || '');
            setSatuan(stokTerbuka.satuan || '');
            setTanggalKadaluarsa(stokTerbuka.tanggal_kadaluarsa || '');
        } else if (open && mode === 'create') {
            resetForm();
        }
    }, [open, stokTerbuka, mode]);

    const resetForm = () => {
        setKodeObat('');
        setNamaObat('');
        setVolume('');
        setUkuran('');
        setSatuan('');
        setTanggalKadaluarsa('');
    };

    const handleObatChange = (kode: string) => {
        setKodeObat(kode);
        const obat = bhpObatList.find(o => o.kode === kode);
        if (obat) {
            setNamaObat(obat.nama || '');
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (mode === 'create' && (!kodeObat || !namaObat || !volume || !ukuran || !satuan)) {
            toast.error('Semua field harus diisi');
            return;
        }

        if (mode === 'edit' && (!volume || !ukuran || !satuan || !tanggalKadaluarsa)) {
            toast.error('Semua field harus diisi');
            return;
        }

        setLoading(true);

        try {
            if (mode === 'create') {
                const response = await fetch('/apotek/stok-terbuka', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                    },
                    body: JSON.stringify({
                        kode_obat: kodeObat,
                        nama_obat: namaObat,
                        volume: Number(volume),
                        ukuran: Number(ukuran),
                        satuan,
                    }),
                });

                const data = await response.json();

                if (data.status === 'success') {
                    toast.success(data.message);
                    onClose();
                    router.reload();
                } else {
                    toast.error(data.message || 'Gagal menambahkan stok terbuka');
                }
            } else if (mode === 'edit') {
                const response = await fetch(`/apotek/stok-terbuka/${stokTerbuka.id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                    },
                    body: JSON.stringify({
                        volume: Number(volume),
                        ukuran: Number(ukuran),
                        satuan,
                        tanggal_kadaluarsa: tanggalKadaluarsa,
                    }),
                });

                const data = await response.json();

                if (data.status === 'success') {
                    toast.success(data.message);
                    onClose();
                    router.reload();
                } else {
                    toast.error(data.message || 'Gagal memperbarui stok terbuka');
                }
            }
        } catch (error) {
            toast.error('Terjadi kesalahan saat menyimpan data');
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const getTitle = () => {
        if (mode === 'create') return 'Tambah Stok Terbuka';
        return 'Edit Stok Terbuka';
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>{getTitle()}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    {mode === 'create' && (
                        <>
                            <div className="space-y-2">
                                <Label htmlFor="obat">Pilih Obat BHP</Label>
                                <Select value={kodeObat} onValueChange={handleObatChange} required>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Pilih obat..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {bhpObatList.length > 0 ? (
                                            bhpObatList.map((obat) => (
                                                <SelectItem key={obat.kode} value={obat.kode}>
                                                    {obat.nama} ({obat.kode})
                                                </SelectItem>
                                            ))
                                        ) : (
                                            <div className="p-2 text-sm text-muted-foreground">
                                                Tidak ada obat BHP. Pastikan obat sudah ditandai sebagai BHP di master data.
                                            </div>
                                        )}
                                    </SelectContent>
                                </Select>
                                {bhpObatList.length === 0 && (
                                    <p className="text-xs text-red-600">
                                        Tidak ada obat dengan status BHP. Silakan set BHP = Ya di menu Daftar Barang terlebih dahulu.
                                    </p>
                                )}
                            </div>
                        </>
                    )}

                    {mode !== 'create' && (
                        <div className="space-y-2">
                            <Label>Nama Obat</Label>
                            <Input value={namaObat} disabled />
                        </div>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="volume">Volume / Sisa Saat Ini</Label>
                        <Input
                            id="volume"
                            type="number"
                            step="0.01"
                            value={volume}
                            onChange={(e) => setVolume(e.target.value === '' ? '' : Number(e.target.value))}
                            placeholder="Contoh: 1000"
                            required
                        />
                        <p className="text-xs text-gray-500">Volume yang tersisa saat ini</p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="ukuran">Ukuran / Kapasitas Penuh</Label>
                        <Input
                            id="ukuran"
                            type="number"
                            step="0.01"
                            value={ukuran}
                            onChange={(e) => setUkuran(e.target.value === '' ? '' : Number(e.target.value))}
                            placeholder="Contoh: 1000"
                            required
                        />
                        <p className="text-xs text-gray-500">Ukuran penuh per 1 stok (untuk acuan isi ulang)</p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="satuan">Satuan</Label>
                        <Input
                            id="satuan"
                            value={satuan}
                            onChange={(e) => setSatuan(e.target.value)}
                            placeholder="Contoh: ml, gram, liter"
                            required
                        />
                    </div>

                    {mode === 'create' && (
                        <div className="rounded-md bg-blue-50 p-3 text-sm text-blue-800">
                            <p className="font-medium">Info:</p>
                            <p>Tanggal kadaluarsa akan diambil otomatis dari stok barang dengan expired paling dekat (FEFO).</p>
                        </div>
                    )}

                    {mode === 'edit' && (
                        <div className="space-y-2">
                            <Label htmlFor="tanggal_kadaluarsa">Tanggal Kadaluarsa</Label>
                            <Input
                                id="tanggal_kadaluarsa"
                                type="date"
                                value={tanggalKadaluarsa}
                                onChange={(e) => setTanggalKadaluarsa(e.target.value)}
                                required
                            />
                        </div>
                    )}

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
                            Batal
                        </Button>
                        <Button type="submit" disabled={loading}>
                            {loading ? 'Menyimpan...' : 'Simpan'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
}
