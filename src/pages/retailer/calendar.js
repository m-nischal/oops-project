import React, { useEffect, useState } from 'react';
import RetailerLayout from '@/components/RetailerLayout';
import { useAuthGuard } from '@/hooks/useAuthGuard';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar as CalendarIcon, Plus, Loader2, Trash2, ShoppingBag, CheckSquare } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function RetailerCalendarPage() {
  const { isLoading: isAuthLoading } = useAuthGuard("RETAILER");
  
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDate, setNewDate] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchEvents = async () => {
      try {
          const token = localStorage.getItem("token");
          const res = await fetch("/api/retailer/calendar", {
              headers: { 'Authorization': `Bearer ${token}` }
          });
          if (res.ok) {
              const data = await res.json();
              setEvents(data.events || []);
          }
      } catch (e) { console.error(e); } 
      finally { setLoading(false); }
  };

  useEffect(() => {
      if (!isAuthLoading) fetchEvents();
  }, [isAuthLoading]);

  const handleAddReminder = async () => {
      if (!newTitle || !newDate) return;
      setSaving(true);
      try {
          const token = localStorage.getItem("token");
          const res = await fetch("/api/retailer/calendar", {
              method: "POST",
              headers: { 
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${token}` 
              },
              body: JSON.stringify({ title: newTitle, date: newDate, description: newDesc })
          });
          
          if (res.ok) {
              setIsModalOpen(false);
              setNewTitle(""); setNewDate(""); setNewDesc("");
              fetchEvents();
          }
      } catch (e) { alert("Failed to save"); } 
      finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
      if (!confirm("Delete this reminder?")) return;
      const token = localStorage.getItem("token");
      await fetch(`/api/retailer/calendar?id=${id}`, {
          method: "DELETE",
          headers: { 'Authorization': `Bearer ${token}` }
      });
      fetchEvents();
  };

  // Helper to group events by date string
  const groupedEvents = events.reduce((acc, event) => {
      const d = new Date(event.date).toLocaleDateString('en-IN', { weekday: 'short', month: 'short', day: 'numeric' });
      if (!acc[d]) acc[d] = [];
      acc[d].push(event);
      return acc;
  }, {});

  if (isAuthLoading) return <RetailerLayout>Loading...</RetailerLayout>;

  return (
    <RetailerLayout>
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
            <div>
                <h1 className="text-3xl font-bold flex items-center gap-3">
                    <CalendarIcon className="h-8 w-8" /> Schedule & Reminders
                </h1>
                <p className="text-gray-500 mt-1">Track your orders and set offline reminders.</p>
            </div>
            <Button onClick={() => setIsModalOpen(true)} className="bg-black text-white rounded-full">
                <Plus className="h-4 w-4 mr-2" /> Add Reminder
            </Button>
        </div>

        {loading ? (
            <div className="py-20 flex justify-center"><Loader2 className="animate-spin h-8 w-8 text-gray-300"/></div>
        ) : Object.keys(groupedEvents).length === 0 ? (
            <Card className="bg-gray-50 border-dashed">
                <CardContent className="py-16 text-center text-gray-500">
                    <CalendarIcon className="h-12 w-12 mx-auto mb-4 opacity-20" />
                    <p>No upcoming events or reminders.</p>
                </CardContent>
            </Card>
        ) : (
            <div className="space-y-8">
                {Object.entries(groupedEvents).map(([dateLabel, dayEvents]) => (
                    <div key={dateLabel}>
                        <h3 className="text-lg font-bold text-gray-400 uppercase tracking-wider mb-4 sticky top-20 bg-gray-100/90 backdrop-blur p-2 rounded-md w-fit z-10">
                            {dateLabel}
                        </h3>
                        <div className="grid gap-3">
                            {dayEvents.map(ev => (
                                <div key={ev.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex items-start gap-4 transition-all hover:shadow-md">
                                    <div className={`p-3 rounded-full shrink-0 ${ev.type === 'order' ? 'bg-blue-100 text-blue-600' : 'bg-yellow-100 text-yellow-600'}`}>
                                        {ev.type === 'order' ? <ShoppingBag className="h-5 w-5" /> : <CheckSquare className="h-5 w-5" />}
                                    </div>
                                    <div className="flex-1">
                                        <div className="flex justify-between items-start">
                                            <h4 className={`font-bold text-lg ${ev.type === 'order' ? 'text-blue-900' : 'text-gray-900'}`}>
                                                {ev.title}
                                            </h4>
                                            {ev.type === 'reminder' && (
                                                <Button variant="ghost" size="icon" className="h-6 w-6 text-gray-400 hover:text-red-500" onClick={() => handleDelete(ev.id)}>
                                                    <Trash2 className="h-4 w-4" />
                                                </Button>
                                            )}
                                        </div>
                                        
                                        {/* Details */}
                                        {ev.type === 'order' ? (
                                            <div className="flex gap-2 mt-2">
                                                <Badge variant="secondary">{ev.meta.status}</Badge>
                                                <Badge variant="outline">Total: ₹{ev.meta.total}</Badge>
                                            </div>
                                        ) : (
                                            <p className="text-gray-600 mt-1 text-sm">{ev.meta.description || "No description"}</p>
                                        )}
                                        
                                        <p className="text-xs text-gray-400 mt-2 font-mono">
                                            {new Date(ev.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        )}
      </div>

      {/* ADD REMINDER MODAL */}
      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent>
            <DialogHeader><DialogTitle>Add New Reminder</DialogTitle></DialogHeader>
            <div className="space-y-4 py-4">
                <div className="space-y-2">
                    <Label>Title</Label>
                    <Input placeholder="e.g. Call Supplier" value={newTitle} onChange={e => setNewTitle(e.target.value)} />
                </div>
                <div className="space-y-2">
                    <Label>Date & Time</Label>
                    <Input type="datetime-local" value={newDate} onChange={e => setNewDate(e.target.value)} />
                </div>
                <div className="space-y-2">
                    <Label>Description</Label>
                    <Textarea placeholder="Details..." value={newDesc} onChange={e => setNewDesc(e.target.value)} />
                </div>
            </div>
            <DialogFooter>
                <Button variant="outline" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button onClick={handleAddReminder} disabled={saving} className="bg-black text-white">{saving ? <Loader2 className="animate-spin h-4 w-4"/> : "Save Reminder"}</Button>
            </DialogFooter>
        </DialogContent>
      </Dialog>
    </RetailerLayout>
  );
}