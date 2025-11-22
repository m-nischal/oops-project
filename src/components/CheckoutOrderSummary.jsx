import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ChevronDown, ChevronUp, ShoppingCart, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const formatPrice = (p) => `₹${Number(p || 0).toLocaleString('en-IN')}`;

/**
 * CheckoutOrderSummary - Displays the order summary in a collapsible card.
 * @param {Object} props
 * @param {Object} props.orderData - Contains: { itemsWithDetails: [], totalSubtotalBeforeDiscount, totalDiscountAmount, totalFee, grandTotal }
 */
export default function CheckoutOrderSummary({ orderData }) {
    const [isExpanded, setIsExpanded] = useState(false);
    // State to cache retailer names: { ownerId: name }
    const [retailerNames, setRetailerNames] = useState({}); 

    // Destructure required fields
    const { 
        itemsWithDetails = [], 
        totalSubtotalBeforeDiscount = 0, 
        totalDiscountAmount = 0, 
        totalFee = 'Calculated at next step', 
        grandTotal = 0 
    } = orderData;
    
    // Memoize the unique owner IDs to watch
    const uniqueOwnerIds = useMemo(() => {
        const ids = new Set();
        itemsWithDetails.forEach(item => {
            if (item.product?.ownerId) {
                ids.add(String(item.product.ownerId));
            }
        });
        return Array.from(ids);
    }, [itemsWithDetails]);

    // Function to fetch a retailer's name
    const fetchRetailerName = useCallback(async (ownerId) => {
        // Prevent re-fetching if already cached or in progress
        if (retailerNames[ownerId] || retailerNames[ownerId] === 'Loading...') return;
        
        setRetailerNames(prev => ({ ...prev, [ownerId]: 'Loading...' }));

        try {
            const res = await fetch(`/api/public/user/${ownerId}`);
            if (!res.ok) throw new Error("Failed to fetch retailer name");
            const data = await res.json();
            
            // The API returns { name, role, ... }
            const name = data.name || "Unknown Retailer";
            setRetailerNames(prev => ({ ...prev, [ownerId]: name }));
        } catch (e) {
            console.error(`Error fetching retailer ${ownerId}:`, e);
            setRetailerNames(prev => ({ ...prev, [ownerId]: 'Unknown Retailer' }));
        }
    }, [retailerNames]);

    // Effect to fetch names for all unique owner IDs
    useEffect(() => {
        uniqueOwnerIds.forEach(ownerId => {
            if (!retailerNames[ownerId]) {
                fetchRetailerName(ownerId);
            }
        });
    }, [uniqueOwnerIds, fetchRetailerName, retailerNames]);


    const displayTotalFee = typeof totalFee === 'number' ? formatPrice(totalFee) : totalFee;

    return (
        <Card className="shadow-xl">
            <CardHeader className="pb-0">
                <div className="flex justify-between items-center">
                    <CardTitle className="text-xl">
                        Your Order 
                        <span className="text-sm text-gray-500 ml-2 font-normal">({itemsWithDetails.length})</span>
                    </CardTitle>
                    <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => setIsExpanded(!isExpanded)}
                        aria-expanded={isExpanded}
                        aria-controls="order-item-list"
                        className="text-black"
                    >
                        {isExpanded ? <ChevronUp className="h-6 w-6" /> : <ChevronDown className="h-6 w-6" />}
                    </Button>
                </div>
            </CardHeader>
            
            {/* Collapsible Content */}
            {isExpanded && (
                 <CardContent className="pt-0 max-h-48 overflow-y-auto" id="order-item-list">
                    <Separator className="my-3" />
                    {itemsWithDetails.map((item, index) => {
                        const ownerId = item.product?.ownerId;
                        const retailerDisplay = ownerId 
                            ? (retailerNames[ownerId] || 'Loading...') 
                            : 'LiveMart Seller';

                        return (
                            <div key={index} className="flex gap-3 py-2 items-center border-b border-gray-50 last:border-b-0">
                                <div className="w-16 h-16 shrink-0 overflow-hidden rounded-md bg-gray-100">
                                    <img src={item.product?.images?.[0] || "/images/placeholder.png"} alt={item.name} className="w-full h-full object-cover" />
                                </div>
                                
                                {/* 1. Truncation, 2. Brand and Retailer */}
                                <div className="flex-1 text-sm overflow-hidden">
                                    <div className="font-semibold truncate">{item.name}</div>
                                    
                                    <div className="text-xs text-gray-500 space-y-0.5 mt-1">
                                        <p className="truncate"><span className="font-medium">Brand:</span> {item.product?.brand || 'N/A'}</p>
                                        <p className="truncate"><span className="font-medium">Retailer:</span> 
                                            {retailerDisplay === 'Loading...' ? <Loader2 className="animate-spin h-3 w-3 inline ml-1" /> : retailerDisplay}
                                        </p>
                                    </div>
                                </div>
                                
                                {/* 3. Unit Price Display */}
                                <div className="text-sm font-medium text-right flex flex-col items-end">
                                    {/* Total Price (Top) */}
                                    <div className="font-bold text-base">{formatPrice(item.subtotalAfterDiscount)}</div>
                                    
                                    {/* (x) (price of one unit) (Bottom) */}
                                    <div className="text-xs text-muted-foreground">({item.qty} x {formatPrice(item.discountedPrice)})</div>
                                </div>
                            </div>
                        );
                    })}
                 </CardContent>
            )}

            {/* Always Visible Summary Footer */}
            <CardContent className={isExpanded ? 'pt-0' : 'pt-4'}>
                <Separator className="my-3" />
                <div className="space-y-2 text-base">
                    <div className="flex justify-between">
                        <span>Subtotal</span>
                        <span className="font-medium">{formatPrice(totalSubtotalBeforeDiscount - totalDiscountAmount)}</span>
                    </div>
                    <div className="flex justify-between text-red-600 font-semibold">
                        <span>Discount</span>
                        <span>-{formatPrice(totalDiscountAmount)}</span>
                    </div>
                    <div className="flex justify-between">
                        <span>Shipping</span>
                        <span className="font-medium">{displayTotalFee}</span>
                    </div>
                </div>
                
                <Separator className="my-3" />
                
                <div className="flex justify-between text-xl font-bold">
                    <span>Total</span>
                    <span className="text-black">{formatPrice(grandTotal)}</span>
                </div>
            </CardContent>
        </Card>
    );
}