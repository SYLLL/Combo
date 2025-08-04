import { useState, useCallback } from 'react'
import { FileText, Upload, CheckCircle, AlertTriangle, Info } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'

interface AnalysisResult {
  status: 'pending' | 'good' | 'questions' | 'issues'
  message: string
  details?: string[]
}

interface SchemaData {
  email: {
    type: string
    format: string
  }
  notes: string[]
  suggestions: string[]
  mitigations: string[]
}

interface LegalReview {
  facts: string[]
  notes: string[]
  suggestions: string[]
  mitigations: string[]
}

export default function Index() {
  const [uploadedFile, setUploadedFile] = useState<File | null>(null)
  const [productDescription, setProductDescription] = useState("Adding a daily mode toggle to user profile")
  const [dragActive, setDragActive] = useState(false)
  
  // Mock data matching the reference image
  const [analysis] = useState<AnalysisResult>({
    status: 'good',
    message: 'Good to proceed with the proposed changes',
    details: ['Age-gating changes']
  })

  const [schemaData] = useState<SchemaData>({
    email: {
      type: "string",
      format: "email"
    },
    notes: ["Is sensitive user_data being stored?"],
    suggestions: ["Beta of the feed (e.g. store email domain only)"],
    mitigations: ["Age-gate for users aged 13 and over"]
  })

  const [legalReview] = useState<LegalReview>({
    facts: ["New feature launches email collection page", "Asks users to input email address"],
    notes: ["Is sensitive user_data being stored?"],
    suggestions: ["Beta of the feed (e.g. store email domain only)"],
    mitigations: [
      "Age-gate for for user_aged 13 and over",
      "Enable the feature by default but prompt for age verification"
    ]
  })

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setUploadedFile(e.dataTransfer.files[0])
    }
  }, [])

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadedFile(e.target.files[0])
    }
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b bg-card px-4 sm:px-6 py-4">
        <h1 className="text-xl sm:text-2xl font-semibold text-foreground">Product Compliance Hub</h1>
        <p className="text-sm text-muted-foreground mt-1 hidden sm:block">
          Streamline product requirements review and compliance analysis
        </p>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          
          {/* Launch Compliance Section */}
          <Card className="md:col-span-2 lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Launch Compliance
              </CardTitle>
              <p className="text-sm text-muted-foreground">
                Submit your product requirements for evaluation and advice.
              </p>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <label className="text-sm font-medium text-foreground mb-2 block">
                  Product description
                </label>
                <Textarea
                  value={productDescription}
                  onChange={(e) => setProductDescription(e.target.value)}
                  className="min-h-[60px] text-sm"
                />
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-3 block">
                  Product requirements doc
                </label>
                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    dragActive 
                      ? 'border-primary bg-accent/50' 
                      : 'border-muted-foreground/30 hover:border-muted-foreground/50'
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <input
                    type="file"
                    id="file-upload"
                    className="hidden"
                    onChange={handleFileInput}
                    accept=".pdf,.doc,.docx,.txt"
                  />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <Upload className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                    {uploadedFile ? (
                      <div>
                        <p className="text-sm font-medium text-foreground">{uploadedFile.name}</p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {(uploadedFile.size / 1024).toFixed(1)} KB
                        </p>
                      </div>
                    ) : (
                      <div>
                        <p className="text-sm text-muted-foreground">
                          Drag and drop file or click to select
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          PDF, DOC, or TXT files
                        </p>
                      </div>
                    )}
                  </label>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-foreground mb-3">Analysis</h3>
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-5 w-5 text-success mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        Good to proceed with the proposed changes
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-5 w-5 text-warning mt-0.5" />
                    <div>
                      <p className="text-sm font-medium text-foreground">Questions</p>
                      <p className="text-xs text-muted-foreground">Age-gating changes</p>
                    </div>
                  </div>
                </div>
                <Button variant="outline" className="w-full mt-4">
                  Request legal review
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Eugene's API Schema Section */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="h-5 w-5 bg-primary rounded text-primary-foreground text-xs flex items-center justify-center font-bold">
                  E
                </div>
                Eugene's API Schema
              </CardTitle>
              <Badge variant="secondary" className="w-fit">
                Potential compliance issue submitted
              </Badge>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-foreground mb-2">Json</h3>
                <div className="bg-muted rounded-md p-3 font-mono text-sm">
                  <pre className="text-foreground whitespace-pre-wrap">
{`"email": {
  "type": "string",
  "format": "email"
}`}
                  </pre>
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-foreground mb-2">Notes</h3>
                <div className="space-y-2">
                  {schemaData.notes.map((note, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <div className="h-1.5 w-1.5 bg-muted-foreground rounded-full mt-2" />
                      <p className="text-sm text-muted-foreground">{note}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-foreground mb-2">Suggestions</h3>
                <div className="space-y-2">
                  {schemaData.suggestions.map((suggestion, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <div className="h-1.5 w-1.5 bg-muted-foreground rounded-full mt-2" />
                      <p className="text-sm text-muted-foreground">{suggestion}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-foreground mb-2">Mitigations</h3>
                <div className="space-y-2">
                  {schemaData.mitigations.map((mitigation, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <div className="h-1.5 w-1.5 bg-muted-foreground rounded-full mt-2" />
                      <p className="text-sm text-muted-foreground">{mitigation}</p>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Product Legal Review Section */}
          <Card className="lg:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Info className="h-5 w-5 text-primary" />
                Product Legal Review
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="text-sm font-medium text-foreground mb-2">Facts</h3>
                <div className="space-y-2">
                  {legalReview.facts.map((fact, index) => (
                    <p key={index} className="text-sm text-muted-foreground">
                      {fact}
                    </p>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-foreground mb-2">Notes</h3>
                <div className="space-y-2">
                  {legalReview.notes.map((note, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <div className="h-1.5 w-1.5 bg-muted-foreground rounded-full mt-2" />
                      <p className="text-sm text-muted-foreground">{note}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-foreground mb-2">Suggestions</h3>
                <div className="space-y-2">
                  {legalReview.suggestions.map((suggestion, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <div className="h-1.5 w-1.5 bg-muted-foreground rounded-full mt-2" />
                      <p className="text-sm text-muted-foreground">{suggestion}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-medium text-foreground mb-2">Mitigations</h3>
                <div className="space-y-2">
                  {legalReview.mitigations.map((mitigation, index) => (
                    <div key={index} className="flex items-start gap-2">
                      <div className="h-1.5 w-1.5 bg-muted-foreground rounded-full mt-2" />
                      <p className="text-sm text-muted-foreground">{mitigation}</p>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

        </div>
      </div>
    </div>
  )
}
