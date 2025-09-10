import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Textarea } from '@/components/ui/textarea';
import AppLayout from '@/layouts/app-layout';
import { type BreadcrumbItem } from '@/types';
import { Head, usePage } from '@inertiajs/react';
import { useState } from 'react';

interface PatientData {
    nomor_rm: string;
    nama: string;
    nomor_register: string;
    jenis_kelamin: string;
    penjamin: string;
    tanggal_lahir: string;
    umur: string;
}

interface UploadedFile {
    id: string;
    file: File;
    description: string;
    uploadDate: Date;
}

interface PageProps {
    pelayanan: PatientData;
    norawat: string;
}

const breadcrumbs: BreadcrumbItem[] = [
    { title: 'Pelayanan', href: '/pelayanan/so-dokter' },
    { title: 'SOAP Dokter', href: '/pelayanan/so-dokter' },
    { title: 'Konfirmasi', href: '' },
];

export default function KonfirmasiSoapDokter() {
    const { pelayanan } = usePage().props as unknown as PageProps;
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [description, setDescription] = useState('');
    const [uploadedFiles, setUploadedFiles] = useState<UploadedFile[]>([]);
    const [previewFile, setPreviewFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string>('');

    const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (file) {
            setSelectedFile(file);
        }
    };

    const handleAddFile = () => {
        if (selectedFile && description) {
            const newFile: UploadedFile = {
                id: Date.now().toString(),
                file: selectedFile,
                description,
                uploadDate: new Date(),
            };
            setUploadedFiles([...uploadedFiles, newFile]);
            setSelectedFile(null);
            setDescription('');
            // Reset file input
            const fileInput = document.getElementById('file-upload') as HTMLInputElement;
            if (fileInput) fileInput.value = '';
        }
    };

    const handleRemoveFile = (id: string) => {
        setUploadedFiles(uploadedFiles.filter((file) => file.id !== id));
    };

    const handlePreviewFile = (file: File) => {
        setPreviewFile(file);
        const url = URL.createObjectURL(file);
        setPreviewUrl(url);
    };

    const closePreview = () => {
        if (previewUrl) {
            URL.revokeObjectURL(previewUrl);
        }
        setPreviewFile(null);
        setPreviewUrl('');
    };

    return (
        <AppLayout breadcrumbs={breadcrumbs}>
            <Head title="Konfirmasi Permintaan" />
            <div className="space-y-6 p-6">
                <Card>
                    <CardHeader>
                        <CardTitle>Konfirmasi Permintaan</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="mb-4 grid grid-cols-1 gap-3 md:grid-cols-3">
                            <div>
                                <Label>No. RM</Label>
                                <Input value={pelayanan.nomor_rm || ''} readOnly />
                            </div>
                            <div>
                                <Label>Nama Pasien</Label>
                                <Input value={pelayanan.nama || ''} readOnly />
                            </div>
                            <div>
                                <Label>No. Registrasi</Label>
                                <Input value={pelayanan.nomor_register || ''} readOnly />
                            </div>
                        </div>

                        <div className="w-full">
                            <div className="mt-4 space-y-4">
                                <div className="grid grid-cols-1 items-center gap-3 md:grid-cols-12">
                                    <div className="md:col-span-2">
                                        <Label>Upload File</Label>
                                    </div>
                                    <div className="md:col-span-8">
                                        <Input id="file-upload" type="file" onChange={handleFileChange} accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" />
                                    </div>
                                </div>

                                <div className="grid grid-cols-1 items-center gap-3 md:grid-cols-12">
                                    <div className="md:col-span-2">
                                        <Label>Keterangan</Label>
                                    </div>
                                    <div className="md:col-span-8">
                                        <Textarea
                                            value={description}
                                            onChange={(e) => setDescription(e.target.value)}
                                            placeholder="Masukkan keterangan file..."
                                            rows={3}
                                        />
                                    </div>
                                    <div className="md:col-span-2">
                                        <Button type="button" className="w-full" onClick={handleAddFile} disabled={!selectedFile || !description}>
                                            Tambah
                                        </Button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                <Card className="flex h-96 flex-col">
                    <CardHeader className="flex-shrink-0">
                        <CardTitle>Daftar File yang Diupload</CardTitle>
                    </CardHeader>
                    <CardContent className="flex flex-1 flex-col overflow-hidden">
                        <div className="flex-1 overflow-auto">
                            <Table>
                                <TableHeader className="sticky top-0 z-20">
                                    <TableRow>
                                        <TableHead>No</TableHead>
                                        <TableHead>Nama File</TableHead>
                                        <TableHead>Keterangan</TableHead>
                                        <TableHead>Tanggal Upload</TableHead>
                                        <TableHead>Ukuran File</TableHead>
                                        <TableHead>Aksi</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {uploadedFiles.length > 0 ? (
                                        uploadedFiles.map((file, index) => (
                                            <TableRow key={file.id}>
                                                <TableCell>{index + 1}</TableCell>
                                                <TableCell className="font-medium">{file.file.name}</TableCell>
                                                <TableCell>{file.description}</TableCell>
                                                <TableCell>
                                                    {file.uploadDate.toLocaleDateString('id-ID', {
                                                        day: '2-digit',
                                                        month: '2-digit',
                                                        year: 'numeric',
                                                        hour: '2-digit',
                                                        minute: '2-digit',
                                                    })}
                                                </TableCell>
                                                <TableCell>{(file.file.size / 1024).toFixed(2)} KB</TableCell>
                                                <TableCell>
                                                    <div className="flex gap-2">
                                                        <Button variant="outline" size="sm" onClick={() => handlePreviewFile(file.file)}>
                                                            Preview
                                                        </Button>
                                                        <Button variant="destructive" size="sm" onClick={() => handleRemoveFile(file.id)}>
                                                            Hapus
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))
                                    ) : (
                                        <TableRow>
                                            <TableCell colSpan={6} className="py-8 text-center text-muted-foreground">
                                                Tidak ada data
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        <div className="mt-4 flex flex-shrink-0 justify-end">
                            <Button type="button" className="px-8">
                                Save
                            </Button>
                        </div>
                    </CardContent>
                </Card>

                {/* File Preview Modal */}
                <Dialog open={!!previewFile} onOpenChange={closePreview}>
                    <DialogContent className="max-h-[80vh] max-w-4xl overflow-auto">
                        <DialogHeader>
                            <DialogTitle>Preview File: {previewFile?.name}</DialogTitle>
                        </DialogHeader>
                        <div className="mt-4">
                            {previewFile && (
                                <div className="w-full">
                                    {previewFile.type.startsWith('image/') ? (
                                        <img src={previewUrl} alt={previewFile.name} className="h-auto max-w-full rounded-lg" />
                                    ) : previewFile.type === 'application/pdf' ? (
                                        <iframe src={previewUrl} className="h-96 w-full rounded-lg border" title={previewFile.name} />
                                    ) : (
                                        <div className="flex h-64 flex-col items-center justify-center rounded-lg bg-gray-100">
                                            <div className="text-center text-gray-500">
                                                <p className="text-lg font-medium">File tidak dapat di-preview</p>
                                                <p className="text-sm">Tipe file: {previewFile.type}</p>
                                                <p className="text-sm">Ukuran: {(previewFile.size / 1024).toFixed(2)} KB</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </DialogContent>
                </Dialog>
            </div>
        </AppLayout>
    );
}
