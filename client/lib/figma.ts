// Figma API integration for design compliance analysis
export interface FigmaFile {
  document: FigmaNode;
  components: Record<string, FigmaComponent>;
  styles: Record<string, FigmaStyle>;
  name: string;
  lastModified: string;
  version: string;
}

export interface FigmaNode {
  id: string;
  name: string;
  type: string;
  visible?: boolean;
  children?: FigmaNode[];
  fills?: FigmaFill[];
  strokes?: FigmaStroke[];
  effects?: FigmaEffect[];
  constraints?: FigmaConstraints;
  layoutMode?: string;
  primaryAxisAlignItems?: string;
  counterAxisAlignItems?: string;
  paddingLeft?: number;
  paddingRight?: number;
  paddingTop?: number;
  paddingBottom?: number;
  itemSpacing?: number;
  characters?: string;
  style?: FigmaTextStyle;
  absoluteBoundingBox?: FigmaBoundingBox;
}

export interface FigmaComponent {
  key: string;
  name: string;
  description: string;
  componentSetId?: string;
  documentationLinks: FigmaDocumentationLink[];
}

export interface FigmaStyle {
  key: string;
  name: string;
  description: string;
  styleType: string;
}

export interface FigmaFill {
  type: string;
  color?: FigmaColor;
  opacity?: number;
  gradientStops?: FigmaGradientStop[];
}

export interface FigmaStroke {
  type: string;
  color?: FigmaColor;
  opacity?: number;
  weight?: number;
}

export interface FigmaEffect {
  type: string;
  color?: FigmaColor;
  offset?: FigmaOffset;
  radius?: number;
  spread?: number;
}

export interface FigmaColor {
  r: number;
  g: number;
  b: number;
  a: number;
}

export interface FigmaGradientStop {
  color: FigmaColor;
  position: number;
}

export interface FigmaOffset {
  x: number;
  y: number;
}

export interface FigmaConstraints {
  vertical: string;
  horizontal: string;
}

export interface FigmaBoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface FigmaTextStyle {
  fontFamily: string;
  fontPostScriptName: string;
  paragraphSpacing: number;
  paragraphIndent: number;
  listSpacing: number;
  hangingPunctuation: boolean;
  hangingList: boolean;
  fontSize: number;
  textCase: string;
  textDecoration: string;
  textAlignHorizontal: string;
  textAlignVertical: string;
  letterSpacing: number;
  fills: FigmaFill[];
  hyperlink: FigmaHyperlink;
  opentypeFlags: Record<string, number>;
  lineHeightPx: number;
  lineHeightPercent: number;
  lineHeightPercentFontSize: number;
  lineHeightUnit: string;
}

export interface FigmaHyperlink {
  type: string;
  url: string;
}

export interface FigmaDocumentationLink {
  uri: string;
}

export interface FigmaComplianceViolation {
  type: 'accessibility' | 'design_system' | 'brand_guidelines' | 'legal' | 'technical';
  severity: 'low' | 'medium' | 'high' | 'critical';
  element: string;
  description: string;
  recommendation: string;
  figmaNodeId?: string;
  rule: string;
}

export interface FigmaComplianceReport {
  fileId: string;
  fileName: string;
  violations: FigmaComplianceViolation[];
  summary: {
    totalViolations: number;
    criticalCount: number;
    highCount: number;
    mediumCount: number;
    lowCount: number;
    accessibilityIssues: number;
    designSystemIssues: number;
    brandGuidelineIssues: number;
    legalIssues: number;
    technicalIssues: number;
  };
  analyzedAt: string;
}

