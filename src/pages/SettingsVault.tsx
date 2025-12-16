import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '@/lib/api-client';
import type { GuardianScreenConfig } from '@shared/types';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { toast } from 'sonner';
import { useEffect, useState } from 'react';
import { Copy, Eye, EyeOff, Loader2 } from 'lucide-react';
const settingsSchema = z.object({
  apiKey: z.string().optional(),
  alertThreshold: z.number().min(0).max(100),
  retentionDays: z.number().min(1).max(365),
  mockMode: z.boolean(),
});
type SettingsFormData = z.infer<typeof settingsSchema>;
export function SettingsVault() {
  const queryClient = useQueryClient();
  const [showApiKey, setShowApiKey] = useState(false);
  const { data: config, isLoading, isError } = useQuery<GuardianScreenConfig>({
    queryKey: ['config'],
    queryFn: () => api('/api/config'),
  });
  const form = useForm<SettingsFormData>({
    resolver: zodResolver(settingsSchema),
  });
  useEffect(() => {
    if (config) {
      form.reset({
        apiKey: config.apiKey,
        alertThreshold: config.alertThreshold,
        retentionDays: config.retentionDays,
        mockMode: config.mockMode,
      });
    }
  }, [config, form]);
  const mutation = useMutation({
    mutationFn: (data: Partial<SettingsFormData>) => api('/api/config', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      toast.success('Settings updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['config'] });
    },
    onError: (error) => {
      toast.error('Failed to update settings', { description: error.message });
    },
  });
  function onSubmit(data: SettingsFormData) {
    mutation.mutate(data);
  }
  const copyApiKey = () => {
    if (config?.apiKey) {
      navigator.clipboard.writeText(config.apiKey);
      toast.success('API Key copied to clipboard');
    }
  };
  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <Skeleton className="h-10 w-1/3" />
        <Skeleton className="h-8 w-2/3" />
        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-1/4" />
            <Skeleton className="h-4 w-1/2" />
          </CardHeader>
          <CardContent className="space-y-6">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }
  if (isError) return <div>Error loading settings.</div>;
  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings Vault</h1>
        <p className="text-muted-foreground">Manage your API keys, credits, and data retention policies.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Configuration</CardTitle>
          <CardDescription>Changes are saved automatically upon submission.</CardDescription>
        </CardHeader>
        <CardContent>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
              <FormField
                control={form.control}
                name="apiKey"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>External API Key</FormLabel>
                    <div className="flex items-center gap-2">
                      <FormControl>
                        <Input type={showApiKey ? 'text' : 'password'} readOnly {...field} />
                      </FormControl>
                      <Button type="button" variant="outline" size="icon" onClick={() => setShowApiKey(!showApiKey)}>
                        {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                      <Button type="button" variant="outline" size="icon" onClick={copyApiKey}>
                        <Copy className="h-4 w-4" />
                      </Button>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="alertThreshold"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Credit Alert Threshold: {field.value}</FormLabel>
                    <FormControl>
                      <Slider
                        min={0}
                        max={100}
                        step={5}
                        value={[field.value]}
                        onValueChange={(vals) => field.onChange(vals[0])}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="retentionDays"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data Retention Period (Days): {field.value}</FormLabel>
                    <FormControl>
                      <Slider
                        min={1}
                        max={365}
                        step={1}
                        value={[field.value]}
                        onValueChange={(vals) => field.onChange(vals[0])}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="mockMode"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">Deep Search Mode</FormLabel>
                      <AlertDescription>
                        {field.value ? "Disabled (Basic Mock)" : "Enabled (Multi-Source Simulation)"}
                      </AlertDescription>
                    </div>
                    <FormControl>
                      <Switch
                        checked={!field.value}
                        onCheckedChange={(checked) => field.onChange(!checked)}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
              <div className="flex justify-end">
                <Button type="submit" disabled={mutation.isPending}>
                  {mutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  Save Changes
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}