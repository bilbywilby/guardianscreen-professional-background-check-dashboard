import type { BackgroundCheck } from '@shared/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Printer, ShieldCheck, ShieldAlert, FileWarning } from 'lucide-react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
interface RiskScorecardProps {
  check: BackgroundCheck;
}
const getRiskColor = (score: number) => {
  if (score > 75) return 'text-red-500';
  if (score > 40) return 'text-yellow-500';
  return 'text-green-500';
};
const getOffenseVariant = (level: string): "destructive" | "secondary" | "outline" => {
    switch (level.toLowerCase()) {
        case 'felony': return 'destructive';
        case 'misdemeanor': return 'secondary';
        default: return 'outline';
    }
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
  const offenses = resultData.offenses || [];
  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    printWindow?.document.write(`
      <html>
        <head>
          <title>Risk Scorecard - ${check.maskedName}</title>
          <style>
            body { font-family: sans-serif; margin: 2rem; }
            h1, h2 { color: #111827; }
            .score { font-size: 3rem; font-weight: bold; color: ${getRiskColor(riskScore).replace('text-','').replace('-500','')} }
            .badge { display: inline-block; padding: 0.25rem 0.5rem; font-size: 0.75rem; border-radius: 0.25rem; margin-right: 0.5rem; }
            .felony { background-color: #FEE2E2; color: #991B1B; }
            .misdemeanor { background-color: #F3F4F6; color: #374151; }
            .details { margin-top: 1rem; padding-top: 1rem; border-top: 1px solid #E5E7EB; }
          </style>
        </head>
        <body>
          <h1>Risk Scorecard</h1>
          <p><strong>Candidate:</strong> ${check.maskedName}</p>
          <p><strong>Check ID:</strong> ${check.id}</p>
          <hr/>
          <h2>Risk Score: <span class="score">${riskScore}%</span></h2>
          <h2>Offenses Found: ${offenses.length}</h2>
          ${offenses.map((offense: any) => `
            <div class="details">
              <p><span class="badge ${offense.level.toLowerCase()}">${offense.level}</span><strong>${offense.date}</strong> at ${offense.location}</p>
              <p>${offense.details}</p>
            </div>
          `).join('')}
          <p style="margin-top: 2rem; font-size: 0.75rem; color: #6B7281;">Generated on ${new Date().toLocaleString()}</p>
        </body>
      </html>
    `);
    printWindow?.document.close();
    printWindow?.print();
  };
  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex justify-between items-start">
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
        <Accordion type="single" collapsible className="w-full">
          <AccordionItem value="offenses">
            <AccordionTrigger>
                <div className="flex items-center gap-2">
                    {offenses.length > 0 ? <ShieldAlert className="h-5 w-5 text-yellow-500" /> : <ShieldCheck className="h-5 w-5 text-green-500" />}
                    <span>{offenses.length} Offenses Found</span>
                </div>
            </AccordionTrigger>
            <AccordionContent>
              {offenses.length > 0 ? (
                <ul className="space-y-3 pl-2">
                  {offenses.map((offense: any, index: number) => (
                    <li key={index} className="border-l-2 pl-4">
                      <div className="flex items-center gap-2">
                        <Badge variant={getOffenseVariant(offense.level)}>{offense.level}</Badge>
                        <span className="text-sm font-medium">{offense.date} - {offense.location}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">{offense.details}</p>
                    </li>
                  ))}
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
            <AccordionContent className="space-y-3">
                <p className="text-sm text-muted-foreground">If you are considering taking adverse action based on this report, you must provide the candidate with a copy of this report and a summary of their rights under the FCRA.</p>
                <Button>Generate Pre-Adverse Action Letter</Button>
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </CardContent>
    </Card>
  );
}