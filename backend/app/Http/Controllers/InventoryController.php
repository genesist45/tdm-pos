<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Inventory;

class InventoryController extends Controller
{
    public function index()
    {
        $inventory = Inventory::with('supplier')->get();
        return response()->json($inventory);
    }

    public function store(Request $request)
    {
        $request->validate([
            'product_name' => 'required|string',
            'category' => 'required|string',
            'quantity' => 'required|integer|min:0',
            'price' => 'required|numeric|min:0',
            'supplier_id' => 'required|exists:suppliers,id',
            'stock_status' => 'required|string',
            'description' => 'nullable|string',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048'
        ]);

        $data = $request->all();

        if ($request->hasFile('image')) {
            $image = $request->file('image');
            $imageName = time() . '.' . $image->getClientOriginalExtension();
            $image->move(public_path('images/inventory'), $imageName);
            $data['image_path'] = '/images/inventory/' . $imageName;
        }

        $inventory = Inventory::create($data);
        return response()->json($inventory->load('supplier'), 201);
    }

    public function show($id)
    {
        $inventory = Inventory::with('supplier')->findOrFail($id);
        return response()->json($inventory);
    }

    public function update(Request $request, $id)
    {
        $inventory = Inventory::findOrFail($id);
        
        $request->validate([
            'product_name' => 'required|string',
            'category' => 'required|string',
            'quantity' => 'required|integer|min:0',
            'price' => 'required|numeric|min:0',
            'supplier_id' => 'required|exists:suppliers,id',
            'stock_status' => 'required|string',
            'description' => 'nullable|string',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048'
        ]);

        $data = $request->all();

        if ($request->hasFile('image')) {
            // Delete old image if exists
            if ($inventory->image_path && file_exists(public_path($inventory->image_path))) {
                unlink(public_path($inventory->image_path));
            }

            $image = $request->file('image');
            $imageName = time() . '.' . $image->getClientOriginalExtension();
            $image->move(public_path('images/inventory'), $imageName);
            $data['image_path'] = '/images/inventory/' . $imageName;
        }

        $inventory->update($data);
        return response()->json($inventory->load('supplier'));
    }

    public function destroy($id)
    {
        $inventory = Inventory::findOrFail($id);
        
        // Delete image if exists
        if ($inventory->image_path && file_exists(public_path($inventory->image_path))) {
            unlink(public_path($inventory->image_path));
        }

        $inventory->delete();
        return response()->json(null, 204);
    }
}
