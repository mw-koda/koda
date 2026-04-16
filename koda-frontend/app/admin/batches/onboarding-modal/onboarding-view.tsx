"use client";

import { Rocket, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

interface AdminOnboardingModalProps {
  isOpen: boolean;
  onOpenBatchCreate: () => void; // Function to trigger the actual creation form
}

export default function AdminOnboardingModal({ isOpen, onOpenBatchCreate }: AdminOnboardingModalProps) {
  return (
    <Dialog open={isOpen}>
      {/* We remove the close button (hideClose) to force the user to initialize */}
      <DialogContent className="max-w-xl border-2 bg-bg-surface/95 backdrop-blur-md border-border-color shadow-2xl">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-2xl bg-accent-primary/10 rotate-3 ring-1 ring-accent-primary/20">
            <Rocket className="h-12 w-12 text-accent-primary -rotate-3" />
          </div>
          <DialogTitle className="text-4xl font-bold tracking-tight text-text-primary font-display">
            System Initialization
          </DialogTitle>
          <DialogDescription className="text-text-muted mt-4 text-lg max-w-sm mx-auto text-center">
            Welcome, Admin. No internship batches are currently registered in the KODA environment.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col gap-6 mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 rounded-lg bg-bg-elevated/50 border border-border-color">
              <h3 className="text-sm font-mono text-accent-secondary mb-1 uppercase tracking-wider">Step 1</h3>
              <p className="text-sm text-text-muted">Configure your first internship batch parameters.</p>
            </div>
            <div className="p-4 rounded-lg bg-bg-elevated/50 border border-border-color opacity-50">
              <h3 className="text-sm font-mono text-text-muted mb-1 uppercase tracking-wider">Step 2</h3>
              <p className="text-sm text-text-muted">Invite coordinators and assign interns.</p>
            </div>
          </div>

          <Button 
            onClick={onOpenBatchCreate}
            className="group w-full bg-accent-primary hover:bg-accent-secondary text-bg-base font-bold h-14 text-xl shadow-lg transition-all duration-300 ease-out hover:-translate-y-0.5"
          >
            <Plus className="mr-2 h-6 w-6 stroke-[3px] transition-transform duration-300 group-hover:rotate-90" />
            Initialize First Batch
          </Button>

          <p className="text-center text-xs text-text-muted font-mono uppercase tracking-widest">
            KODA Framework v1.0.0 // Admin Access
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}