<?php

namespace App\Http\Controllers;

use App\Models\Cliente;
use App\Models\Campana;
use App\Models\Estado;
use Illuminate\Http\Request;

class DashboardController extends Controller
{
    public function getStats()
    {
        return response()->json([
            'total_clientes' => Cliente::count(),
            'campanas_activas' => Campana::where('activa', true)->count(), // Ajusta según tu columna
            'total_estados' => Estado::count(),
            // Puedes agregar más métricas aquí
        ]);
    }
}