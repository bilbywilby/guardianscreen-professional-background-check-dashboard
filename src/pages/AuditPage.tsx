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
const piiKeys = ['name', 'ssn', 'dob', 'maskedName', 'cacheKey'];
function jsonReplacer(key: string, value: any) {
    if (piiKeys.includes(key)) {
        return '***REDACTED***';
    }
    return value;
}
export function AuditPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const { data, isLoading, error } = useQuery<PaginatedResponse<AuditEntry>>({
    queryKey: ['audits'],
    queryFn: () => api('/api/audits?limit=100'),
    refetchInterval: 5000,
  });
  const filteredAudits = data?.items.filter(entry =>
    entry.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
    JSON.stringify(entry.details).toLowerCase().includes(searchTerm.toLowerCase())
  );
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-8 md:py-10 lg:py-12 space-y-6">
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
                    <TableHead className="w-[150px]">Action</TableHead>
                    <TableHead className="w-[150px]">IP Address</TableHead>
                    <TableHead>Details</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {isLoading ? (
                    [...Array(10)].map((_, i) => (
                        <TableRow key={i}>
                        <TableCell colSpan={4}>
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
                        <TableCell className="font-mono text-xs">{entry.ip}</TableCell>
                        <TableCell>
                            <pre className="text-xs bg-muted p-2 rounded-md overflow-x-auto">
                            <code>{JSON.stringify(entry.details, jsonReplacer, 2)}</code>
                            </pre>
                        </TableCell>
                        </TableRow>
                    ))
                    ) : (
                    <TableRow>
                        <TableCell colSpan={4} className="h-24 text-center">
                        No audit entries found.
                        </TableCell>
                    </TableRow>
                    )}
                </TableBody>
                </Table>
            </div>
        </div>
    </div>
  );
}