"use client";

import { Rocket, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

export default function AdminOnboardingView() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] p-4">
      <Card className="max-w-xl w-full border-dashed border-2 bg-bg-surface/30 card-glow border-border-color backdrop-blur-sm motion-safe:animate-in motion-safe:fade-in-0 motion-safe:slide-in-from-bottom-4 motion-safe:duration-700">
        <CardHeader className="text-center">
          <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-2xl bg-accent-primary/10 rotate-3 ring-1 ring-accent-primary/20">
            <Rocket className="h-12 w-12 text-accent-primary -rotate-3" />
          </div>
          <CardTitle className="text-4xl font-bold tracking-tight text-text-primary font-display">
            System Initialization
          </CardTitle>
          <CardDescription className="text-text-muted mt-4 text-lg max-w-sm mx-auto">
            Welcome, Admin. No internship batches are currently registered in the KODA environment.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="flex flex-col gap-6 mt-4">
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

          <Dialog>
            <DialogTrigger asChild>
              <Button className="group w-full bg-accent-primary hover:bg-accent-secondary text-bg-base font-bold h-14 text-xl shadow-lg hover:shadow-[0_16px_38px_-18px_rgba(34,197,94,0.85)] transition-all duration-300 ease-out hover:-translate-y-0.5 active:translate-y-0 active:scale-[0.99] focus-visible:ring-2 focus-visible:ring-accent-primary/60 focus-visible:ring-offset-2 focus-visible:ring-offset-bg-surface">
                <Plus className="mr-2 h-6 w-6 stroke-[3px] transition-transform duration-300 group-hover:rotate-90" />
                Initialize First Batch
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-bg-surface border-border-color text-text-primary">
              <DialogHeader>
                <DialogTitle>Create First Batch</DialogTitle>
                <DialogDescription>
                  Batch configuration is part of the upcoming Batch Management scope. This modal confirms the onboarding handoff is wired.
                </DialogDescription>
              </DialogHeader>
              {/* Form will be added in the Batch Management task. */}
            </DialogContent>
          </Dialog>
          
          <p className="text-center text-xs text-text-muted font-mono uppercase tracking-widest">
            KODA Framework v1.0.0 // Admin Access
          </p>
        </CardContent>
      </Card>
    </div>
  );
}