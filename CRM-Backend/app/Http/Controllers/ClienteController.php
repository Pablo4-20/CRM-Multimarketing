<?php
namespace App\Http\Controllers;

use App\Models\Cliente;
use App\Models\Campana;
use App\Models\Comentario;
use App\Models\Estado;
use Illuminate\Http\Request;

class ClienteController extends Controller
{
    public function index(\Illuminate\Http\Request $request) {
        $query = Cliente::with(['user', 'campana', 'estado'])->orderBy('id', 'asc');

        // 1. Filtrar por Agente desde el Backend
        if ($request->filled('agente_id')) {
            $val = $request->agente_id;
            if ($val === 'unassigned') {
                $query->whereNull('user_id');
            } else if (is_numeric($val)) {
                $query->where('user_id', $val);
            }
        }

        // 2. Filtrar por Campaña desde el Backend
        if ($request->filled('campana_id')) {
            $val = $request->campana_id;
            if ($val === 'unassigned') {
                $query->whereNull('campana_id');
            } else if (is_numeric($val)) {
                $query->where('campana_id', $val);
            }
        }

        // 3. Filtrar por Estado desde el Backend
        if ($request->filled('estado_id')) {
            $val = $request->estado_id;
            if ($val === 'unassigned') {
                $query->whereNull('estado_id');
            } else if (is_numeric($val)) {
                $query->where('estado_id', $val);
            }
        }

        if ($request->query('all') === 'true') {
            return response()->json($query->get());
        }

        // Devolvemos los 500 registros ya filtrados correctamente
        return response()->json($query->paginate(500));
    }

    public function storeMasivo(Request $request) {
        $request->validate([
            'clientes' => 'required|array',
            'clientes.*.nombre' => 'required|string|max:255',
            'clientes.*.email' => 'nullable|string|max:255',
            'clientes.*.telefono' => 'nullable|string|max:255',
            'clientes.*.campana' => 'nullable|string|max:255',
            'clientes.*.estado' => 'nullable|string|max:255',
            'clientes.*.user_id' => 'nullable|integer',
            'clientes.*.campana_id' => 'nullable|integer',
            'clientes.*.estado_id' => 'nullable|integer',
        ]);

        $creados = 0;
        $omitidos = 0;
        $listaOmitidos = []; 
        $nuevosClientes = [];

        foreach ($request->clientes as $cliData) {
            $clienteExistente = null;
            $motivoOmitido = '';

            // 1. Buscar duplicado por Email
            if (!empty($cliData['email'])) {
                $clienteExistente = Cliente::where('email', trim($cliData['email']))->first();
                if ($clienteExistente) {
                    $motivoOmitido = 'el correo electrónico ya existe';
                }
            }

            // 2. Buscar duplicado por Teléfono (si no se encontró por email)
            if (!$clienteExistente && !empty($cliData['telefono'])) {
                $clienteExistente = Cliente::where('telefono', trim($cliData['telefono']))->first();
                if ($clienteExistente) {
                    $motivoOmitido = 'el número de teléfono ya está registrado';
                }
            }
            // ELIMINA O COMENTA ESTE BLOQUE COMPLETO
            // 3. Buscar duplicado por Nombre (si no hay email ni teléfono duplicados)
            /* if (!$clienteExistente) {
                $clienteExistente = Cliente::where('nombre', trim($cliData['nombre']))->first();
                if ($clienteExistente) {
                    $motivoOmitido = 'ya existe un cliente con ese mismo nombre';
                }
            }
            */

            // SI EL CLIENTE YA EXISTE, REGISTRAMOS EL MOTIVO Y LO SALTAMOS
            if ($clienteExistente) {
                $omitidos++;
                $nombreCliente = trim($cliData['nombre']);
                $listaOmitidos[] = "{$nombreCliente} se omitió porque {$motivoOmitido}.";
                continue; 
            }

            // SI EL CLIENTE NO EXISTE, LO CREAMOS
            $campana_id = null;
            if (!empty($cliData['campana_id'])) {
                $campana_id = $cliData['campana_id'];
            } elseif (!empty($cliData['campana'])) {
                $campana = Campana::firstOrCreate(['nombre' => trim($cliData['campana'])]);
                $campana_id = $campana->id;
            }

            $estado_id = null;
            if (!empty($cliData['estado_id'])) {
                $estado_id = $cliData['estado_id'];
            } elseif (!empty($cliData['estado'])) {
                $estadoObj = Estado::firstOrCreate(
                    ['nombre' => trim($cliData['estado'])],
                    ['color' => '#f59e0b']
                );
                $estado_id = $estadoObj->id;
            }

            $user_id = $cliData['user_id'] ?? null;

            $nuevo = Cliente::create([
                'nombre' => trim($cliData['nombre']),
                'email' => empty($cliData['email']) ? null : trim($cliData['email']),
                'telefono' => empty($cliData['telefono']) ? null : trim($cliData['telefono']),
                'campana_id' => $campana_id,
                'estado_id' => $estado_id,
                'user_id' => $user_id
            ]);
            
            $creados++;
            $nuevosClientes[] = $nuevo;
        }

        return response()->json([
            'message' => "Procesamiento completado.",
            'creados' => $creados,
            'omitidos_conteo' => $omitidos,
            'omitidos' => $listaOmitidos, 
            'data' => $nuevosClientes
        ], 201);
    }
    public function show($id) {
        // Buscamos el cliente y cargamos sus relaciones, incluyendo los comentarios y el agente que hizo cada comentario
        $cliente = Cliente::with([
            'user', 
            'campana', 
            'estado', 
            'comentarios' => function($query) {
                // Ordenamos los comentarios del más antiguo al más reciente y cargamos al usuario
                $query->orderBy('created_at', 'asc')->with('user');
            }
        ])->findOrFail($id);

        return response()->json(['cliente' => $cliente]);
    }

    public function update(Request $request, $id) {
        $request->validate(['nombre' => 'required|string|max:255']);
        $cliente = Cliente::findOrFail($id);
        $cliente->update($request->only(['nombre', 'email', 'telefono', 'campana_id', 'user_id', 'estado_id']));
        return response()->json($cliente);
    }

    public function destroy($id) {
        Cliente::findOrFail($id)->delete();
        return response()->json(['message' => 'Cliente eliminado']);
    }

    public function getPorAgente($user_id) {
        $clientes = Cliente::with([
                'campana', 
                'estado', 
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
            'estado_id' => 'nullable|exists:estados,id',
            'estado_nombre' => 'nullable|string'
        ]);

        if ($request->estado_id) {
            $cliente = Cliente::findOrFail($id);
            $cliente->update(['estado_id' => $request->estado_id]);
        }

        $comentario = Comentario::create([
            'cliente_id' => $id,
            'user_id' => $request->user_id,
            'texto' => $request->texto,
            'estado' => $request->estado_nombre 
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
    
    public function updateComentario(Request $request, $id) {
        $request->validate([
            'texto' => 'required|string'
        ]);

        $comentario = Comentario::findOrFail($id);
        $comentario->update([
            'texto' => $request->texto
        ]);

        return response()->json([
            'message' => 'Gestión actualizada correctamente',
            'comentario' => $comentario->load('cliente')
        ]);
    }

    public function destroyComentario($id) {
        $comentario = Comentario::findOrFail($id);
        $comentario->delete();

        return response()->json([
            'message' => 'Gestión eliminada correctamente'
        ]);
    }
}