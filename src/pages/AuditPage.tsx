import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import type { AuditEntry, PaginatedResponse } from '@shared/types';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { Badge } from '@/components/ui/badge';
export function AuditPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const { data, isLoading, error } = useQuery<PaginatedResponse<AuditEntry>>({
    queryKey: ['audits'],
    queryFn: () => api('/api/audits?limit=100'), // Fetch more for local filtering
    refetchInterval: 5000, // Poll for updates
  });
  const filteredAudits = data?.items.filter(entry =>
    entry.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    JSON.stringify(entry.details).toLowerCase().includes(searchTerm.toLowerCase())
  );
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Audit & Compliance Log</h1>
        <p className="text-muted-foreground">An immutable ledger of all system and user actions.</p>
      </div>
      <div className="flex justify-end">
        <Input
          placeholder="Filter by action or details..."
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
              <TableHead className="w-[200px]">Timestamp</TableHead>
              <TableHead className="w-[200px]">Action</TableHead>
              <TableHead>Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              [...Array(10)].map((_, i) => (
                <TableRow key={i}>
                  <TableCell colSpan={3}>
                    <Skeleton className="h-8 w-full" />
                  </TableCell>
                </TableRow>
              ))
            ) : filteredAudits && filteredAudits.length > 0 ? (
              filteredAudits.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell className="font-mono text-xs">{format(new Date(entry.timestamp), 'PPpp')}</TableCell>
                  <TableCell>
                    <Badge variant="secondary">{entry.action}</Badge>
                  </TableCell>
                  <TableCell>
                    <pre className="text-xs bg-muted p-2 rounded-md overflow-x-auto">
                      <code>{JSON.stringify(entry.details, null, 2)}</code>
                    </pre>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={3} className="h-24 text-center">
                  No audit entries found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}