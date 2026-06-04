<?php
namespace App\Http\Controllers;

use App\Models\Cliente;
use App\Models\User;
use App\Models\Campana;
use App\Models\Estado;
use Illuminate\Http\Request;

class AsignacionController extends Controller
{
    // Obtiene los datos necesarios para llenar los 'Select' del Modal
    public function getDatosModal() {
        return response()->json([
            'usuarios' => User::where('status', 'Activo')->get(),
            'campanas' => Campana::all(),
            'estados' => Estado::all()
        ]);
    }

    // Procesa la asignación masiva
    public function asignarMasivo(Request $request) {
        $request->validate([
            'cliente_ids' => 'required|array',
            'user_id' => 'required|exists:users,id',
            'campana_id' => 'required|exists:campanas,id',
            'estado_id' => 'required|exists:estados,id',
        ]);

        Cliente::whereIn('id', $request->cliente_ids)->update([
            'user_id' => $request->user_id,
            'campana_id' => $request->campana_id,
            'estado_id' => $request->estado_id,
        ]);

        return response()->json(['message' => 'Clientes asignados correctamente']);
    }
}