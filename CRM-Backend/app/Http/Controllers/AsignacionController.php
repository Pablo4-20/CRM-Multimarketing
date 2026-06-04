<?php
namespace App\Http\Controllers;

use App\Models\Cliente;
use App\Models\User;
use App\Models\Campana;
use App\Models\Estado;
use Illuminate\Http\Request;

class AsignacionController extends Controller
{
    public function getDatosModal() {
        return response()->json([
            'usuarios' => User::where('status', 'Activo')->get(),
            'campanas' => Campana::all(),
            'estados' => Estado::all()
        ]);
    }

    public function asignarMasivo(Request $request) {
        $request->validate([
            'cliente_ids' => 'required|array',
            'user_id' => 'nullable|exists:users,id',
            'campana_id' => 'nullable|exists:campanas,id',
            'estado_id' => 'nullable|exists:estados,id',
        ]);

        // Solo preparamos para actualizar los campos que el usuario SÍ envió
        $updateData = [];
        if ($request->filled('user_id')) $updateData['user_id'] = $request->user_id;
        if ($request->filled('campana_id')) $updateData['campana_id'] = $request->campana_id;
        if ($request->filled('estado_id')) $updateData['estado_id'] = $request->estado_id;

        // Si hay algo que actualizar, lo hacemos
        if (!empty($updateData)) {
            Cliente::whereIn('id', $request->cliente_ids)->update($updateData);
        }

        return response()->json(['message' => 'Clientes asignados correctamente']);
    }
}