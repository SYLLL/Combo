# Figma Integration Guide

## Overview

The Figma integration allows you to analyze design files for compliance violations across multiple categories including accessibility, design system consistency, brand guidelines, legal compliance, and technical considerations.

## Features

### 🎨 Design Compliance Analysis
- **Accessibility Checks**: WCAG AA contrast ratios, minimum touch targets
- **Design System**: Consistent spacing, proper component usage
- **Brand Guidelines**: Color palette compliance, typography standards
- **Legal Compliance**: Privacy policy references, terms of service accessibility
- **Technical**: Responsive design considerations, performance optimization

### 📊 Comprehensive Reporting
- Detailed violation breakdown by severity (Critical, High, Medium, Low)
- Category-specific issue counts
- Actionable recommendations for each violation
- Direct links to Figma nodes for easy navigation

## Getting Started

### 1. Get Your Figma Access Token

1. Go to [Figma Developer Settings](https://www.figma.com/developers/api#access-tokens)
2. Click "Create new token"
3. Give it a descriptive name (e.g., "Compliance Analysis")
4. Copy the generated token

### 2. Access the Figma Analysis Tab

1. Sign in to the Compliance Council
2. Navigate to the "Figma Analysis" tab
3. Enter your Figma access token
4. Paste your Figma file URL or file ID

### 3. Analyze Your Design

1. Click "Analyze Figma File"
2. Wait for the analysis to complete
3. Review the compliance report
4. Click "Open in Figma" to view violations in context

## File URL Format

The system accepts Figma file URLs in these formats:
- `https://www.figma.com/file/ABC123DEF456/My-Design-File`
- `ABC123DEF456` (file ID only)

## Compliance Categories

### ♿ Accessibility Violations
- **WCAG AA Contrast**: Text contrast ratios below 4.5:1
- **Minimum Touch Targets**: Interactive elements smaller than 44x44px
- **Color Blindness**: High contrast color combinations

### 🎨 Design System Violations
- **Inconsistent Spacing**: Non-standard spacing between elements
- **Component Usage**: Improper component instances
- **Layout Patterns**: Inconsistent layout structures

### 🏷️ Brand Guidelines Violations
- **Color Usage**: Non-brand colors detected
- **Typography**: Fonts outside brand guidelines
- **Logo Usage**: Improper logo placement or sizing

### ⚖️ Legal Compliance Violations
- **Privacy Policy**: Missing or unclear privacy references
- **Terms of Service**: Unclear terms agreement text
- **Copyright**: Missing copyright notices where required

### ⚙️ Technical Violations
- **Responsive Design**: Designs exceeding common screen sizes
- **Performance**: Excessive effects or complex layouts
- **Cross-Platform**: Platform-specific design considerations

## Understanding Violations

### Severity Levels
- **Critical**: Must be fixed immediately (legal/accessibility issues)
- **High**: Should be fixed soon (accessibility barriers)
- **Medium**: Recommended fixes (brand/design consistency)
- **Low**: Nice to have improvements (performance optimizations)

### Violation Details
Each violation includes:
- **Element**: The specific design element affected
- **Description**: What the issue is
- **Recommendation**: How to fix it
- **Rule**: The compliance rule being violated
- **Node ID**: Direct link to the Figma element

## API Integration

### Server Endpoint
```
POST /api/figma/analyze
Content-Type: application/json

{
  "figmaToken": "your-figma-token",
  "fileId": "figma-file-id"
}
```

### Response Format
```json
{
  "success": true,
  "report": {
    "fileId": "file-name",
    "fileName": "file-name",
    "violations": [...],
    "summary": {
      "totalViolations": 5,
      "criticalCount": 1,
      "highCount": 2,
      "mediumCount": 1,
      "lowCount": 1,
      "accessibilityIssues": 2,
      "designSystemIssues": 1,
      "brandGuidelineIssues": 1,
      "legalIssues": 1,
      "technicalIssues": 0
    },
    "analyzedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

## Best Practices

### Before Analysis
1. **Organize Your Design**: Use proper naming conventions
2. **Component Structure**: Create reusable components
3. **Documentation**: Add descriptions to complex elements

### After Analysis
1. **Prioritize Fixes**: Start with Critical and High severity issues
2. **Batch Similar Issues**: Fix all spacing issues together
3. **Test Changes**: Verify fixes don't introduce new issues
4. **Re-analyze**: Run analysis again after making changes

### Team Workflow
1. **Design Review**: Include compliance analysis in design reviews
2. **Automated Checks**: Run analysis on major design updates
3. **Documentation**: Keep track of resolved violations
4. **Training**: Educate team on compliance requirements

## Troubleshooting

### Common Issues

**"Figma API error: 403 Forbidden"**
- Check that your access token is valid
- Ensure the file is accessible (not private or restricted)

**"Figma API error: 404 Not Found"**
- Verify the file ID is correct
- Check that the file URL is properly formatted

**"Analysis failed"**
- Ensure the file contains analyzable content
- Check that the file isn't too large or complex

**"No violations found"**
- This is good! Your design meets compliance standards
- Consider running analysis on different file versions

### Getting Help

1. **Check Figma API Status**: [Figma API Status](https://status.figma.com/)
2. **Review Token Permissions**: Ensure your token has file access
3. **File Access**: Verify the file is shared with your account
4. **Network Issues**: Check your internet connection

## Security Notes

- **Token Security**: Never share your Figma access token
- **File Access**: Only analyze files you have permission to access
- **Data Privacy**: Analysis data is processed securely and not stored permanently
- **Token Rotation**: Regularly rotate your access tokens

## Legal Brief Integration

The Figma analysis results are automatically included in legal compliance briefs when you upload requirements documents. Here's how it works:

### 📋 **Legal Brief Generation**

When you upload a requirements document with Figma analysis:

1. **Upload Requirements**: Use the upload form with your Figma URL and token
2. **Automatic Analysis**: The system analyzes both the document and Figma design
3. **Comprehensive Brief**: The legal brief includes:
   - Document compliance analysis
   - GitHub code analysis (if provided)
   - **Figma design compliance analysis**
   - Integrated recommendations

### 🎯 **What's Included in Legal Briefs**

The legal brief will include sections like:

```
Figma Design Analysis Results:
File: My-Design-File
Total Violations: 5
Critical Issues: 1
High Priority Issues: 2
Medium Priority Issues: 1
Low Priority Issues: 1

Violation Categories:
- Accessibility Issues: 2
- Design System Issues: 1
- Brand Guidelines Issues: 1
- Legal Compliance Issues: 1
- Technical Issues: 0

Detailed Violations:
1. LEGAL - HIGH
   Element: Terms Agreement Button
   Issue: Terms agreement text should be clearly linked to terms of service
   Recommendation: Ensure terms of service are easily accessible and clearly linked
   Rule: TERMS_OF_SERVICE_ACCESSIBILITY
```

### ⚖️ **Legal Considerations**

The AI analyzes design violations in the context of legal compliance:

- **Accessibility Issues**: May create legal liability under ADA/WCAG
- **Legal Compliance**: Missing privacy policies, unclear terms
- **Brand Guidelines**: Could affect legal agreements and trademarks
- **Technical Issues**: May impact data handling and user experience

## Future Enhancements

- **GitHub Integration**: Analyze code repositories for compliance ✅ **COMPLETED**
- **Automated Reports**: Generate compliance reports automatically
- **Team Collaboration**: Share analysis results with team members
- **Custom Rules**: Define organization-specific compliance rules
- **Integration**: Connect with design tools and project management systems

## Support

For technical support or feature requests, please contact the development team or create an issue in the project repository.
