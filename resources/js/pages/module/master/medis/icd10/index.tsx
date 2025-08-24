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
import { toast } from "sonner";
import { type BreadcrumbItem } from "@/types";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Icd10 {
  id: number;
  kode: string;
  nama: string;
  perlu_rujuk?: string;
}

interface PageProps {
  icd10s: Icd10[];
  flash?: {
    success?: string;
    error?: string;
  };
}

const breadcrumbs: BreadcrumbItem[] = [
  { title: "Data Master", href: "" },
  { title: "Medis", href: "" },
  { title: "ICD-10", href: "" },
];

export default function Index() {
  const { icd10s, flash, errors } = usePage().props as unknown as PageProps & { errors?: any };

  useEffect(() => {
    if (flash?.success) toast.success(flash.success);
    if (flash?.error) toast.error(flash.error);
    if (errors?.nama) toast.error(errors.nama);
  }, [flash, errors]);

  // State modal Tambah/Edit/Sync
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"add" | "edit" | "sync">("add");
  const [editId, setEditId] = useState<number | null>(null);
  const [nama, setNama] = useState("");
  const [kode, setKode] = useState("");
  const [perluRujuk, setPerluRujuk] = useState("");

  // Modal Hapus
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleteNama, setDeleteNama] = useState("");

  // Pencarian
  const [search, setSearch] = useState("");

  const filteredIcd10s = icd10s.filter((a) =>
    a.nama.toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (mode === "sync") {
        router.post(`/datamaster/medis/icd10/sync/${kode}`, {}, {
            preserveScroll: true,
            onSuccess: () => {
            setOpen(false);
            resetForm();
            },
        });
        return;
    }


    const payload = { nama, kode, perlu_rujuk: perluRujuk };

    if (mode === "edit" && editId) {
      router.put(`/datamaster/medis/icd10/${editId}`, payload, {
        preserveScroll: true,
        onSuccess: () => {
          setOpen(false);
          resetForm();
        },
      });
    } else {
      router.post("/datamaster/medis/icd10", payload, {
        preserveScroll: true,
        onSuccess: () => {
          setOpen(false);
          resetForm();
        },
      });
    }
  };

  const handleOpenAdd = () => {
    resetForm();
    setMode("add");
    setOpen(true);
  };

  const handleOpenEdit = (icd10: Icd10) => {
    setEditId(icd10.id);
    setNama(icd10.nama);
    setKode(icd10.kode);
    setPerluRujuk(icd10.perlu_rujuk || "");
    setMode("edit");
    setOpen(true);
  };

  const handleOpenSync = () => {
    resetForm();
    setMode("sync");
    setOpen(true);
  };

  const handleOpenDelete = (icd10: Icd10) => {
    setDeleteId(icd10.id);
    setDeleteNama(icd10.nama);
    setDeleteOpen(true);
  };

  const handleDelete = () => {
    if (!deleteId) return;
    router.delete(`/datamaster/medis/icd10/${deleteId}`, { preserveScroll: true });
    setDeleteOpen(false);
    setDeleteId(null);
  };

  const resetForm = () => {
    setEditId(null);
    setNama("");
    setKode("");
    setPerluRujuk("");
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Data ICD-10" />
      <div className="p-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>ICD-10</CardTitle>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-2.5 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Cari ICD-10..."
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
                  <TableHead>Perlu Rujuk</TableHead>
                  <TableHead className="w-40 text-right">Aksi</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredIcd10s.length > 0 ? (
                  filteredIcd10s.map((item, index) => (
                    <TableRow key={item.id}>
                      <TableCell>{index + 1}</TableCell>
                      <TableCell>{item.nama}</TableCell>
                      <TableCell>{item.kode}</TableCell>
                      <TableCell>{item.perlu_rujuk || "-"}</TableCell>
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

      {/* Modal Tambah/Edit/Sync */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {mode === "add" && "Tambah ICD-10"}
              {mode === "edit" && "Edit ICD-10"}
              {mode === "sync" && "Sinkron ICD-10"}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Field kode selalu ada */}
            <Input
              placeholder="Kode ICD-10"
              value={kode}
              onChange={(e) => setKode(e.target.value)}
              required
            />

            {/* Field tambahan hanya kalau add/edit */}
            {mode !== "sync" && (
              <>
                <Input
                  placeholder="Nama ICD-10"
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  required
                />
                <Select value={perluRujuk} onValueChange={setPerluRujuk} required>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Pilih Rujukan" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="YA">Perlu Rujuk</SelectItem>
                    <SelectItem value="TIDAK">Tidak Perlu Rujuk</SelectItem>
                  </SelectContent>
                </Select>
              </>
            )}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Batal
              </Button>
              <Button type="submit">
                {mode === "sync" ? "Sinkron" : "Simpan"}
              </Button>
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
            Apakah Anda yakin ingin menghapus ICD-10{" "}
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
