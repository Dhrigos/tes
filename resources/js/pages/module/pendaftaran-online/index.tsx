"use client";
import { usePage, router } from "@inertiajs/react";
import { useEffect ,useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { toast, Toaster } from "sonner";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import ThemeToggle from "@/components/ThemeToggle";

type Kelamin = { id: number; nama: string };
type Goldar = { id: number; nama: string; rhesus: string };
type Pernikahan = { id: number; nama: string };

type Props = {
  kelamin: Kelamin[];
  goldar: Goldar[];
  pernikahan: Pernikahan[];
  flash?: {
    success?: string;
    error?: string;
    nomor_antrian?: string | null;
  };
  errors?: {
    [key: string]: string;
  };
};

export default function Pendaftaran({ kelamin, goldar, pernikahan, flash }: Props) {
  const [openModal, setOpenModal] = useState<"bpjs" | "non" | "baru" | null>(null);
  const [baruStep, setBaruStep] = useState(1);

  const [nama, setNama] = useState("");
  const [nik, setNik] = useState("");
  const [tglLahir, setTglLahir] = useState("");
  const [kelaminValue, setKelaminValue] = useState<string>("");
  const [telepon, setTelepon] = useState("");
  const [alamat, setAlamat] = useState("");
  const [goldarValue, setGoldarValue] = useState<string>("");
  const [pernikahanValue, setPernikahanValue] = useState<string>("");
  const [foto, setFoto] = useState<File | null>(null);

  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedTime, setSelectedTime] = useState<string>("10:30");
  const [selectedPoli, setSelectedPoli] = useState<string | undefined>();
  const [selectedDokter, setSelectedDokter] = useState<string | undefined>();

  const [openPrintModal, setOpenPrintModal] = useState(false);
  const [hasilAntrian, setHasilAntrian] = useState<string | null>(null);

  const nameRef = useRef<HTMLInputElement>(null);

  const poliOptions = ["Poli Umum", "Poli Gigi", "Poli Anak"];
  const dokterOptions = ["Dr. Siti", "Dr. Joko", "Dr. Andi"];

  const cards = [
    { id: "bpjs", title: "Daftar Antrian BPJS", color: "green", description: "Daftar antrian pasien BPJS" },
    { id: "non", title: "Daftar Antrian Non-BPJS", color: "blue", description: "Daftar antrian pasien Non-BPJS" },
    { id: "baru", title: "Daftar Sebagai Pasien Baru", color: "cyan", description: "Daftar pasien baru di rumah sakit" },
  ];

  const { errors } = usePage<Props>().props;
    useEffect(() => {
    if (flash?.success) toast.success(flash.success);
    if (flash?.error) toast.error(flash.error);
    if (errors && Object.values(errors).length > 0) {
        Object.values(errors).forEach((err) => toast.error(err));
    }
    }, [flash, errors]);


  const handleSubmitBPJS = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Pendaftaran BPJS berhasil (simulasi).");
    setOpenModal(null);
  };

  const handleSubmitNonBPJS = (e: React.FormEvent) => {
    e.preventDefault();
    toast.success("Pendaftaran Non-BPJS berhasil (simulasi).");
    setOpenModal(null);
  };

  const handleSubmitPasienBaru = (e: React.FormEvent) => {
    e.preventDefault();

    const formData = new FormData();
    formData.append("nama", nama);
    formData.append("nik", nik);
    formData.append("tgl_lahir", tglLahir);
    formData.append("kelamin", kelaminValue);
    formData.append("telepon", telepon);
    formData.append("alamat", alamat);
    formData.append("goldar", goldarValue);
    formData.append("pernikahan", pernikahanValue);
    if (foto) formData.append("foto", foto);

    router.post(route("pendaftaran-online.add"), formData, {
      onSuccess: (page) => {
        const flashData = page.props.flash as { nomor_antrian?: string | null } | undefined;
        const antrian = flashData?.nomor_antrian ?? null;

        if (antrian) {
          setHasilAntrian(antrian);
          setOpenModal(null);
          setOpenPrintModal(true); // buka modal cetak
        }

        // Clear form
        setNama(""); setNik(""); setTglLahir(""); setKelaminValue("");
        setTelepon(""); setAlamat(""); setGoldarValue(""); setPernikahanValue("");
        setFoto(null); setBaruStep(1);
      },
      onError: (err) => {
        console.log("Error submit:", err);
      },
    });
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-900 p-6">
      <div className="flex justify-end mb-4"><ThemeToggle /></div>
      <div className="mx-auto max-w-6xl">
        {/* Cards */}
        <div className="grid grid-cols-12 gap-6 justify-center">
          {cards.map((card, idx) => (
            <div key={card.id} className={`${idx < 2 ? "col-span-12 md:col-span-6" : "col-span-12 md:col-span-6 md:col-start-4"} rounded-2xl border bg-white dark:bg-gray-800 p-6 text-center shadow-md hover:scale-105 transition-transform`}>
              <h2 className={`mb-4 text-lg font-semibold ${card.color === "green" ? "text-green-600 dark:text-green-400" : card.color === "blue" ? "text-blue-600 dark:text-blue-400" : "text-cyan-600 dark:text-cyan-400"}`}>{card.title}</h2>
              <p className="mb-4 text-gray-600 dark:text-gray-300">{card.description}</p>
              <Button onClick={() => setOpenModal(card.id as any)} className={`w-full ${card.color === "green" ? "bg-green-500 hover:bg-green-600" : card.color === "blue" ? "bg-blue-500 hover:bg-blue-600" : "bg-cyan-500 hover:bg-cyan-600"}`}>Daftar</Button>
            </div>
          ))}
        </div>

        {/* Form Modals */}
        <Dialog open={!!openModal} onOpenChange={() => setOpenModal(null)}>
          <DialogContent className="sm:max-w-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
            <DialogHeader>
              <DialogTitle>
                {openModal === "bpjs" ? "Form Daftar BPJS" :
                 openModal === "non" ? "Form Daftar Non-BPJS" :
                 "Form Pasien Baru"}
              </DialogTitle>
            </DialogHeader>

            {/* === BPJS === */}
            {openModal === "bpjs" && (
              <form className="space-y-4 mt-4" onSubmit={handleSubmitBPJS}>
                <Input ref={nameRef} placeholder="Nama" />
                <Input placeholder="NIK / No. BPJS" type="text" inputMode="numeric" pattern="[0-9]*" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Popover>
                    <PopoverTrigger asChild><Button variant="outline" className="w-full justify-start text-left px-4 py-2">{selectedDate ? format(selectedDate, "PPP") : "Pilih Tanggal"}</Button></PopoverTrigger>
                    <PopoverContent className="w-full p-2"><Calendar mode="single" selected={selectedDate} onSelect={setSelectedDate} /></PopoverContent>
                  </Popover>
                  <input type="time" value={selectedTime} onChange={(e) => setSelectedTime(e.target.value)} step={60} className="w-full text-center rounded-md border px-2 py-1"/>
                </div>
                <Select value={selectedPoli} onValueChange={setSelectedPoli}><SelectTrigger><SelectValue placeholder="Pilih Poli"/></SelectTrigger><SelectContent>{poliOptions.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}</SelectContent></Select>
                <Select value={selectedDokter} onValueChange={setSelectedDokter}><SelectTrigger><SelectValue placeholder="Pilih Dokter"/></SelectTrigger><SelectContent>{dokterOptions.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}</SelectContent></Select>
                <div className="flex justify-end gap-2 mt-2"><Button variant="outline" onClick={() => setOpenModal(null)}>Batal</Button><Button type="submit" className="bg-green-500 hover:bg-green-600">Daftar</Button></div>
              </form>
            )}

            {/* === Non-BPJS === */}
            {openModal === "non" && (
              <form className="space-y-4 mt-4" onSubmit={handleSubmitNonBPJS}>
                <Input placeholder="Nama"/>
                <Input placeholder="Alamat"/>
                <Input type="tel" placeholder="Telepon"/>
                <div className="flex justify-end gap-2 mt-2"><Button variant="outline" onClick={() => setOpenModal(null)}>Batal</Button><Button type="submit" className="bg-blue-500 hover:bg-blue-600">Daftar</Button></div>
              </form>
            )}

            {/* === Pasien Baru === */}
            {openModal === "baru" && (
              <form className="space-y-4 mt-4" onSubmit={handleSubmitPasienBaru}>
                {/* Stepper */}
                <div className="flex items-center justify-center gap-2 mb-4">
                  {[1,2,3].map((s, idx) => (
                    <div key={s} className="flex items-center">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-base font-bold border-2 ${baruStep === s ? "bg-cyan-500 text-white border-cyan-500" : "bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600"}`}>{s}</div>
                      {idx < 2 && <div className="w-8 h-1 bg-gray-300 dark:bg-gray-600 mx-2 rounded"></div>}
                    </div>
                  ))}
                </div>

                {baruStep === 1 && (
                  <>
                    <Input placeholder="Nama" value={nama} onChange={(e) => setNama(e.target.value)}/>
                    <Input placeholder="NIK" value={nik} onChange={(e) => setNik(e.target.value)} type="text"/>
                    <Input type="date" placeholder="Tanggal Lahir" value={tglLahir} onChange={(e) => setTglLahir(e.target.value)}/>
                    <Select value={kelaminValue} onValueChange={setKelaminValue}><SelectTrigger><SelectValue placeholder="Pilih Kelamin"/></SelectTrigger><SelectContent>{kelamin.map(k => <SelectItem key={k.id} value={String(k.id)}>{k.nama}</SelectItem>)}</SelectContent></Select>
                    <div className="flex justify-end gap-2 mt-2"><Button variant="outline" onClick={() => setOpenModal(null)}>Batal</Button><Button type="button" className="bg-cyan-500 hover:bg-cyan-600" onClick={() => setBaruStep(2)}>Lanjut</Button></div>
                  </>
                )}

                {baruStep === 2 && (
                  <>
                    <Input placeholder="Nomor Telepon" type="tel" value={telepon} onChange={(e) => setTelepon(e.target.value)}/>
                    <Input placeholder="Alamat" value={alamat} onChange={(e) => setAlamat(e.target.value)}/>
                    <div className="flex justify-between gap-2 mt-2"><Button variant="outline" onClick={() => setBaruStep(1)}>Kembali</Button><Button type="button" className="bg-cyan-500 hover:bg-cyan-600" onClick={() => setBaruStep(3)}>Lanjut</Button></div>
                  </>
                )}

                {baruStep === 3 && (
                  <>
                    <Select value={goldarValue} onValueChange={setGoldarValue}><SelectTrigger><SelectValue placeholder="Pilih Golongan Darah"/></SelectTrigger><SelectContent>{goldar.map(g => <SelectItem key={g.id} value={String(g.id)}>{g.nama}{g.rhesus && g.rhesus !== "Tidak Ada" ? ` ${g.rhesus}` : ""}</SelectItem>)}</SelectContent></Select>
                    <Select value={pernikahanValue} onValueChange={setPernikahanValue}><SelectTrigger><SelectValue placeholder="Status Pernikahan"/></SelectTrigger><SelectContent>{pernikahan.map(p => <SelectItem key={p.id} value={String(p.id)}>{p.nama}</SelectItem>)}</SelectContent></Select>
                    <Input type="file" accept="image/*" capture="environment" onChange={(e) => setFoto(e.target.files?.[0] ?? null)}/>
                    <div className="flex justify-between gap-2 mt-2"><Button variant="outline" onClick={() => setBaruStep(2)}>Kembali</Button><Button type="submit" className="bg-cyan-500 hover:bg-cyan-600">Daftar</Button></div>
                  </>
                )}
              </form>
            )}
          </DialogContent>
        </Dialog>

        {/* === Modal Print Antrian (DIPISAH) === */}
        <Dialog open={openPrintModal} onOpenChange={setOpenPrintModal}>
          <DialogContent className=" sm:max-w-md bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 rounded-lg shadow-lg p-6">
            <DialogHeader>
              <DialogTitle className="text-lg font-semibold">Nomor Antrian Anda</DialogTitle>
            </DialogHeader>
            <div className="p-4 text-center">
              <p className="text-lg mb-2">Nomor Antrian:</p>
              <p className="text-3xl font-bold mb-4">{hasilAntrian}</p>
               <div className="flex justify-center gap-2">
                    {/* Cetak / Download PDF */}
                    <Button
                    className="bg-green-500 hover:bg-green-600"
                    onClick={() => {
                        import("jspdf").then(({ jsPDF }) => {
                            // Buat dokumen PDF ukuran 80mm x 100mm
                            const doc = new jsPDF({
                                orientation: "portrait",
                                unit: "mm",
                                format: [80, 100], // lebar 80mm, tinggi 100mm
                            });

                            // Judul
                            doc.setFontSize(12);
                            doc.text("KLINIK SEHAT SENTOSA", 40, 10, { align: "center" });

                            // Garis pemisah
                            doc.setLineWidth(0.5);
                            doc.line(5, 15, 75, 15);

                            // Label
                            doc.setFontSize(10);
                            doc.text("Nomor Antrian Anda", 40, 30, { align: "center" });

                            // Nomor antrian besar
                            doc.setFontSize(36);
                            doc.text(String(hasilAntrian), 40, 55, { align: "center" });

                            // Tanggal cetak
                            const now = new Date();
                            const tanggal = now.toLocaleDateString("id-ID");
                            const jam = now.toLocaleTimeString("id-ID");
                            doc.setFontSize(10);
                            doc.text(`Dicetak: ${tanggal} ${jam}`, 40, 85, { align: "center" });

                            // Simpan file
                            doc.save(`antrian-${hasilAntrian}.pdf`);
                            });

                    }}
                    >
                    Cetak
                    </Button>

                    <Button variant="outline" onClick={() => setOpenPrintModal(false)}>
                    Tutup
                    </Button>
                </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      <Toaster position="top-right" />
    </div>
  );
}
