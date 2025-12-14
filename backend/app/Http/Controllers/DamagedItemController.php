<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\DamagedItem;

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
     */
    public function store(Request $request)
    {
        $request->validate([
            'invoice_no' => 'required|string|max:100',
            'item_name' => 'required|string|max:200',
            'quantity_returned' => 'required|integer|min:1',
            'return_reason' => 'required|in:Damaged,Expired,Wrong Item,Defective,Other',
            'other_reason' => 'nullable|string|max:500',
            'return_date' => 'required|date',
            'processed_by' => 'required|string|max:100'
        ]);

        $data = $request->all();
        
        // If reason is not "Other", clear the other_reason field
        if ($request->return_reason !== 'Other') {
            $data['other_reason'] = null;
        }

        $damagedItem = DamagedItem::create($data);
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
     */
    public function update(Request $request, $id)
    {
        $damagedItem = DamagedItem::findOrFail($id);

        $request->validate([
            'invoice_no' => 'required|string|max:100',
            'item_name' => 'required|string|max:200',
            'quantity_returned' => 'required|integer|min:1',
            'return_reason' => 'required|in:Damaged,Expired,Wrong Item,Defective,Other',
            'other_reason' => 'nullable|string|max:500',
            'return_date' => 'required|date',
            'processed_by' => 'required|string|max:100'
        ]);

        $data = $request->all();
        
        // If reason is not "Other", clear the other_reason field
        if ($request->return_reason !== 'Other') {
            $data['other_reason'] = null;
        }

        $damagedItem->update($data);
        return response()->json($damagedItem);
    }

    /**
     * Remove the specified damaged item.
     */
    public function destroy($id)
    {
        $damagedItem = DamagedItem::findOrFail($id);
        $damagedItem->delete();
        return response()->json(null, 204);
    }
}
