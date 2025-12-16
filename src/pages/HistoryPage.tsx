import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import type { BackgroundCheck, PaginatedResponse } from '@shared/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { StatusBadge } from '@/components/ui/status-badge';
import { format } from 'date-fns';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
export function HistoryPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const { data, isLoading, error } = useQuery<PaginatedResponse<BackgroundCheck>>({
    queryKey: ['checks'],
    queryFn: () => api('/api/checks?limit=100'), // Fetch more for local filtering
    refetchInterval: 5000, // Poll for updates
  });
  const filteredChecks = data?.items.filter(check =>
    check.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Case Files</h1>
        <p className="text-muted-foreground">A complete history of all background checks conducted.</p>
      </div>
      <div className="flex justify-end">
        <Input
          placeholder="Filter by name..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="max-w-sm"
        />
      </div>
      {error && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      )}
      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Candidate</TableHead>
              <TableHead>SSN (Last 4)</TableHead>
              <TableHead>Date of Birth</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Initiated At</TableHead>
              <TableHead>Completed At</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              [...Array(10)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={6}>
                    <Skeleton className="h-8 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : filteredChecks && filteredChecks.length > 0 ? (
              filteredChecks.map((check) => (
                <TableRow key={check.id}>
                  <TableCell className="font-medium">{check.name}</TableCell>
                  <TableCell>***-**-{check.ssn}</TableCell>
                  <TableCell>{check.dob}</TableCell>
                  <TableCell>
                    <StatusBadge status={check.status} />
                  </TableCell>
                  <TableCell>{format(new Date(check.createdAt), 'PPpp')}</TableCell>
                  <TableCell>
                    {check.completedAt ? format(new Date(check.completedAt), 'PPpp') : 'N/A'}
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={6} className="h-24 text-center">
                  No case files found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}