<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Inventory;

class InventoryController extends Controller
{
    /**
     * Get all inventory items
     */
    public function index()
    {
        $inventory = Inventory::all();
        return response()->json($inventory);
    }

    /**
     * Get only active inventory items (for POS/Buy Purchase page)
     */
    public function getActiveItems()
    {
        $inventory = Inventory::where('is_active', true)->get();
        return response()->json($inventory);
    }

    /**
     * Store a new inventory item
     */
    public function store(Request $request)
    {
        $request->validate([
            'product_name' => 'required|string',
            'category' => 'required|string',
            'quantity' => 'required|integer|min:0',
            'price' => 'required|numeric|min:0',
            'stock_status' => 'required|string',
            'description' => 'nullable|string',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            'is_active' => 'nullable|boolean'
        ]);

        $data = $request->all();

        // Set default value for is_active if not provided
        if (!isset($data['is_active'])) {
            $data['is_active'] = true;
        }

        // Convert string 'true'/'false' to boolean
        if (isset($data['is_active']) && is_string($data['is_active'])) {
            $data['is_active'] = filter_var($data['is_active'], FILTER_VALIDATE_BOOLEAN);
        }

        if ($request->hasFile('image')) {
            $image = $request->file('image');
            $imageName = time() . '.' . $image->getClientOriginalExtension();
            $image->move(public_path('images/inventory'), $imageName);
            $data['image_path'] = '/images/inventory/' . $imageName;
        }

        $inventory = Inventory::create($data);
        return response()->json($inventory, 201);
    }

    /**
     * Get a specific inventory item
     */
    public function show($id)
    {
        $inventory = Inventory::findOrFail($id);
        return response()->json($inventory);
    }

    /**
     * Update an inventory item
     */
    public function update(Request $request, $id)
    {
        $inventory = Inventory::findOrFail($id);

        // Convert string 'true'/'false' to boolean BEFORE validation
        if ($request->has('is_active') && is_string($request->input('is_active'))) {
            $request->merge([
                'is_active' => filter_var($request->input('is_active'), FILTER_VALIDATE_BOOLEAN)
            ]);
        }

        $request->validate([
            'product_name' => 'required|string',
            'category' => 'required|string',
            'quantity' => 'required|integer|min:0',
            'price' => 'required|numeric|min:0',
            'stock_status' => 'required|string',
            'description' => 'nullable|string',
            'image' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:2048',
            'is_active' => 'nullable|boolean'
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
        return response()->json($inventory);
    }

    /**
     * Toggle active status of an inventory item
     */
    public function toggleActive($id)
    {
        $inventory = Inventory::findOrFail($id);
        $inventory->is_active = !$inventory->is_active;
        $inventory->save();

        return response()->json([
            'message' => $inventory->is_active ? 'Item enabled successfully' : 'Item disabled successfully',
            'is_active' => $inventory->is_active,
            'item' => $inventory
        ]);
    }

    /**
     * Delete an inventory item
     */
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
