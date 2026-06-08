<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

class SuperAdminSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Usamos updateOrCreate para que si corres el seeder varias veces, 
        // no te cree cuentas duplicadas, solo actualice la existente.
        User::updateOrCreate(
            ['email' => 'admin@admin.com'], // El correo de acceso
            [
                'name' => 'Super Administrador',
                'password' => Hash::make('password123'), // La contraseña (cámbiala si deseas)
                'role' => 'super-admin', // Exactamente el rol que usamos en React
            ]
        );
    }
}