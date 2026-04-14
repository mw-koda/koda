'use client';

import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from '@/components/ui/table';
import { users as initialUsers, type User } from '@/lib/mock-data';
import { zodResolver } from '@hookform/resolvers/zod';
import { Github, PencilLine, Plus } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

type UserFormValues = {
  name: string;
  github: string;
  role: User['role'];
  status: User['status'];
  school?: string;
};

const userFormSchema = z
  .object({
    name: z.string().trim().min(1, 'Name is required.'),
    github: z.string().trim().min(1, 'GitHub username is required.'),
    role: z.enum(['admin', 'coordinator', 'intern']),
    status: z.enum(['active', 'pending', 'inactive']),
    school: z.string().trim().optional(),
  })
  .superRefine((values, ctx) => {
    if (values.role === 'coordinator' && !values.school) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ['school'],
        message: 'Coordinator school is required.',
      });
    }
  });

const roleOptions: Array<{ value: User['role']; label: string }> = [
  { value: 'admin', label: 'Admin' },
  { value: 'coordinator', label: 'Coordinator' },
  { value: 'intern', label: 'Intern' },
];

const coordinatorSchoolSuggestions = [
  'Ateneo de Manila University',
  'De La Salle University',
  'University of the Philippines Diliman',
  'University of Santo Tomas',
  'Mapua University',
  'Polytechnic University of the Philippines',
  'Far Eastern University',
  'Adamson University',
  'Pamantasan ng Lungsod ng Maynila',
  'National University',
  'San Beda University',
  'Centro Escolar University',
];

function getRoleBadgeVariant(role: User['role']) {
  switch (role) {
    case 'admin':
      return 'bg-purple-500/10 text-purple-500 border-purple-500/20';
    case 'coordinator':
      return 'bg-blue-500/10 text-blue-500 border-blue-500/20';
    case 'intern':
      return 'bg-accent-primary/10 text-accent-primary border-accent-primary/20';
    default:
      return 'bg-text-muted/10 text-text-muted border-text-muted/20';
  }
}

function getStatusBadgeVariant(status: User['status']) {
  switch (status) {
    case 'active':
      return 'bg-accent-primary/10 text-accent-primary border-accent-primary/20';
    case 'pending':
      return 'bg-accent-warning/10 text-accent-warning border-accent-warning/20';
    case 'inactive':
      return 'bg-text-muted/10 text-text-muted border-text-muted/20';
    default:
      return 'bg-text-muted/10 text-text-muted border-text-muted/20';
  }
}

function formatRoleLabel(role: User['role']) {
  return role.charAt(0).toUpperCase() + role.slice(1);
}

function formatStatusLabel(status: User['status']) {
  return status.charAt(0).toUpperCase() + status.slice(1);
}

function buildAvatarInitials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('')
    .slice(0, 2) || 'U';
}

function getDefaultValues(user: User | null): UserFormValues {
  if (!user) {
    return {
      name: '',
      github: '',
      role: 'intern',
      status: 'active',
      school: '',
    };
  }

  return {
    name: user.name,
    github: user.github,
    role: user.role,
    status: user.status,
    school: '',
  };
}

