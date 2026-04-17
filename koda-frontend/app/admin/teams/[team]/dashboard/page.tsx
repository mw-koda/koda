'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { teamsApi, type TeamDetail } from '@/lib/api/teams';
import { 
  Activity, 
  AlertCircle, 
  CheckCircle2, 
  Clock, 
  ExternalLink, 
  Zap,
  PanelRightClose,
  PanelRightOpen,
  Terminal
} from 'lucide-react';
import { cn } from '@/lib/utils';

function generateTeamCode(teamId: string) {
  const normalized = teamId.replace(/[^a-z0-9]/gi, '').toUpperCase();
  const prefix = normalized.slice(0, 3).padEnd(3, 'X');
  let hash = 0;
  for (let i = 0; i < normalized.length; i += 1) {
    hash = (hash * 31 + normalized.charCodeAt(i)) % 100000;
  }
  return `${prefix}-${String(hash).padStart(5, '0')}`;
}

export default function AdminTeamDashboardPage() {
  const params = useParams();
  const teamId = params?.team as string;
  const [team, setTeam] = useState<TeamDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); // Toggle State

  useEffect(() => { setIsMounted(true); }, []);

  useEffect(() => {
    if (!isMounted || !teamId) return;
    const loadTeam = async () => {
      try {
        const data = await teamsApi.findOne(teamId);
        setTeam(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load dashboard.');
      } finally {
        setIsLoading(false);
      }
    };
    void loadTeam();
  }, [isMounted, teamId]);

  if (!isMounted || isLoading) return <div className="p-8 text-text-muted font-mono animate-pulse">Initializing System...</div>;
  if (!team || error) return <div className="p-8 text-red-500 font-mono">Error: {error ?? 'Link Terminal Offline'}</div>;

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  });

  const issues = [
    { id: 1, title: "Add rate limiting to API endpoints", repo: "motawatt/koda-api", user: "Karl", status: "open" },
    { id: 2, title: "Fix memory leak in data processing pipeline", repo: "motawatt/koda-engine", user: "S. Nakamura", status: "open" },
    { id: 3, title: "Add unit tests for auth module", repo: "motawatt/koda-ui", user: "J. Doe", status: "open" },
  ];

  const logs = [
    { type: 'DEPLOYMENT', message: 'Updated database schema', time: '12m ago' },
    { type: 'SYSTEM', message: 'Team initialization complete', time: '1h ago' },
    { type: 'ACCESS', message: 'Karl modified permissions', time: '3h ago' },
  ];

  return (
    <div className="flex h-full min-h-screen bg-transparent transition-all duration-500 ease-in-out">
      {/* MAIN CONTENT AREA */}
      <div className={cn(
        "flex-1 p-8 space-y-8 transition-all duration-500",
        isSidebarOpen ? "pr-4" : "pr-8"
      )}>
        <div className="flex justify-between items-start">
          <div className="flex flex-col gap-1">
            <h1 className="text-4xl font-display font-bold text-text-primary tracking-tight">
              {team.name} Dashboard
            </h1>
            <div className="flex items-center gap-4 mt-2">
              <p className="text-[10px] font-mono uppercase tracking-[0.3em] text-accent-primary">
                TEAM CODE: {generateTeamCode(team.id)}
              </p>
              <span className="text-text-muted/30">|</span>
              <p className="text-xs font-mono text-text-muted uppercase tracking-widest">{today}</p>
            </div>
          </div>
          
          <Button 
            variant="outline" 
            size="icon" 
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="border-border-color bg-bg-surface hover:bg-bg-elevated"
          >
            {isSidebarOpen ? <PanelRightClose className="h-4 w-4" /> : <PanelRightOpen className="h-4 w-4" />}
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <MetricCard label="Open Issues" value="3" subtext="Needs assignment" icon={<AlertCircle className="h-4 w-4 text-accent-primary" />} />
          <MetricCard label="In Progress" value="0" subtext="Currently tracked" icon={<Clock className="h-4 w-4 text-yellow-500" />} />
          <MetricCard label="Closed Issues" value="0" subtext="Closed this cycle" icon={<CheckCircle2 className="h-4 w-4 text-green-500" />} />
          <MetricCard label="High Priority" value="0" subtext="Escalated items" icon={<Zap className="h-4 w-4 text-red-500" />} />
        </div>

        <Card className="bg-bg-surface border-border-color shadow-2xl">
          <CardHeader className="flex flex-row items-center justify-between border-b border-border-color/50 pb-4">
            <CardTitle className="text-lg font-display flex items-center gap-2 text-white">
              <Activity className="h-4 w-4 text-white/80" /> 
              Recent Issue Updates
            </CardTitle>
            <Button asChild variant="ghost" size="sm" className="text-accent-secondary text-[10px] uppercase font-mono tracking-tighter">
              <Link href={`/admin/teams/${team.id}/issue-tracking`}>
                View All <ExternalLink className="ml-2 h-3 w-3" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            <div className="divide-y divide-border-color/30">
              {issues.map((issue) => (
                <div key={issue.id} className="group flex items-center justify-between p-4 hover:bg-bg-elevated/40 transition-all">
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-text-primary group-hover:text-accent-primary transition-colors">{issue.title}</p>
                    <div className="flex items-center gap-2 text-[10px] font-mono text-text-muted uppercase tracking-wider">
                      <span>{issue.repo}</span><span>•</span><span className="text-text-muted/80">{issue.user}</span>
                    </div>
                  </div>
                  <Badge className="bg-accent-primary/10 text-accent-primary border-accent-primary/20 text-[10px] font-mono uppercase">{issue.status}</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* ACTIVITY LOG SIDE PANEL */}
      <div className={cn(
        "bg-bg-surface border-l border-border-color transition-all duration-500 ease-in-out overflow-hidden flex flex-col",
        isSidebarOpen ? "w-[350px] opacity-100" : "w-0 opacity-0 border-none"
      )}>
        <div className="p-6 border-b border-border-color flex items-center gap-2">
          <Terminal className="h-4 w-4 text-accent-primary" />
          <h2 className="text-xs font-mono font-bold uppercase tracking-[0.2em] text-text-primary">Activity Log</h2>
        </div>
        
        <div className="flex-1 overflow-y-auto p-6 space-y-8">
          {logs.map((log, i) => (
            <div key={i} className="relative pl-6 border-l border-border-color/50 space-y-1">
              <div className="absolute -left-[5px] top-0 h-2 w-2 rounded-full bg-accent-primary/50 shadow-[0_0_8px_rgba(var(--accent-primary-rgb),0.5)]" />
              <p className="text-[10px] font-mono font-bold text-text-primary tracking-widest">{log.type}</p>
              <p className="text-xs text-text-muted leading-relaxed">{log.message}</p>
              <p className="text-[9px] font-mono text-text-muted/50 uppercase">{log.time}</p>
            </div>
          ))}
        </div>

        <div className="p-6 border-t border-border-color bg-bg-elevated/20">
          <Link 
            href="#" 
            className="flex items-center justify-center gap-2 text-[10px] font-mono font-bold text-accent-primary uppercase tracking-[0.2em] hover:text-white transition-colors"
          >
            Full System Report <ExternalLink className="h-3 w-3" />
          </Link>
        </div>
      </div>
    </div>
  );
}

function MetricCard({ label, value, subtext, icon }: { label: string; value: string; subtext: string; icon: React.ReactNode }) {
  return (
    <Card className="bg-bg-surface/50 border-border-color backdrop-blur-sm group hover:border-accent-primary/40 transition-all duration-300">
      <CardContent className="pt-6">
        <div className="flex items-center justify-between mb-4">
          <p className="text-[10px] font-mono text-text-muted uppercase tracking-[0.2em]">{label}</p>
          {icon}
        </div>
        <div className="text-4xl font-bold text-text-primary tracking-tight group-hover:scale-105 transition-transform duration-300">{value}</div>
        <p className="text-[10px] text-text-muted mt-2 font-mono uppercase tracking-tighter opacity-70">{subtext}</p>
      </CardContent>
    </Card>
  );
}