import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useState } from 'react';
import type { BackgroundCheck, GuardianScreenConfig } from '@shared/types';
import { Loader2 } from 'lucide-react';
import { RiskScorecard } from '@/components/ui/RiskScorecard';
const ageCheck = (dob: string) => {
    const birthDate = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--;
    }
    return age;
};
const checkSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters").regex(/^[a-zA-Z-.' ]+ [a-zA-Z-.' ]+$/, "Please enter a valid full name"),
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date of birth must be in YYYY-MM-DD format")
    .refine(d => !isNaN(Date.parse(d)), "Invalid date")
    .refine(d => ageCheck(d) >= 18, "Candidate must be at least 18 years old")
    .refine(d => ageCheck(d) <= 120, "Please enter a valid date of birth"),
  ssn: z.string().regex(/^\d{4}$/, "SSN must be the last 4 digits"),
});
type CheckFormData = z.infer<typeof checkSchema>;
async function hmacSha256(secret: string, data: string): Promise<string> {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(data));
  return Array.from(new Uint8Array(signature)).map(b => b.toString(16).padStart(2, '0')).join('');
}
function maskName(name: string): string {
    const parts = name.split(' ');
    if (parts.length > 1) {
        return `${parts[0][0]}*** ${parts[parts.length - 1][0]}***`;
    }
    return `${name[0]}***`;
}
export function InvestigationPage() {
  const queryClient = useQueryClient();
  const [pollingCheckId, setPollingCheckId] = useState<string | null>(null);
  const { data: config } = useQuery<GuardianScreenConfig>({ queryKey: ['config'], queryFn: () => api('/api/config') });
  const { data: pollingResult, isLoading: isPolling } = useQuery<BackgroundCheck>({
    queryKey: ['check', pollingCheckId],
    queryFn: () => api(`/api/checks/${pollingCheckId}`),
    enabled: !!pollingCheckId,
    refetchInterval: (query) => (query.state.data?.status === 'Pending' ? 2000 : false),
    refetchOnWindowFocus: false,
  });
  const form = useForm<CheckFormData>({
    resolver: zodResolver(checkSchema),
    defaultValues: { name: '', dob: '', ssn: '' },
  });
  const mutation = useMutation({
    mutationFn: (data: any) => api<BackgroundCheck>('/api/checks', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    onSuccess: (data) => {
      toast.success('Check initiated successfully!', { description: `Monitoring for results for ${data.maskedName}.` });
      queryClient.invalidateQueries({ queryKey: ['checks'] });
      queryClient.invalidateQueries({ queryKey: ['config'] });
      form.reset();
      setPollingCheckId(data.id);
    },
    onError: (error) => {
      toast.error('Failed to initiate check', { description: error.message });
    },
  });
  async function onSubmit(data: CheckFormData) {
    if (!config?.apiKey) {
        toast.error("API key not found. Please configure settings.");
        return;
    }
    const pii = `${data.name}${data.dob}${data.ssn}`;
    const cacheKey = await hmacSha256(config.apiKey, pii);
    const maskedName = maskName(data.name);
    mutation.mutate({ ...data, cacheKey, maskedName });
  }
  const displayResult = pollingResult || (mutation.isSuccess ? mutation.data : null);
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="py-8 md:py-10 lg:py-12 max-w-4xl mx-auto space-y-8">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Investigation Center</h1>
          <p className="text-muted-foreground">Submit candidate details to run a comprehensive background check.</p>
        </div>
        <div className="grid md:grid-cols-2 gap-8 items-start">
          <Card>
            <CardHeader>
              <CardTitle>New Background Check</CardTitle>
              <CardDescription>All fields are required. PII is hashed client-side.</CardDescription>
            </CardHeader>
            <CardContent>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  <FormField control={form.control} name="name" render={({ field }) => ( <FormItem> <FormLabel>Full Name</FormLabel> <FormControl> <Input placeholder="John Doe" {...field} /> </FormControl> <FormMessage /> </FormItem> )}/>
                  <FormField control={form.control} name="dob" render={({ field }) => ( <FormItem> <FormLabel>Date of Birth</FormLabel> <FormControl> <Input placeholder="YYYY-MM-DD" {...field} /> </FormControl> <FormMessage /> </FormItem> )}/>
                  <FormField control={form.control} name="ssn" render={({ field }) => ( <FormItem> <FormLabel>Social Security Number (Last 4)</FormLabel> <FormControl> <Input placeholder="1234" {...field} /> </FormControl> <FormMessage /> </FormItem> )}/>
                  <Button type="submit" disabled={mutation.isPending || isPolling} className="w-full">
                    {(mutation.isPending || isPolling) && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Run Check
                  </Button>
                </form>
              </Form>
            </CardContent>
          </Card>
          <div className="flex items-center justify-center">
            { (mutation.isPending || isPolling) ? (
              <Card className="w-full animate-pulse">
                <CardHeader className="items-center text-center">
                  <Loader2 className="h-12 w-12 text-muted-foreground animate-spin" />
                  <CardTitle className="mt-4">Running Check...</CardTitle>
                  <CardDescription>Please wait while we query our databases.</CardDescription>
                </CardHeader>
              </Card>
            ) : displayResult && displayResult.status !== 'Pending' ? (
              <RiskScorecard check={displayResult} />
            ) : (
              <Card className="w-full border-dashed">
                <CardHeader className="items-center text-center h-96 justify-center">
                  <CardTitle>Awaiting Submission</CardTitle>
                  <CardDescription>Results from your latest check will appear here.</CardDescription>
                </CardHeader>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}