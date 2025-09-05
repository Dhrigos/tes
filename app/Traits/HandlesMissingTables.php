<?php

namespace App\Traits;

use Illuminate\Support\Facades\Schema;
use Illuminate\Database\Query\Exception as QueryException;
use Illuminate\Support\Facades\Log;

trait HandlesMissingTables
{
    /**
     * Periksa apakah tabel ada dan jalankan callback, atau kembalikan nilai default
     *
     * @param string $table
     * @param callable $callback
     * @param mixed $default
     * @return mixed
     */
    protected function withTableCheck($table, $callback, $default = null)
    {
        try {
            if (Schema::hasTable($table)) {
                return $callback();
            }
            return $default;
        } catch (QueryException $e) {
            // Catat error tetapi jangan gagal
            Log::warning('Pemeriksaan tabel gagal untuk ' . $table . ': ' . $e->getMessage());
            return $default;
        } catch (\Exception $e) {
            // Catat error lainnya tetapi jangan gagal
            Log::warning('Error tidak terduga saat memeriksa tabel ' . $table . ': ' . $e->getMessage());
            return $default;
        }
    }

    /**
     * Jalankan query hanya jika tabel ada
     *
     * @param string $table
     * @param callable $queryCallback
     * @return mixed
     */
    protected function whenTableExists($table, $queryCallback)
    {
        return $this->withTableCheck($table, $queryCallback, collect());
    }
}
