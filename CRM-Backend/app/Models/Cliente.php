<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Cliente extends Model
{
    use HasFactory;
    
    protected $fillable = [
        'nombre', 
        'email', 
        'telefono', 
        'campana_id', 
        'estado_id', 
        'user_id', 
        'notas'
    ];

    public function campana() { 
        return $this->belongsTo(Campana::class); 
    }
    
    public function estado() { 
        return $this->belongsTo(Estado::class); 
    }
    
    public function user() { 
        return $this->belongsTo(User::class); 
    }

    // NUEVO: Relación de 1 a muchos con los comentarios
    public function comentarios() {
        return $this->hasMany(Comentario::class);
    }
}