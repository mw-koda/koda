'use client';

import { useState } from 'react';
import { Users, Hash, Building2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

// Define the Team Type for strict metadata consistency
export type TeamType = 'Database Team' | 'GHL Team' | 'Scraping Team' | 'Agentic Rag';

interface CreateTeamModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (payload: any) => void;
}

export default function CreateTeamModal({ isOpen, onClose, onSuccess }: CreateTeamModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData(e.currentTarget);
    
    // Constructing the metadata payload
    const payload = {
      name: formData.get('name') as string,
      team: formData.get('teamType') as TeamType,
      maxInterns: parseInt(formData.get('maxInterns') as string, 10),
      organizationId: (formData.get('organizationId') as string) || undefined,
    };

    // Simulate API call (Replace with your actual teamsApi.create call later)
    console.log('Finalizing Team Initialization:', payload);
    
    setTimeout(() => {
      setIsSubmitting(false);
      onSuccess(payload);
      onClose();
    }, 800);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px] bg-bg-surface border-border-color shadow-2xl backdrop-blur-md">
        <DialogHeader>
          <DialogTitle className="text-2xl font-display font-bold text-text-primary flex items-center gap-2">
            <Users className="text-accent-primary h-6 w-6" />
            Create New Team
          </DialogTitle>
          <DialogDescription className="text-text-muted">
            Define the project scope and intern capacity for this team.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          {/* Team Name */}
          <div className="space-y-2">
            <Label htmlFor="name" className="text-text-muted font-mono text-xs uppercase tracking-wider">
              Team Name
            </Label>
            <div className="relative">
              <Input
                id="name"
                name="name"
                placeholder="e.g. Alpha Squad"
                required
                className="bg-bg-elevated border-border-color focus:ring-accent-primary pl-10 h-11"
              />
              <Hash className="absolute left-3 top-3.5 h-4 w-4 text-text-muted" />
            </div>
          </div>

          {/* Team Type (Specialization Metadata) */}
          <div className="space-y-2">
            <Label htmlFor="teamType" className="text-text-muted font-mono text-xs uppercase tracking-wider">
              Specialization
            </Label>
            <Select name="teamType" required defaultValue="Database Team">
              <SelectTrigger className="bg-bg-elevated border-border-color h-11">
                <SelectValue placeholder="Select team type" />
              </SelectTrigger>
              <SelectContent className="bg-bg-surface border-border-color">
                <SelectItem value="Database Team">Database Team</SelectItem>
                <SelectItem value="GHL Team">GHL Team</SelectItem>
                <SelectItem value="Scraping Team">Scraping Team</SelectItem>
                <SelectItem value="Agentic Rag">Agentic Rag</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Capacity */}
            <div className="space-y-2">
              <Label htmlFor="maxInterns" className="text-text-muted font-mono text-xs uppercase tracking-wider">
                Capacity
              </Label>
              <div className="relative">
                <Input
                  id="maxInterns"
                  name="maxInterns"
                  type="number"
                  placeholder="5"
                  required
                  min="1"
                  className="bg-bg-elevated border-border-color pl-10 h-11"
                />
                <Users className="absolute left-3 top-3.5 h-4 w-4 text-text-muted" />
              </div>
            </div>

            {/* Organization ID */}
            <div className="space-y-2">
              <Label htmlFor="organizationId" className="text-text-muted font-mono text-xs uppercase tracking-wider">
                Org ID (Optional)
              </Label>
              <div className="relative">
                <Input
                  id="organizationId"
                  name="organizationId"
                  placeholder="ORG-01"
                  className="bg-bg-elevated border-border-color pl-10 h-11"
                />
                <Building2 className="absolute left-3 top-3.5 h-4 w-4 text-text-muted" />
              </div>
            </div>
          </div>

          <DialogFooter className="pt-4 gap-2 sm:gap-0">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="text-text-muted hover:text-text-primary hover:bg-bg-elevated"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="bg-accent-primary hover:bg-accent-secondary text-white font-bold px-8 transition-all"
            >
              {isSubmitting ? 'Initializing...' : 'Create Team'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}