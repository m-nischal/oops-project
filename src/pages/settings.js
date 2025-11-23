// src/pages/settings.js
import React, { useState, useMemo } from 'react'; // ADDED useMemo
import { useRouter } from 'next/router';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AlertTriangle, Loader2, LogOut, Trash2, Settings, Mail, Lock, Shield, Check, X, Eye, EyeOff } from 'lucide-react'; // ADDED Eye, EyeOff
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import Link from 'next/link';

// --- Password Validation Logic (NEW) ---
const isValidNewPassword = (password) => {
    // 1. Minimum 8 characters
    const hasLength = password.length >= 8;
    // 2. At least one number
    const hasNumber = /\d/.test(password);
    // 3. At least one special character: @, !, or $
    const hasSpecial = /[@!$]/.test(password);
    return { hasLength, hasNumber, hasSpecial, isValid: hasLength && hasNumber && hasSpecial };
};

// --- Custom Password Input Component (NEW) ---
const PasswordInput = ({ id, value, onChange, placeholder, disabled, autoFocus, showToggle, setShowToggle, isInvalid }) => (
  <div className="relative">
      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 h-5 w-5" />
      <input
        id={id}
        type={showToggle ? "text" : "password"}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        autoFocus={autoFocus}
        required
        className={`w-full h-14 pl-12 pr-12 rounded-2xl bg-white border text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-black/10 focus:border-black transition-all disabled:bg-gray-50 disabled:text-gray-500
          ${isInvalid ? 'border-red-500 focus:border-red-500 focus:ring-red-200' : 'border-gray-200'}
        `}
      />
      <button
          type="button"
          onClick={() => setShowToggle(prev => !prev)}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 p-1"
          tabIndex="-1"
      >
          {showToggle ? <EyeOff size={20} /> : <Eye size={20} />}
      </button>
  </div>
);
// ------------------------------------


