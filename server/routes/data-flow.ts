import { RequestHandler } from "express";

export const handleAnalyzeDataFlow: RequestHandler = async (req, res) => {
  try {
    const {
      productDescription,
      schemaData,
      legalReview,
      githubSearchResults,
      codeSnippets,
      figmaAnalysis,
      complianceAnalysis,
      uploadedFile
    } = req.body;

    console.log('📊 Analyzing data flow for:', productDescription);

    // Generate comprehensive data flow analysis
    const dataFlow = {
      nodes: [],
      edges: [],
      privacyImplications: [],
      complianceRisks: [],
      recommendations: []
    };

    // Add core system nodes
    dataFlow.nodes.push({
      id: 'user-input',
      label: 'User Input',
      type: 'source',
      dataTypes: ['email', 'profile_data', 'preferences', 'user_actions'],
      description: 'User provides input through various interfaces'
    });

    dataFlow.nodes.push({
      id: 'auth',
      label: 'Authentication System',
      type: 'process',
      dataTypes: ['credentials', 'session_tokens', 'user_identity'],
      description: 'Handles user authentication and authorization'
    });

    dataFlow.nodes.push({
      id: 'app',
      label: 'Main Application',
      type: 'process',
      dataTypes: ['user_data', 'application_state', 'business_logic'],
      description: 'Core application processing and business logic'
    });

    dataFlow.nodes.push({
      id: 'storage',
      label: 'Data Storage',
      type: 'storage',
      dataTypes: ['persistent_data', 'user_profiles', 'session_data'],
      description: 'Persistent data storage and retrieval'
    });

    // Add third-party integrations based on available data
    if (githubSearchResults || codeSnippets) {
      dataFlow.nodes.push({
        id: 'github',
        label: 'GitHub API',
        type: 'external',
        dataTypes: ['code_data', 'repository_info', 'commit_history'],
        description: 'External code repository integration'
      });
    }

    if (figmaAnalysis) {
      dataFlow.nodes.push({
        id: 'figma',
        label: 'Figma API',
        type: 'external',
        dataTypes: ['design_data', 'component_info', 'design_assets'],
        description: 'External design tool integration'
      });
    }

    // Add analytics/logging if mentioned in compliance analysis
    if (complianceAnalysis?.gdpr || complianceAnalysis?.ccpa) {
      dataFlow.nodes.push({
        id: 'analytics',
        label: 'Analytics System',
        type: 'process',
        dataTypes: ['usage_data', 'behavioral_data', 'performance_metrics'],
        description: 'User behavior and application analytics'
      });
    }

    // Define data flow edges
    dataFlow.edges.push({
      from: 'user-input',
      to: 'auth',
      label: 'User credentials',
      dataTypes: ['email', 'password', 'biometric_data'],
      securityLevel: 'high'
    });

    dataFlow.edges.push({
      from: 'auth',
      to: 'app',
      label: 'Authenticated session',
      dataTypes: ['session_token', 'user_id', 'permissions'],
      securityLevel: 'high'
    });

    dataFlow.edges.push({
      from: 'app',
      to: 'storage',
      label: 'Data persistence',
      dataTypes: ['user_data', 'preferences', 'application_state'],
      securityLevel: 'medium'
    });

    if (githubSearchResults || codeSnippets) {
      dataFlow.edges.push({
        from: 'app',
        to: 'github',
        label: 'Code analysis request',
        dataTypes: ['repository_url', 'access_token', 'analysis_parameters'],
        securityLevel: 'medium'
      });

      dataFlow.edges.push({
        from: 'github',
        to: 'app',
        label: 'Code analysis results',
        dataTypes: ['code_snippets', 'repository_metadata', 'analysis_results'],
        securityLevel: 'low'
      });
    }

    if (figmaAnalysis) {
      dataFlow.edges.push({
        from: 'app',
        to: 'figma',
        label: 'Design analysis request',
        dataTypes: ['figma_url', 'access_token', 'analysis_parameters'],
        securityLevel: 'medium'
      });

      dataFlow.edges.push({
        from: 'figma',
        to: 'app',
        label: 'Design analysis results',
        dataTypes: ['design_components', 'design_metadata', 'compliance_violations'],
        securityLevel: 'low'
      });
    }

    if (complianceAnalysis?.gdpr || complianceAnalysis?.ccpa) {
      dataFlow.edges.push({
        from: 'app',
        to: 'analytics',
        label: 'User behavior data',
        dataTypes: ['click_events', 'page_views', 'user_interactions'],
        securityLevel: 'medium'
      });
    }

    // Analyze privacy implications based on schema and legal review
    if (schemaData?.email) {
      dataFlow.privacyImplications.push({
        type: 'PII Collection',
        severity: 'high',
        description: 'Email addresses are collected and stored as personal identifiable information',
        regulation: 'GDPR Article 4(1), CCPA Section 1798.140(o)(1), COPPA 16 CFR 312.2',
        dataSubject: 'All users',
        retentionPeriod: 'As specified in privacy policy',
        legalBasis: 'Consent or legitimate interest'
      });
    }

    if (legalReview?.facts?.some((fact: string) => fact.toLowerCase().includes('age'))) {
      dataFlow.privacyImplications.push({
        type: 'Age Verification',
        severity: 'high',
        description: 'Age-related data processing requires special protection under COPPA',
        regulation: 'COPPA 16 CFR 312.3, GDPR Article 8',
        dataSubject: 'Users under 13',
        retentionPeriod: 'Minimal necessary for verification',
        legalBasis: 'Parental consent required'
      });
    }

    if (complianceAnalysis?.gdpr) {
      dataFlow.privacyImplications.push({
        type: 'Data Processing',
        severity: 'medium',
        description: 'Personal data processing requires GDPR compliance measures',
        regulation: 'GDPR Articles 5-7, 12-22',
        dataSubject: 'EU residents',
        retentionPeriod: 'As specified in data retention policy',
        legalBasis: 'Consent, contract, legal obligation, vital interests, public task, or legitimate interests'
      });
    }

    // Analyze compliance risks
    if (complianceAnalysis?.coppa) {
      dataFlow.complianceRisks.push({
        type: 'COPPA Compliance',
        severity: 'high',
        description: 'Children\'s Online Privacy Protection Act compliance required',
        mitigation: 'Implement age-gating mechanism and parental consent system',
        penalty: 'Up to $43,280 per violation',
        implementation: 'Add age verification form and parental consent workflow'
      });
    }

    if (complianceAnalysis?.gdpr) {
      dataFlow.complianceRisks.push({
        type: 'GDPR Compliance',
        severity: 'high',
        description: 'General Data Protection Regulation compliance required for EU users',
        mitigation: 'Implement comprehensive privacy framework and data subject rights',
        penalty: 'Up to 4% of annual global turnover or €20 million',
        implementation: 'Privacy by design, consent management, data subject rights portal'
      });
    }

    if (complianceAnalysis?.ccpa) {
      dataFlow.complianceRisks.push({
        type: 'CCPA Compliance',
        severity: 'medium',
        description: 'California Consumer Privacy Act compliance required',
        mitigation: 'Implement consumer rights and privacy disclosures',
        penalty: 'Up to $7,500 per intentional violation',
        implementation: 'Privacy policy updates, consumer rights portal, opt-out mechanisms'
      });
    }

    // Generate recommendations based on analysis
    dataFlow.recommendations.push({
      type: 'Data Minimization',
      priority: 'high',
      description: 'Only collect data that is necessary for the stated purpose',
      implementation: 'Audit all data collection points and remove unnecessary fields',
      timeline: 'Immediate',
      effort: 'Medium',
      impact: 'High'
    });

    dataFlow.recommendations.push({
      type: 'Encryption',
      priority: 'high',
      description: 'Encrypt sensitive data in transit and at rest',
      implementation: 'Implement TLS 1.3 for data transmission and AES-256 for storage',
      timeline: '1-2 weeks',
      effort: 'High',
      impact: 'High'
    });

    dataFlow.recommendations.push({
      type: 'Access Controls',
      priority: 'medium',
      description: 'Implement proper access controls and audit logging',
      implementation: 'Use role-based access control (RBAC) and comprehensive audit logging',
      timeline: '2-3 weeks',
      effort: 'Medium',
      impact: 'Medium'
    });

    dataFlow.recommendations.push({
      type: 'Consent Management',
      priority: 'high',
      description: 'Implement granular consent management system',
      implementation: 'Build consent collection, storage, and withdrawal mechanisms',
      timeline: '3-4 weeks',
      effort: 'High',
      impact: 'High'
    });

    dataFlow.recommendations.push({
      type: 'Data Subject Rights',
      priority: 'high',
      description: 'Implement data subject rights portal (GDPR Article 15-22)',
      implementation: 'Build self-service portal for data access, rectification, erasure, and portability',
      timeline: '4-6 weeks',
      effort: 'High',
      impact: 'High'
    });

    // Calculate risk score
    const riskScore = calculateRiskScore(dataFlow);

    const result = {
      success: true,
      dataFlow,
      summary: {
        totalNodes: dataFlow.nodes.length,
        totalEdges: dataFlow.edges.length,
        privacyImplications: dataFlow.privacyImplications.length,
        complianceRisks: dataFlow.complianceRisks.length,
        recommendations: dataFlow.recommendations.length,
        riskScore
      },
      metadata: {
        analyzedAt: new Date().toISOString(),
        productDescription,
        hasGitHubIntegration: !!(githubSearchResults || codeSnippets),
        hasFigmaIntegration: !!figmaAnalysis,
        hasComplianceAnalysis: !!complianceAnalysis,
        fileUploaded: !!uploadedFile
      }
    };

    console.log('📊 Data flow analysis completed:', result.summary);
    res.json(result);

  } catch (error: any) {
    console.error('📊 Error analyzing data flow:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to analyze data flow',
      details: error.message
    });
  }
};

function calculateRiskScore(dataFlow: any): number {
  let score = 0;
  
  // Base score
  score += 20;
  
  // Privacy implications
  dataFlow.privacyImplications.forEach((implication: any) => {
    if (implication.severity === 'high') score += 30;
    else if (implication.severity === 'medium') score += 15;
    else score += 5;
  });
  
  // Compliance risks
  dataFlow.complianceRisks.forEach((risk: any) => {
    if (risk.severity === 'high') score += 25;
    else if (risk.severity === 'medium') score += 10;
    else score += 5;
  });
  
  // External integrations add complexity
  const externalNodes = dataFlow.nodes.filter((node: any) => node.type === 'external');
  score += externalNodes.length * 10;
  
  // Cap at 100
  return Math.min(score, 100);
}
