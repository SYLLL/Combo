import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { 
  MessageCircle, 
  Send, 
  CheckCircle, 
  XCircle, 
  Clock, 
  User, 
  AlertTriangle,
  FileText,
  Calendar,
  Filter
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  userRole: 'product_manager' | 'legal' | 'compliance' | 'admin';
  message: string;
  timestamp: Date;
  type: 'comment' | 'decision' | 'status_change';
}

interface ComplianceRisk {
  id: string;
  title: string;
  description: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  category: 'coppa' | 'hipaa' | 'gdpr' | 'general';
  status: 'flagged' | 'under_review' | 'approved' | 'rejected' | 'needs_changes';
  documentId?: string;
  documentName?: string;
  createdAt: Date;
  updatedAt: Date;
  assignedTo?: string[];
  finalDecision?: {
    decision: 'approved' | 'rejected' | 'needs_changes';
    reasoning: string;
    decidedBy: string;
    decidedAt: Date;
  };
}

interface ComplianceChatProps {
  riskId: string;
  onDecisionMade?: (decision: any) => void;
}

export const ComplianceChat = ({ riskId, onDecisionMade }: ComplianceChatProps) => {
  const { currentUser, userProfile } = useAuth();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [risk, setRisk] = useState<ComplianceRisk | null>(null);
  const [decisionMode, setDecisionMode] = useState(false);
  const [finalDecision, setFinalDecision] = useState<'approved' | 'rejected' | 'needs_changes'>('approved');
  const [decisionReasoning, setDecisionReasoning] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Mock data - in real app, this would come from your backend
  useEffect(() => {
    // Load risk data
    const mockRisk: ComplianceRisk = {
      id: riskId,
      title: 'Age Verification Missing for User Registration',
      description: 'The user registration flow does not include age verification, which may violate COPPA requirements for users under 13.',
      riskLevel: 'high',
      category: 'coppa',
      status: 'under_review',
      documentId: 'doc_123',
      documentName: 'user_registration_requirements.pdf',
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      updatedAt: new Date(),
      assignedTo: ['pm_user', 'legal_user']
    };
    setRisk(mockRisk);

    // Load existing messages
    const mockMessages: ChatMessage[] = [
      {
        id: '1',
        userId: 'system',
        userName: 'System',
        userRole: 'admin',
        message: 'Compliance risk flagged: Age verification missing for user registration',
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
        type: 'status_change'
      },
      {
        id: '2',
        userId: 'pm_user',
        userName: 'Sarah Johnson',
        userRole: 'product_manager',
        message: 'I reviewed the registration flow. We currently collect birth date but don\'t have specific COPPA compliance measures. What are the specific requirements we need to implement?',
        timestamp: new Date(Date.now() - 1.5 * 24 * 60 * 60 * 1000),
        type: 'comment'
      },
      {
        id: '3',
        userId: 'legal_user',
        userName: 'Michael Chen',
        userRole: 'legal',
        message: 'For COPPA compliance, we need: 1) Clear age verification, 2) Parental consent mechanism for under-13 users, 3) Limited data collection for minors, 4) Parental access rights. The current flow lacks parental consent entirely.',
        timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000),
        type: 'comment'
      },
      {
        id: '4',
        userId: 'pm_user',
        userName: 'Sarah Johnson',
        userRole: 'product_manager',
        message: 'Thanks for the clarification. I estimate 2-3 weeks to implement proper parental consent flow. Should we block the current registration feature until this is implemented?',
        timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000),
        type: 'comment'
      }
    ];
    setMessages(mockMessages);
  }, [riskId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !currentUser || !userProfile) return;

    setIsSubmitting(true);
    
    const message: ChatMessage = {
      id: Date.now().toString(),
      userId: currentUser.uid,
      userName: userProfile.displayName || currentUser.email || 'Unknown User',
      userRole: (userProfile.role as any) || 'compliance',
      message: newMessage.trim(),
      timestamp: new Date(),
      type: 'comment'
    };

    setMessages(prev => [...prev, message]);
    setNewMessage('');
    setIsSubmitting(false);

    // In real app, save to backend
    console.log('Saving message to backend:', message);
  };

  const handleMakeDecision = async () => {
    if (!decisionReasoning.trim() || !currentUser || !userProfile) return;

    setIsSubmitting(true);

    const decisionMessage: ChatMessage = {
      id: Date.now().toString(),
      userId: currentUser.uid,
      userName: userProfile.displayName || currentUser.email || 'Unknown User',
      userRole: (userProfile.role as any) || 'compliance',
      message: `**FINAL DECISION: ${finalDecision.toUpperCase()}**\n\nReasoning: ${decisionReasoning}`,
      timestamp: new Date(),
      type: 'decision'
    };

    const decision = {
      decision: finalDecision,
      reasoning: decisionReasoning,
      decidedBy: userProfile.displayName || currentUser.email || 'Unknown User',
      decidedAt: new Date()
    };

    setMessages(prev => [...prev, decisionMessage]);
    
    if (risk) {
      const updatedRisk = {
        ...risk,
        status: finalDecision === 'approved' ? 'approved' as const : 
                finalDecision === 'rejected' ? 'rejected' as const : 'needs_changes' as const,
        finalDecision: decision,
        updatedAt: new Date()
      };
      setRisk(updatedRisk);
    }

    setDecisionMode(false);
    setDecisionReasoning('');
    setIsSubmitting(false);

    onDecisionMade?.(decision);

    // In real app, save to backend
    console.log('Saving decision to backend:', decision);
  };

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

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'product_manager': return '👨‍💼';
      case 'legal': return '⚖️';
      case 'compliance': return '🛡️';
      case 'admin': return '🔧';
      default: return '👤';
    }
  };

  if (!risk) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center text-muted-foreground">Loading compliance risk...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Risk Overview */}
      <Card>
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                {risk.title}
              </CardTitle>
              <div className="flex items-center gap-2 flex-wrap">
                <Badge className={getRiskLevelColor(risk.riskLevel)}>
                  {risk.riskLevel.toUpperCase()} RISK
                </Badge>
                <Badge className={getStatusColor(risk.status)}>
                  {risk.status.replace('_', ' ').toUpperCase()}
                </Badge>
                <Badge variant="outline">
                  {risk.category.toUpperCase()}
                </Badge>
              </div>
            </div>
            <div className="text-right text-sm text-muted-foreground">
              <div className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {risk.createdAt.toLocaleDateString()}
              </div>
              {risk.documentName && (
                <div className="flex items-center gap-1 mt-1">
                  <FileText className="h-4 w-4" />
                  {risk.documentName}
                </div>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">{risk.description}</p>
          
          {risk.finalDecision && (
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                {risk.finalDecision.decision === 'approved' ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : risk.finalDecision.decision === 'rejected' ? (
                  <XCircle className="h-5 w-5 text-red-600" />
                ) : (
                  <Clock className="h-5 w-5 text-yellow-600" />
                )}
                <span className="font-semibold">
                  Final Decision: {risk.finalDecision.decision.replace('_', ' ').toUpperCase()}
                </span>
              </div>
              <p className="text-sm text-muted-foreground mb-2">
                {risk.finalDecision.reasoning}
              </p>
              <div className="text-xs text-muted-foreground">
                Decided by {risk.finalDecision.decidedBy} on {risk.finalDecision.decidedAt.toLocaleDateString()}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Chat Messages */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MessageCircle className="h-5 w-5" />
            Discussion & Decision Log
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {messages.map((message) => (
              <div key={message.id} className="space-y-2">
                <div className="flex items-start gap-3">
                  <div className="flex-shrink-0">
                    <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center text-sm">
                      {message.userId === 'system' ? '🤖' : getRoleIcon(message.userRole)}
                    </div>
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">{message.userName}</span>
                      <Badge variant="outline" className="text-xs">
                        {message.userRole.replace('_', ' ')}
                      </Badge>
                      <span className="text-xs text-muted-foreground">
                        {message.timestamp.toLocaleString()}
                      </span>
                      {message.type === 'decision' && (
                        <Badge className="bg-purple-100 text-purple-800 text-xs">
                          DECISION
                        </Badge>
                      )}
                    </div>
                    <div className={`text-sm p-3 rounded-lg ${
                      message.type === 'decision' 
                        ? 'bg-purple-50 border border-purple-200' 
                        : message.type === 'status_change'
                        ? 'bg-blue-50 border border-blue-200'
                        : 'bg-muted'
                    }`}>
                      <div className="whitespace-pre-wrap">{message.message}</div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <Separator className="my-4" />

          {/* Message Input */}
          {!risk.finalDecision && (
            <div className="space-y-4">
              {!decisionMode ? (
                <div className="space-y-3">
                  <Textarea
                    placeholder="Add your comment or analysis..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    className="min-h-[80px]"
                  />
                  <div className="flex items-center justify-between">
                    <Button
                      variant="outline"
                      onClick={() => setDecisionMode(true)}
                      className="text-purple-600 border-purple-200 hover:bg-purple-50"
                    >
                      Make Final Decision
                    </Button>
                    <Button
                      onClick={handleSendMessage}
                      disabled={!newMessage.trim() || isSubmitting}
                    >
                      <Send className="h-4 w-4 mr-2" />
                      {isSubmitting ? 'Sending...' : 'Send Comment'}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-5 w-5 text-purple-600" />
                    <span className="font-semibold text-purple-800">Make Final Decision</span>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Decision</label>
                      <Select value={finalDecision} onValueChange={(value: any) => setFinalDecision(value)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="approved">✅ Approved - Risk is acceptable</SelectItem>
                          <SelectItem value="rejected">❌ Rejected - Risk must be addressed</SelectItem>
                          <SelectItem value="needs_changes">⚠️ Needs Changes - Modifications required</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">Reasoning & Next Steps</label>
                      <Textarea
                        placeholder="Explain the reasoning behind this decision and any required next steps..."
                        value={decisionReasoning}
                        onChange={(e) => setDecisionReasoning(e.target.value)}
                        className="min-h-[100px]"
                      />
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        onClick={handleMakeDecision}
                        disabled={!decisionReasoning.trim() || isSubmitting}
                        className="bg-purple-600 hover:bg-purple-700"
                      >
                        {isSubmitting ? 'Recording Decision...' : 'Record Final Decision'}
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setDecisionMode(false);
                          setDecisionReasoning('');
                        }}
                      >
                        Cancel
                      </Button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {risk.finalDecision && (
            <div className="text-center text-sm text-muted-foreground py-4">
              This compliance risk has been resolved. The decision log is preserved for future reference.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};