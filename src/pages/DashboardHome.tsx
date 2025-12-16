import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { BarChart, CreditCard, FileText, AlertTriangle, ArrowRight } from 'lucide-react';
import { api } from '@/lib/api-client';
import type { GuardianScreenConfig, BackgroundCheck, PaginatedResponse } from '@shared/types';
import { StatusBadge } from '@/components/ui/status-badge';
import { formatDistanceToNow } from 'date-fns';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ResponsiveContainer, AreaChart, Area } from 'recharts';
const MOCK_CHART_DATA = Array.from({ length: 30 }, (_, i) => ({
  day: i,
  searches: Math.floor(Math.random() * (20 - 5 + 1) + 5),
}));
function maskName(name: string): string {
    if (!name) return 'Unknown';
    const parts = name.split(' ');
    if (parts.length > 1) {
        return `${parts[0][0]}*** ${parts[parts.length - 1][0]}***`;
    }
    return `${name[0]}***`;
}
function StatCard({ title, value, icon: Icon, description, isLoading }: { title: string; value: string | number; icon: React.ElementType; description: string; isLoading?: boolean; }) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <>
            <Skeleton className="h-8 w-24 mt-1" />
            <Skeleton className="h-4 w-40 mt-2" />
          </>
        ) : (
          <>
            <div className="text-2xl font-bold">{value}</div>
            <p className="text-xs text-muted-foreground">{description}</p>
          </>
        )}
      </CardContent>
    </Card>
  );
}
export function DashboardHome() {
  const { data: config, isLoading: isConfigLoading, error: configError } = useQuery<GuardianScreenConfig>({
    queryKey: ['config'],
    queryFn: () => api('/api/config'),
  });
  const { data: checksData, isLoading: areChecksLoading, error: checksError } = useQuery<PaginatedResponse<BackgroundCheck>>({
    queryKey: ['checks', { limit: 5 }],
    queryFn: () => api('/api/checks?limit=5'),
  });
  const totalChecks = checksData?.items?.length || 0; // This is just for the current page, a real app would have a total count endpoint.
  const recentHits = checksData?.items?.filter(c => c.status === 'Hit').length || 0;
  const error = configError || checksError;
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="py-8 md:py-10 lg:py-12 space-y-8">
        <div className="flex flex-col md:flex-row justify-between md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Mission Control</h1>
            <p className="text-muted-foreground">Welcome back, here's a summary of your operations.</p>
          </div>
          <Link to="/investigation">
            <Button>
              New Investigation <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
        {error && (
          <Alert variant="destructive">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>Error</AlertTitle>
            <AlertDescription>{error.message}</AlertDescription>
          </Alert>
        )}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <StatCard title="Credits Remaining" value={config?.credits ?? '...'} icon={CreditCard} description="Credits for new checks" isLoading={isConfigLoading} />
          <StatCard title="Total Checks" value={totalChecks} icon={FileText} description="In the last 30 days" isLoading={areChecksLoading} />
          <StatCard title="Recent Hits" value={recentHits} icon={AlertTriangle} description="Potential flags found" isLoading={areChecksLoading} />
          <StatCard title="Compliance Score" value="98.7%" icon={BarChart} description="Based on audit log activity" isLoading={false} />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
          <Card className="lg:col-span-4">
            <CardHeader>
              <CardTitle>Search Volume</CardTitle>
              <CardDescription>Your background check volume over the last 30 days.</CardDescription>
            </CardHeader>
            <CardContent className="pl-2">
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={MOCK_CHART_DATA} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorUv" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <Area type="monotone" dataKey="searches" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorUv)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
          <Card className="lg:col-span-3">
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>The latest background checks initiated.</CardDescription>
            </CardHeader>
            <CardContent>
              {areChecksLoading ? (
                <div className="space-y-4">
                  {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
                </div>
              ) : (
                <div className="space-y-4">
                  {checksData?.items.map(check => (
                    <div key={check.id} className="flex items-center">
                      <div className="flex-1 space-y-1">
                        <p className="text-sm font-medium leading-none">{check.maskedName || maskName(check.name)}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(check.createdAt), { addSuffix: true })}
                        </p>
                      </div>
                      <StatusBadge status={check.status} />
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}