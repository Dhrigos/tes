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

interface Poli {
  id: number;
  nama: string;
  kode: string;
  jenis: string;
}

interface PageProps {
  polis: Poli[];
  flash?: {
    success?: string;
    error?: string;
  };
}

const breadcrumbs: BreadcrumbItem[] = [
  { title: "Data Master", href: "" },
  { title: "Medis", href: "" },
  { title: "Poli", href: "" },
];

export default function Index() {
  const { polis, flash, errors } = usePage().props as unknown as PageProps & { errors?: any };

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
    if (errors?.kode) {
      toast.error(errors.kode);
    }
    if (errors?.jenis) {
      toast.error(errors.jenis);
    }
    if (errors?.msg) {
      toast.error(errors.msg);
    }
  }, [flash, errors]);

  // State modal Tambah/Edit/Sync
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"add" | "edit" | "sync">("add");
  const [editId, setEditId] = useState<number | null>(null);
  const [nama, setNama] = useState("");
  const [kode, setKode] = useState("");
  const [jenis, setJenis] = useState("");
  // Modal Hapus
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleteNama, setDeleteNama] = useState("");

  // Pencarian
  const [search, setSearch] = useState("");

  const filteredPoli = polis.filter((a) =>
    a.nama.toLowerCase().includes(search.toLowerCase())
  );

  const resetForm = () => {
    setEditId(null);
    setNama("");
    setKode("");
    setJenis("");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (mode === "sync") {
      // Sinkron hanya konfirmasi, tidak perlu kode
      router.post(`/datamaster/medis/poli/sync`, {}, {
        preserveScroll: true,
        onSuccess: () => {
          setOpen(false);
          resetForm();
        },
        onError: (errors) => {
          // Modal tetap terbuka jika ada error
        },
      });
      return;
    }

    if (mode === "edit" && editId) {
      router.put(
        `/datamaster/medis/poli/${editId}`,
        { nama, kode, jenis },
        {
          preserveScroll: true,
          onSuccess: () => {
            setOpen(false);
            resetForm();
          },
          onError: (errors) => {
            // Modal tetap terbuka jika ada error
          },
        }
      );
    } else {
      router.post(
        "/datamaster/medis/poli",
        { nama, kode, jenis },
        {
          preserveScroll: true,
          onSuccess: () => {
            setOpen(false);
            resetForm();
          },
          onError: (errors) => {
            // Modal tetap terbuka jika ada error
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

  const handleOpenEdit = (poliItem: Poli) => {
    setEditId(poliItem.id);
    setNama(poliItem.nama);
    setKode(poliItem.kode);
    setJenis(poliItem.jenis);
    setMode("edit");
    setOpen(true);
  };

  const handleOpenSync = () => {
    resetForm();
    setMode("sync");
    setOpen(true);
  };

  const handleOpenDelete = (poliItem: Poli) => {
    setDeleteId(poliItem.id);
    setDeleteNama(poliItem.nama);
    setDeleteOpen(true);
  };

  const handleDelete = () => {
    if (!deleteId) return;
    router.delete(`/datamaster/medis/poli/${deleteId}`, { 
      preserveScroll: true,
      onSuccess: () => {
        setDeleteOpen(false);
        setDeleteId(null);
        setDeleteNama("");
      },
      onError: (errors) => {
        // Modal tetap terbuka jika ada error
      },
    });
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Data Poli" />
      <div className="p-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Poli</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Cari poli..."
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
                  <TableHead>Jenis</TableHead>
                  <TableHead className="w-40 text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPoli.length > 0 ? (
                  filteredPoli.map((item, index) => (
                    <TableRow key={item.id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{item.nama}</TableCell>
                      <TableCell>{item.kode}</TableCell>
                      <TableCell>{item.jenis}</TableCell>
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

      {/* Modal Tambah/Edit/Sync */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {mode === "add" && "Tambah Poli"}
              {mode === "edit" && "Edit Poli"}
              {mode === "sync" && "Sinkron Poli"}
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
                placeholder="Kode Poli"
                value={kode}
                onChange={(e) => setKode(e.target.value)}
                required
              />
              {/* Field tambahan hanya kalau add/edit */}
              <Input
                placeholder="Nama Poli"
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                required
              />
              <Input
                placeholder="Jenis Poli"
                value={jenis}
                onChange={(e) => setJenis(e.target.value)}
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
            Apakah Anda yakin ingin menghapus poli{" "}
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
