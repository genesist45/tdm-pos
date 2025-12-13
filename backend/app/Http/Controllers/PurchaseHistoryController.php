<?php

namespace App\Http\Controllers;

use App\Models\PurchaseHistory;
use App\Models\Inventory;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class PurchaseHistoryController extends Controller
{
    public function index()
    {
        return PurchaseHistory::orderBy('created_at', 'desc')->get();
    }

    public function store(Request $request)
    {
        $request->validate([
            'items' => 'required|array',
            'total_amount' => 'required|numeric',
            'amount_received' => 'required|numeric',
            'change' => 'required|numeric'
        ]);

        // Generate a unique purchase ID
        $purchaseId = 'PUR-' . strtoupper(Str::random(8));

        // Create the purchase history record
        $purchase = PurchaseHistory::create([
            'purchase_id' => $purchaseId,
            'total_amount' => $request->total_amount,
            'items' => $request->items,
            'amount_received' => $request->amount_received,
            'change' => $request->change
        ]);

        // Update inventory quantities
        foreach ($request->items as $item) {
            $inventory = Inventory::find($item['id']);
            if ($inventory) {
                $inventory->quantity -= $item['quantity'];
                $inventory->save();
            }
        }

        return response()->json($purchase, 201);
    }

    public function show($id)
    {
        return PurchaseHistory::where('purchase_id', $id)->firstOrFail();
    }

    public function destroy($id)
    {
        $purchase = PurchaseHistory::where('purchase_id', $id)->firstOrFail();
        
        // Restore inventory quantities
        foreach ($purchase->items as $item) {
            $inventory = Inventory::find($item['id']);
            if ($inventory) {
                $inventory->quantity += $item['quantity'];
                $inventory->save();
            }
        }

        $purchase->delete();
        return response()->json(null, 204);
    }
}
