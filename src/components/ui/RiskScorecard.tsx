import type { BackgroundCheck } from '@shared/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Printer, ShieldCheck, ShieldAlert, FileWarning, AlertOctagon } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
interface RiskScorecardProps {
  check: BackgroundCheck;
}
const sourceConfig = {
  criminal: { icon: ShieldCheck, color: 'text-blue-500', label: 'Criminal Database' },
  nsopw: { icon: ShieldAlert, color: 'text-red-500', label: 'Sex Offender Registry (NSOPW)' },
  ofac: { icon: AlertOctagon, color: 'text-orange-500', label: 'Sanctions List (OFAC)' },
};
const getRiskColor = (score: number) => {
  if (score > 75) return 'text-red-500';
  if (score > 40) return 'text-yellow-500';
  return 'text-green-500';
};
const getOffenseVariant = (level: string): "destructive" | "secondary" | "outline" => {
    switch (level.toLowerCase()) {
        case 'felony': return 'destructive';
        case 'sex offense': return 'destructive';
        case 'sanction': return 'destructive';
        case 'misdemeanor': return 'secondary';
        default: return 'outline';
    }
};
type Offense = {
    level: string;
    date: string;
    location: string;
    details: string;
    source: string;
};
export function RiskScorecard({ check }: RiskScorecardProps) {
  const { resultData } = check;
  if (!resultData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Analysis Pending</CardTitle>
          <CardDescription>Detailed risk analysis will be available once the check is complete.</CardDescription>
        </CardHeader>
      </Card>
    );
  }
  const riskScore = resultData.riskScore || 0;
  const offenses: Offense[] = resultData.offenses || [];
  const sources: string[] = resultData.sources || [];
  const handlePrint = () => {
    window.print();
  };
  return (
    <Card className="w-full print-container relative">
      <div className="print-only absolute inset-0 -z-10 flex items-center justify-center">
        <p className="text-6xl font-light text-gray-200 dark:text-gray-800 opacity-50 transform -rotate-45">
          Official GuardianScreen Report — Confidential
        </p>
      </div>
      <CardHeader>
        <div className="no-print flex justify-between items-start">
            <div>
                <CardTitle>Risk Scorecard</CardTitle>
                <CardDescription>For {check.maskedName}</CardDescription>
            </div>
            <Button variant="outline" size="icon" onClick={handlePrint}>
                <Printer className="h-4 w-4" />
            </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="text-center py-4">
          <div className={`text-6xl font-bold ${getRiskColor(riskScore)}`}>{riskScore}%</div>
          <p className="text-muted-foreground">Calculated Risk Score</p>
        </div>
        {sources.length > 0 && (
            <div className="flex flex-wrap justify-center gap-1.5">
                <span className="text-sm font-medium text-muted-foreground self-center mr-1">Sources:</span>
                {sources.map((source) => {
                    const sourceInfo = sourceConfig[source as keyof typeof sourceConfig];
                    if (!sourceInfo) return null;
                    const Icon = sourceInfo.icon;
                    return (
                        <Badge key={source} variant="secondary" className="flex items-center gap-1.5 hover:shadow-md transition-shadow">
                            <Icon className={cn("h-3.5 w-3.5 shrink-0", sourceInfo.color)} />
                            <span>{sourceInfo.label || source}</span>
                        </Badge>
                    );
                })}
            </div>
        )}
        {riskScore > 40 && (
          <div className="mt-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800/50 rounded-lg flex items-start gap-3">
            <ShieldAlert className="h-5 w-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-yellow-900 dark:text-yellow-200">FCRA Pre-Adverse Action Notice</p>
              <p className="text-sm text-yellow-800 dark:text-yellow-300">Provide report + FCRA rights summary before action.</p>
            </div>
          </div>
        )}
        <Accordion type="single" collapsible className="w-full" defaultValue="offenses">
          <AccordionItem value="offenses">
            <AccordionTrigger>
                <div className="flex items-center gap-2">
                    {offenses.length > 0 ? <ShieldAlert className="h-5 w-5 text-yellow-500" /> : <ShieldCheck className="h-5 w-5 text-green-500" />}
                    <span>{offenses.length} Offenses Found</span>
                </div>
            </AccordionTrigger>
            <AccordionContent>
              {offenses.length > 0 ? (
                <ul className={cn("space-y-4 pl-2", offenses.length > 1 && "md:grid md:grid-cols-2 md:gap-x-6 md:space-y-0")}>
                  {offenses.map((offense, index) => {
                    const sourceInfo = sourceConfig[offense.source as keyof typeof sourceConfig];
                    const SourceIcon = sourceInfo?.icon;
                    return (
                        <li key={index} className="border-l-2 pl-4 offense-item pt-1">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2 flex-wrap">
                                    <Badge variant={getOffenseVariant(offense.level)}>{offense.level}</Badge>
                                    <span className="text-sm font-medium">{offense.date} - {offense.location}</span>
                                </div>
                                {SourceIcon && (
                                    <TooltipProvider>
                                        <Tooltip>
                                            <TooltipTrigger className="group relative">
                                                <SourceIcon className={cn("h-4 w-4 transition-transform group-hover:scale-110", sourceInfo.color)} />
                                                <span className="absolute -inset-2.5 rounded-full group-hover:bg-primary/10 transition-colors"></span>
                                            </TooltipTrigger>
                                            <TooltipContent>
                                                <p>Source: {sourceInfo.label}</p>
                                            </TooltipContent>
                                        </Tooltip>
                                    </TooltipProvider>
                                )}
                            </div>
                            <p className="text-sm text-muted-foreground mt-1.5">{offense.details}</p>
                        </li>
                    );
                  })}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">No adverse records found.</p>
              )}
            </AccordionContent>
          </AccordionItem>
          <AccordionItem value="pre-adverse">
            <AccordionTrigger>
                <div className="flex items-center gap-2">
                    <FileWarning className="h-5 w-5" />
                    <span>Pre-Adverse Action Notice</span>
                </div>
            </AccordionTrigger>
            <AccordionContent className="space-y-3 no-print">
                <p className="text-sm text-muted-foreground">If you are considering taking adverse action based on this report, you must provide the candidate with a copy of this report and a summary of their rights under the FCRA.</p>
                <Button>Generate Pre-Adverse Action Letter</Button>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
}