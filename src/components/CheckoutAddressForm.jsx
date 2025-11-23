import React from "react";
import { 
  MapPin, 
  ArrowRight,
  Lock, 
  Info 
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

/**
 * CheckoutAddressForm (Hybrid Read-Only / Editable)
 * - Contact Info: Editable (Email, Phone)
 * - Shipping Address: Read-Only (Pre-filled from profile/location)
 */
export default function CheckoutAddressForm({ initialData, onContinue, onContactChange }) {
  
  // Helper to render a disabled field with a lock icon (for Shipping Address)
  const ReadOnlyField = ({ label, value, id }) => (
    <div className="space-y-2 relative group cursor-not-allowed">
        <Label htmlFor={id} className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1 flex items-center gap-1">
            {label} <Lock className="w-3 h-3 opacity-50" />
        </Label>
        <Input
            id={id}
            value={value || ''}
            readOnly
            disabled
            className="w-full h-11 rounded-xl bg-gray-50 border-gray-200 text-gray-600 cursor-not-allowed focus:ring-0"
        />
    </div>
  );

  return (
    <div className="p-6 space-y-6 relative">
        
      {/* 1. CONTACT INFO (EDITABLE) */}
      <div className="space-y-4">
          <h2 className="text-xl font-black uppercase tracking-wider mb-2 text-gray-800">Contact Info</h2>
          
          <div className="space-y-2">
            <Label htmlFor="email" className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">
                Email Address
            </Label>
            <Input
                id="email"
                value={initialData.email || ''}
                onChange={(e) => onContactChange('email', e.target.value)}
                placeholder="name@example.com"
                className="w-full h-11 rounded-xl bg-white border-gray-300 focus:ring-2 focus:ring-black/5"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="phone" className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1">
                Phone Number
            </Label>
            <div className="flex gap-2">
                <div className="w-16 flex items-center justify-center bg-gray-100 border border-gray-300 rounded-xl text-sm font-medium text-gray-600">
                    {initialData.countryCode || '+91'}
                </div>
                <Input
                    id="phone"
                    value={initialData.phone || ''}
                    onChange={(e) => onContactChange('phone', e.target.value)}
                    placeholder="Mobile Number"
                    className="flex-1 h-11 rounded-xl bg-white border-gray-300 focus:ring-2 focus:ring-black/5"
                />
            </div>
          </div>
      </div>
      
      <Separator className="my-6" />

      {/* 2. SHIPPING ADDRESS (READ-ONLY WITH TOOLTIP) */}
      <TooltipProvider delayDuration={100}>
        <Tooltip>
            <TooltipTrigger asChild>
                <div className="space-y-4 opacity-90"> 
                    <h2 className="text-xl font-black uppercase tracking-wider mb-2 text-gray-800">Shipping Address</h2>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <ReadOnlyField id="firstName" label="First Name" value={initialData.firstName} />
                        <ReadOnlyField id="lastName" label="Last Name" value={initialData.lastName} />
                    </div>
                    
                    <ReadOnlyField id="country" label="Country" value={initialData.country} />
                    
                    <div className="space-y-2">
                        <Label className="text-xs font-bold text-gray-500 uppercase tracking-wider ml-1 flex items-center gap-1">
                            Address Line 1 <Lock className="w-3 h-3 opacity-50" />
                        </Label>
                        <div className="relative">
                            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input 
                                value={initialData.addressLine1 || ''} 
                                readOnly disabled 
                                className="pl-9 h-11 rounded-xl bg-gray-50 border-gray-200 text-gray-600 cursor-not-allowed"
                            />
                        </div>
                    </div>

                    <ReadOnlyField id="addressLine2" label="Address Line 2" value={initialData.addressLine2} />
                    
                    <div className="grid grid-cols-3 gap-4">
                        <ReadOnlyField id="city" label="City" value={initialData.city} />
                        <ReadOnlyField id="state" label="State" value={initialData.state} />
                        <ReadOnlyField id="pincode" label="Postal Code" value={initialData.pincode} />
                    </div>
                </div>
            </TooltipTrigger>
            <TooltipContent side="top" className="bg-black text-white border-none px-4 py-2 rounded-lg shadow-xl">
                <div className="flex items-center gap-2">
                    <Info className="w-4 h-4 text-yellow-400" />
                    <p className="font-medium">To change shipping address, use <strong>"Change Address / Location"</strong> on the right.</p>
                </div>
            </TooltipContent>
        </Tooltip>
      </TooltipProvider>

      {/* Continue Button */}
      <Button
          onClick={(e) => { e.preventDefault(); onContinue(); }}
          className="w-full h-12 rounded-xl bg-black text-white font-bold text-lg hover:bg-gray-900 active:scale-[0.98] transition-all flex items-center justify-center gap-2 mt-6 shadow-lg"
      >
          Confirm & Proceed to Payment
          <ArrowRight className="h-5 w-5" />
      </Button>
      
      <p className="text-xs text-center text-gray-400 mt-2">
          Please confirm your details above are correct.
      </p>
    </div>
  );
}