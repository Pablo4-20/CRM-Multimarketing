<?php
namespace App\Http\Controllers;

use App\Models\Cliente;
use Illuminate\Http\Request;

class ClienteController extends Controller
{
    public function index() {
        return response()->json(Cliente::orderBy('id', 'desc')->get());
    }

    public function storeMasivo(Request $request) {
        $request->validate([
            'clientes' => 'required|array',
            'clientes.*.nombre' => 'required|string|max:255',
            'clientes.*.email' => 'nullable|string|max:255',
            'clientes.*.telefono' => 'nullable|string|max:255'
        ]);

        $nuevosClientes = [];
        foreach ($request->clientes as $cliData) {
            $nuevosClientes[] = Cliente::create([
                'nombre' => $cliData['nombre'],
                'email' => $cliData['email'] ?? null,
                'telefono' => $cliData['telefono'] ?? null,
            ]);
        }
        return response()->json(['message' => 'Carga masiva exitosa', 'data' => $nuevosClientes], 201);
    }

    public function update(Request $request, $id) {
        $request->validate([
            'nombre' => 'required|string|max:255'
        ]);
        $cliente = Cliente::findOrFail($id);
        $cliente->update($request->only(['nombre', 'email', 'telefono']));
        return response()->json($cliente);
    }

    public function destroy($id) {
        Cliente::findOrFail($id)->delete();
        return response()->json(['message' => 'Cliente eliminado']);
    }
}