<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DamagedItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'invoice_no',
        'item_id',
        'item_name',
        'quantity_returned',
        'item_price',
        'refund_amount',
        'return_type',
        'return_reason',
        'other_reason',
        'return_date',
        'processed_by'
    ];

    protected $casts = [
        'return_date' => 'date',
        'quantity_returned' => 'integer',
        'item_price' => 'decimal:2',
        'refund_amount' => 'decimal:2',
        'item_id' => 'integer'
    ];

    public function inventory()
    {
        return $this->belongsTo(Inventory::class, 'item_id');
    }
}
