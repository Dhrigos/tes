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
import { toast } from "sonner"; // ✅ pakai sonner
import { type BreadcrumbItem } from "@/types";

interface PenggunaanObat {
  id: number;
  nama: string;
}

interface PageProps {
  penggunaan_obats: PenggunaanObat[];
  flash?: {
    success?: string;
    error?: string;
  };
}

const breadcrumbs: BreadcrumbItem[] = [
  { title: "Data Master", href: "" },
  { title: "Medis", href: "" },
  { title: "Penggunaan Obat", href: "" },
];

export default function Index() {
  const { penggunaan_obats, flash, errors } = usePage().props as unknown as PageProps & { errors?: any };

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
  }, [flash, errors]);

  // State modal Tambah/Edit
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [nama, setNama] = useState("");

  // Modal Hapus
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleteNama, setDeleteNama] = useState("");

  // Pencarian
  const [search, setSearch] = useState("");

  const filteredPenggunaanObats = penggunaan_obats.filter((a) =>
    a.nama.toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editId) {
      router.put(
        `/datamaster/medis/penggunaan-obat/${editId}`,
        { nama },
        {
          preserveScroll: true,
          onSuccess: () => {
            setOpen(false);
            setNama("");
            setEditId(null);
          },
          onError: (errors) => {
            console.error('Error updating:', errors);
          },
        }
      );
    } else {
      router.post(
        "/datamaster/medis/penggunaan-obat",
        { nama },
        {
          preserveScroll: true,
          onSuccess: () => {
            setOpen(false);
            setNama("");
            setEditId(null);
          },
          onError: (errors) => {
            console.error('Error creating:', errors);
          },
        }
      );
    }
  };

  const handleOpenEdit = (penggunaanObat: PenggunaanObat) => {
    setEditId(penggunaanObat.id);
    setNama(penggunaanObat.nama);
    setOpen(true);
  };

  const handleOpenDelete = (penggunaanObat: PenggunaanObat) => {
    setDeleteId(penggunaanObat.id);
    setDeleteNama(penggunaanObat.nama);
    setDeleteOpen(true);
  };

  const handleDelete = () => {
    if (!deleteId) return;
    router.delete(`/datamaster/medis/penggunaan-obat/${deleteId}`, { 
      preserveScroll: true,
      onSuccess: () => {
        setDeleteOpen(false);
        setDeleteId(null);
        setDeleteNama("");
      },
      onError: (errors) => {
        console.error('Error deleting:', errors);
      },
    });
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Data Penggunaan Obat" />
      <div className="p-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Data Penggunaan Obat</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Cari penggunaan obat..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 w-48"
                />
              </div>
              <Button
                onClick={() => {
                  setEditId(null);
                  setNama("");
                  setOpen(true);
                }}
              >
                <Plus className="w-4 h-4 mr-2" /> Tambah
              </Button>
            </div>
          </CardHeader>

          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">#</TableHead>
                  <TableHead>Nama</TableHead>
                  <TableHead className="w-40 text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPenggunaanObats.length > 0 ? (
                  filteredPenggunaanObats.map((item, index) => (
                    <TableRow key={item.id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{item.nama}</TableCell>
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
                    <TableCell colSpan={3} className="text-center">
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
            <DialogTitle>{editId ? "Edit Penggunaan Obat" : "Tambah Penggunaan Obat"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              placeholder="Nama Penggunaan Obat"
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
            Apakah Anda yakin ingin menghapus penggunaan obat{" "}
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
