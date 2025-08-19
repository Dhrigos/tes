"use client";

import { useState, useEffect, useRef } from "react";
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

import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import ThemeToggle from "@/components/ThemeToggle";

export default function Pendaftaran() {
  const [openModal, setOpenModal] = useState<"bpjs" | "non" | "baru" | null>(null);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [selectedTime, setSelectedTime] = useState<string>("");
  const [selectedPoli, setSelectedPoli] = useState<string | undefined>();
  const [selectedDokter, setSelectedDokter] = useState<string | undefined>();

  const nameRef = useRef<HTMLInputElement>(null);

  const poliOptions = ["Poli Umum", "Poli Gigi", "Poli Anak"];
  const dokterOptions = ["Dr. Siti", "Dr. Joko", "Dr. Andi"];

  const cards = [
    { id: "bpjs", title: "Daftar Antrian BPJS", color: "green", description: "Daftar antrian pasien BPJS" },
    { id: "non", title: "Daftar Antrian Non-BPJS", color: "blue", description: "Daftar antrian pasien Non-BPJS" },
    { id: "baru", title: "Daftar Sebagai Pasien Baru", color: "cyan", description: "Daftar pasien baru di rumah sakit" },
  ];

  // Fokus otomatis pada input Nama saat modal BPJS dibuka
  useEffect(() => {
    if (openModal === "bpjs") {
      setTimeout(() => {
        nameRef.current?.focus();
      }, 100);
    }
  }, [openModal]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="flex justify-end mb-4">
        <ThemeToggle />
      </div>

      <div className="mx-auto max-w-6xl">
        <h1 className="text-3xl font-bold text-gray-800 dark:text-gray-100 mb-6">
          Pendaftaran Antrian
        </h1>

        {/* Grid Cards */}
        <div className="grid grid-cols-12 gap-6">
          {cards.map((card, idx) => (
            <div
              key={card.id}
              className={`col-span-12 md:col-span-${idx < 2 ? 6 : 12} rounded-2xl border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800 p-6 text-center shadow-md hover:scale-105 hover:shadow-xl transition-transform`}
            >
              <h2 className={`mb-4 text-lg font-semibold ${
                card.color === "green" ? "text-green-600 dark:text-green-400" :
                card.color === "blue" ? "text-blue-600 dark:text-blue-400" :
                "text-cyan-600 dark:text-cyan-400"
              }`}>
                {card.title}
              </h2>
              <p className="mb-4 text-gray-600 dark:text-gray-300">{card.description}</p>
              <Button
                onClick={() => setOpenModal(card.id as "bpjs" | "non" | "baru")}
                className={
                  card.color === "green" ? "w-full bg-green-500 hover:bg-green-600" :
                  card.color === "blue" ? "w-full bg-blue-500 hover:bg-blue-600" :
                  "w-full bg-cyan-500 hover:bg-cyan-600"
                }
              >
                Buka Form
              </Button>
            </div>
          ))}
        </div>

        {/* Modal */}
        {openModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <Dialog open={!!openModal} onOpenChange={() => setOpenModal(null)}>
              <DialogContent className="sm:max-w-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100">
                <DialogHeader>
                  <DialogTitle>
                    {openModal === "bpjs"
                      ? "Form Daftar BPJS"
                      : openModal === "non"
                      ? "Form Daftar Non-BPJS"
                      : "Form Pasien Baru"}
                  </DialogTitle>
                </DialogHeader>

                {/* Form BPJS */}
                {openModal === "bpjs" && (
                  <form className="space-y-4 mt-4">
                    <Input ref={nameRef} placeholder="Nama" className="dark:bg-gray-700 dark:text-gray-100" />
                    <Input placeholder="NIK / No. BPJS" type="text" inputMode="numeric" pattern="[0-9]*" className="dark:bg-gray-700 dark:border-gray-600 dark:text-gray-100" />

                    {/* Date & Time langsung muncul */}
                    <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-4">
                        {/* Date Picker tetap pakai Popover */}
                        <Popover>
                            <PopoverTrigger asChild>
                            <Button variant="outline" className="w-full justify-start text-left px-4 py-2">
                                {selectedDate ? format(selectedDate, "PPP") : "Pilih Tanggal"}
                            </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-full p-2 bg-white dark:bg-gray-800 rounded-md">
                            <Calendar
                                mode="single"
                                selected={selectedDate}
                                onSelect={setSelectedDate}
                                className="w-full rounded-md p-2
                                        bg-white dark:bg-gray-700
                                        text-gray-900 dark:text-gray-100
                                        border border-gray-300 dark:border-gray-600"
                            />
                            </PopoverContent>

                        </Popover>

                        {/* Time Picker langsung tampil */}
                        <div>
                            <input
                            type="time"
                            value={selectedTime}
                            onChange={(e) => setSelectedTime(e.target.value)}
                            className="w-full text-center rounded-md border border-gray-300 dark:border-gray-600 px-2 py-1 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                            />
                        </div>
                        </div>


                    {/* Poli & Dokter */}
                    <Select value={selectedPoli} onValueChange={setSelectedPoli}>
                      <SelectTrigger className="dark:bg-gray-700 dark:text-gray-100">
                        <SelectValue placeholder="Pilih Poli" />
                      </SelectTrigger>
                      <SelectContent className="dark:bg-gray-700 dark:text-gray-100">
                        {poliOptions.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                      </SelectContent>
                    </Select>

                    <Select value={selectedDokter} onValueChange={setSelectedDokter}>
                      <SelectTrigger className="dark:bg-gray-700 dark:text-gray-100">
                        <SelectValue placeholder="Pilih Dokter" />
                      </SelectTrigger>
                      <SelectContent className="dark:bg-gray-700 dark:text-gray-100">
                        {dokterOptions.map((d) => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                      </SelectContent>
                    </Select>

                    <div className="flex justify-end gap-2 mt-2">
                      <Button variant="outline" onClick={() => setOpenModal(null)}>Batal</Button>
                      <Button type="submit" className="bg-green-500 hover:bg-green-600">Daftar</Button>
                    </div>
                  </form>
                )}

                {/* Form Non-BPJS */}
                {openModal === "non" && (
                  <form className="space-y-4 mt-4">
                    <Input placeholder="Nama" className="dark:bg-gray-700 dark:text-gray-100" />
                    <Input placeholder="Alamat" className="dark:bg-gray-700 dark:text-gray-100" />
                    <Input type="tel" placeholder="Telepon" className="dark:bg-gray-700 dark:text-gray-100" />
                    <div className="flex justify-end gap-2 mt-2">
                      <Button variant="outline" onClick={() => setOpenModal(null)}>Batal</Button>
                      <Button type="submit" className="bg-blue-500 hover:bg-blue-600">Daftar</Button>
                    </div>
                  </form>
                )}

                {/* Form Pasien Baru */}
                {openModal === "baru" && (
                  <form className="space-y-4 mt-4">
                    <Input placeholder="Nama" className="dark:bg-gray-700 dark:text-gray-100" />
                    <Input placeholder="Alamat" className="dark:bg-gray-700 dark:text-gray-100" />
                    <Input type="tel" placeholder="No. HP" className="dark:bg-gray-700 dark:text-gray-100" />
                    <Input type="date" className="dark:bg-gray-700 dark:text-gray-100" />
                    <div className="flex justify-end gap-2 mt-2">
                      <Button variant="outline" onClick={() => setOpenModal(null)}>Batal</Button>
                      <Button type="submit" className="bg-cyan-500 hover:bg-cyan-600">Daftar</Button>
                    </div>
                  </form>
                )}
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>
    </div>
  );
}
