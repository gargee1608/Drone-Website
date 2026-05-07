"use client";

import { useState } from "react";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface DroneEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  drone: {
    id: string;
    modelName: string;
    type: string;
    camera: string;
    payloadKg: string;
    flightTimeMin: string;
    rangeKm: string;
    useCases: string[];
  };
  onSave: (updatedDrone: any) => void;
}

const DRONE_TYPE_OPTIONS = ["FPV", "Autonomous", "Line of Sight"];
const DRONE_USE_CASE_OPTIONS = ["Survey", "Filming", "Inspection", "Delivery", "Security"];

const selectClass =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

function RequiredMark() {
  return <span className="text-red-500">*</span>;
}

export function DroneEditModal({ isOpen, onClose, drone, onSave }: DroneEditModalProps) {
  const [formData, setFormData] = useState({
    modelName: drone.modelName,
    type: drone.type,
    camera: drone.camera,
    payloadKg: drone.payloadKg,
    flightTimeMin: drone.flightTimeMin,
    rangeKm: drone.rangeKm,
    useCases: [...drone.useCases],
  });

  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  console.log("DroneEditModal rendering with isOpen:", isOpen, "drone:", drone);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const model = formData.modelName.trim();
    const type = formData.type.trim();
    
    if (!model) {
      setError("Model name is required.");
      return;
    }
    if (!type) {
      setError("Type is required.");
      return;
    }

    try {
      await onSave({
        ...drone,
        ...formData,
        modelName: model,
        type,
        camera: formData.camera.trim(),
        payloadKg: formData.payloadKg.trim(),
        flightTimeMin: formData.flightTimeMin.trim(),
        rangeKm: formData.rangeKm.trim(),
      });
      onClose();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Failed to update drone");
    }
  };

  const toggleUseCase = (label: string) => {
    setFormData(prev => ({
      ...prev,
      useCases: prev.useCases.includes(label)
        ? prev.useCases.filter(x => x !== label)
        : [...prev.useCases, label]
    }));
  };

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-transparent backdrop-blur-none">
      <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto relative z-[10000]">
        <div className="flex items-center justify-between p-6 border-b">
          <h2 className="text-lg font-semibold">Edit Drone Details</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="h-8 w-8 p-0"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-sm font-medium">
                Model name <RequiredMark />
              </label>
              <Input
                value={formData.modelName}
                onChange={(e) => setFormData(prev => ({ ...prev, modelName: e.target.value }))}
                placeholder="DJI Mavic 3"
                className="h-10"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">
                Type <RequiredMark />
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData(prev => ({ ...prev, type: e.target.value }))}
                className={selectClass}
              >
                <option value="">Select type</option>
                {DRONE_TYPE_OPTIONS.map((opt) => (
                  <option key={opt} value={opt}>{opt}</option>
                ))}
              </select>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Camera</label>
              <Input
                value={formData.camera}
                onChange={(e) => setFormData(prev => ({ ...prev, camera: e.target.value }))}
                placeholder="4K"
                className="h-10"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Payload (kg)</label>
              <Input
                value={formData.payloadKg}
                onChange={(e) => setFormData(prev => ({ ...prev, payloadKg: e.target.value }))}
                placeholder="2.5"
                className="h-10"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Flight time (min)</label>
              <Input
                value={formData.flightTimeMin}
                onChange={(e) => setFormData(prev => ({ ...prev, flightTimeMin: e.target.value }))}
                placeholder="30"
                className="h-10"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Range (km)</label>
              <Input
                value={formData.rangeKm}
                onChange={(e) => setFormData(prev => ({ ...prev, rangeKm: e.target.value }))}
                placeholder="10"
                className="h-10"
              />
            </div>
          </div>

          <div className="space-y-2 mt-4">
            <label className="text-sm font-medium">Use cases</label>
            <div className="flex flex-wrap gap-2">
              {DRONE_USE_CASE_OPTIONS.map((label) => {
                const on = formData.useCases.includes(label);
                return (
                  <button
                    key={label}
                    type="button"
                    onClick={() => toggleUseCase(label)}
                    className={cn(
                      "rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors",
                      on
                        ? "border-[#008B8B] bg-[#008B8B]/10 text-[#006060]"
                        : "border-border bg-background text-foreground hover:bg-muted/50"
                    )}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {error && (
            <p className="text-sm text-red-600 mt-4" role="alert">
              {error}
            </p>
          )}

          <div className="flex justify-end gap-3 mt-6">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-[#008B8B] hover:bg-[#006060] text-white"
            >
              Save Changes
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
