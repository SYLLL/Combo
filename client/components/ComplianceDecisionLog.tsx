import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Search, 
  Filter, 
  Calendar, 
  FileText, 
  AlertTriangle,
  CheckCircle,
  XCircle,
  Clock,
  MessageCircle,
  Eye
} from 'lucide-react';

interface DecisionLogEntry {
  id: string;
  title: string;
  description: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  category: 'coppa' | 'hipaa' | 'gdpr' | 'general';
  status: 'flagged' | 'under_review' | 'approved' | 'rejected' | 'needs_changes';
  documentName?: string;
  createdAt: Date;
  updatedAt: Date;
  messageCount: number;
  finalDecision?: {
    decision: 'approved' | 'rejected' | 'needs_changes';
    reasoning: string;
    decidedBy: string;
    decidedAt: Date;
  };
  participants: string[];
}

interface ComplianceDecisionLogProps {
  onViewRisk?: (riskId: string) => void;
}

export const ComplianceDecisionLog = ({ onViewRisk }: ComplianceDecisionLogProps) => {
  const [entries, setEntries] = useState<DecisionLogEntry[]>([]);
  const [filteredEntries, setFilteredEntries] = useState<DecisionLogEntry[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [riskLevelFilter, setRiskLevelFilter] = useState<string>('all');

  // Mock data - in real app, this would come from your backend
  useEffect(() => {
    const mockEntries: DecisionLogEntry[] = [
      {
        id: 'risk_001',
        title: 'Age Verification Missing for User Registration',
        description: 'The user registration flow does not include age verification, which may violate COPPA requirements for users under 13.',
        riskLevel: 'high',
        category: 'coppa',
        status: 'under_review',
        documentName: 'user_registration_requirements.pdf',
        createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
        messageCount: 4,
        participants: ['Sarah Johnson (PM)', 'Michael Chen (Legal)']
      },
      {
        id: 'risk_002',
        title: 'Health Data Collection Without HIPAA Safeguards',
        description: 'The fitness tracking feature collects health metrics but lacks proper HIPAA compliance measures.',
        riskLevel: 'critical',
        category: 'hipaa',
        status: 'rejected',
        documentName: 'fitness_feature_spec.pdf',
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        messageCount: 8,
        finalDecision: {
          decision: 'rejected',
          reasoning: 'Feature requires complete HIPAA compliance framework before implementation. Current design poses significant legal risk.',
          decidedBy: 'Michael Chen',
          decidedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
        },
        participants: ['Alex Rivera (PM)', 'Michael Chen (Legal)', 'Dr. Sarah Kim (Compliance)']
      },
      {
        id: 'risk_003',
        title: 'EU User Data Processing Without Consent',
        description: 'Analytics tracking processes EU user data without explicit GDPR consent mechanisms.',
        riskLevel: 'high',
        category: 'gdpr',
        status: 'approved',
        documentName: 'analytics_implementation.pdf',
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        messageCount: 6,
        finalDecision: {
          decision: 'approved',
          reasoning: 'Approved with conditions: Implement cookie consent banner and provide clear opt-out mechanisms. Legal team to review implementation before launch.',
          decidedBy: 'Michael Chen',
          decidedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
        },
        participants: ['Emma Thompson (PM)', 'Michael Chen (Legal)', 'James Wilson (Engineering)']
      },
      {
        id: 'risk_004',
        title: 'Third-Party SDK Data Sharing',
        description: 'New advertising SDK shares user data with external partners without clear disclosure.',
        riskLevel: 'medium',
        category: 'general',
        status: 'needs_changes',
        documentName: 'advertising_integration.pdf',
        createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        messageCount: 12,
        finalDecision: {
          decision: 'needs_changes',
          reasoning: 'Requires updated privacy policy and user consent flow. SDK configuration must be modified to limit data sharing scope.',
          decidedBy: 'Dr. Sarah Kim',
          decidedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
        },
        participants: ['David Park (PM)', 'Michael Chen (Legal)', 'Dr. Sarah Kim (Compliance)', 'Lisa Zhang (Engineering)']
      },
      {
        id: 'risk_005',
        title: 'Location Data Storage Duration',
        description: 'App stores location data indefinitely without user control or automatic deletion.',
        riskLevel: 'medium',
        category: 'gdpr',
        status: 'flagged',
        documentName: 'location_services_spec.pdf',
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        messageCount: 1,
        participants: ['System']
      }
    ];
    
    setEntries(mockEntries);
    setFilteredEntries(mockEntries);
  }, []);

  // Filter entries based on search and filters
  useEffect(() => {
    let filtered = entries;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(entry =>
        entry.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        entry.documentName?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(entry => entry.status === statusFilter);
    }

    // Category filter
    if (categoryFilter !== 'all') {
      filtered = filtered.filter(entry => entry.category === categoryFilter);
    }

    // Risk level filter
    if (riskLevelFilter !== 'all') {
      filtered = filtered.filter(entry => entry.riskLevel === riskLevelFilter);
    }

    setFilteredEntries(filtered);
  }, [entries, searchTerm, statusFilter, categoryFilter, riskLevelFilter]);

  const getRiskLevelColor = (level: string) => {
    switch (level) {
      case 'critical': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      case 'needs_changes': return 'bg-yellow-100 text-yellow-800';
      case 'under_review': return 'bg-blue-100 text-blue-800';
      case 'flagged': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved': return <CheckCircle className="h-4 w-4" />;
      case 'rejected': return <XCircle className="h-4 w-4" />;
      case 'needs_changes': return <Clock className="h-4 w-4" />;
      case 'under_review': return <MessageCircle className="h-4 w-4" />;
      case 'flagged': return <AlertTriangle className="h-4 w-4" />;
      default: return <FileText className="h-4 w-4" />;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Compliance Decision Log
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Track all flagged compliance risks, discussions, and final decisions
          </p>
        </CardHeader>
        <CardContent>
          {/* Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            <div className="lg:col-span-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search risks, documents, or descriptions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="flagged">Flagged</SelectItem>
                <SelectItem value="under_review">Under Review</SelectItem>
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
                <SelectItem value="needs_changes">Needs Changes</SelectItem>
              </SelectContent>
            </Select>

            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                <SelectItem value="coppa">COPPA</SelectItem>
                <SelectItem value="hipaa">HIPAA</SelectItem>
                <SelectItem value="gdpr">GDPR</SelectItem>
                <SelectItem value="general">General</SelectItem>
              </SelectContent>
            </Select>

            <Select value={riskLevelFilter} onValueChange={setRiskLevelFilter}>
              <SelectTrigger>
                <SelectValue placeholder="All Risk Levels" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Risk Levels</SelectItem>
                <SelectItem value="critical">Critical</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="low">Low</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Results Summary */}
          <div className="flex items-center justify-between mb-4">
            <p className="text-sm text-muted-foreground">
              Showing {filteredEntries.length} of {entries.length} compliance risks
            </p>
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">
                {[searchTerm, statusFilter !== 'all' ? statusFilter : '', 
                  categoryFilter !== 'all' ? categoryFilter : '', 
                  riskLevelFilter !== 'all' ? riskLevelFilter : '']
                  .filter(Boolean).length} filters active
              </span>
            </div>
          </div>

          {/* Entries List */}
          <div className="space-y-4">
            {filteredEntries.map((entry) => (
              <Card key={entry.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 mt-1">
                          {getStatusIcon(entry.status)}
                        </div>
                        <div className="flex-1">
                          <h3 className="font-semibold text-lg">{entry.title}</h3>
                          <p className="text-muted-foreground text-sm mt-1">
                            {entry.description}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 flex-wrap">
                        <Badge className={getRiskLevelColor(entry.riskLevel)}>
                          {entry.riskLevel.toUpperCase()}
                        </Badge>
                        <Badge className={getStatusColor(entry.status)}>
                          {entry.status.replace('_', ' ').toUpperCase()}
                        </Badge>
                        <Badge variant="outline">
                          {entry.category.toUpperCase()}
                        </Badge>
                        {entry.documentName && (
                          <Badge variant="outline" className="text-xs">
                            📄 {entry.documentName}
                          </Badge>
                        )}
                      </div>

                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          Created {entry.createdAt.toLocaleDateString()}
                        </div>
                        <div className="flex items-center gap-1">
                          <MessageCircle className="h-4 w-4" />
                          {entry.messageCount} messages
                        </div>
                        <div>
                          👥 {entry.participants.join(', ')}
                        </div>
                      </div>

                      {entry.finalDecision && (
                        <div className="mt-3 p-3 bg-muted rounded-lg">
                          <div className="flex items-center gap-2 mb-1">
                            {entry.finalDecision.decision === 'approved' ? (
                              <CheckCircle className="h-4 w-4 text-green-600" />
                            ) : entry.finalDecision.decision === 'rejected' ? (
                              <XCircle className="h-4 w-4 text-red-600" />
                            ) : (
                              <Clock className="h-4 w-4 text-yellow-600" />
                            )}
                            <span className="font-medium text-sm">
                              Decision: {entry.finalDecision.decision.replace('_', ' ').toUpperCase()}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {entry.finalDecision.reasoning.length > 150 
                              ? `${entry.finalDecision.reasoning.substring(0, 150)}...`
                              : entry.finalDecision.reasoning
                            }
                          </p>
                          <div className="text-xs text-muted-foreground mt-1">
                            By {entry.finalDecision.decidedBy} on {entry.finalDecision.decidedAt.toLocaleDateString()}
                          </div>
                        </div>
                      )}
                    </div>

                    <div className="flex-shrink-0 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onViewRisk?.(entry.id)}
                        className="flex items-center gap-2"
                      >
                        <Eye className="h-4 w-4" />
                        View Details
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {filteredEntries.length === 0 && (
              <div className="text-center py-8">
                <AlertTriangle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No compliance risks found</h3>
                <p className="text-muted-foreground">
                  {searchTerm || statusFilter !== 'all' || categoryFilter !== 'all' || riskLevelFilter !== 'all'
                    ? 'Try adjusting your filters to see more results.'
                    : 'No compliance risks have been flagged yet.'}
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};