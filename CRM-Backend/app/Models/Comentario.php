<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Comentario extends Model
{
    use HasFactory;
    
    protected $fillable = [
        'cliente_id', 
        'user_id', 
        'texto'
    ];

    public function cliente() {
        return $this->belongsTo(Cliente::class);
    }

    // NUEVO: Relación para saber qué usuario (agente) escribió el comentario
    public function user() {
        return $this->belongsTo(User::class);
    }
}