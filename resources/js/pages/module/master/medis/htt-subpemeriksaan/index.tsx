
// INI KAGAK KEPAKE HAPUS AJA NTAR KALAU BISA


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
import { Plus, Pencil, Trash2, Search } from "lucide-react";
import AppLayout from "@/layouts/app-layout";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { type BreadcrumbItem } from "@/types";

interface Htt_Pemeriksaan {
  id: number;
  nama_pemeriksaan: string;
}

interface Htt_Subpemeriksaan {
  id: number;
  nama: string;
  id_htt_pemeriksaan: number;
  htt_pemeriksaan: Htt_Pemeriksaan;
}

interface PageProps {
  htt_subpemeriksaans: Htt_Subpemeriksaan[];
  htt_pemeriksaans: Htt_Pemeriksaan[];
  flash?: {
    success?: string;
    error?: string;
  };
}

const breadcrumbs: BreadcrumbItem[] = [
  { title: "Data Master", href: "" },
  { title: "Medis", href: "" },
  { title: "Sub Pemeriksaan Head To Toe", href: "" },
];

export default function Index() {
  const { htt_subpemeriksaans, htt_pemeriksaans, flash, errors } = usePage().props as unknown as PageProps & { errors?: any };

  useEffect(() => {
    if (flash?.success) {
      toast.success(flash.success);
    }
    if (flash?.error) {
      toast.error(flash.error);
    }
    if (errors?.nama) {
      toast.error(errors.nama);
    }
    if (errors?.id_htt_pemeriksaan) {
      toast.error(errors.id_htt_pemeriksaan);
    }
  }, [flash, errors]);

  // State modal Tambah/Edit
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [nama, setNama] = useState("");
  const [selectedPemeriksaanId, setSelectedPemeriksaanId] = useState<number | null>(null);

  // Modal Hapus
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleteNama, setDeleteNama] = useState("");

  // Pencarian
  const [search, setSearch] = useState("");

  const filteredHtt_subpemeriksaans = htt_subpemeriksaans.filter((a) =>
    a.nama.toLowerCase().includes(search.toLowerCase()) ||
    a.htt_pemeriksaan.nama_pemeriksaan.toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedPemeriksaanId) {
      toast.error("Pilih pemeriksaan terlebih dahulu");
      return;
    }

    if (editId) {
      router.put(
        `/datamaster/medis/htt-subpemeriksaan/${editId}`,
        { 
          nama: nama,
          id_htt_pemeriksaan: selectedPemeriksaanId 
        },
        {
          preserveScroll: true,
          onSuccess: () => {
            setOpen(false);
            setNama("");
            setEditId(null);
            setSelectedPemeriksaanId(null);
          },
        }
      );
    } else {
      router.post(
        "/datamaster/medis/htt-subpemeriksaan",
        { 
          nama: nama,
          id_htt_pemeriksaan: selectedPemeriksaanId 
        },
        {
          preserveScroll: true,
          onSuccess: () => {
            setOpen(false);
            setNama("");
            setEditId(null);
            setSelectedPemeriksaanId(null);
          },
          onError: () => {
            // modal tetap terbuka
          },
        }
      );
    }
  };

  const handleOpenEdit = (htt_subpemeriksaan: Htt_Subpemeriksaan) => {
    setEditId(htt_subpemeriksaan.id);
    setNama(htt_subpemeriksaan.nama);
    setSelectedPemeriksaanId(htt_subpemeriksaan.id_htt_pemeriksaan);
    setOpen(true);
  };

  const handleOpenDelete = (htt_subpemeriksaan: Htt_Subpemeriksaan) => {
    setDeleteId(htt_subpemeriksaan.id);
    setDeleteNama(htt_subpemeriksaan.nama);
    setDeleteOpen(true);
  };

  const handleDelete = () => {
    if (!deleteId) return;
    router.delete(`/datamaster/medis/htt-subpemeriksaan/${deleteId}`, { preserveScroll: true });
    setDeleteOpen(false);
    setDeleteId(null);
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Data Sub HTT Pemeriksaan" />
      <div className="p-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Data Sub Pemeriksaan Head To Toe</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Cari Sub Pemeriksaan..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 w-56"
                />
              </div>
              <Button
                onClick={() => {
                  setEditId(null);
                  setNama("");
                  setSelectedPemeriksaanId(null);
                  setOpen(true);
                }}
              >
                <Plus className="w-4 h-4 mr-2" /> Tambah Sub Pemeriksaan
              </Button>
            </div>
          </CardHeader>

          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">#</TableHead>
                  <TableHead>Nama Sub Pemeriksaan</TableHead>
                  <TableHead>Pemeriksaan Induk</TableHead>
                  <TableHead className="w-40 text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredHtt_subpemeriksaans.length > 0 ? (
                  filteredHtt_subpemeriksaans.map((item, index) => (
                    <TableRow key={item.id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell className="font-medium">{item.nama}</TableCell>
                      <TableCell className="text-gray-600">{item.htt_pemeriksaan.nama_pemeriksaan}</TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOpenEdit(item)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleOpenDelete(item)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center">
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
            <DialogTitle>{editId ? "Edit Sub Pemeriksaan" : "Tambah Sub Pemeriksaan"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Select
              value={selectedPemeriksaanId?.toString() || ""}
              onValueChange={(value) => setSelectedPemeriksaanId(parseInt(value))}
              disabled={!!editId}
            >
              <SelectTrigger>
                <SelectValue placeholder="Pilih Pemeriksaan Induk" />
              </SelectTrigger>
              <SelectContent>
                {htt_pemeriksaans.map((pemeriksaan) => (
                  <SelectItem key={pemeriksaan.id} value={pemeriksaan.id.toString()}>
                    {pemeriksaan.nama_pemeriksaan}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              placeholder="Nama Sub Pemeriksaan"
              value={nama}
              onChange={(e) => setNama(e.target.value)}
              required
            />
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
            Apakah Anda yakin ingin menghapus Sub Pemeriksaan{" "}
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
