<?php

namespace App\Http\Controllers;

use App\Models\Estado;
use Illuminate\Http\Request;

class EstadoController extends Controller
{
    public function index() {
        return response()->json(Estado::orderBy('id', 'desc')->get());
    }

    public function store(Request $request) {
        $request->merge(['nombre' => mb_strtoupper(trim($request->nombre), 'UTF-8')]);

        $request->validate([
            'nombre' => 'required|string|max:255|unique:estados,nombre'
        ], [
            'nombre.unique' => 'Ya existe un estado con este nombre.'
        ]);
        
        $estado = Estado::create(['nombre' => $request->nombre]);
        return response()->json($estado, 201);
    }

    public function storeMasivo(Request $request) {
        $request->validate([
            'estados' => 'required|array',
            'estados.*.nombre' => 'required|string|max:255'
        ]);

        $nuevosEstados = [];
        foreach ($request->estados as $estData) {
            $nombreUpper = mb_strtoupper(trim($estData['nombre']), 'UTF-8');
            $estado = Estado::firstOrCreate(['nombre' => $nombreUpper]);
            $nuevosEstados[] = $estado;
        }
        return response()->json(['message' => 'Carga exitosa', 'data' => $nuevosEstados], 201);
    }

    public function update(Request $request, $id) {
        $request->merge(['nombre' => mb_strtoupper(trim($request->nombre), 'UTF-8')]);

        $request->validate([
            'nombre' => 'required|string|max:255|unique:estados,nombre,' . $id
        ], [
            'nombre.unique' => 'Ya existe un estado con este nombre.'
        ]);
        
        $estado = Estado::findOrFail($id);
        $estado->nombre = $request->nombre;
        $estado->save();
        return response()->json($estado);
    }

    public function destroy($id) {
        Estado::findOrFail($id)->delete();
        return response()->json(['message' => 'Estado eliminado']);
    }
}