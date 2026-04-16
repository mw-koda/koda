'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { 
  ChevronLeft, 
  Users, 
  Settings, 
  MessageSquare, 
  ShieldCheck, 
  Zap,
  MoreVertical,
  Activity,
  Terminal,
  ExternalLink
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

export default function TeamPage({ params }: { params: { team: string } }) {
  // Logic: 'params.team' corresponds to the [team] folder name (the ID)
  const teamId = params.team;

  // Placeholder state - Replace with your teamsApi.findOne(teamId) call
  const [teamData, setTeamData] = useState({
    name: "Database Team Alpha",
    id: teamId,
    specialization: "Backend Systems",
    batch: "Cohort 2026-A",
    progress: 68,
    status: "Active",
    members: [
      { id: '1', name: 'Karl', role: 'Lead', initial: 'K' },
      { id: '2', name: 'S. Nakamura', role: 'Intern', initial: 'SN' },
      { id: '3', name: 'J. Doe', role: 'Intern', initial: 'JD' },
    ]
  });

  return (
    <div className="p-8 space-y-8 animate-in fade-in slide-in-from-bottom-2 duration-500">
      
      {/* TOP NAVIGATION / BREADCRUMBS */}
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-4">
          <Button asChild variant="ghost" size="sm" className="text-text-muted hover:text-text-primary group">
            <Link href="/admin/batches">
              <ChevronLeft className="mr-2 h-4 w-4 transition-transform group-hover:-translate-x-1" />
              Back to Batch
            </Link>
          </Button>
          <div className="h-4 w-[1px] bg-border-color" />
          <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-widest text-text-muted">
            <Terminal className="h-3 w-3" />
            System / Teams / {teamId}
          </div>
        </div>

        {/* HEADER SECTION */}
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <h1 className="text-4xl font-display font-bold text-text-primary tracking-tight">
              {teamData.name}
            </h1>
            <div className="mt-2 flex items-center gap-3">
              <Badge variant="outline" className="bg-accent-primary/5 border-accent-primary/30 text-accent-primary font-mono text-[10px]">
                {teamData.specialization}
              </Badge>
              <span className="text-text-muted text-sm">•</span>
              <span className="text-text-muted text-sm font-medium">{teamData.batch}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button variant="outline" className="border-border-color bg-bg-surface hover:bg-bg-elevated gap-2">
              <Settings className="h-4 w-4" />
              Configure
            </Button>
            <Button className="bg-accent-primary hover:bg-accent-secondary text-white font-bold gap-2 shadow-lg shadow-accent-primary/20">
              <MessageSquare className="h-4 w-4" />
              Sync Team
            </Button>
          </div>
        </div>
      </div>

      <div className="grid gap-6 grid-cols-1 lg:grid-cols-12">
        
        {/* LEFT COLUMN: TEAM OVERVIEW (8 Cols) */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* CORE METRICS */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="border-border-color bg-bg-surface/50 backdrop-blur-sm">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-xs font-mono text-text-muted uppercase">Velocity</p>
                  <Zap className="h-4 w-4 text-yellow-500" />
                </div>
                <div className="text-3xl font-bold text-text-primary">{teamData.progress}%</div>
                <Progress value={teamData.progress} className="h-1 mt-4 bg-border-color" />
              </CardContent>
            </Card>

            <Card className="border-border-color bg-bg-surface/50 backdrop-blur-sm">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-xs font-mono text-text-muted uppercase">Resources</p>
                  <Users className="h-4 w-4 text-accent-primary" />
                </div>
                <div className="text-3xl font-bold text-text-primary">{teamData.members.length}</div>
                <p className="text-[10px] text-text-muted mt-2 uppercase tracking-tighter">Assigned Personnel</p>
              </CardContent>
            </Card>

            <Card className="border-border-color bg-bg-surface/50 backdrop-blur-sm">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-xs font-mono text-text-muted uppercase">Integrity</p>
                  <ShieldCheck className="h-4 w-4 text-green-500" />
                </div>
                <div className="text-3xl font-bold text-text-primary">Nominal</div>
                <p className="text-[10px] text-text-muted mt-2 uppercase tracking-tighter">Status Stable</p>
              </CardContent>
            </Card>
          </div>

          {/* MEMBER ROSTER */}
          <Card className="border-border-color bg-bg-surface shadow-xl">
            <CardHeader className="border-b border-border-color/50">
              <CardTitle className="text-lg font-display">Personnel Roster</CardTitle>
              <CardDescription className="font-mono text-[11px]">Authorized members for this team environment.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-border-color/50">
                {teamData.members.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-4 hover:bg-bg-elevated/30 transition-all">
                    <div className="flex items-center gap-4">
                      <Avatar className="h-9 w-9 border border-border-color ring-2 ring-transparent group-hover:ring-accent-primary/20 transition-all">
                        <AvatarFallback className="bg-bg-elevated text-accent-primary text-xs font-bold">
                          {member.initial}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="text-sm font-semibold text-text-primary">{member.name}</p>
                        <p className="text-[10px] font-mono text-text-muted uppercase tracking-wider">{member.role}</p>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-text-muted hover:text-text-primary">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT COLUMN: SYSTEM FEED (4 Cols) */}
        <div className="lg:col-span-4">
          <Card className="border-border-color bg-bg-surface h-full border-l-2 border-l-accent-primary/30">
            <CardHeader>
              <CardTitle className="text-xs font-mono uppercase tracking-[0.2em] flex items-center gap-2 text-text-muted">
                <Activity className="h-4 w-4 text-accent-primary" />
                Activity Log
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {[
                { label: "Deployment", desc: "Updated database schema", time: "12m ago" },
                { label: "System", desc: "Team initialization complete", time: "1h ago" },
                { label: "Access", desc: "Karl modified permissions", time: "3h ago" }
              ].map((item, i) => (
                <div key={i} className="group relative pl-4 border-l border-border-color hover:border-accent-primary transition-colors">
                  <div className="absolute -left-[4.5px] top-0 h-2 w-2 rounded-full bg-border-color group-hover:bg-accent-primary transition-colors" />
                  <p className="text-xs font-bold text-text-primary uppercase tracking-tight">{item.label}</p>
                  <p className="text-xs text-text-muted mt-1 leading-relaxed">{item.desc}</p>
                  <p className="text-[9px] font-mono text-text-muted/60 mt-2">{item.time}</p>
                </div>
              ))}
              <Button variant="ghost" className="w-full mt-4 text-[10px] uppercase font-mono tracking-widest text-accent-primary hover:bg-accent-primary/5">
                Full System Report <ExternalLink className="ml-2 h-3 w-3" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}