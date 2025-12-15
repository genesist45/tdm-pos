<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\DamagedItem;
use App\Models\Inventory;
use App\Models\PurchaseHistory;

class DamagedItemController extends Controller
{
    /**
     * Display a listing of damaged items.
     */
    public function index()
    {
        $damagedItems = DamagedItem::orderBy('created_at', 'desc')->get();
        return response()->json($damagedItems);
    }

    /**
     * Store a newly created damaged item record.
     * Also updates inventory and calculates refund amount.
     */
    public function store(Request $request)
    {
        $request->validate([
            'invoice_no' => 'required|string|max:100',
            'item_id' => 'nullable|integer',
            'item_name' => 'required|string|max:200',
            'quantity_returned' => 'required|integer|min:1',
            'item_price' => 'nullable|numeric|min:0',
            'return_type' => 'nullable|in:damaged_item,good_item',
            'return_reason' => 'required|string|max:100',
            'other_reason' => 'nullable|string|max:500',
            'return_date' => 'required|date',
            'processed_by' => 'required|string|max:100'
        ]);

        $data = $request->all();

        // Set default return_type if not provided
        if (!isset($data['return_type'])) {
            $data['return_type'] = 'damaged_item';
        }

        // Calculate refund amount
        $itemPrice = $request->item_price ?? 0;
        $data['refund_amount'] = $itemPrice * $request->quantity_returned;

        // Create the damaged item record
        $damagedItem = DamagedItem::create($data);

        // Update inventory quantity - add returned items back to stock
        $this->updateInventoryQuantity($request->item_id, $request->item_name, $request->quantity_returned);

        return response()->json($damagedItem, 201);
    }

    /**
     * Display the specified damaged item.
     */
    public function show($id)
    {
        $damagedItem = DamagedItem::findOrFail($id);
        return response()->json($damagedItem);
    }

    /**
     * Update the specified damaged item.
     * Properly adjusts inventory based on quantity difference.
     */
    public function update(Request $request, $id)
    {
        $damagedItem = DamagedItem::findOrFail($id);
        $oldQuantity = $damagedItem->quantity_returned;
        $oldItemId = $damagedItem->item_id;
        $oldItemName = $damagedItem->item_name;

        $request->validate([
            'invoice_no' => 'required|string|max:100',
            'item_id' => 'nullable|integer',
            'item_name' => 'required|string|max:200',
            'quantity_returned' => 'required|integer|min:1',
            'item_price' => 'nullable|numeric|min:0',
            'return_type' => 'nullable|in:damaged_item,good_item',
            'return_reason' => 'required|string|max:100',
            'other_reason' => 'nullable|string|max:500',
            'return_date' => 'required|date',
            'processed_by' => 'required|string|max:100'
        ]);

        $newQuantity = $request->quantity_returned;
        $quantityDiff = $newQuantity - $oldQuantity;

        // Validate quantity doesn't exceed available
        if ($quantityDiff > 0) {
            $maxAllowed = $this->calculateMaxAllowedQuantity(
                $damagedItem->invoice_no,
                $oldItemName,
                $damagedItem->id
            );

            if ($newQuantity > $maxAllowed) {
                return response()->json([
                    'message' => "Cannot return more than {$maxAllowed} items. Original purchase quantity exceeded.",
                    'max_allowed' => $maxAllowed
                ], 422);
            }
        }

        $data = $request->all();

        // Calculate refund amount
        $itemPrice = $request->item_price ?? $damagedItem->item_price ?? 0;
        $data['refund_amount'] = $itemPrice * $request->quantity_returned;

        // Adjust inventory if quantity changed
        if ($quantityDiff != 0) {
            // Use old item_id or old item_name to find the inventory
            $this->updateInventoryQuantity($oldItemId, $oldItemName, $quantityDiff);
        }

        $damagedItem->update($data);

        return response()->json([
            'data' => $damagedItem,
            'message' => 'Item return updated successfully',
            'inventory_adjusted' => $quantityDiff != 0,
            'quantity_change' => $quantityDiff
        ]);
    }

    /**
     * Remove the specified damaged item.
     * Also reverses the inventory adjustment.
     */
    public function destroy($id)
    {
        $damagedItem = DamagedItem::findOrFail($id);

        // Reverse the inventory adjustment - remove the returned items from stock
        $this->updateInventoryQuantity(
            $damagedItem->item_id,
            $damagedItem->item_name,
            -$damagedItem->quantity_returned
        );

        $damagedItem->delete();
        return response()->json(null, 204);
    }

    /**
     * Get total refund amount for dashboard
     */
    public function getTotalRefunds()
    {
        $totalRefunds = DamagedItem::sum('refund_amount');
        return response()->json(['total_refunds' => $totalRefunds]);
    }

    /**
     * Get maximum allowed quantity for editing a return
     * This considers the original purchase quantity minus other returns
     */
    public function getMaxQuantity(Request $request)
    {
        $request->validate([
            'invoice_no' => 'required|string',
            'item_name' => 'required|string',
            'current_return_id' => 'nullable|integer'
        ]);

        $maxAllowed = $this->calculateMaxAllowedQuantity(
            $request->invoice_no,
            $request->item_name,
            $request->current_return_id
        );

        return response()->json([
            'max_quantity' => $maxAllowed,
            'invoice_no' => $request->invoice_no,
            'item_name' => $request->item_name
        ]);
    }

    /**
     * Helper function to update inventory quantity
     * Tries to find inventory by item_id first, then by item_name
     */
    private function updateInventoryQuantity($itemId, $itemName, $quantityChange)
    {
        $inventory = null;

        // Try to find by item_id first
        if ($itemId) {
            $inventory = Inventory::find($itemId);
        }

        // If not found by ID, try by name
        if (!$inventory && $itemName) {
            $inventory = Inventory::where('product_name', $itemName)->first();
        }

        if ($inventory) {
            $inventory->quantity += $quantityChange;

            // Ensure quantity doesn't go negative
            if ($inventory->quantity < 0) {
                $inventory->quantity = 0;
            }

            $inventory->save();
            return true;
        }

        return false;
    }

    /**
     * Calculate maximum allowed quantity for a return
     * Original purchase quantity - already returned quantity (excluding current return if editing)
     */
    private function calculateMaxAllowedQuantity($invoiceNo, $itemName, $excludeReturnId = null)
    {
        // Get original purchase quantity from purchase history
        $purchaseHistory = PurchaseHistory::where('receipt_no', $invoiceNo)->first();

        if (!$purchaseHistory) {
            // If no purchase history found, allow reasonable default
            return 999;
        }

        $items = json_decode($purchaseHistory->items, true) ?? [];
        $originalQty = 0;

        foreach ($items as $item) {
            if (isset($item['name']) && $item['name'] === $itemName) {
                $originalQty = $item['quantity'] ?? 0;
                break;
            }
        }

        if ($originalQty === 0) {
            return 999; // Item not found in purchase, allow edit
        }

        // Get total already returned for this invoice and item (excluding current return)
        $query = DamagedItem::where('invoice_no', $invoiceNo)
            ->where('item_name', $itemName);

        if ($excludeReturnId) {
            $query->where('id', '!=', $excludeReturnId);
        }

        $alreadyReturned = $query->sum('quantity_returned');

        // Max allowed is original quantity minus what's already returned
        $maxAllowed = $originalQty - $alreadyReturned;

        return max(0, $maxAllowed);
    }
}