export default function SettingsPage() {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState('');
  const [verificationPassword, setVerificationPassword] = useState('');
  const [deleteError, setDeleteError] = useState(null);
  
  // --- Change Password State ---
  const [isPassModalOpen, setIsPassModalOpen] = useState(false);
  const [currentPass, setCurrentPass] = useState("");
  const [newPass, setNewPass] = useState("");
  const [confirmPass, setConfirmPass] = useState("");
  const [passLoading, setPassLoading] = useState(false);
  const [passMessage, setPassMessage] = useState(null); // { type: 'success' | 'error', text: '' }
  
  // --- Password Visibility State (NEW) ---
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);

  // --- Derived Validation (NEW) ---
  const newPassValidation = useMemo(() => isValidNewPassword(newPass), [newPass]);
  const newPasswordsMatch = newPass && confirmPass && newPass === confirmPass;
  const isFormValid = currentPass && newPass && confirmPass && newPasswordsMatch && newPassValidation.isValid;


  const handleLogout = async () => {
    try {
        await fetch("/api/auth/logout", { method: "POST" });
        localStorage.removeItem("token");
        router.push('/login');
    } catch (e) {
        router.push('/login');
    }
  };

  const handleDeleteAccount = async () => {
    setDeleting(true);
    setDeleteError(null);

    if (!verificationEmail || !verificationPassword) {
        setDeleteError("Please enter your email and password to confirm.");
        setDeleting(false);
        return;
    }

    try {
      const token = localStorage.getItem("token");
      const res = await fetch('/api/user/delete', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
            email: verificationEmail,
            password: verificationPassword
        })
      });

      const errData = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(errData.error || 'Failed to delete account');

      await fetch("/api/auth/logout", { method: "POST" });
      localStorage.removeItem("token");
      alert("Your account has been successfully deleted.");
      router.push('/');

    } catch (err) {
      console.error(err);
      setDeleteError(err.message);
    } finally {
      setDeleting(false);
      setVerificationEmail('');
      setVerificationPassword('');
    }
  };

  // --- CHANGE PASSWORD LOGIC (UPDATED VALIDATION) ---
  const handleChangePassword = async (e) => {
    e.preventDefault();
    setPassMessage(null);
    
    // 1. Client-Side Validation
    if (!currentPass || !newPass || !confirmPass) {
        setPassMessage({ type: 'error', text: "All fields are required." });
        return;
    }
    
    if (!newPassValidation.isValid) {
        setPassMessage({ type: 'error', text: "New password does not meet requirements." });
        return;
    }
    
    if (!newPasswordsMatch) {
        setPassMessage({ type: 'error', text: "New passwords do not match." });
        return;
    }

    setPassLoading(true);
    try {
        const token = localStorage.getItem("token");
        const res = await fetch("/api/auth/change-password", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({ currentPassword: currentPass, newPassword: newPass })
        });

        const data = await res.json();
        if (res.ok) {
            setPassMessage({ type: 'success', text: "Password updated successfully!" });
            // Clear form
            setCurrentPass("");
            setNewPass("");
            setConfirmPass("");
            // Close modal after delay
            setTimeout(() => {
                setIsPassModalOpen(false);
                setPassMessage(null);
            }, 1500);
        } else {
            setPassMessage({ type: 'error', text: data.error || "Failed to update password." });
        }
    } catch (err) {
        setPassMessage({ type: 'error', text: "Network error. Please try again." });
    } finally {
        setPassLoading(false);
    }
  };
  
  const resetModalState = (open) => {
    if (!open) {
      setVerificationEmail('');
      setVerificationPassword('');
      setDeleteError(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50 p-6 md:p-10">
      <div className="max-w-xl mx-auto">
        <h1 className="text-3xl font-bold mb-6 flex items-center">
          <Settings className="mr-3 h-6 w-6" /> Account Settings
        </h1>

        {/* Security Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-xl flex items-center">
              <Shield className="mr-2 h-5 w-5" /> Security
            </CardTitle>
            <CardDescription>
              Manage your password and account security.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div>
               <p className="font-medium text-sm">Password</p>
               <p className="text-xs text-gray-500">Change your current password.</p>
            </div>
            <Button variant="outline" onClick={() => { setIsPassModalOpen(true); setPassMessage(null); }}>
                Change Password
            </Button>
          </CardContent>
        </Card>

        {/* Logout Card */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-xl flex items-center">
              <LogOut className="mr-2 h-5 w-5" /> Logout
            </CardTitle>
            <CardDescription>
              Sign out of your account on this device.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={handleLogout} variant="secondary">
              Logout Now
            </Button>
          </CardContent>
        </Card>

        {/* Delete Account Card */}
        <Card className="border-red-500/50 bg-red-50/50">
          <CardHeader>
            <CardTitle className="text-xl flex items-center text-red-600">
              <Trash2 className="mr-2 h-5 w-5" /> Danger Zone
            </CardTitle>
            <CardDescription className="text-red-700">
              Permanently delete your account and all associated data. This action cannot be undone.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AlertDialog onOpenChange={resetModalState}>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" disabled={deleting}>
                  Delete My Account
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-red-600 flex items-center">
                    <AlertTriangle className="mr-2 h-5 w-5" /> Confirm Account Deletion
                  </AlertDialogTitle>
                  <AlertDialogDescription>
                    To confirm permanent deletion, please re-enter your email and password below.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                
                <div className="space-y-4 pt-2">
                    <div className="space-y-2">
                        <Label htmlFor="verifyEmail">Your Email</Label>
                        <Input 
                            id="verifyEmail" 
                            type="email" 
                            value={verificationEmail} 
                            onChange={(e) => { setVerificationEmail(e.target.value); setDeleteError(null); }}
                            disabled={deleting}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="verifyPassword">Your Password</Label>
                        <Input 
                            id="verifyPassword" 
                            type="password" 
                            value={verificationPassword} 
                            onChange={(e) => { setVerificationPassword(e.target.value); setDeleteError(null); }}
                            disabled={deleting}
                        />
                    </div>
                    {deleteError && <Alert variant="destructive"><AlertDescription>{deleteError}</AlertDescription></Alert>}
                </div>
                
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
                  <Button onClick={handleDeleteAccount} disabled={deleting} className="bg-red-600 hover:bg-red-700">
                    {deleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Yes, Delete Account"}
                  </Button>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      </div>

      {/* --- CHANGE PASSWORD MODAL (UPDATED) --- */}
      <Dialog open={isPassModalOpen} onOpenChange={(open) => { if(!open) { setIsPassModalOpen(false); setPassMessage(null); } }}>
        <DialogContent className="sm:max-w-[425px]">
            <DialogHeader>
                <DialogTitle>Change Password</DialogTitle>
                <DialogDescription>
                    Enter your current password to set a new one.
                </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleChangePassword} className="space-y-5">
                
                {/* 1. Current Password */}
                <div className="space-y-2">
                    <Label htmlFor="currentPass">Current Password</Label>
                    <PasswordInput
                        id="currentPass"
                        value={currentPass}
                        onChange={(e) => setCurrentPass(e.target.value)}
                        placeholder="••••••••"
                        showToggle={showCurrentPass}
                        setShowToggle={setShowCurrentPass}
                    />
                </div>
                
                {/* 2. New Password */}
                <div className="space-y-2">
                    <Label htmlFor="newPass">New Password</Label>
                    <PasswordInput
                        id="newPass"
                        value={newPass}
                        onChange={(e) => setNewPass(e.target.value)}
                        placeholder="••••••••"
                        showToggle={showNewPass}
                        setShowToggle={setShowNewPass}
                        isInvalid={newPass && !newPassValidation.isValid}
                    />
                    
                    {/* Validation Hint (NEW) */}
                    <ul className="text-xs text-gray-500 space-y-0.5 ml-2">
                        <li className={`flex items-center ${newPassValidation.hasLength ? 'text-green-600' : 'text-red-500'}`}>
                            {newPassValidation.hasLength ? <Check className="h-3 w-3 mr-1" /> : <X className="h-3 w-3 mr-1" />} 8+ characters
                        </li>
                        <li className={`flex items-center ${newPassValidation.hasNumber ? 'text-green-600' : 'text-red-500'}`}>
                            {newPassValidation.hasNumber ? <Check className="h-3 w-3 mr-1" /> : <X className="h-3 w-3 mr-1" />} At least 1 number
                        </li>
                        <li className={`flex items-center ${newPassValidation.hasSpecial ? 'text-green-600' : 'text-red-500'}`}>
                            {newPassValidation.hasSpecial ? <Check className="h-3 w-3 mr-1" /> : <X className="h-3 w-3 mr-1" />} Special char (@, !, $)
                        </li>
                    </ul>
                </div>
                
                {/* 3. Confirm New Password */}
                <div className="space-y-2">
                    <Label htmlFor="confirmPass">Confirm New Password</Label>
                    <PasswordInput
                        id="confirmPass"
                        value={confirmPass}
                        onChange={(e) => setConfirmPass(e.target.value)}
                        placeholder="••••••••"
                        showToggle={showConfirmPass}
                        setShowToggle={setShowConfirmPass}
                        isInvalid={confirmPass && !newPasswordsMatch}
                    />
                    {confirmPass && !newPasswordsMatch && (
                        <p className="text-xs text-red-500 pl-1">Passwords do not match.</p>
                    )}
                </div>

                {passMessage && (
                    <Alert variant={passMessage.type === 'error' ? 'destructive' : 'default'} className={passMessage.type === 'success' ? "border-green-500 text-green-600 bg-green-50" : ""}>
                         {passMessage.type === 'success' && <Check className="h-4 w-4 mr-2 inline" />}
                         <AlertDescription>{passMessage.text}</AlertDescription>
                    </Alert>
                )}

                <DialogFooter className="pt-2">
                    <Button type="button" variant="outline" onClick={() => setIsPassModalOpen(false)}>Cancel</Button>
                    <Button type="submit" disabled={passLoading || !isFormValid}>
                        {passLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Update Password"}
                    </Button>
                </DialogFooter>
            </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}