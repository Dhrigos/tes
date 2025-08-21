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
import { Plus, Pencil, Trash2, Search, RefreshCcw } from "lucide-react";
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

interface Sarana {
  id: number;
  nama: string;
  kode: string;
}

interface PageProps {
  sarana: Sarana[];
  flash?: {
    success?: string;
    error?: string;
  };
}

const breadcrumbs: BreadcrumbItem[] = [
  { title: "Data Master", href: "" },
  { title: "Medis", href: "" },
  { title: "Sarana", href: "" },
];

export default function Index() {
  const { sarana, flash, errors } = usePage().props as unknown as PageProps & { errors?: any };

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

  // State modal Tambah/Edit/Sync
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"add" | "edit" | "sync">("add");
  const [editId, setEditId] = useState<number | null>(null);
  const [nama, setNama] = useState("");
  const [kode, setKode] = useState("");
  // Modal Hapus
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleteNama, setDeleteNama] = useState("");

  // Pencarian
  const [search, setSearch] = useState("");

  const filteredSarana = sarana.filter((a) =>
    a.nama.toLowerCase().includes(search.toLowerCase())
  );

  const resetForm = () => {
    setEditId(null);
    setNama("");
    setKode("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (mode === "sync") {
      // Sinkron hanya konfirmasi, tidak perlu kode
      router.post(`/datamaster/medis/sarana/sync`, {}, {
        preserveScroll: true,
        onSuccess: () => {
          setOpen(false);
          resetForm();
        },
      });
      return;
    }

    if (mode === "edit" && editId) {
      router.put(
        `/datamaster/medis/sarana/${editId}`,
        { nama, kode },
        {
          preserveScroll: true,
          onSuccess: () => {
            setOpen(false);
            resetForm();
          },
        }
      );
    } else {
      router.post(
        "/datamaster/medis/sarana",
        { nama, kode },
        {
          preserveScroll: true,
          onSuccess: () => {
            setOpen(false);
            resetForm();
          },
          onError: () => {
            // modal tetap terbuka
          },
        }
      );
    }
  };

  const handleOpenAdd = () => {
    resetForm();
    setMode("add");
    setOpen(true);
  };

  const handleOpenEdit = (saranaItem: Sarana) => {
    setEditId(saranaItem.id);
    setNama(saranaItem.nama);
    setKode(saranaItem.kode);
    setMode("edit");
    setOpen(true);
  };

  const handleOpenSync = () => {
    resetForm();
    setMode("sync");
    setOpen(true);
  };

  const handleOpenDelete = (saranaItem: Sarana) => {
    setDeleteId(saranaItem.id);
    setDeleteNama(saranaItem.nama);
    setDeleteOpen(true);
  };

  const handleDelete = () => {
    if (!deleteId) return;
    router.delete(`/datamaster/medis/sarana/${deleteId}`, { preserveScroll: true });
    setDeleteOpen(false);
    setDeleteId(null);
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Data Sarana" />
      <div className="p-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Sarana</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Cari sarana..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 w-48"
                />
              </div>
              <Button onClick={handleOpenAdd}>
                <Plus className="w-4 h-4 mr-2" /> Tambah
              </Button>
              <Button variant="outline" onClick={handleOpenSync}>
                <RefreshCcw className="w-4 h-4 mr-2" /> Sinkron
              </Button>
            </div>
          </CardHeader>

          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-16">#</TableHead>
                  <TableHead>Nama</TableHead>
                  <TableHead>Kode</TableHead>
                  <TableHead className="w-40 text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSarana.length > 0 ? (
                  filteredSarana.map((item, index) => (
                    <TableRow key={item.id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{item.nama}</TableCell>
                      <TableCell>{item.kode}</TableCell>
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

      {/* Modal Tambah/Edit/Sync */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {mode === "add" && "Tambah Sarana"}
              {mode === "edit" && "Edit Sarana"}
              {mode === "sync" && "Sinkron Sarana"}
            </DialogTitle>
          </DialogHeader>
          {mode === "sync" ? (
            <form
              onSubmit={handleSubmit}
              className="space-y-4"
            >
              <p>Apakah Anda ingin melakukan sinkron?</p>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Batal
                </Button>
                <Button type="submit">
                  Sinkron
                </Button>
              </DialogFooter>
            </form>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Field kode selalu ada */}
              <Input
                placeholder="Kode Sarana"
                value={kode}
                onChange={(e) => setKode(e.target.value)}
                required
              />
              {/* Field tambahan hanya kalau add/edit */}
              <Input
                placeholder="Nama Sarana"
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                required
              />
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                  Batal
                </Button>
                <Button type="submit">
                  Simpan
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Modal Konfirmasi Hapus */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Konfirmasi Hapus</DialogTitle>
          </DialogHeader>
          <p>
            Apakah Anda yakin ingin menghapus sarana{" "}
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
