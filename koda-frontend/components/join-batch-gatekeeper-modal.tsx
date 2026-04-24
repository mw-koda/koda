'use client';

import { Button } from '@/components/ui/button';
import { zodResolver } from '@hookform/resolvers/zod';
import { Building2, Hash, Loader2, ShieldCheck } from 'lucide-react';
import { useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

type JoinBatchFormValues = {
  batchCode: string;
  school?: string;
};

const schoolSuggestions = [
  'CIT-U',
  'Cebu Institute of Technology University',
  'University of San Carlos',
  'University of Cebu',
  'University of the Philippines Cebu',
  'Cebu Technological University',
];

interface JoinBatchGatekeeperModalProps {
  isOpen: boolean;
  roleLabel: 'Intern' | 'Coordinator';
  onJoin: (values: JoinBatchFormValues) => Promise<void> | void;
}

export default function JoinBatchGatekeeperModal({
  isOpen,
  roleLabel,
  onJoin,
}: JoinBatchGatekeeperModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const joinBatchSchema = useMemo(
    () =>
      z.object({
        batchCode: z.string().trim().min(1, 'Batch code is required.'),
        school:
          roleLabel === 'Intern'
            ? z.string().trim().min(1, 'School is required.')
            : z.string().trim().optional(),
      }),
    [roleLabel],
  );

  const form = useForm<JoinBatchFormValues>({
    resolver: zodResolver(joinBatchSchema),
    defaultValues: {
      batchCode: '',
      school: '',
    },
    mode: 'onChange',
  });

  const isJoinDisabled = useMemo(() => {
    return isSubmitting || !form.formState.isValid;
  }, [form.formState.isValid, isSubmitting]);

  if (!isOpen) {
    return null;
  }

  const handleQuickSchoolFill = (value: string) => {
    form.setValue('school', value, { shouldValidate: true, shouldDirty: true });
  };

  const handleSubmit = form.handleSubmit(async (values) => {
    setIsSubmitting(true);
    try {
      await onJoin(values);
    } finally {
      setIsSubmitting(false);
    }
  });

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-xl border border-border-color bg-bg-surface p-6 card-glow">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-accent-primary/10">
            <ShieldCheck className="h-7 w-7 text-accent-primary" />
          </div>
          <h2 className="font-display text-2xl font-bold text-text-primary">Join Batch Required</h2>
          <p className="mt-2 text-sm text-text-muted">
            Your {roleLabel.toLowerCase()} account does not have a batch assignment yet.
            {roleLabel === 'Intern'
              ? ' Enter your batch code and school to continue.'
              : ' Enter your batch code to continue.'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label
              htmlFor="batchCode"
              className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-text-muted"
            >
              <Hash className="h-3.5 w-3.5 text-accent-primary" />
              Batch Code
            </label>
            <input
              id="batchCode"
              type="text"
              placeholder="e.g. KODA-SPRING-26"
              autoComplete="off"
              className="w-full rounded-md border border-border-color bg-bg-elevated px-4 py-3 text-text-primary outline-none transition-colors placeholder:text-text-muted/60 focus:border-accent-primary"
              {...form.register('batchCode')}
            />
            {form.formState.errors.batchCode ? (
              <p className="text-xs text-red-400">{form.formState.errors.batchCode.message}</p>
            ) : null}
          </div>

          {roleLabel === 'Intern' ? (
            <div className="space-y-2">
              <label
                htmlFor="school"
                className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.22em] text-text-muted"
              >
                <Building2 className="h-3.5 w-3.5 text-accent-primary" />
                School
              </label>
              <input
                id="school"
                type="text"
                list="koda-school-suggestions"
                placeholder="Type your school"
                autoComplete="off"
                className="w-full rounded-md border border-border-color bg-bg-elevated px-4 py-3 text-text-primary outline-none transition-colors placeholder:text-text-muted/60 focus:border-accent-primary"
                {...form.register('school')}
              />
              <datalist id="koda-school-suggestions">
                {schoolSuggestions.map((school) => (
                  <option key={school} value={school} />
                ))}
              </datalist>
              <div className="flex flex-wrap gap-2 pt-1">
                {schoolSuggestions.slice(0, 4).map((school) => (
                  <button
                    key={school}
                    type="button"
                    onClick={() => handleQuickSchoolFill(school)}
                    className="rounded-full border border-border-color bg-bg-elevated px-2.5 py-1 text-xs text-text-muted transition-colors hover:border-accent-primary/40 hover:text-text-primary"
                  >
                    {school}
                  </button>
                ))}
              </div>
              {form.formState.errors.school ? (
                <p className="text-xs text-red-400">{form.formState.errors.school.message}</p>
              ) : null}
            </div>
          ) : null}

          <Button
            type="submit"
            disabled={isJoinDisabled}
            className="w-full bg-accent-primary text-bg-base hover:bg-accent-secondary disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? (
              <span className="inline-flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Joining...
              </span>
            ) : (
              'Join'
            )}
          </Button>
        </form>
      </div>
    </div>
  );
}