<?php

namespace App\Console\Commands;

use App\Models\Module\Master\Data\Manajemen\Posker;
use Spatie\Permission\Models\Role;
use Illuminate\Console\Command;

class CheckPoskerRoles extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'posker:check-roles {posker_id?}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Check posker and their assigned roles';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $poskerId = $this->argument('posker_id');
        
        if ($poskerId) {
            $this->checkSpecificPosker($poskerId);
        } else {
            $this->checkAllPoskers();
        }
    }

    private function checkSpecificPosker($poskerId)
    {
        $posker = Posker::with('roles')->find($poskerId);
        
        if (!$posker) {
            $this->error("Posker with ID {$poskerId} not found!");
            return;
        }

        $this->info("=== CHECKING POSKER: {$posker->nama} (ID: {$posker->id}) ===");
        
        if (!$posker->roles || $posker->roles->isEmpty()) {
            $this->warn("No roles assigned to this posker");
            return;
        }

        $this->info("Assigned Roles:");
        foreach ($posker->roles as $role) {
            $this->line("  - {$role->name} (ID: {$role->id})");
        }
    }

    private function checkAllPoskers()
    {
        $this->info("=== CHECKING ALL POSKERS ===");
        
        $poskers = Posker::with('roles')->get();
        
        $this->table(
            ['ID', 'Nama', 'Roles Count', 'Roles'],
            $poskers->map(function ($posker) {
                $roles = $posker->roles ? $posker->roles->pluck('name')->implode(', ') : 'None';
                return [
                    $posker->id,
                    $posker->nama,
                    $posker->roles ? $posker->roles->count() : 0,
                    $roles
                ];
            })
        );

        $this->info("\n=== ALL AVAILABLE ROLES ===");
        $roles = Role::all();
        $this->table(
            ['ID', 'Name'],
            $roles->map(function ($role) {
                return [$role->id, $role->name];
            })
        );
    }
}
