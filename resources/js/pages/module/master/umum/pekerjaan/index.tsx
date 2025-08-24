"use client";

import { useEffect, useState } from "react";
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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { type BreadcrumbItem } from "@/types";
import { toast } from "sonner";

interface Pekerjaan {
  id: number;
  name: string;
}

interface PageProps {
  pekerjaans: Pekerjaan[];
  flash?: {
    success?: string;
    error?: string;
  };
}

const breadcrumbs: BreadcrumbItem[] = [
  { title: "Data Master", href: "" },
  { title: "Umum", href: "" },
  { title: "Pekerjaan", href: "" },
];

export default function Index() {
  const { pekerjaans, flash, errors } = usePage().props as unknown as PageProps & { errors?: any };

  useEffect(() => {
    if (flash?.success) {
      toast.success(flash.success);
    }
    if (flash?.error) {
      toast.error(flash.error);
    }
    if (errors?.name) {
      toast.error(errors.name);
    }
  }, [flash, errors]);

  // State untuk modal
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [name, setName] = useState("");

  // Pencarian
  const [search, setSearch] = useState("");

  // Modal Hapus
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleteName, setDeleteName] = useState("");

  const filteredPekerjaans = pekerjaans.filter((g) =>
    `${g.name}`.toLowerCase().includes(search.toLowerCase())
  );

  const handleOpenDelete = (pekerjaan: Pekerjaan) => {
    setDeleteId(pekerjaan.id);
    setDeleteName(pekerjaan.name);
    setDeleteOpen(true);
  };

  const handleDelete = () => {
    if (!deleteId) return;
    router.delete(`/datamaster/umum/pekerjaan/${deleteId}`, {
      preserveScroll: true,
      onSuccess: () => {
        setDeleteOpen(false);
        setDeleteId(null);
        setDeleteName("");
      },
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editId) {
      // Update
      router.put(
        `/datamaster/umum/pekerjaan/${editId}`,
        { name },
        {
          preserveScroll: true,
          onSuccess: () => {
            setOpen(false);
            setName("");
            setEditId(null);
          },
        }
      );
    } else {
      // Tambah
      router.post(
        "/datamaster/umum/pekerjaan",
        { name },
        {
          preserveScroll: true,
          onSuccess: () => {
            setOpen(false);
            setName("");
          },
        }
      );
    }
  };

  const handleOpenEdit = (pekerjaan: Pekerjaan) => {
    setEditId(pekerjaan.id);
    setName(pekerjaan.name);
    setOpen(true);
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Data Pekerjaan" />
      <div className="p-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Data Pekerjaan</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Cari pekerjaan..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-8 w-48"
                />
              </div>
              <Button
                onClick={() => {
                  setEditId(null);
                  setName("");
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
                {filteredPekerjaans && filteredPekerjaans.length > 0 ? (
                  filteredPekerjaans.map((item, index) => (
                    <TableRow key={item.id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{item.name}</TableCell>
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
            <DialogTitle>
              {editId ? "Edit Pekerjaan" : "Tambah Pekerjaan"}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              placeholder="Nama Pekerjaan"
              value={name}
              onChange={(e) => setName(e.target.value)}
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
            Apakah Anda yakin ingin menghapus pekerjaan{" "}
            <span className="font-semibold">{deleteName}</span>?
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
