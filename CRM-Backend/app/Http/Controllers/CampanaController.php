<?php

namespace App\Http\Controllers;

use App\Models\Campana;
use Illuminate\Http\Request;

class CampanaController extends Controller
{
    public function index()
    {
        return response()->json(Campana::orderBy('id', 'desc')->get());
    }

    public function store(Request $request)
    {
        // Convertimos a mayúsculas antes de validar
        $request->merge(['nombre' => mb_strtoupper(trim($request->nombre), 'UTF-8')]);

        $request->validate([
            'nombre' => 'required|string|max:255|unique:campanas,nombre'
        ], [
            'nombre.unique' => 'Ya existe una campaña con este nombre.'
        ]);

        $campana = Campana::create(['nombre' => $request->nombre]);
        return response()->json($campana, 201);
    }

    public function storeMasivo(Request $request)
    {
        $request->validate([
            'campanas' => 'required|array',
            'campanas.*.nombre' => 'required|string|max:255'
        ]);

        $nuevasCampanas = [];
        foreach ($request->campanas as $campData) {
            // Convertimos a mayúsculas
            $nombreUpper = mb_strtoupper(trim($campData['nombre']), 'UTF-8');
            
            // Si ya existe (en mayúsculas) lo ignora, si no, lo crea
            $campana = Campana::firstOrCreate(['nombre' => $nombreUpper]);
            $nuevasCampanas[] = $campana;
        }

        return response()->json(['message' => 'Carga masiva procesada', 'data' => $nuevasCampanas], 201);
    }

    public function update(Request $request, $id)
    {
        // Convertimos a mayúsculas antes de validar
        $request->merge(['nombre' => mb_strtoupper(trim($request->nombre), 'UTF-8')]);

        $request->validate([
            'nombre' => 'required|string|max:255|unique:campanas,nombre,' . $id
        ], [
            'nombre.unique' => 'Ya existe una campaña con este nombre.'
        ]);

        $campana = Campana::findOrFail($id);
        $campana->nombre = $request->nombre;
        $campana->save();

        return response()->json($campana);
    }

    public function destroy($id)
    {
        Campana::findOrFail($id)->delete();
        return response()->json(['message' => 'Campaña eliminada']);
    }
}