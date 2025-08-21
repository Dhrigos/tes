"use client";

import { useState, useEffect } from "react";
import { usePage, router, Head } from "@inertiajs/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Pencil, Trash2, Search, RefreshCw } from "lucide-react";
import AppLayout from "@/layouts/app-layout";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { toast } from "sonner"; // ✅ pakai sonner
import { type BreadcrumbItem } from "@/types";
import { Select, SelectItem, SelectContent, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Alergi {
  id: number;
  kode: string;
  jenis_alergi: string;
  nama: string;
}

interface PageProps {
  alergis: Alergi[];
  flash?: {
    success?: string;
    error?: string;
  };
}

const breadcrumbs: BreadcrumbItem[] = [
  { title: "Data Master", href: "" },
  { title: "Medis", href: "" },
  { title: "Alergi", href: "" },
];

export default function Index() {
  const { alergis, flash, errors } = usePage().props as unknown as PageProps & { errors?: any };

  useEffect(() => {
    if (flash?.success) toast.success(flash.success);
    if (flash?.error) toast.error(flash.error);
    if (errors?.kode) toast.error(errors.kode);
    if (errors?.jenis_alergi) toast.error(errors.jenis_alergi);
    if (errors?.nama) toast.error(errors.nama);
  }, [flash, errors]);

  // State modal Tambah/Edit
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [kode, setKode] = useState("");
  const [jenisAlergi, setJenisAlergi] = useState("");
  const [nama, setNama] = useState("");
  const [isSinkron, setIsSinkron] = useState(false); // tambahan untuk modal sinkron

  // Modal Hapus
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleteNama, setDeleteNama] = useState("");

  // Pencarian
  const [search, setSearch] = useState("");

  const filteredAlergis = alergis.filter((a) => {
    const q = search.toLowerCase();
    return (
      a.kode?.toLowerCase().includes(q) ||
      a.jenis_alergi?.toLowerCase().includes(q) ||
      a.nama?.toLowerCase().includes(q)
    );
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (isSinkron) {
    // panggil route sinkron
        router.post(
        `/datamaster/medis/alergi/${jenisAlergi}`, // value 01,02,03 akan dipakai sebagai {alergi}
        {},
        {
            preserveScroll: true,
            onSuccess: () => {
            setOpen(false);
            setJenisAlergi("");
            setIsSinkron(false);
            toast.success("Sinkron berhasil");
            },
            onError: () => {
            toast.error("Sinkron gagal");
            },
        }
        );
        return;
    }

    const payload = {
      kode: kode,
      jenis_alergi: jenisAlergi,
      nama: nama,
    };

    if (editId) {
      router.put(`/datamaster/medis/alergi/${editId}`, payload, {
        preserveScroll: true,
        onSuccess: () => {
          setOpen(false);
          setKode("");
          setJenisAlergi("");
          setNama("");
          setEditId(null);
        },
      });
    } else {
      router.post("/datamaster/medis/alergi", payload, {
        preserveScroll: true,
        onSuccess: () => {
          setOpen(false);
          setKode("");
          setJenisAlergi("");
          setNama("");
          setEditId(null);
        },
        onError: () => {
          // modal tetap terbuka
        },
      });
    }
  };

  const handleOpenEdit = (alergi: Alergi) => {
    setEditId(alergi.id);
    setKode(alergi.kode ?? "");
    setJenisAlergi(alergi.jenis_alergi ?? "");
    setNama(alergi.nama ?? "");
    setIsSinkron(false);
    setOpen(true);
  };

  const handleOpenDelete = (alergi: Alergi) => {
    setDeleteId(alergi.id);
    setDeleteNama(alergi.nama);
    setDeleteOpen(true);
  };



  const handleDelete = () => {
    if (!deleteId) return;
    router.delete(`/datamaster/medis/alergi/${deleteId}`, { preserveScroll: true });
    setDeleteOpen(false);
    setDeleteId(null);
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Data Alergi" />
      <div className="p-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Alergi</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Cari alergi..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 w-48"
                />
              </div>
              <Button
                onClick={() => {
                  setEditId(null);
                  setKode("");
                  setJenisAlergi("");
                  setNama("");
                  setIsSinkron(false);
                  setOpen(true);
                }}
              >
                <Plus className="w-4 h-4 mr-2" /> Tambah
              </Button>
              <Button
                onClick={() => {
                  setEditId(null);
                  setKode("");
                  setNama("");
                  setJenisAlergi(""); // reset value
                  setIsSinkron(true); // modal sinkron
                  setOpen(true);
                }}
              >
                <RefreshCw className="w-4 h-4 mr-2" /> Sinkron
              </Button>
            </div>
          </CardHeader>

          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">#</TableHead>
                  <TableHead>Kode Alergi</TableHead>
                  <TableHead>Jenis Alergi</TableHead>
                  <TableHead>Nama Alergi</TableHead>
                  <TableHead className="w-40 text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAlergis.length > 0 ? (
                  filteredAlergis.map((item, index) => (
                    <TableRow key={item.id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{item.kode}</TableCell>
                      <TableCell>
                        {item.jenis_alergi.charAt(0).toUpperCase() +
                          item.jenis_alergi.slice(1).toLowerCase()}
                      </TableCell>
                      <TableCell>{item.nama}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button size="sm" variant="outline" onClick={() => handleOpenEdit(item)}>
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="destructive" onClick={() => handleOpenDelete(item)}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center">
                      Tidak ada data.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>

      {/* Modal Tambah/Edit */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {isSinkron ? "Sinkron Alergi" : editId ? "Edit Alergi" : "Tambah Alergi"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            {isSinkron ? (
              <Select value={jenisAlergi} onValueChange={setJenisAlergi} required>
                <SelectTrigger className="w-full px-4 py-2">
                  <SelectValue placeholder="Pilih Opsi" />
                </SelectTrigger>
                <SelectContent className="w-full max-h-60 overflow-auto">
                  <SelectItem value="01">01</SelectItem>
                  <SelectItem value="02">02</SelectItem>
                  <SelectItem value="03">03</SelectItem>
                </SelectContent>
              </Select>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  placeholder="Kode Alergi"
                  value={kode}
                  onChange={(e) => setKode(e.target.value)}
                  required
                />
                <Select value={jenisAlergi} onValueChange={setJenisAlergi} required>
                  <SelectTrigger className="w-full px-4 py-2">
                    <SelectValue placeholder="Pilih Jenis Alergi" />
                  </SelectTrigger>
                  <SelectContent className="w-full max-h-60 overflow-auto">
                    <SelectItem value="Obat">Obat</SelectItem>
                    <SelectItem value="Makanan">Makanan</SelectItem>
                    <SelectItem value="Udara">Udara</SelectItem>
                    <SelectItem value="LAINNYA">Lainnya</SelectItem>
                  </SelectContent>
                </Select>
                <div className="sm:col-span-2">
                  <Input
                    placeholder="Nama Alergi"
                    value={nama}
                    onChange={(e) => setNama(e.target.value)}
                    required
                  />
                </div>
              </div>
            )}
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Batal
              </Button>
              <Button type="submit">Simpan</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Konfirmasi Hapus */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Konfirmasi Hapus</DialogTitle>
          </DialogHeader>
          <p>
            Apakah Anda yakin ingin menghapus alergi{" "}
            <span className="font-semibold">{deleteNama}</span>?
          </p>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDeleteOpen(false)}>
              Batal
            </Button>
            <Button type="button" variant="destructive" onClick={handleDelete}>
              Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
