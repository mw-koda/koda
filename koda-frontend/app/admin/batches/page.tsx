'use client';

import { useEffect, useState } from 'react';
import { Plus } from 'lucide-react';

import { CreateBatchForm } from '@/components/admin/create-batch-form';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  } from '@/components/ui/dialog';

export default function AdminBatchesPage() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return <div className="p-8 text-text-muted">Loading batches...</div>;
  }

  return (
    <div className="p-8">
      <Card className="card-glow border-border-color bg-bg-surface">
        <CardHeader>
          <CardTitle className="font-display text-3xl text-text-primary">
            Batch Management
          </CardTitle>
          <CardDescription className="text-text-muted">
            Create a new internship batch with the modal form below.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Dialog>
            <DialogTrigger asChild>
              <Button className="bg-accent-primary text-bg-base hover:bg-accent-primary/90">
                <Plus className="mr-2 h-4 w-4" />
                Create Batch
              </Button>
            </DialogTrigger>
            <DialogContent className="w-[calc(100vw-2rem)] max-h-[calc(100vh-2rem)] overflow-hidden border-border-color bg-bg-surface p-0 text-text-primary sm:max-w-3xl">
              <div className="max-h-[calc(100vh-2rem)] overflow-y-auto p-6 sm:p-8">
                <DialogHeader className="mb-6 text-left">
                  <DialogTitle className="text-2xl font-display text-text-primary">
                    Create Batch
                  </DialogTitle>
                  <DialogDescription className="text-text-muted">
                    Provide the batch details below. Dates are validated so the end date must come after the start date.
                  </DialogDescription>
                </DialogHeader>
                <CreateBatchForm />
              </div>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  );
}