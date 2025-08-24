"use client";

import { useState, useEffect } from "react";
import { usePage, router, Head } from "@inertiajs/react";
import { toast } from "sonner";

// UI Components
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";

// Icons
import { 
  Plus, 
  Pencil, 
  Trash2, 
  Search, 
  ChevronDown, 
  ChevronRight
} from "lucide-react";

// Layouts & Types
import AppLayout from "@/layouts/app-layout";
import { type BreadcrumbItem } from "@/types";

// Interfaces
interface Pemeriksaan {
  id: number;
  nama: string;
  id_jenis: number;
}

interface Jenis {
  id: number;
  nama: string;
  pemeriksaans: Pemeriksaan[];
}

interface PageProps {
  jenises: Jenis[];
  flash?: {
    success?: string;
    error?: string;
  };
}

// Constants
const breadcrumbs: BreadcrumbItem[] = [
  { title: "Data Master", href: "" },
  { title: "Medis", href: "" },
  { title: "Radiologi", href: "" },
];

export default function Index() {
  const { jenises, flash } = usePage().props as unknown as PageProps;

  // State Management
  const [search, setSearch] = useState("");
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());

  // Modal State - Jenis
  const [open, setOpen] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [namaJenis, setNamaJenis] = useState("");

  // Modal State - Pemeriksaan
  const [pemeriksaanOpen, setPemeriksaanOpen] = useState(false);
  const [pemeriksaanEditId, setPemeriksaanEditId] = useState<number | null>(null);
  const [namaPemeriksaan, setNamaPemeriksaan] = useState("");
  const [selectedJenisId, setSelectedJenisId] = useState<number | null>(null);

  // Modal State - Delete
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleteNama, setDeleteNama] = useState("");
  const [deleteType, setDeleteType] = useState<"jenis" | "pemeriksaan">("jenis");

  // Computed Values
  const filteredJenises = jenises.filter((jenis) =>
    jenis.nama.toLowerCase().includes(search.toLowerCase())
  );

  // Effects
  useEffect(() => {
    if (flash?.success) {
      toast.success(flash.success);
    }
    if (flash?.error) {
      toast.error(flash.error);
    }
  }, [flash]);

  // Event Handlers - Jenis
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (editId) {
      router.put(
        `/datamaster/medis/radiologi-jenis/${editId}`,
        { nama: namaJenis },
        {
          preserveScroll: true,
          onSuccess: () => {
            setOpen(false);
            setNamaJenis("");
            setEditId(null);
          },
        }
      );
    } else {
      router.post(
        "/datamaster/medis/radiologi-jenis",
        { nama: namaJenis },
        {
          preserveScroll: true,
          onSuccess: () => {
            setOpen(false);
            setNamaJenis("");
            setEditId(null);
          },
        }
      );
    }
  };

  const handleOpenEdit = (jenis: Jenis) => {
    setEditId(jenis.id);
    setNamaJenis(jenis.nama);
    setOpen(true);
  };

  // Event Handlers - Pemeriksaan
  const handlePemeriksaanSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedJenisId) {
      toast.error("Pilih jenis terlebih dahulu");
      return;
    }

    if (pemeriksaanEditId) {
      router.put(
        `/datamaster/medis/radiologi-pemeriksaan/${pemeriksaanEditId}`,
        {
          nama: namaPemeriksaan,
          id_jenis: selectedJenisId
        },
        {
          preserveScroll: true,
          onSuccess: () => {
            setPemeriksaanOpen(false);
            setNamaPemeriksaan("");
            setPemeriksaanEditId(null);
            setSelectedJenisId(null);
          },
        }
      );
    } else {
      router.post(
        "/datamaster/medis/radiologi-pemeriksaan",
        {
          nama: namaPemeriksaan,
          id_jenis: selectedJenisId
        },
        {
          preserveScroll: true,
          onSuccess: () => {
            setPemeriksaanOpen(false);
            setNamaPemeriksaan("");
            setPemeriksaanEditId(null);
            setSelectedJenisId(null);
          },
        }
      );
    }
  };

  const handleOpenPemeriksaanEdit = (pemeriksaan: Pemeriksaan) => {
    setPemeriksaanEditId(pemeriksaan.id);
    setNamaPemeriksaan(pemeriksaan.nama);
    setSelectedJenisId(pemeriksaan.id_jenis);
    setPemeriksaanOpen(true);
  };

  // Event Handlers - Delete
  const handleOpenDelete = (item: Jenis | Pemeriksaan, type: "jenis" | "pemeriksaan") => {
    setDeleteId(item.id);
    setDeleteType(type);
    if (type === "jenis") {
      setDeleteNama((item as Jenis).nama);
    } else {
      setDeleteNama((item as Pemeriksaan).nama);
    }
    setDeleteOpen(true);
  };

  const handleDelete = () => {
    if (!deleteId) return;

    if (deleteType === "jenis") {
      router.delete(`/datamaster/medis/radiologi-jenis/${deleteId}`, { preserveScroll: true });
    } else {
      router.delete(`/datamaster/medis/radiologi-pemeriksaan/${deleteId}`, { preserveScroll: true });
    }

    setDeleteOpen(false);
    setDeleteId(null);
  };

  // Event Handlers - UI
  const toggleExpanded = (jenisId: number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(jenisId)) {
      newExpanded.delete(jenisId);
    } else {
      newExpanded.add(jenisId);
    }
    setExpandedRows(newExpanded);
  };

  return (
    <AppLayout breadcrumbs={breadcrumbs}>
      <Head title="Radiologi Jenis dan Pemeriksaan" />
      
      <div className="p-6">
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <CardTitle className="text-xl">Radiologi Jenis dan Pemeriksaan</CardTitle>
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <div className="relative">
                  <Search className="absolute top-1/2 left-3 h-4 w-4 text-muted-foreground transform -translate-y-1/2" />
                  <Input
                    placeholder="Cari jenis..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full sm:w-64 pl-10 pr-4"
                  />
                </div>
                <Button
                  onClick={() => {
                    setEditId(null);
                    setNamaJenis("");
                    setOpen(true);
                  }}
                  className="w-full sm:w-auto"
                >
                  <Plus className="mr-2 h-4 w-4" /> Tambah Jenis
                </Button>
              </div>
            </div>
          </CardHeader>

          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="px-6 py-4">#</TableHead>
                    <TableHead className="px-6 py-4">Nama Jenis</TableHead>
                    <TableHead className="px-6 py-4 text-center">Action</TableHead>
                  </TableRow>
                </TableHeader>
                
                <TableBody>
                  {filteredJenises.length > 0 ? (
                    filteredJenises.map((jenis, index) => (
                      <>
                        {/* Baris Jenis Utama */}
                        <TableRow key={jenis.id} className="hover:bg-muted/50">
                          <TableCell className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => toggleExpanded(jenis.id)}
                                className="p-0 h-auto hover:bg-transparent"
                              >
                                {expandedRows.has(jenis.id) ? (
                                  <ChevronDown className="w-4 h-4" />
                                ) : (
                                  <ChevronRight className="w-4 h-4" />
                                )}
                              </Button>
                              {index + 1}
                            </div>
                          </TableCell>
                          
                          <TableCell className="px-6 py-4 font-medium">
                            {jenis.nama}
                          </TableCell>
                          
                          <TableCell className="px-6 py-4">
                            <div className="flex justify-center space-x-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleOpenEdit(jenis)}
                                className="bg-yellow-500 text-white border-yellow-500 hover:bg-yellow-600"
                              >
                                <Pencil className="h-4 w-4" />
                              </Button>
                              
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => {
                                  setSelectedJenisId(jenis.id);
                                  setNamaPemeriksaan("");
                                  setPemeriksaanEditId(null);
                                  setPemeriksaanOpen(true);
                                }}
                              >
                                <Plus className="h-4 w-4" />
                              </Button>
                              
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleOpenDelete(jenis, "jenis")}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>

                        {/* Baris Pemeriksaan */}
                        {expandedRows.has(jenis.id) && jenis.pemeriksaans && jenis.pemeriksaans.length > 0 && (
                          jenis.pemeriksaans.map((pemeriksaan, pemeriksaanIndex) => (
                            <TableRow key={`pemeriksaan-${pemeriksaan.id}`} className="hover:bg-muted/20">
                              <TableCell className="px-6 py-4">
                                <div className="flex items-center gap-2 pl-8">
                                  {pemeriksaanIndex + 1}
                                </div>
                              </TableCell>
                              
                              <TableCell className="px-6 py-4 text-muted-foreground">
                                {pemeriksaan.nama}
                              </TableCell>
                              
                              <TableCell className="px-6 py-4">
                                <div className="flex justify-center space-x-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => handleOpenPemeriksaanEdit(pemeriksaan)}
                                    className="bg-yellow-500 text-white border-yellow-500 hover:bg-yellow-600"
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  
                                  <Button
                                    size="sm"
                                    variant="destructive"
                                    onClick={() => handleOpenDelete(pemeriksaan, "pemeriksaan")}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                        )}

                        {/* Empty state untuk pemeriksaan */}
                        {expandedRows.has(jenis.id) && (!jenis.pemeriksaans || jenis.pemeriksaans.length === 0) && (
                          <TableRow key={`empty-${jenis.id}`}>
                            <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                              Belum ada pemeriksaan
                            </TableCell>
                          </TableRow>
                        )}
                      </>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-8 text-muted-foreground">
                        Tidak ada data.
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Modal Tambah/Edit Jenis */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="pb-4">
            <DialogTitle className="text-lg">
              {editId ? "Edit Jenis Radiologi" : "Tambah Jenis Radiologi"}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-3">
              <label className="text-sm font-medium">Nama Jenis</label>
              <Input
                placeholder="Masukkan nama jenis"
                value={namaJenis}
                onChange={(e) => setNamaJenis(e.target.value)}
                className="w-full"
                required
              />
            </div>
            
            <DialogFooter className="flex justify-end space-x-3 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setOpen(false)}
              >
                Batal
              </Button>
              <Button 
                type="submit"
                className="min-w-[100px]"
              >
                {editId ? "Update" : "Simpan"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Tambah/Edit Pemeriksaan */}
      <Dialog open={pemeriksaanOpen} onOpenChange={setPemeriksaanOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="pb-4">
            <DialogTitle className="text-lg">
              {pemeriksaanEditId ? "Edit Pemeriksaan" : "Tambah Pemeriksaan"}
            </DialogTitle>
          </DialogHeader>
          
          <form onSubmit={handlePemeriksaanSubmit} className="space-y-4">
            <div className="space-y-3">
              <label className="text-sm font-medium">Jenis Radiologi</label>
              <Select
                value={selectedJenisId?.toString() || ""}
                onValueChange={(value) => setSelectedJenisId(parseInt(value))}
                disabled={!!pemeriksaanEditId}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Pilih Jenis" />
                </SelectTrigger>
                <SelectContent>
                  {jenises.map((jenis) => (
                    <SelectItem 
                      key={jenis.id} 
                      value={jenis.id.toString()}
                    >
                      {jenis.nama}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-3">
              <label className="text-sm font-medium">Nama Pemeriksaan</label>
              <Input
                placeholder="Masukkan nama pemeriksaan"
                value={namaPemeriksaan}
                onChange={(e) => setNamaPemeriksaan(e.target.value)}
                className="w-full"
                required
              />
            </div>
            
            <DialogFooter className="flex justify-end space-x-3 pt-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setPemeriksaanOpen(false)}
              >
                Batal
              </Button>
              <Button 
                type="submit"
                className="min-w-[100px]"
              >
                {pemeriksaanEditId ? "Update" : "Simpan"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Modal Konfirmasi Hapus */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader className="pb-4">
            <DialogTitle className="text-lg">Konfirmasi Hapus</DialogTitle>
          </DialogHeader>
          
          <div className="py-4">
            <p className="text-muted-foreground">
              Apakah Anda yakin ingin menghapus {deleteType === "jenis" ? "Jenis" : "Pemeriksaan"}{" "}
              <span className="font-medium">{deleteNama}</span>?
            </p>
            {deleteType === "jenis" && (
              <p className="text-sm text-muted-foreground mt-2">
                Semua pemeriksaan terkait juga akan dihapus.
              </p>
            )}
          </div>
          
          <DialogFooter className="flex justify-end space-x-3 pt-4">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => setDeleteOpen(false)}
            >
              Batal
            </Button>
            <Button 
              type="button" 
              variant="destructive" 
              onClick={handleDelete}
              className="min-w-[100px]"
            >
              Hapus
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AppLayout>
  );
}
