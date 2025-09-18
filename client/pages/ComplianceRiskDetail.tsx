import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ComplianceChat } from '@/components/ComplianceChat';
import { ArrowLeft, Share, Download, Archive } from 'lucide-react';

export default function ComplianceRiskDetail() {
  const { riskId } = useParams<{ riskId: string }>();
  const navigate = useNavigate();
  const [isArchiving, setIsArchiving] = useState(false);

  const handleDecisionMade = (decision: any) => {
    console.log('Decision made:', decision);
    // In real app, you might want to show a success message or redirect
  };

  const handleArchive = async () => {
    setIsArchiving(true);
    // In real app, make API call to archive the risk
    setTimeout(() => {
      setIsArchiving(false);
      navigate('/compliance-log');
    }, 1000);
  };

  const handleShare = () => {
    // In real app, implement sharing functionality
    navigator.clipboard.writeText(window.location.href);
    alert('Link copied to clipboard!');
  };

  const handleDownload = () => {
    // In real app, generate and download a PDF report
    alert('PDF report download would start here');
  };

  if (!riskId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card>
          <CardContent className="p-6">
            <p className="text-muted-foreground">Invalid compliance risk ID</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card px-4 sm:px-6 py-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate(-1)}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div>
              <h1 className="text-xl sm:text-2xl font-semibold text-foreground">
                Compliance Risk Details
              </h1>
              <p className="text-sm text-muted-foreground mt-1">
                Risk ID: {riskId}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handleShare}
              className="flex items-center gap-2"
            >
              <Share className="h-4 w-4" />
              Share
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownload}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Download Report
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleArchive}
              disabled={isArchiving}
              className="flex items-center gap-2"
            >
              <Archive className="h-4 w-4" />
              {isArchiving ? 'Archiving...' : 'Archive'}
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <ComplianceChat 
          riskId={riskId} 
          onDecisionMade={handleDecisionMade}
        />
      </main>
    </div>
  );
}