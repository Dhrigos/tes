<?php

namespace App\Exports;

use Maatwebsite\Excel\Concerns\FromArray;
use Maatwebsite\Excel\Concerns\WithHeadings;

class GenericArrayExport implements FromArray, WithHeadings
{
    /** @var array<int, array<int, mixed>> */
    protected array $rows;

    /** @var array<int, string> */
    protected array $headers;

    /**
     * @param array<int, string> $headers
     * @param array<int, array<int, mixed>> $rows
     */
    public function __construct(array $headers, array $rows)
    {
        $this->headers = $headers;
        $this->rows = $rows;
    }

    public function array(): array
    {
        return $this->rows;
    }

    public function headings(): array
    {
        return $this->headers;
    }
}