class FigmaService {
  private apiKey: string;
  private baseUrl = 'https://api.figma.com/v1';

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  async getFile(fileId: string): Promise<FigmaFile> {
    try {
      const response = await fetch(`${this.baseUrl}/files/${fileId}`, {
        headers: {
          'X-Figma-Token': this.apiKey,
        },
      });

      if (!response.ok) {
        throw new Error(`Figma API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error fetching Figma file:', error);
      throw error;
    }
  }

  async getFileImages(fileId: string, nodeIds: string[]): Promise<Record<string, string>> {
    try {
      const response = await fetch(`${this.baseUrl}/images/${fileId}?ids=${nodeIds.join(',')}&format=png`, {
        headers: {
          'X-Figma-Token': this.apiKey,
        },
      });

      if (!response.ok) {
        throw new Error(`Figma API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return data.images;
    } catch (error) {
      console.error('Error fetching Figma images:', error);
      throw error;
    }
  }

  analyzeCompliance(file: FigmaFile): FigmaComplianceReport {
    const violations: FigmaComplianceViolation[] = [];
    
    // Analyze the document recursively
    this.analyzeNode(file.document, violations, file);
    
    // Generate summary
    const summary = this.generateSummary(violations);
    
    return {
      fileId: file.name,
      fileName: file.name,
      violations,
      summary,
      analyzedAt: new Date().toISOString(),
    };
  }

  private analyzeNode(node: FigmaNode, violations: FigmaComplianceViolation[], file: FigmaFile): void {
    // Accessibility checks
    this.checkAccessibility(node, violations);
    
    // Design system checks
    this.checkDesignSystem(node, violations, file);
    
    // Brand guidelines checks
    this.checkBrandGuidelines(node, violations);
    
    // Legal compliance checks
    this.checkLegalCompliance(node, violations);
    
    // Technical compliance checks
    this.checkTechnicalCompliance(node, violations);
    
    // Recursively analyze children
    if (node.children) {
      node.children.forEach(child => this.analyzeNode(child, violations, file));
    }
  }

  private checkAccessibility(node: FigmaNode, violations: FigmaComplianceViolation[]): void {
    // Check for text contrast
    if (node.type === 'TEXT' && node.fills) {
      node.fills.forEach(fill => {
        if (fill.type === 'SOLID' && fill.color) {
          const contrast = this.calculateContrast(fill.color, { r: 1, g: 1, b: 1, a: 1 }); // Assume white background
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

  private checkDesignSystem(node: FigmaNode, violations: FigmaComplianceViolation[], file: FigmaFile): void {
    // Check for consistent spacing
    if (node.type === 'FRAME' && node.layoutMode === 'VERTICAL') {
      const children = node.children || [];
      if (children.length > 1) {
        const spacings = children.slice(1).map((child, index) => {
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
    if (node.type === 'INSTANCE' && !(node as any).componentId) {
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

  private checkBrandGuidelines(node: FigmaNode, violations: FigmaComplianceViolation[]): void {
    // Check for brand colors
    if (node.fills) {
      node.fills.forEach(fill => {
        if (fill.type === 'SOLID' && fill.color) {
          const colorHex = this.rgbToHex(fill.color);
          // This would typically check against a predefined brand color palette
          if (this.isNonBrandColor(colorHex)) {
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
      if (fontFamily && !this.isBrandFont(fontFamily)) {
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

  private checkLegalCompliance(node: FigmaNode, violations: FigmaComplianceViolation[]): void {
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

  private checkTechnicalCompliance(node: FigmaNode, violations: FigmaComplianceViolation[]): void {
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

  private calculateContrast(color1: FigmaColor, color2: FigmaColor): number {
    const getLuminance = (color: FigmaColor) => {
      const { r, g, b } = color;
      const [rs, gs, bs] = [r, g, b].map(c => {
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

  private rgbToHex(color: FigmaColor): string {
    const toHex = (n: number) => {
      const hex = Math.round(n * 255).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };
    return `#${toHex(color.r)}${toHex(color.g)}${toHex(color.b)}`;
  }

  private isNonBrandColor(hex: string): boolean {
    // This would typically check against a predefined brand color palette
    // For now, we'll flag some common non-brand colors
    const nonBrandColors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00', '#ff00ff', '#00ffff'];
    return nonBrandColors.includes(hex.toLowerCase());
  }

  private isBrandFont(fontFamily: string): boolean {
    // This would typically check against a predefined brand font list
    // For now, we'll allow common system fonts
    const brandFonts = ['Inter', 'Roboto', 'Helvetica', 'Arial', 'Times New Roman', 'Georgia'];
    return brandFonts.some(font => fontFamily.includes(font));
  }

  private generateSummary(violations: FigmaComplianceViolation[]) {
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
}

export default FigmaService;
