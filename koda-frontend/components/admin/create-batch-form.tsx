'use client';

import * as React from 'react';
import { CalendarIcon } from 'lucide-react';
import { format, isAfter } from 'date-fns';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Textarea } from '@/components/ui/textarea';

const createBatchSchema = z
  .object({
    batchName: z.string().min(1, 'Batch name is required.'),
    startDate: z.date({ required_error: 'Start date is required.' }),
    endDate: z.date({ required_error: 'End date is required.' }),
    maxInterns: z.coerce
      .number({ required_error: 'Max interns is required.' })
      .min(1, 'Max interns must be at least 1.'),
    description: z.string().optional(),
  })
  .refine((values) => isAfter(values.endDate, values.startDate), {
    message: 'End date must be after start date.',
    path: ['endDate'],
  });

export type CreateBatchFormValues = z.infer<typeof createBatchSchema>;

function formatDateLabel(date?: Date) {
  return date ? format(date, 'PPP') : 'Pick a date';
}

function DatePickerField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value?: Date;
  onChange: (date?: Date) => void;
  placeholder: string;
}) {
  const [open, setOpen] = React.useState(false);

  return (
    <div className="space-y-2">
      <FormLabel>{label}</FormLabel>
      <Popover open={open} onOpenChange={setOpen}>
        <FormControl>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              className={cn(
                'w-full justify-start bg-bg-surface border-border-color text-left font-normal hover:bg-bg-elevated',
                !value && 'text-text-muted'
              )}
            >
              <CalendarIcon className="mr-2 h-4 w-4 shrink-0" />
              {value ? formatDateLabel(value) : placeholder}
            </Button>
          </PopoverTrigger>
        </FormControl>
        <PopoverContent className="w-auto p-0" align="start" sideOffset={8}>
          <Calendar
            mode="single"
            selected={value}
            onSelect={(date) => {
              onChange(date);
              if (date) {
                setOpen(false);
              }
            }}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  );
}

export function CreateBatchForm() {
  const [isMounted, setIsMounted] = React.useState(false);

  React.useEffect(() => {
    setIsMounted(true);
  }, []);

  const form = useForm<CreateBatchFormValues>({
    resolver: zodResolver(createBatchSchema),
    defaultValues: {
      batchName: '',
      startDate: undefined,
      endDate: undefined,
      maxInterns: undefined,
      description: '',
    },
  });

  function onSubmit(values: CreateBatchFormValues) {
    console.log('Create batch form submitted', values);

    toast({
      title: 'Batch submitted',
      description: `${values.batchName} is ready for the next workflow step.`,
    });

    form.reset();
  }

  if (!isMounted) {
    return <div className="py-6 text-sm text-text-muted">Loading form...</div>;
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="batchName"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Batch Name</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  value={field.value ?? ''}
                  placeholder="e.g. Cohort 12"
                  className="bg-bg-surface border-border-color text-text-primary placeholder:text-text-muted"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="startDate"
            render={({ field }) => (
              <FormItem>
                <DatePickerField
                  label="Start Date"
                  value={field.value}
                  placeholder="Choose start date"
                  onChange={(date) => {
                    field.onChange(date);
                    const endDate = form.getValues('endDate');

                    if (date && endDate && isAfter(date, endDate)) {
                      form.setValue('endDate', undefined, { shouldValidate: true });
                    }
                  }}
                />
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="endDate"
            render={({ field }) => (
              <FormItem>
                <DatePickerField
                  label="End Date"
                  value={field.value}
                  placeholder="Choose end date"
                  onChange={field.onChange}
                />
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="maxInterns"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Max Interns</FormLabel>
              <FormControl>
                <Input
                  {...field}
                  type="number"
                  min={1}
                  step={1}
                  value={field.value ?? ''}
                  placeholder="1"
                  className="bg-bg-surface border-border-color text-text-primary placeholder:text-text-muted"
                  onChange={(event) => {
                    const nextValue = event.target.value;
                    field.onChange(nextValue === '' ? undefined : Number(nextValue));
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  {...field}
                  value={field.value ?? ''}
                  placeholder="Optional batch notes, goals, or constraints."
                  className="min-h-28 bg-bg-surface border-border-color text-text-primary placeholder:text-text-muted"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <Button
            type="submit"
            className="bg-accent-primary text-bg-base hover:bg-accent-primary/90"
          >
            Submit
          </Button>
        </div>
      </form>
    </Form>
  );
}

export default CreateBatchForm;