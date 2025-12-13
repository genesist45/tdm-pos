<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Inventory extends Model
{
    use HasFactory;

    protected $table = 'inventory';

    protected $fillable = [
        'product_name',
        'category',
        'quantity',
        'price',
        'supplier_id',
        'stock_status',
        'description',
        'image_path'
    ];

    public function supplier()
    {
        return $this->belongsTo(Supplier::class);
    }
}
