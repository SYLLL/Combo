# GitHub Integration Setup

This document explains how to set up GitHub API integration for code compliance analysis.

## GitHub Personal Access Token Setup

1. Go to GitHub.com and sign in to your account
2. Navigate to Settings → Developer settings → Personal access tokens → Tokens (classic)
3. Click "Generate new token (classic)"
4. Give it a descriptive name like "Combo Compliance Analyzer"
5. Select the following scopes:
   - `repo` (Full control of private repositories)
   - `public_repo` (Access public repositories)
6. Click "Generate token"
7. Copy the token (it starts with `ghp_`)

## Environment Configuration

Add the following to your `.env.local` file:

```bash
# GitHub API Configuration
GITHUB_TOKEN=ghp_your_actual_token_here
```

## How It Works

When you provide a GitHub repository URL in the compliance analysis form, the system will:

1. **Extract Repository Info**: Parse the GitHub URL to get owner and repository name
2. **Search for Compliance-Related Code**: Run multiple searches looking for:
   - Privacy policies and data collection
   - Cookie and tracking implementations
   - Age verification and children's data handling
   - GDPR compliance measures
   - HIPAA health data handling
   - Authentication and user account systems
   - Data storage and database operations
   - API integrations and third-party services
   - Security and encryption implementations
   - Legal compliance and terms of service

3. **Analyze Code Content**: Fetch and analyze the actual code files found
4. **Integrate with Compliance Analysis**: Include the GitHub search results in the AI-powered compliance analysis

## Search Queries Used

The system searches for these compliance-related terms:
- Privacy and data collection
- Cookie and tracking
- Age verification and children's data
- GDPR compliance
- HIPAA health information
- Authentication systems
- Data storage
- API integrations
- Security measures
- Legal compliance

## Rate Limiting

The GitHub API has rate limits. The system includes delays between requests to respect these limits:
- 1 second delay between search queries
- Handles API errors gracefully
- Provides fallback when API is unavailable

## Testing

To test the GitHub integration:

1. Set up your GitHub token in `.env.local`
2. Start the development server: `npm run dev`
3. Upload a file with a GitHub repository URL
4. Check the server logs for GitHub search progress
5. Review the compliance analysis results for GitHub-specific findings

## Troubleshooting

### Common Issues

1. **"Invalid GitHub URL format"**: Ensure the URL is a valid GitHub repository URL
2. **"API Error: 401"**: Check that your GitHub token is valid and has the correct permissions
3. **"API Error: 403"**: You may have hit rate limits or the repository is private and your token doesn't have access
4. **"No search results found"**: The repository may not contain compliance-related code, or the search terms didn't match

### Debug Mode

Check the server console logs for detailed information about:
- GitHub search progress
- API response status codes
- Search results found
- Any errors encountered
