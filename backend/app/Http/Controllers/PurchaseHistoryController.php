<?php

namespace App\Http\Controllers;

use App\Models\PurchaseHistory;
use App\Models\DamagedItem;
use App\Models\Inventory;
use Illuminate\Http\Request;
use Illuminate\Support\Str;

class PurchaseHistoryController extends Controller
{
    public function index()
    {
        // Get all purchase history records
        $purchases = PurchaseHistory::orderBy('created_at', 'desc')->get()->map(function ($purchase) {
            return [
                'id' => $purchase->id,
                'transaction_id' => $purchase->purchase_id,
                'type' => 'purchase',
                'items' => $purchase->items,
                'item_name' => null,
                'quantity' => null,
                'total_amount' => $purchase->total_amount,
                'amount_received' => $purchase->amount_received,
                'change' => $purchase->change,
                'reason' => null,
                'processed_by' => null,
                'created_at' => $purchase->created_at
            ];
        });

        // Get all damaged item records
        $damagedItems = DamagedItem::orderBy('created_at', 'desc')->get()->map(function ($item) {
            return [
                'id' => $item->id,
                'transaction_id' => 'DMG-' . str_pad($item->id, 6, '0', STR_PAD_LEFT),
                'type' => 'damage_return',
                'items' => [['name' => $item->item_name, 'quantity' => $item->quantity_returned]],
                'item_name' => $item->item_name,
                'quantity' => $item->quantity_returned,
                'total_amount' => 0,
                'amount_received' => 0,
                'change' => 0,
                'reason' => $item->return_reason . ($item->other_reason ? ' - ' . $item->other_reason : ''),
                'processed_by' => $item->processed_by,
                'created_at' => $item->return_date
            ];
        });

        // Combine and sort by date
        $transactions = $purchases->concat($damagedItems)->sortByDesc('created_at')->values();

        return response()->json($transactions);
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
