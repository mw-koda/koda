'use client';

import { useEffect, useState } from 'react';
import { Users, Hash, FileText } from "lucide-react";
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
import { getUsers, type ApiUser } from "@/lib/api/users";
import { teamsApi, type TeamDetail } from '@/lib/api/teams';
import { toTitleCase } from '@/lib/utils';

interface CreateTeamModalProps {
  batchId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (team: TeamDetail) => void;
}

export default function CreateTeamModal({ batchId, isOpen, onClose, onSuccess }: CreateTeamModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [adminUsers, setAdminUsers] = useState<ApiUser[]>([]);
  const [isLoadingAdmins, setIsLoadingAdmins] = useState(false);
  const [adminLoadError, setAdminLoadError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [teamLeadId, setTeamLeadId] = useState('');

  useEffect(() => {
    let isMounted = true;

    const loadAdmins = async () => {
      try {
        setIsLoadingAdmins(true);
        setAdminLoadError(null);
        const admins = await getUsers({ role: 'team_lead' });

        if (!isMounted) {
          return;
        }

        setAdminUsers(admins);
      } catch (err: unknown) {
        if (!isMounted) {
          return;
        }

        setAdminLoadError(err instanceof Error ? err.message : 'Failed to load admins');
        setAdminUsers([]);
      } finally {
        if (isMounted) {
          setIsLoadingAdmins(false);
        }
      }
    };

    void loadAdmins();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    if (!teamLeadId && adminUsers.length > 0) {
      setTeamLeadId(adminUsers[0].id);
    }
  }, [adminUsers, teamLeadId]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitError(null);

    const formData = new FormData(e.currentTarget);
    const rawName = formData.get('name') as string;
    const teamName = toTitleCase(rawName);
    
    // Constructing the metadata payload
    const payload = {
<<<<<<< Updated upstream
      name: teamName,
=======
      name: formData.get('name') as string,
      batchId,
>>>>>>> Stashed changes
      description: formData.get('description') as string,
      teamLeadId: teamLeadId || undefined,
      maxInterns: parseInt(formData.get('maxInterns') as string, 10),
    };

    try {
      const team = await teamsApi.create(payload);
      onSuccess(team);
      onClose();
    } catch (error: unknown) {
      setSubmitError(error instanceof Error ? error.message : 'Failed to create team.');
    } finally {
      setIsSubmitting(false);
    }
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

          {/* Team Description */}
          <div className="space-y-2">
            <Label htmlFor="description" className="text-text-muted font-mono text-xs uppercase tracking-wider">
              Short Description
            </Label>
            <div className="relative">
              <Input
                id="description"
                name="description"
                placeholder="e.g. Client onboarding support team"
                required
                className="bg-bg-elevated border-border-color focus:ring-accent-primary pl-10 h-11"
              />
              <FileText className="absolute left-3 top-3.5 h-4 w-4 text-text-muted" />
            </div>
          </div>

          {/* Assign Team Lead */}
          <div className="space-y-2">
            <Label htmlFor="teamLeadId" className="text-text-muted font-mono text-xs uppercase tracking-wider">
              Assign Team Lead
            </Label>
            <Select
              name="teamLeadId"
              required
              value={teamLeadId}
              onValueChange={setTeamLeadId}
              disabled={isLoadingAdmins || adminUsers.length === 0 || Boolean(adminLoadError)}
            >
              <SelectTrigger className="bg-bg-elevated border-border-color h-11">
                <SelectValue
                  placeholder={
                    isLoadingAdmins
                        ? "Loading team leads..."
                      : adminLoadError
                        ? "Unable to load team leads"
                      : adminUsers.length
                      ? "Select team lead"
                        : "No team leads available"
                  }
                />
              </SelectTrigger>
              <SelectContent className="bg-bg-surface border-border-color">
                {adminUsers.map((admin) => (
                  <SelectItem key={admin.id} value={admin.id}>
                    {admin.name ?? admin.github_username ?? admin.email ?? admin.id}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

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

          <DialogFooter className="pt-4 gap-2 sm:gap-0">
            {submitError && (
              <p className="w-full text-sm text-accent-secondary">{submitError}</p>
            )}
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