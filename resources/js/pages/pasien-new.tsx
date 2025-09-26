"use client";

import { useState, useEffect } from "react";
import { usePage, router, Head } from "@inertiajs/react";
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import AppLayout from '@/layouts/app-layout';
import type { BreadcrumbItem } from '@/types';
import { User, UserCheck, UserX, Users, Plus, Pencil, Trash2, Search, RefreshCcw } from 'lucide-react';

interface Pasien {
  id: number;
  no_rm: string;
  nama: string;
  tanggal_lahir: string;
  no_bpjs: string;
  telepon: string;
  verifikasi: number;
  nik?: string;
  tempat_lahir?: string;
  provinsi?: string;
  kabupaten?: string;
  kecamatan?: string;
  desa?: string;
  rt?: string;
  rw?: string;
  kode_pos?: string;
  alamat?: string;
  noka?: string;
  noihs?: string;
  jenis_kartu?: string;
  kelas?: string;
  provide?: string;
  tgl_exp_bpjs?: string;
  seks?: string;
  goldar?: string;
  pernikahan?: string;
  kewarganegaraan?: string;
  agama?: string;
  pendidikan?: string;
  status_kerja?: string;
  suku?: string;
  bangsa?: string;
  bahasa?: string;
  email?: string;
  penjamin_2?: string;
  penjamin_2_info?: string;
  penjamin_3?: string;
  penjamin_3_info?: string;
  profile_image?: string;
}

interface PageProps {
  pasiens: Pasien[];
  pasienallold: number;
  pasienallnewnow: number;
  pasienall: number;
  pasiennoverif: number;
  provinsi: any[];
  kabupaten: any[];
  kecamatan: any[];
  desa: any[];
  kelamin: any[];
  goldar: any[];
  pernikahan: any[];
  agama: any[];
  pendidikan: any[];
  pekerjaan: any[];
  suku: any[];
  bangsa: any[];
  bahasa: any[];
  asuransi: any[];
  flash?: {
    success?: string;
    error?: string;
  };
}

const breadcrumbs: BreadcrumbItem[] = [
  { title: "Pasien", href: "/pasien" },
  { title: "Pendaftaran", href: "/pasien/pendaftaran" },
];

export default function PendaftaranPasien() {
  const { 
    pasiens, 
    pasienallold, 
    pasienallnewnow, 
    pasienall, 
    pasiennoverif,
    provinsi,
    kabupaten,
    kecamatan,
    desa,
    kelamin,
    goldar,
    pernikahan,
    agama,
    pendidikan,
    pekerjaan,
    suku,
    bangsa,
    bahasa,
    asuransi,
    flash, 
    errors 
  } = usePage().props as unknown as PageProps & { errors?: any };

  useEffect(() => {
    if (flash?.success) {
      toast.success(flash.success);
    }
    if (flash?.error) {
      toast.error(flash.error);
    }
  }, [flash]);

  // State untuk modal
  const [lengkapiOpen, setLengkapiOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [panggilOpen, setPanggilOpen] = useState(false);
  const [selectedPasien, setSelectedPasien] = useState<Pasien | null>(null);
  const [panggilPasien, setPanggilPasien] = useState<{ id: number; nama: string } | null>(null);

  // State untuk pencarian
  const [search, setSearch] = useState("");

  const stats = [
    { label: 'Total Pasien Lama', value: pasienallold, icon: User, color: 'bg-cyan-500' },
    { label: 'Total Pasien Baru Bulan Ini', value: pasienallnewnow, icon: UserCheck, color: 'bg-green-500' },
    { label: 'Total Pasien', value: pasienall, icon: Users, color: 'bg-yellow-500' },
    { label: 'Pasien Belum Verifikasi', value: pasiennoverif, icon: UserX, color: 'bg-red-500' },
  ];

  const filteredPasiens = pasiens.filter((p) =>
    p.nama.toLowerCase().includes(search.toLowerCase()) ||
    p.no_rm.toLowerCase().includes(search.toLowerCase()) ||
    p.no_bpjs.toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenLengkapi = (pasien: Pasien) => {
    setSelectedPasien(pasien);
    setLengkapiOpen(true);
  };

  const handleOpenEdit = (pasien: Pasien) => {
    setSelectedPasien(pasien);
    setEditOpen(true);
  };

  const handleOpenPanggil = (pasien: Pasien) => {
    setPanggilPasien({ id: pasien.id, nama: pasien.nama });
    setPanggilOpen(true);
  };

  const handlePanggil = () => {
    if (!panggilPasien) return;
    
    router.post(`/pasien/panggil/${panggilPasien.id}`, {}, {
      preserveScroll: true,
      onSuccess: () => {
        setPanggilOpen(false);
        setPanggilPasien(null);
      },
      onError: (errors) => {
        console.error('Error:', errors);
      },
    });
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Modul Pendaftaran Pasien" />
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

        {/* Search and Table */}
        <Card className="rounded-2xl shadow-md">
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Daftar Pasien</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Cari pasien..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 w-48"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-center w-24">Status</TableHead>
                  <TableHead className="text-center">No.RM</TableHead>
                  <TableHead className="text-center">Nama</TableHead>
                  <TableHead className="text-center">Tanggal Lahir</TableHead>
                  <TableHead className="text-center">No.Kartu BPJS</TableHead>
                  <TableHead className="text-center">No.Telepon</TableHead>
                  <TableHead className="text-center w-48">Tindakan</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPasiens.length > 0 ? (
                  filteredPasiens.map((p) => (
                    <TableRow key={p.id}>
                      <TableCell className="text-center">
                        {p.verifikasi === 1 ? (
                          <Badge variant="destructive">Belum Verifikasi</Badge>
                        ) : p.verifikasi === 2 ? (
                          <Badge variant="success">Sudah Verifikasi</Badge>
                        ) : (
                          <Badge variant="secondary">Tidak Aktif</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-center">{p.no_rm}</TableCell>
                      <TableCell className="text-center">{p.nama}</TableCell>
                      <TableCell className="text-center">{p.tanggal_lahir}</TableCell>
                      <TableCell className="text-center">{p.no_bpjs}</TableCell>
                      <TableCell className="text-center">{p.telepon}</TableCell>
                      <TableCell className="text-center space-x-2">
                        {p.verifikasi === 1 ? (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenLengkapi(p)}
                            >
                              <Plus className="w-4 h-4 mr-1" />
                              Lengkapi
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleOpenPanggil(p)}
                            >
                              <RefreshCcw className="w-4 h-4 mr-1" />
                              Panggil
                            </Button>
                          </>
                        ) : (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleOpenEdit(p)}
                          >
                            <Pencil className="w-4 h-4 mr-1" />
                            Edit
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center">
                      Tidak ada data.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Modal Panggil Pasien */}
      <Dialog open={panggilOpen} onOpenChange={setPanggilOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Konfirmasi Panggil Pasien</DialogTitle>
          </DialogHeader>
          <p>
            Apakah Anda yakin ingin memanggil pasien{" "}
            <span className="font-semibold">{panggilPasien?.nama}</span>?
          </p>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setPanggilOpen(false)}>
              Batal
            </Button>
            <Button type="button" onClick={handlePanggil}>
              Panggil
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
