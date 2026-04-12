"use client";

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useTheme } from "@/components/app/shared/theme-provider";
import { Trash2, Navigation, AlertTriangle } from 'lucide-react';

interface TourPoint {
  id: string;
  name: string;
  sweep_id: string;
  position: {
    x: number;
    y: number;
    z: number;
  };
  rotation: {
    x: number;
    y: number;
  };
  created_at: string;
}

interface ManagePositionsModalProps {
  isOpen: boolean;
  onClose: () => void;
  tourId: string;
  points: TourPoint[];
  onDelete: (pointId: string) => Promise<void>;
  onTest: (point: TourPoint) => void;
  onRefresh: () => Promise<void>;
}

export function ManagePositionsModal({
  isOpen,
  onClose,
  tourId,
  points,
  onDelete,
  onTest,
  onRefresh
}: ManagePositionsModalProps) {
  const { theme } = useTheme();
  const isDarkMode = theme === "dark";
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmDeleteName, setConfirmDeleteName] = useState<string>('');

  const handleDelete = async () => {
    if (!confirmDeleteId) return;
    
    setDeletingId(confirmDeleteId);
    try {
      await onDelete(confirmDeleteId);
      await onRefresh();
      setConfirmDeleteId(null);
      setConfirmDeleteName('');
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className={isDarkMode ? "sm:max-w-[640px] rounded-xl border border-slate-700/80 bg-[#0f1117] shadow-sm text-slate-100" : "sm:max-w-[640px] rounded-xl border border-slate-200 bg-white shadow-sm"}>
        <DialogHeader>
          <DialogTitle className={isDarkMode ? "text-slate-100" : "text-slate-900"}>Manage Saved Positions</DialogTitle>
          <DialogDescription className={isDarkMode ? "text-slate-400" : "text-slate-600"}>
            Review, test, or remove saved navigation points for this tour.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 max-h-[500px] overflow-y-auto">
          {points.length === 0 ? (
            <div className="rounded-lg border border-slate-200 bg-slate-50/60 py-8 text-center text-slate-600 dark:border-input dark:bg-background dark:text-slate-400">
              No saved positions yet. Click <span className="font-medium text-slate-900 dark:text-slate-100">Save Position</span> to add your first point.
            </div>
          ) : (
            points.map((point) => (
              <div
                key={point.id}
                className="space-y-3 rounded-lg border border-slate-200 bg-white p-4 dark:border-input dark:bg-background"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-slate-900 dark:text-slate-100">
                      {point.name}
                    </h3>
                    <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">
                      Sweep ID: <span className="font-mono text-xs">{point.sweep_id}</span>
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="rounded border border-slate-200 bg-slate-50/70 p-2 dark:border-input dark:bg-background">
                    <span className="text-slate-600 dark:text-slate-400">Position:</span>
                    <div className="mt-1 space-y-0.5 font-mono text-slate-700 dark:text-slate-300">
                      <div>X: {point.position.x.toFixed(2)}</div>
                      <div>Y: {point.position.y.toFixed(2)}</div>
                      <div>Z: {point.position.z.toFixed(2)}</div>
                    </div>
                  </div>
                  <div className="rounded border border-slate-200 bg-slate-50/70 p-2 dark:border-input dark:bg-background">
                    <span className="text-slate-600 dark:text-slate-400">Rotation:</span>
                    <div className="mt-1 space-y-0.5 font-mono text-slate-700 dark:text-slate-300">
                      <div>X: {point.rotation.x.toFixed(2)}</div>
                      <div>Y: {point.rotation.y.toFixed(2)}</div>
                    </div>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onTest(point)}
                    className="flex-1 border-slate-300 bg-white text-slate-700 hover:bg-slate-100 dark:border-input dark:bg-background dark:text-slate-100 dark:hover:bg-neutral-800"
                  >
                    <Navigation className="h-4 w-4 mr-2" />
                    Test Navigation
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setConfirmDeleteId(point.id);
                      setConfirmDeleteName(point.name);
                    }}
                    disabled={deletingId === point.id}
                    className="border-slate-300 bg-white text-red-600 hover:bg-red-50 hover:text-red-700"
                  >
                    {deletingId === point.id ? (
                      <div className="h-4 w-4 border-2 border-red-600 border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Trash2 className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="flex justify-end border-t border-slate-200 pt-4 dark:border-slate-800">
          <Button variant="outline" onClick={onClose} className="border-slate-300 bg-white text-slate-700 hover:bg-slate-100 dark:border-input dark:bg-background dark:text-slate-100 dark:hover:bg-neutral-800">
            Close
          </Button>
        </div>
      </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!confirmDeleteId} onOpenChange={() => {
        setConfirmDeleteId(null);
        setConfirmDeleteName('');
      }}>
        <DialogContent className={isDarkMode ? "sm:max-w-md rounded-xl border border-slate-700/80 bg-[#0f1117] shadow-sm text-slate-100" : "sm:max-w-md rounded-xl border border-slate-200 bg-white shadow-sm"}>
          <DialogHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100 dark:bg-red-950/30">
                <AlertTriangle className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <DialogTitle className={isDarkMode ? "text-slate-100" : "text-slate-900"}>Delete Position</DialogTitle>
                <DialogDescription className={isDarkMode ? "text-slate-400" : "text-slate-600"}>
                  This action cannot be undone.
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
          
          <div className="py-4">
            <p className="text-sm text-slate-600 dark:text-slate-400">
              Are you sure you want to delete{' '}
              <span className="font-semibold text-slate-900 dark:text-slate-100">
                {confirmDeleteName}
              </span>
              ? This position will be permanently removed from your tour.
            </p>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                setConfirmDeleteId(null);
                setConfirmDeleteName('');
              }}
              className="border-slate-300 bg-white text-slate-700 hover:bg-slate-100 dark:border-input dark:bg-background dark:text-slate-100 dark:hover:bg-neutral-800"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={!!deletingId}
            >
              {deletingId ? (
                <>
                  <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Deleting...
                </>
              ) : (
                'Delete Position'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
