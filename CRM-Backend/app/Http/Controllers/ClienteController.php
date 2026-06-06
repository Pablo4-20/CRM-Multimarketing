<?php
namespace App\Http\Controllers;

use App\Models\Cliente;
use App\Models\Campana;
use App\Models\Comentario; // <-- Asegúrate de que esta línea esté aquí
use Illuminate\Http\Request;

class ClienteController extends Controller
{
    public function index() {
        return response()->json(Cliente::with(['user', 'campana', 'estado'])->orderBy('id', 'desc')->get());
    }

    public function storeMasivo(Request $request) {
        $request->validate([
            'clientes' => 'required|array',
            'clientes.*.nombre' => 'required|string|max:255',
            'clientes.*.email' => 'nullable|string|max:255',
            'clientes.*.telefono' => 'nullable|string|max:255',
            'clientes.*.campana' => 'nullable|string|max:255',
        ]);

        $creados = 0;
        $actualizados = 0;
        $nuevosClientes = [];

        foreach ($request->clientes as $cliData) {
            $campana_id = null;
            
            // Si el Excel trae una Campaña, la buscamos o la creamos
            if (!empty($cliData['campana'])) {
                $campana = Campana::firstOrCreate(['nombre' => trim($cliData['campana'])]);
                $campana_id = $campana->id;
            }

            $cliente = null;

            // 1. Buscar duplicado por Email
            if (!empty($cliData['email'])) {
                $cliente = Cliente::where('email', trim($cliData['email']))->first();
            }
            // 2. Buscar duplicado por Teléfono (si no se encontró por email)
            if (!$cliente && !empty($cliData['telefono'])) {
                $cliente = Cliente::where('telefono', trim($cliData['telefono']))->first();
            }
            // 3. Buscar duplicado por Nombre exacto (si no hay email ni teléfono)
            if (!$cliente) {
                $cliente = Cliente::where('nombre', trim($cliData['nombre']))->first();
            }

            // LÓGICA ANTI-DUPLICADOS
            if ($cliente) {
                // El cliente YA EXISTE -> Lo actualizamos para no duplicar
                $cliente->update([
                    'nombre' => trim($cliData['nombre']),
                    'email' => empty($cliData['email']) ? $cliente->email : trim($cliData['email']),
                    'telefono' => empty($cliData['telefono']) ? $cliente->telefono : trim($cliData['telefono']),
                    'campana_id' => $campana_id ?? $cliente->campana_id
                ]);
                $actualizados++;
                $nuevosClientes[] = $cliente;
            } else {
                // El cliente NO EXISTE -> Lo creamos nuevo
                $nuevo = Cliente::create([
                    'nombre' => trim($cliData['nombre']),
                    'email' => empty($cliData['email']) ? null : trim($cliData['email']),
                    'telefono' => empty($cliData['telefono']) ? null : trim($cliData['telefono']),
                    'campana_id' => $campana_id
                ]);
                $creados++;
                $nuevosClientes[] = $nuevo;
            }
        }

        // Devolvemos un mensaje detallado
        return response()->json([
            'message' => "Importación exitosa: $creados clientes nuevos creados y $actualizados clientes actualizados.", 
            'data' => $nuevosClientes
        ], 201);
    }

    public function update(Request $request, $id) {
        $request->validate(['nombre' => 'required|string|max:255']);
        $cliente = Cliente::findOrFail($id);
        $cliente->update($request->only(['nombre', 'email', 'telefono', 'campana_id']));
        return response()->json($cliente);
    }

    public function destroy($id) {
        Cliente::findOrFail($id)->delete();
        return response()->json(['message' => 'Cliente eliminado']);
    }

    // -------- MODIFICADO: AHORA TRAE LOS COMENTARIOS --------
    public function getPorAgente($user_id) {
        $clientes = Cliente::with([
                'campana', 
                'estado', 
                // Añadimos la relación de comentarios y el usuario de cada comentario, ordenados del más viejo al más nuevo
                'comentarios' => function($query) {
                    $query->orderBy('created_at', 'asc')->with('user');
                }
            ])
            ->where('user_id', $user_id)
            ->orderBy('id', 'desc')
            ->get();
            
        return response()->json($clientes);
    }

    public function addComentario(Request $request, $id) {
        $request->validate([
            'texto' => 'required|string',
            'user_id' => 'required|exists:users,id',
            'estado_id' => 'nullable|exists:estados,id', // Validamos que el estado exista
            'estado_nombre' => 'nullable|string'
        ]);

        // 1. Si el agente seleccionó un nuevo estado, actualizamos al Cliente principal
        if ($request->estado_id) {
            $cliente = Cliente::findOrFail($id);
            $cliente->update(['estado_id' => $request->estado_id]);
        }

        // 2. Creamos el comentario guardando el nombre del estado para el historial
        $comentario = Comentario::create([
            'cliente_id' => $id,
            'user_id' => $request->user_id,
            'texto' => $request->texto,
            'estado' => $request->estado_nombre // Guardamos el nombre ("Interesado", "Vendido", etc.)
        ]);
        $comentario->load('user');

        return response()->json(['message' => 'Comentario agregado', 'comentario' => $comentario]);
    }

    public function updateNotas(Request $request, $id) {
        $request->validate([
            'notas' => 'nullable|string'
        ]);

        $cliente = Cliente::findOrFail($id);
        $cliente->update(['notas' => $request->notas]);

        return response()->json(['message' => 'Notas guardadas correctamente', 'cliente' => $cliente]);
    }
}