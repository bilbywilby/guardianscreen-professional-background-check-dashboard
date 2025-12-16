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
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { RiskScorecard } from '@/components/ui/RiskScorecard';
function maskName(name: string): string {
    const parts = name.split(' ');
    if (parts.length > 1) {
        return `${parts[0][0]}*** ${parts[parts.length - 1][0]}***`;
    }
    return `${name[0]}***`;
}
export function HistoryPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const { data, isLoading, error } = useQuery<PaginatedResponse<BackgroundCheck>>({
    queryKey: ['checks'],
    queryFn: () => api('/api/checks?limit=100'),
    refetchInterval: 5000,
  });
  const filteredChecks = data?.items.filter(check =>
    (check.maskedName || check.name).toLowerCase().includes(searchTerm.toLowerCase())
  );
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="py-8 md:py-10 lg:py-12 space-y-6">
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
                <Accordion type="single" collapsible className="w-full">
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead className="w-12"></TableHead>
                                <TableHead>Candidate</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Initiated At</TableHead>
                                <TableHead>Completed At</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                        {isLoading ? (
                            [...Array(5)].map((_, i) => (
                                <TableRow key={i}>
                                    <TableCell colSpan={5}><Skeleton className="h-10 w-full" /></TableCell>
                                </TableRow>
                            ))
                        ) : filteredChecks && filteredChecks.length > 0 ? (
                            filteredChecks.map((check) => (
                                <AccordionItem value={check.id} key={check.id} className="border-b">
                                    <AccordionTrigger asChild>
                                        <TableRow className="cursor-pointer hover:bg-muted/50">
                                            <TableCell></TableCell>
                                            <TableCell className="font-medium">{check.maskedName || maskName(check.name)}</TableCell>
                                            <TableCell><StatusBadge status={check.status} /></TableCell>
                                            <TableCell>{format(new Date(check.createdAt), 'PPp')}</TableCell>
                                            <TableCell>{check.completedAt ? format(new Date(check.completedAt), 'PPp') : 'N/A'}</TableCell>
                                        </TableRow>
                                    </AccordionTrigger>
                                    <AccordionContent asChild>
                                        <tr>
                                            <td colSpan={5} className="p-4 bg-muted/20">
                                                <div className="max-w-2xl mx-auto">
                                                    <RiskScorecard check={check} />
                                                </div>
                                            </td>
                                        </tr>
                                    </AccordionContent>
                                </AccordionItem>
                            ))
                        ) : (
                            <TableRow>
                                <TableCell colSpan={5} className="h-24 text-center">No case files found.</TableCell>
                            </TableRow>
                        )}
                        </TableBody>
                    </Table>
                </Accordion>
            </div>
        </div>
    </div>
  );
}