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

        $clientes = Cliente::whereIn('id', $request->cliente_ids)->get();
        $nuevoAgente = null;

        if ($request->filled('user_id')) {
            $nuevoAgente = User::find($request->user_id);
        }

        foreach ($clientes as $cliente) {
            // Si se envió un nuevo agente y es diferente al que ya tenía
            if ($nuevoAgente && $request->user_id != $cliente->user_id) {
                
                $fechaActual = date('d/m/Y');
                $textoHistorial = "";

                if (is_null($cliente->user_id)) {
                    // Primera asignación
                    $textoHistorial = "Asignado a: " . $nuevoAgente->name . " Fecha: " . $fechaActual;
                } else {
                    // Reasignación (agregamos quién lo tenía antes para mayor control)
                    $agenteAnterior = User::find($cliente->user_id);
                    $nombreAnterior = $agenteAnterior ? $agenteAnterior->name : 'Desconocido';
                    $textoHistorial = "Asignado a: " . $nuevoAgente->name . " Fecha: " . $fechaActual . "\n(Agente anterior: " . $nombreAnterior . ")";
                }

                // Creamos el comentario automático
                \App\Models\Comentario::create([
                    'cliente_id' => $cliente->id,
                    'user_id' => auth()->id() ?? 1, // ID del administrador que hace el cambio
                    'texto' => $textoHistorial,
                    'estado' => 'Sistema' // Etiqueta especial
                ]);

                // Guardamos el nuevo agente en el cliente
                $cliente->user_id = $request->user_id;
            }

            if ($request->filled('campana_id')) {
                $cliente->campana_id = $request->campana_id;
            }
            if ($request->filled('estado_id')) {
                $cliente->estado_id = $request->estado_id;
            }

            $cliente->save();
        }

        return response()->json(['message' => 'Clientes asignados correctamente']);
    }
}