function UserDialog({
  open,
  user,
  onOpenChange,
  onSave,
}: {
  open: boolean;
  user: User | null;
  onOpenChange: (open: boolean) => void;
  onSave: (values: UserFormValues) => void;
}) {
  const form = useForm<UserFormValues>({
    resolver: zodResolver(userFormSchema),
    defaultValues: getDefaultValues(user),
  });
  const selectedRole = form.watch('role');
  const schoolQuery = (form.watch('school') ?? '').trim();
  const schoolMatches = useMemo(() => {
    if (selectedRole !== 'coordinator' || schoolQuery.length === 0) {
      return [];
    }

    const normalizedQuery = schoolQuery.toLowerCase();

    return coordinatorSchoolSuggestions
      .map((school) => {
        const normalizedSchool = school.toLowerCase();
        const startsWith = normalizedSchool.startsWith(normalizedQuery);
        const includes = normalizedSchool.includes(normalizedQuery);
        const score = startsWith ? 3 : includes ? 2 : 0;
        return { school, score };
      })
      .filter((entry) => entry.score > 0)
      .sort((a, b) => {
        if (a.score !== b.score) {
          return b.score - a.score;
        }

        return a.school.localeCompare(b.school);
      })
      .map((entry) => entry.school)
      .slice(0, 5);
  }, [schoolQuery, selectedRole]);
  const closestSchool = schoolMatches[0] ?? null;
  const closestMatchStart = closestSchool
    ? closestSchool.toLowerCase().indexOf(schoolQuery.toLowerCase())
    : -1;

  useEffect(() => {
    if (open) {
      form.reset(getDefaultValues(user));
    }
  }, [form, open, user]);

  return (
    <Dialog
      open={open}
      onOpenChange={(nextOpen) => {
        onOpenChange(nextOpen);
        if (!nextOpen) {
          form.reset(getDefaultValues(null));
        }
      }}
    >
      <DialogContent className="bg-bg-surface border-border-color text-text-primary sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="font-mono text-2xl">
            {user ? 'Edit User' : 'Add User'}
          </DialogTitle>
          <DialogDescription className="text-text-muted">
            Update the account profile, GitHub handle, role, and access status.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form
            className="grid gap-4"
            onSubmit={form.handleSubmit((values) => {
              onSave(values);
              form.reset(getDefaultValues(null));
            })}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Name</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Alyssa Harper" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="github"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>GitHub Username</FormLabel>
                    <div className="relative">
                      <Github className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                      <FormControl>
                        <Input {...field} className="pl-10 font-mono" placeholder="alyssaharper" />
                      </FormControl>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Role</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a role" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {roleOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select a status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="pending">Pending</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {selectedRole === 'coordinator' && (
              <div className="animate-in fade-in-0 slide-in-from-top-1 duration-200">
                <FormField
                  control={form.control}
                  name="school"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Coordinator School</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          className="selection:bg-accent-primary/30 selection:text-text-primary focus-visible:ring-1 focus-visible:ring-accent-primary/40"
                          autoComplete="off"
                          placeholder="Mountain Ridge High School"
                          onChange={(event) => {
                            const nextValue = event.target.value;
                            field.onChange(nextValue);

                            const normalizedNextValue = nextValue.trim().toLowerCase();
                            if (!normalizedNextValue) {
                              return;
                            }

                            const startsWithMatch = coordinatorSchoolSuggestions.find((school) =>
                              school.toLowerCase().startsWith(normalizedNextValue)
                            );

                            if (
                              startsWithMatch &&
                              startsWithMatch.toLowerCase() !== normalizedNextValue
                            ) {
                              const inputElement = event.currentTarget;
                              form.setValue('school', startsWithMatch, {
                                shouldDirty: true,
                                shouldTouch: true,
                                shouldValidate: true,
                              });
                              requestAnimationFrame(() => {
                                inputElement.setSelectionRange(nextValue.length, startsWithMatch.length);
                              });
                            }
                          }}
                          onKeyDown={(event) => {
                            if (
                              event.key === 'Tab' &&
                              closestSchool &&
                              schoolQuery.length > 0 &&
                              closestSchool.toLowerCase() !== schoolQuery.toLowerCase()
                            ) {
                              event.preventDefault();
                              form.setValue('school', closestSchool, {
                                shouldDirty: true,
                                shouldTouch: true,
                                shouldValidate: true,
                              });
                            }
                          }}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            <DialogFooter className="mt-2 gap-2 sm:gap-2">
              <Button
                type="button"
                variant="outline"
                className="border-border-color bg-bg-surface text-text-primary hover:bg-bg-elevated"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-accent-primary text-bg-base hover:bg-accent-secondary"
              >
                {user ? 'Save Changes' : 'Create User'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

export default function AdminUserManagementPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [users, setUsers] = useState<User[]>(initialUsers);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  if (!isMounted) {
    return <div className="p-8 text-text-muted">Loading user management...</div>;
  }

  const activeUsers = users.filter((user) => user.status === 'active');
  const pendingUsers = users.filter((user) => user.status === 'pending');
  const adminUsers = users.filter((user) => user.role === 'admin');

  const openCreateDialog = () => {
    setEditingUser(null);
    setIsDialogOpen(true);
  };

  const openEditDialog = (user: User) => {
    setEditingUser(user);
    setIsDialogOpen(true);
  };

  const handleSaveUser = (values: UserFormValues) => {
    const nextUser: User = {
      id: editingUser?.id ?? `user-${Date.now()}`,
      name: values.name,
      github: values.github,
      role: values.role,
      status: values.status,
      joinedAt: editingUser?.joinedAt ?? new Date().toISOString().slice(0, 10),
      avatarInitials: buildAvatarInitials(values.name),
      organizationId: editingUser?.organizationId,
    };

    setUsers((currentUsers) => {
      const existingIndex = currentUsers.findIndex((user) => user.id === nextUser.id);

      if (existingIndex === -1) {
        return [nextUser, ...currentUsers];
      }

      const updatedUsers = [...currentUsers];
      updatedUsers[existingIndex] = nextUser;
      return updatedUsers;
    });

    setIsDialogOpen(false);
    setEditingUser(null);
  };

  return (
    <div className="p-8">
      <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-mono uppercase tracking-[0.35em] text-accent-secondary">
            Admin Console
          </p>
          <h1 className="mt-2 text-4xl font-mono font-bold text-text-primary">
            User Management
          </h1>
          <p className="mt-3 max-w-2xl text-text-muted">
            Manage every KODA account from one place. Add new users, edit roles,
            and keep access status in sync with the team structure.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button
            asChild
            variant="outline"
            className="border-border-color bg-bg-surface text-text-primary hover:bg-bg-elevated"
          >
            <Link href="/admin/dashboard">View Dashboard</Link>
          </Button>
          <Button
            onClick={openCreateDialog}
            className="bg-accent-primary text-bg-base hover:bg-accent-secondary"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add User
          </Button>
        </div>
      </div>

      <div className="mb-8 grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card className="bg-bg-surface border-border-color p-5 card-glow">
          <p className="text-sm text-text-muted">Total Users</p>
          <p className="mt-2 text-3xl font-mono font-bold text-text-primary">
            {users.length}
          </p>
        </Card>
        <Card className="bg-bg-surface border-border-color p-5 card-glow">
          <p className="text-sm text-text-muted">Active</p>
          <p className="mt-2 text-3xl font-mono font-bold text-text-primary">
            {activeUsers.length}
          </p>
        </Card>
        <Card className="bg-bg-surface border-border-color p-5 card-glow">
          <p className="text-sm text-text-muted">Pending / Admins</p>
          <p className="mt-2 text-3xl font-mono font-bold text-text-primary">
            {pendingUsers.length} / {adminUsers.length}
          </p>
        </Card>
      </div>

      <Card className="overflow-hidden border-border-color bg-bg-surface">
        <div className="flex flex-col gap-2 border-b border-border-color px-6 py-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-xl font-mono font-semibold text-text-primary">
              Directory
            </h2>
            <p className="text-sm text-text-muted">
              Click Edit on any row to open the add/edit dialog.
            </p>
          </div>
          <p className="text-xs font-mono uppercase tracking-[0.3em] text-text-muted">
            {users.length} records
          </p>
        </div>

        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>GitHub</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {users.map((user) => (
              <TableRow key={user.id} className="group">
                <TableCell>
                  <div className="flex items-center gap-3">
                    <Avatar className="h-11 w-11 border border-border-color bg-bg-elevated">
                      <AvatarFallback className="bg-accent-primary/10 text-accent-primary font-mono font-semibold">
                        {user.avatarInitials}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-text-primary">
                        {user.name}
                      </p>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(user)}
                        className="mt-1 h-auto p-0 text-xs text-accent-secondary opacity-80 transition-opacity hover:bg-transparent hover:text-accent-primary group-hover:opacity-100"
                      >
                        <PencilLine className="mr-1 h-3.5 w-3.5" />
                        Edit user
                      </Button>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <a
                    href={`https://github.com/${user.github}`}
                    target="_blank"
                    rel="noreferrer"
                    className="font-mono text-sm text-accent-secondary transition-colors hover:text-accent-primary"
                  >
                    @{user.github}
                  </a>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className={getRoleBadgeVariant(user.role)}>
                    {formatRoleLabel(user.role)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={getStatusBadgeVariant(user.status)}
                  >
                    {formatStatusLabel(user.status)}
                  </Badge>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Card>

      <UserDialog
        open={isDialogOpen}
        user={editingUser}
        onOpenChange={(nextOpen) => {
          setIsDialogOpen(nextOpen);
          if (!nextOpen) {
            setEditingUser(null);
          }
        }}
        onSave={handleSaveUser}
      />
    </div>
  );
}