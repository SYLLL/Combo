import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { AuthProvider } from '@/hooks/useAuth';
import Index from '@/pages/Index';
import NotFound from '@/pages/NotFound';
import AuthDemo from '@/pages/AuthDemo';
import ProductComplianceCouncil from '@/pages/ProductComplianceCouncil';
import ComplianceLog from '@/pages/ComplianceLog';
import ComplianceRiskDetail from '@/pages/ComplianceRiskDetail';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Index />} />
          <Route path="/auth-demo" element={<AuthDemo />} />
          <Route path="/product-compliance-council" element={<ProductComplianceCouncil />} />
          <Route path="/compliance-log" element={<ComplianceLog />} />
          <Route path="/compliance-risk/:riskId" element={<ComplianceRiskDetail />} />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;