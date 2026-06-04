<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Cliente extends Model
{
    use HasFactory;
    
    protected $fillable = ['nombre', 'email', 'telefono', 'user_id', 'campana_id', 'estado_id'];

    // Relaciones para poder mostrar los nombres en la tabla
    public function user() {
        return $this->belongsTo(User::class);
    }
    public function campana() {
        return $this->belongsTo(Campana::class);
    }
    public function estado() {
        return $this->belongsTo(Estado::class);
    }
}