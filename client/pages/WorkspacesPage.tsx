// src/pages/WorkspacesPage.tsx
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardContent, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { X, Edit, Trash2, Plus } from "lucide-react";
import AppLayout from "@/components/layout/AppLayout";
import { toast } from "sonner";

interface Workplace {
  id: string;
  name: string;
  description: string;
  color: string;
}

export default function WorkspacesPage() {
  const [workplaces, setWorkplaces] = useState<Workplace[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [editing, setEditing] = useState<Workplace | null>(null);
  const [form, setForm] = useState({ name: "", description: "", color: "#3b82f6" });

  async function load() {
    try {
      const res = await fetch("/api/me/workplaces");
      const data = await res.json();
      setWorkplaces(data);
    } catch (err) {
      console.error(err);
    }
  }

  useEffect(() => { load(); }, []);

  function openEditor(wp?: Workplace) {
    if (wp) {
      setEditing(wp);
      setForm({ name: wp.name, description: wp.description, color: wp.color });
    } else {
      setEditing(null);
      setForm({ name: "", description: "", color: "#3b82f6" });
    }
    setIsOpen(true);
  }

  async function handleSave() {
    const url = editing ? `/api/me/workplaces/${editing.id}` : "/api/me/workplaces";
    const method = editing ? "PUT" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (res.ok) {
      toast.success(editing ? "Updated workplace" : "Created workplace");
      load();
      setIsOpen(false);
    } else {
      toast.error("Error saving");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Confirm delete?")) return;
    const res = await fetch(`/api/me/workplaces/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Deleted");
      load();
    } else toast.error("Error deleting");
  }

  return (
    <AppLayout>
      <div className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-2xl font-bold">Workspaces</h1>
          <Button onClick={() => openEditor()}>
            <Plus className="w-4 h-4 mr-1" /> New Workspace
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {workplaces.map(wp => (
            <Card key={wp.id} className="border-l-4" style={{ borderLeftColor: wp.color }}>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle>{wp.name}</CardTitle>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="icon" onClick={() => openEditor(wp)}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(wp.id)}>
                      <Trash2 className="w-4 h-4 text-red-600" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{wp.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {isOpen && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-bold">{editing ? "Edit Workplace" : "New Workplace"}</h2>
              <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)}>
                <X className="w-4 h-4" />
              </Button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm">Name</label>
                <Input
                  value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm">Description</label>
                <textarea
                  className="w-full border rounded p-2"
                  rows={3}
                  value={form.description}
                  onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                />
              </div>
              <div>
                <label className="block text-sm">Color</label>
                <input
                  type="color"
                  value={form.color}
                  onChange={e => setForm(f => ({ ...f, color: e.target.value }))}
                  className="w-10 h-10 p-0 border-none"
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsOpen(false)}>Cancel</Button>
                <Button onClick={handleSave}>{editing ? "Update" : "Create"}</Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </AppLayout>
  );
}
