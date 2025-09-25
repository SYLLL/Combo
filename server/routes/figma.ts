import { RequestHandler } from "express";

export interface FigmaAnalysisRequest {
  figmaToken: string;
  fileId: string;
}

export interface FigmaAnalysisResponse {
  success: boolean;
  report?: any;
  error?: string;
}

export const analyzeFigmaFile: RequestHandler = async (req, res) => {
  try {
    const { figmaToken, fileId } = req.body as FigmaAnalysisRequest;

    if (!figmaToken || !fileId) {
      return res.status(400).json({
        success: false,
        error: 'Figma token and file ID are required'
      });
    }

    // Fetch Figma file data
    const figmaResponse = await fetch(`https://api.figma.com/v1/files/${fileId}`, {
      headers: {
        'X-Figma-Token': figmaToken,
      },
    });

    if (!figmaResponse.ok) {
      throw new Error(`Figma API error: ${figmaResponse.status} ${figmaResponse.statusText}`);
    }

    const figmaData = await figmaResponse.json();

    // Perform compliance analysis
    const complianceReport = analyzeCompliance(figmaData);

    res.json({
      success: true,
      report: complianceReport
    });

  } catch (error: any) {
    console.error('Figma analysis error:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Failed to analyze Figma file'
    });
  }
};

function analyzeCompliance(figmaData: any) {
  const violations: any[] = [];
  
  // Analyze the document recursively
  analyzeNode(figmaData.document, violations, figmaData);
  
  // Generate summary
  const summary = generateSummary(violations);
  
  return {
    fileId: figmaData.name,
    fileName: figmaData.name,
    violations,
    summary,
    analyzedAt: new Date().toISOString(),
  };
}

function analyzeNode(node: any, violations: any[], file: any): void {
  // Accessibility checks
  checkAccessibility(node, violations);
  
  // Design system checks
  checkDesignSystem(node, violations, file);
  
  // Brand guidelines checks
  checkBrandGuidelines(node, violations);
  
  // Legal compliance checks
  checkLegalCompliance(node, violations);
  
  // Technical compliance checks
  checkTechnicalCompliance(node, violations);
  
  // Recursively analyze children
  if (node.children) {
    node.children.forEach((child: any) => analyzeNode(child, violations, file));
  }
}

function checkAccessibility(node: any, violations: any[]): void {
  // Check for text contrast
  if (node.type === 'TEXT' && node.fills) {
    node.fills.forEach((fill: any) => {
      if (fill.type === 'SOLID' && fill.color) {
        const contrast = calculateContrast(fill.color, { r: 1, g: 1, b: 1, a: 1 }); // Assume white background
        if (contrast < 4.5) {
          violations.push({
            type: 'accessibility',
            severity: 'high',
            element: node.name || 'Text element',
            description: `Text contrast ratio ${contrast.toFixed(2)} is below WCAG AA standard (4.5:1)`,
            recommendation: 'Increase text contrast by using darker colors or adding background contrast',
            figmaNodeId: node.id,
            rule: 'WCAG_AA_CONTRAST',
          });
        }
      }
    });
  }

  // Check for interactive element sizes
  if (node.type === 'FRAME' && node.absoluteBoundingBox) {
    const { width, height } = node.absoluteBoundingBox;
    if (width < 44 || height < 44) {
      violations.push({
        type: 'accessibility',
        severity: 'medium',
        element: node.name || 'Interactive element',
        description: `Interactive element size ${width}x${height}px is below recommended 44x44px minimum`,
        recommendation: 'Increase element size to at least 44x44px for better touch accessibility',
        figmaNodeId: node.id,
        rule: 'MINIMUM_TOUCH_TARGET',
      });
    }
  }
}

function checkDesignSystem(node: any, violations: any[], file: any): void {
  // Check for consistent spacing
  if (node.type === 'FRAME' && node.layoutMode === 'VERTICAL') {
    const children = node.children || [];
    if (children.length > 1) {
      const spacings = children.slice(1).map((child: any, index: number) => {
        const prevChild = children[index];
        return child.absoluteBoundingBox?.y - (prevChild.absoluteBoundingBox?.y + prevChild.absoluteBoundingBox?.height);
      });
      
      const uniqueSpacings = [...new Set(spacings)];
      if (uniqueSpacings.length > 1) {
        violations.push({
          type: 'design_system',
          severity: 'medium',
          element: node.name || 'Frame',
          description: 'Inconsistent spacing between elements detected',
          recommendation: 'Use consistent spacing values from your design system',
          figmaNodeId: node.id,
          rule: 'CONSISTENT_SPACING',
        });
      }
    }
  }

  // Check for proper component usage
  if (node.type === 'INSTANCE' && !node.componentId) {
    violations.push({
      type: 'design_system',
      severity: 'low',
      element: node.name || 'Component instance',
      description: 'Component instance without proper component reference',
      recommendation: 'Use proper component instances from your design system',
      figmaNodeId: node.id,
      rule: 'PROPER_COMPONENT_USAGE',
    });
  }
}

