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

  interface Icd9 {
    id: number;
    kode: string;
    nama: string;
  }

  interface PageProps {
    icd9s: Icd9[];
    flash?: {
      success?: string;
      error?: string;
    };
  }

  const breadcrumbs: BreadcrumbItem[] = [
    { title: "Data Master", href: "" },
    { title: "Medis", href: "" },
    { title: "ICD-9", href: "" },
  ];

  export default function Index() {
    const { icd9s, flash, errors } = usePage().props as unknown as PageProps & { errors?: any };

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
    const [kode, setKode] = useState("");
    // Modal Hapus
    const [deleteOpen, setDeleteOpen] = useState(false);
    const [deleteId, setDeleteId] = useState<number | null>(null);
    const [deleteNama, setDeleteNama] = useState("");

    // Pencarian
    const [search, setSearch] = useState("");

    const filteredIcd9s = icd9s.filter((a) =>
      a.nama.toLowerCase().includes(search.toLowerCase())
    );

    const handleSubmit = (e: React.FormEvent) => {
      e.preventDefault();

      if (editId) {
        router.put(
          `/datamaster/medis/icd9/${editId}`,
          { nama, kode },
          {
            preserveScroll: true,
            onSuccess: () => {
              setOpen(false);
              setNama("");
              setEditId(null);
            },
          }
        );
      } else {
        router.post(
          "/datamaster/medis/icd9",
          { nama, kode },
          {
            preserveScroll: true,
            onSuccess: () => {
              setOpen(false);
              setNama("");
              setEditId(null);
            },
            onError: () => {
              // modal tetap terbuka
            },
          }
        );
      }
    };

    const handleOpenEdit = (icd9: Icd9) => {
      setEditId(icd9.id);
      setNama(icd9.nama);
      setKode(icd9.kode);
      setOpen(true);
    };

    const handleOpenDelete = (icd9: Icd9) => {
      setDeleteId(icd9.id);
      setDeleteNama(icd9.nama);
      setDeleteOpen(true);
    };

    const handleDelete = () => {
      if (!deleteId) return;
      router.delete(`/datamaster/medis/icd9/${deleteId}`, { preserveScroll: true });
      setDeleteOpen(false);
      setDeleteId(null);
    };

    return (
      <AppLayout breadcrumbs={breadcrumbs}>
        <Head title="Data ICD-9" />
        <div className="p-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>ICD-9</CardTitle>
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Cari icd9..."
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
                    <TableHead>Kode</TableHead>
                    <TableHead className="w-40 text-right">Aksi</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredIcd9s.length > 0 ? (
                    filteredIcd9s.map((item, index) => (
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
              <DialogTitle>{editId ? "Edit ICD-9" : "Tambah ICD-9"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4">
                <Input
                  placeholder="Nama ICD-9"
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  required
                />
                <Input
                  placeholder="Kode ICD-9"
                  value={kode}
                  onChange={(e) => setKode(e.target.value)}
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
              Apakah Anda yakin ingin menghapus icd9{" "}
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
