// src/pages/settings.js
import React, { useState } from 'react';
import { useRouter } from 'next/router';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { AlertTriangle, Loader2, LogOut, Trash2, Settings, Mail, Lock } from 'lucide-react'; // Added Mail, Lock
import { Input } from "@/components/ui/input"; // Added Input
import { Label } from "@/components/ui/label"; // Added Label
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

export default function SettingsPage() {
  const router = useRouter();
  const [deleting, setDeleting] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState(''); // NEW STATE
  const [verificationPassword, setVerificationPassword] = useState(''); // NEW STATE
  const [deleteError, setDeleteError] = useState(null); // NEW STATE

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push('/login');
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
        body: JSON.stringify({ // <--- PASSING CREDENTIALS
            email: verificationEmail,
            password: verificationPassword
        })
      });

      const errData = await res.json().catch(() => ({}));

      if (!res.ok) {
        setDeleteError(errData.error || errData.message || 'Failed to delete account');
        throw new Error(errData.error || 'Failed to delete account');
      }

      // Success - Clear local storage and redirect
      localStorage.removeItem("token");
      alert("Your account has been successfully deleted.");
      router.push('/');

    } catch (err) {
      console.error(err);
      // Error state already set above inside the try block
    } finally {
      setDeleting(false);
      // Clear fields on success/failure to prevent accidental re-use
      setVerificationEmail('');
      setVerificationPassword('');
    }
  };
  
  // Helper to reset modal state when closed
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
                
                {/* Re-authentication Inputs */}
                <div className="space-y-4 pt-2">
                    <div className="space-y-2">
                        <Label htmlFor="verifyEmail" className="flex items-center text-sm font-medium">
                            <Mail className="h-4 w-4 mr-2" /> Your Email
                        </Label>
                        <Input 
                            id="verifyEmail" 
                            type="email" 
                            placeholder="user@example.com"
                            value={verificationEmail} 
                            onChange={(e) => {
                                setVerificationEmail(e.target.value);
                                setDeleteError(null);
                            }}
                            disabled={deleting}
                        />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="verifyPassword" className="flex items-center text-sm font-medium">
                            <Lock className="h-4 w-4 mr-2" /> Your Password
                        </Label>
                        <Input 
                            id="verifyPassword" 
                            type="password" 
                            placeholder="Password"
                            value={verificationPassword} 
                            onChange={(e) => {
                                setVerificationPassword(e.target.value);
                                setDeleteError(null);
                            }}
                            disabled={deleting}
                        />
                    </div>
                    
                    {deleteError && (
                        <Alert variant="destructive">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>
                                {deleteError}
                            </AlertDescription>
                        </Alert>
                    )}
                </div>
                
                <AlertDialogFooter>
                  <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
                  <Button 
                    onClick={handleDeleteAccount} 
                    disabled={deleting || !verificationEmail || !verificationPassword} 
                    className="bg-red-600 hover:bg-red-700"
                  >
                    {deleting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : "Yes, Delete Account"}
                  </Button>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}