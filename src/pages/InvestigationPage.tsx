import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { useState } from 'react';
import type { BackgroundCheck } from '@shared/types';
import { Loader2, CheckCircle, XCircle } from 'lucide-react';
const checkSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters"),
  dob: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date of birth must be in YYYY-MM-DD format"),
  ssn: z.string().regex(/^\d{4}$/, "SSN must be the last 4 digits"),
});
type CheckFormData = z.infer<typeof checkSchema>;
export function InvestigationPage() {
  const queryClient = useQueryClient();
  const [lastResult, setLastResult] = useState<BackgroundCheck | null>(null);
  const form = useForm<CheckFormData>({
    resolver: zodResolver(checkSchema),
    defaultValues: { name: '', dob: '', ssn: '' },
  });
  const mutation = useMutation({
    mutationFn: (data: CheckFormData) => api<BackgroundCheck>('/api/checks', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    onSuccess: (data) => {
      toast.success('Check initiated successfully!', {
        description: `Monitoring for results for ${data.name}.`,
      });
      queryClient.invalidateQueries({ queryKey: ['checks'] });
      queryClient.invalidateQueries({ queryKey: ['config'] });
      form.reset();
      setLastResult(data);
    },
    onError: (error) => {
      toast.error('Failed to initiate check', {
        description: error.message,
      });
    },
  });
  function onSubmit(data: CheckFormData) {
    mutation.mutate(data);
  }
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Investigation Center</h1>
        <p className="text-muted-foreground">Submit candidate details to run a comprehensive background check.</p>
      </div>
      <div className="grid md:grid-cols-2 gap-8">
        <Card>
          <CardHeader>
            <CardTitle>New Background Check</CardTitle>
            <CardDescription>All fields are required. Data is handled securely.</CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Full Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="dob"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Date of Birth</FormLabel>
                      <FormControl>
                        <Input placeholder="YYYY-MM-DD" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="ssn"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Social Security Number (Last 4)</FormLabel>
                      <FormControl>
                        <Input placeholder="1234" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" disabled={mutation.isPending} className="w-full">
                  {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Run Check
                </Button>
              </form>
            </Form>
          </CardContent>
        </Card>
        <div className="flex items-center justify-center">
          {mutation.isPending ? (
            <Card className="w-full animate-pulse">
              <CardHeader className="items-center text-center">
                <Loader2 className="h-12 w-12 text-muted-foreground animate-spin" />
                <CardTitle className="mt-4">Running Check...</CardTitle>
                <CardDescription>Please wait while we query our databases.</CardDescription>
              </CardHeader>
            </Card>
          ) : lastResult ? (
            <Card className="w-full">
              <CardHeader className="items-center text-center">
                {lastResult.status === 'Clear' ? <CheckCircle className="h-12 w-12 text-green-500" /> : <XCircle className="h-12 w-12 text-red-500" />}
                <CardTitle className="mt-4">Check Initiated</CardTitle>
                <CardDescription>
                  The check for <span className="font-semibold">{lastResult.name}</span> has started. Results will appear in Case Files.
                </CardDescription>
              </CardHeader>
            </Card>
          ) : (
            <Card className="w-full border-dashed">
              <CardHeader className="items-center text-center">
                <CardTitle>Awaiting Submission</CardTitle>
                <CardDescription>Results from your latest check will appear here.</CardDescription>
              </CardHeader>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}