<?php

namespace App\Events;

use Illuminate\Broadcasting\Channel;
use Illuminate\Broadcasting\InteractsWithSockets;
use Illuminate\Broadcasting\PresenceChannel;
use Illuminate\Broadcasting\PrivateChannel;
use Illuminate\Contracts\Broadcasting\ShouldBroadcast;
use Illuminate\Foundation\Events\Dispatchable;
use Illuminate\Queue\SerializesModels;

class PermintaanBarangEvent implements ShouldBroadcast
{
    use Dispatchable, InteractsWithSockets, SerializesModels;

    public $data;
    public $eventType;
    public $kodeKlinik;
    public $isGudangUtama;

    /**
     * Create a new event instance.
     */
    public function __construct($data, $eventType, $kodeKlinik, $isGudangUtama = false)
    {
        $this->data = $data;
        $this->eventType = $eventType;
        $this->kodeKlinik = $kodeKlinik;
        $this->isGudangUtama = $isGudangUtama;
    }

    /**
     * Get the channels the event should broadcast on.
     *
     * @return array<int, \Illuminate\Broadcasting\Channel>
     */
    public function broadcastOn(): array
    {
        // Broadcast ke channel berdasarkan kode klinik
        $channelName = "permintaan-barang.{$this->kodeKlinik}";
        
        return [
            new Channel($channelName),
        ];
    }

    /**
     * Get the data to broadcast.
     */
    public function broadcastWith(): array
    {
        return [
            'event_type' => $this->eventType,
            'data' => $this->data,
            'kode_klinik' => $this->kodeKlinik,
            'is_gudang_utama' => $this->isGudangUtama,
            'timestamp' => now()->toISOString(),
        ];
    }

    /**
     * Get the broadcast event name.
     */
    public function broadcastAs(): string
    {
        return 'permintaan-barang-updated';
    }
}
