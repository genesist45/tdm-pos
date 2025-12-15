<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Category extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'image_path',
        'description'
    ];

    /**
     * Get the inventory items for this category.
     */
    public function inventoryItems()
    {
        return $this->hasMany(Inventory::class, 'category', 'name');
    }

    protected $appends = ['image_url'];

    public function getImageUrlAttribute()
    {
        return $this->image_path ? url($this->image_path) : null;
    }
}