function checkBrandGuidelines(node: any, violations: any[]): void {
  // Check for brand colors
  if (node.fills) {
    node.fills.forEach((fill: any) => {
      if (fill.type === 'SOLID' && fill.color) {
        const colorHex = rgbToHex(fill.color);
        // This would typically check against a predefined brand color palette
        if (isNonBrandColor(colorHex)) {
          violations.push({
            type: 'brand_guidelines',
            severity: 'medium',
            element: node.name || 'Element',
            description: `Color ${colorHex} may not be part of brand guidelines`,
            recommendation: 'Use colors from your brand color palette',
            figmaNodeId: node.id,
            rule: 'BRAND_COLOR_USAGE',
          });
        }
      }
    });
  }

  // Check for brand typography
  if (node.type === 'TEXT' && node.style) {
    const fontFamily = node.style.fontFamily;
    if (fontFamily && !isBrandFont(fontFamily)) {
      violations.push({
        type: 'brand_guidelines',
        severity: 'medium',
        element: node.name || 'Text element',
        description: `Font family "${fontFamily}" may not be part of brand guidelines`,
        recommendation: 'Use fonts from your brand typography system',
        figmaNodeId: node.id,
        rule: 'BRAND_TYPOGRAPHY',
      });
    }
  }
}

function checkLegalCompliance(node: any, violations: any[]): void {
  // Check for copyright notices
  if (node.type === 'TEXT' && node.characters) {
    const text = node.characters.toLowerCase();
    if (text.includes('copyright') || text.includes('©')) {
      // This is actually good - no violation
      return;
    }
  }

  // Check for privacy policy links
  if (node.type === 'TEXT' && node.characters) {
    const text = node.characters.toLowerCase();
    if (text.includes('privacy') && !text.includes('policy')) {
      violations.push({
        type: 'legal',
        severity: 'medium',
        element: node.name || 'Text element',
        description: 'Privacy-related text without clear policy reference',
        recommendation: 'Include clear reference to privacy policy',
        figmaNodeId: node.id,
        rule: 'PRIVACY_POLICY_REFERENCE',
      });
    }
  }

  // Check for terms of service references
  if (node.type === 'TEXT' && node.characters) {
    const text = node.characters.toLowerCase();
    if (text.includes('agree') || text.includes('terms')) {
      violations.push({
        type: 'legal',
        severity: 'high',
        element: node.name || 'Text element',
        description: 'Terms agreement text should be clearly linked to terms of service',
        recommendation: 'Ensure terms of service are easily accessible and clearly linked',
        figmaNodeId: node.id,
        rule: 'TERMS_OF_SERVICE_ACCESSIBILITY',
      });
    }
  }
}

function checkTechnicalCompliance(node: any, violations: any[]): void {
  // Check for responsive design considerations
  if (node.type === 'FRAME' && node.absoluteBoundingBox) {
    const { width } = node.absoluteBoundingBox;
    if (width > 1920) {
      violations.push({
        type: 'technical',
        severity: 'medium',
        element: node.name || 'Frame',
        description: `Frame width ${width}px exceeds common desktop resolution`,
        recommendation: 'Consider responsive design for larger screens',
        figmaNodeId: node.id,
        rule: 'RESPONSIVE_DESIGN',
      });
    }
  }

  // Check for performance considerations
  if (node.effects && node.effects.length > 3) {
    violations.push({
      type: 'technical',
      severity: 'low',
      element: node.name || 'Element',
      description: 'Multiple effects may impact performance',
      recommendation: 'Consider reducing the number of effects for better performance',
      figmaNodeId: node.id,
      rule: 'PERFORMANCE_OPTIMIZATION',
    });
  }
}

function calculateContrast(color1: any, color2: any): number {
  const getLuminance = (color: any) => {
    const { r, g, b } = color;
    const [rs, gs, bs] = [r, g, b].map((c: number) => {
      c = c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
      return c;
    });
    return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs;
  };

  const l1 = getLuminance(color1);
  const l2 = getLuminance(color2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + 0.05) / (darker + 0.05);
}

function rgbToHex(color: any): string {
  const toHex = (n: number) => {
    const hex = Math.round(n * 255).toString(16);
    return hex.length === 1 ? '0' + hex : hex;
  };
  return `#${toHex(color.r)}${toHex(color.g)}${toHex(color.b)}`;
}

function isNonBrandColor(hex: string): boolean {
  // This would typically check against a predefined brand color palette
  // For now, we'll flag some common non-brand colors
  const nonBrandColors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'];
  return nonBrandColors.includes(hex.toLowerCase());
}

function isBrandFont(fontFamily: string): boolean {
  // This would typically check against a predefined brand font list
  // For now, we'll allow common system fonts
  const brandFonts = ['Inter', 'Roboto', 'Helvetica', 'Arial', 'Times New Roman', 'Georgia'];
  return brandFonts.some(font => fontFamily.includes(font));
}

function generateSummary(violations: any[]) {
  const summary = {
    totalViolations: violations.length,
    criticalCount: 0,
    highCount: 0,
    mediumCount: 0,
    lowCount: 0,
    accessibilityIssues: 0,
    designSystemIssues: 0,
    brandGuidelineIssues: 0,
    legalIssues: 0,
    technicalIssues: 0,
  };

  violations.forEach(violation => {
    switch (violation.severity) {
      case 'critical': summary.criticalCount++; break;
      case 'high': summary.highCount++; break;
      case 'medium': summary.mediumCount++; break;
      case 'low': summary.lowCount++; break;
    }

    switch (violation.type) {
      case 'accessibility': summary.accessibilityIssues++; break;
      case 'design_system': summary.designSystemIssues++; break;
      case 'brand_guidelines': summary.brandGuidelineIssues++; break;
      case 'legal': summary.legalIssues++; break;
      case 'technical': summary.technicalIssues++; break;
    }
  });

  return summary;
}
