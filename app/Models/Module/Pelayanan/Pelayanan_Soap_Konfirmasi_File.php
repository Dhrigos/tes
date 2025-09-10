<?php

namespace App\Models\Module\Pelayanan;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Storage;

class Pelayanan_Soap_Konfirmasi_File extends Model
{
    protected $table = 'pelayanan_soap_konfirmasi_files';

    public const STORAGE_DIR = 'konfirmasi_soap'; // disimpan di storage/app/public/konfirmasi_soap

    protected $fillable = [
        'konfirmasi_id',
        'original_name',
        'stored_path',
        'mime_type',
        'size_kb',
        'description',
    ];

    public function konfirmasi()
    {
        return $this->belongsTo(Pelayanan_Soap_Konfirmasi::class, 'konfirmasi_id');
    }

    /**
     * Simpan file upload ke storage/app/public/konfirmasi_soap dan
     * mengembalikan relative path (konfirmasi_soap/filename.ext).
     */
    public static function storeUploaded(UploadedFile $file, ?string $fileName = null): string
    {
        $targetName = $fileName ?: uniqid('konfirmasi_', true) . '.' . $file->getClientOriginalExtension();
        $stored = $file->storeAs('public/' . self::STORAGE_DIR, $targetName);
        return str_replace('public/', '', $stored); // simpan tanpa prefix 'public/' di kolom stored_path
    }

    /**
     * URL publik dari file yang tersimpan (butuh php artisan storage:link).
     */
    public function getUrlAttribute(): string
    {
        return Storage::url($this->stored_path);
    }
}


