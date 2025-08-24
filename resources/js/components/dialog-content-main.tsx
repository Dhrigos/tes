"use client"

import { useState } from "react"
import React from "react"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table"

import { Input } from "@/components/ui/input"

// ----------------- Config Satu Sehat -----------------
function ConfigSatuSehat() {
  return (
    <form className="grid grid-cols-2 gap-4 p-4">
      <div>
        <label className="block text-sm font-medium">Client ID</label>
        <input type="text" className="w-full rounded border p-2" placeholder="Masukkan Client ID" />
      </div>
      <div>
        <label className="block text-sm font-medium">Organization ID</label>
        <input type="text" className="w-full rounded border p-2" placeholder="Masukkan Org ID" />
      </div>
      <div>
        <label className="block text-sm font-medium">Client Secret</label>
        <input type="password" className="w-full rounded border p-2" placeholder="••••••••" />
      </div>
      <div>
        <label className="block text-sm font-medium">API Key</label>
        <input type="password" className="w-full rounded border p-2" placeholder="••••••••" />
      </div>
    </form>
  )
}

// ----------------- Config BPJS -----------------
function ConfigBPJS() {
  return (
    <form className="grid grid-cols-2 gap-4 p-4">
      <div>
        <label className="block text-sm font-medium">Cons ID</label>
        <input type="text" className="w-full rounded border p-2" />
      </div>
      <div>
        <label className="block text-sm font-medium">Secret Key</label>
        <input type="password" className="w-full rounded border p-2" />
      </div>
      <div>
        <label className="block text-sm font-medium">Username</label>
        <input type="text" className="w-full rounded border p-2" />
      </div>
      <div>
        <label className="block text-sm font-medium">Password</label>
        <input type="password" className="w-full rounded border p-2" />
      </div>
      <div>
        <label className="block text-sm font-medium">Kode Apotek</label>
        <input type="text" className="w-full rounded border p-2" />
      </div>
      <div>
        <label className="block text-sm font-medium">App Code</label>
        <input type="text" className="w-full rounded border p-2" />
      </div>
      <div>
        <label className="block text-sm font-medium">App Key</label>
        <input type="password" className="w-full rounded border p-2" />
      </div>
      <div>
        <label className="block text-sm font-medium">URL Base</label>
        <input type="text" className="w-full rounded border p-2" />
      </div>
      <div>
        <label className="block text-sm font-medium">URL Token</label>
        <input type="text" className="w-full rounded border p-2" />
      </div>
      <div>
        <label className="block text-sm font-medium">URL Service</label>
        <input type="text" className="w-full rounded border p-2" />
      </div>
    </form>
  )
}

// ----------------- Config Gudang -----------------
function ConfigGudang() {
  const [enabled, setEnabled] = React.useState(true)

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center justify-between">
        <span className="font-medium">Aktifkan Fitur Gudang</span>
        <Switch checked={enabled} onCheckedChange={setEnabled} />
      </div>
      {!enabled && (
        <Button variant="destructive" onClick={() => alert("Gudang dimatikan!")}>
          Konfirmasi Nonaktifkan
        </Button>
      )}
    </div>
  )
}

// ----------------- Payment -----------------
function Payment() {
  const [banks, setBanks] = useState<{ id: number; bank: string; norek: string }[]>([])
  const [bank, setBank] = useState("")
  const [norek, setNorek] = useState("")

  const handleAdd = () => {
    if (!bank || !norek) return
    const newBank = {
      id: Date.now(),
      bank,
      norek,
    }
    setBanks([...banks, newBank])
    setBank("")
    setNorek("")
  }

  const handleDelete = (id: number) => {
    setBanks(banks.filter((b) => b.id !== id))
  }

  return (
    <div className="pt-4">
        <Card className="p-4">
      <CardContent className="space-y-4 pt-4">
        {/* Form tambah data */}
        <div className="flex gap-2 mb-4">
          <Input
            placeholder="Nama Bank"
            value={bank}
            onChange={(e) => setBank(e.target.value)}
          />
          <Input
            placeholder="No. Rekening"
            value={norek}
            onChange={(e) => setNorek(e.target.value)}
          />
          <Button onClick={handleAdd}>Tambah</Button>
        </div>

        {/* Tabel data */}
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Bank</TableHead>
              <TableHead>No. Rekening</TableHead>
              <TableHead>Aksi</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {banks.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center text-muted-foreground">
                  Belum ada data
                </TableCell>
              </TableRow>
            ) : (
              banks.map((b) => (
                <TableRow key={b.id}>
                  <TableCell>{b.bank}</TableCell>
                  <TableCell>{b.norek}</TableCell>
                  <TableCell>
                    <Button size="sm" variant="destructive" onClick={() => handleDelete(b.id)}>
                      Hapus
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
    </div>
  )
}

// ----------------- Advanced -----------------
function Advanced() {
  const [logo, setLogo] = React.useState<File | null>(null)
  const [preview, setPreview] = React.useState<string | null>(null)

  const fileInputRef = React.useRef<HTMLInputElement>(null)

  const handleLogoClick = () => {
    fileInputRef.current?.click()
  }

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null
    setLogo(file)
    if (file) {
      const reader = new FileReader()
      reader.onloadend = () => setPreview(reader.result as string)
      reader.readAsDataURL(file)
    } else {
      setPreview(null)
    }
  }

  return (
    <form className="grid grid-cols-2 gap-4 p-4">
      <div className="flex flex-col items-center justify-center col-span-2">
        <label className="block text-sm font-medium mb-2">Logo Klinik</label>
        <div
  className="w-48 h-48 flex items-center justify-center rounded-full cursor-pointer bg-gray-100 hover:bg-gray-200 mb-2"
  onClick={handleLogoClick}
  style={{ border: "none" }}
>
  {preview ? (
    <img
      src={preview}
      alt="Preview Logo Klinik"
      className="w-44 h-44 object-cover rounded-full"
    />
  ) : (
    <img
      src="/icon/default.webp"
      alt="Default Logo Klinik"
      className="w-32 h-32 object-cover rounded-full opacity-60"
    />
  )}
</div>
        <input
            type="file"
            accept="image/*"
            className="hidden"
            ref={fileInputRef}
            onChange={handleLogoChange}
        />
    </div>
      <div>
        <label className="block text-sm font-medium">Nama Klinik</label>
        <input type="text" className="w-full rounded border p-2" placeholder="Masukkan Nama Klinik" />
      </div>
      <div>
        <label className="block text-sm font-medium">Kode Aplikasi Klinik</label>
        <input type="text" className="w-full rounded border p-2" placeholder="Masukkan Kode Aplikasi" />
      </div>
      <div className="col-span-2">
        <label className="block text-sm font-medium">Alamat Klinik</label>
        <textarea
            className="w-full rounded border p-2 min-h-[80px] resize-y"
            placeholder="Masukkan Alamat Klinik"
        />
    </div>
    </form>
  )
}
export { ConfigSatuSehat, ConfigBPJS, ConfigGudang, Payment, Advanced }
