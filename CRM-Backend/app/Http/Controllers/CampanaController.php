<?php

namespace App\Http\Controllers;

use App\Models\Campana;
use Illuminate\Http\Request;

class CampanaController extends Controller
{
    // 1. Obtener todas las campañas
    public function index()
    {
        $campanas = Campana::orderBy('id', 'desc')->get();
        return response()->json($campanas);
    }

    // 2. Crear UNA campaña (Manual)
    public function store(Request $request)
    {
        $request->validate([
            'nombre' => 'required|string|max:255'
        ]);

        $campana = Campana::create([
            'nombre' => $request->nombre
        ]);

        return response()->json($campana, 201);
    }

    // 3. Crear MÚLTIPLES campañas (Carga Masiva desde React)
    public function storeMasivo(Request $request)
    {
        $request->validate([
            'campanas' => 'required|array',
            'campanas.*.nombre' => 'required|string|max:255'
        ]);

        $nuevasCampanas = [];
        foreach ($request->campanas as $campData) {
            $nuevasCampanas[] = Campana::create([
                'nombre' => $campData['nombre']
            ]);
        }

        return response()->json(['message' => 'Carga masiva exitosa', 'data' => $nuevasCampanas], 201);
    }

    // 4. Editar el nombre de una campaña
    public function update(Request $request, $id)
    {
        $request->validate([
            'nombre' => 'required|string|max:255'
        ]);

        $campana = Campana::findOrFail($id);
        $campana->nombre = $request->nombre;
        $campana->save();

        return response()->json($campana);
    }

    // 5. Eliminar una campaña
    public function destroy($id)
    {
        $campana = Campana::findOrFail($id);
        $campana->delete();

        return response()->json(['message' => 'Campaña eliminada']);
    }
}