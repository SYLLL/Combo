import { useNavigate } from 'react-router-dom';
import { ComplianceDecisionLog } from '@/components/ComplianceDecisionLog';

export default function ComplianceLog() {
  const navigate = useNavigate();

  const handleViewRisk = (riskId: string) => {
    navigate(`/compliance-risk/${riskId}`);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card px-4 sm:px-6 py-4">
        <h1 className="text-xl sm:text-2xl font-semibold text-foreground">
          Compliance Decision Log
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          View all compliance risks, discussions, and decisions
        </p>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <ComplianceDecisionLog onViewRisk={handleViewRisk} />
      </main>
    </div>
  );
}