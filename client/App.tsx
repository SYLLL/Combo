import "./global.css";

import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route, useNavigate } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";
import jsPDF from 'jspdf';
import { signInUser, signUpUser, createUserProfile, createProject, getUserProjects, Project, signOutUser, initializeUserProjects, syncProjectsToFirebase, subscribeToUserProjects, fetchBearerToken, createProjectREST, getUserProjectsREST, db } from "./lib/firebase";
// Removed Firebase SDK imports to prevent WebSocket connections
import { AuthProvider, useAuth } from "./hooks/useAuth";
import { LoginForm } from "./components/LoginForm";
import ComplianceReviewPage from "./pages/ComplianceReviewPage";
import PayPalPayment from "./components/PayPalPayment";

// Product Compliance Council Page
function ProductComplianceCouncil() {
  const navigate = useNavigate();
  const { currentUser, loading: authLoading } = useAuth();
  
  const [showNewProjectForm, setShowNewProjectForm] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);
  const [signingOut, setSigningOut] = useState(false);
  const [newProject, setNewProject] = useState({
    name: '',
    description: '',
    priority: 'Medium' as 'Low' | 'Medium' | 'High',
    legalPartnerEmail: ''
  });
  
  // Don't redirect immediately - let the loading state handle it


         // Load user projects when component mounts or user changes
         useEffect(() => {
           
           // Don't load projects if signing out
           if (signingOut) {
             setLoading(false);
             return;
           }
           
           if (currentUser) {
             setLoading(true);
             
             // Initialize user projects with fresh Bearer token authentication
             const loadProjects = async () => {
               try {
                 // console.log('🔥 Starting loadProjects function with fresh Bearer token');
                 
                 // Get fresh Bearer token using the simple signUp approach
                 // console.log('🔥 Fetching fresh Bearer token for project loading...');
                 const tokenResult = await fetchBearerToken();
                 
                 if (tokenResult.success) {
                   // console.log('🔥 Using REST API with fresh Bearer token for project loading...');
                   const result = await getUserProjectsREST(currentUser.uid, currentUser.email || '', tokenResult.idToken);
                   
                   if (result.success) {
                     setProjects(result.projects);
                     setLoading(false);
                     // console.log('🔥 Set projects from REST API:', result.projects);
                     return;
                   } else {
                     // console.log('🔥 REST API failed, trying SDK fallback...');
                   }
                 } else {
                   // console.log('🔥 Failed to get Bearer token, trying SDK fallback...');
                 }

                 // Fallback to SDK method
                 const result = await initializeUserProjects(currentUser.uid);
                 // console.log('🔥 Project initialization result:', result);
                 
                 if (result.success) {
                   setProjects(result.projects);
                   setLoading(false);
                   // console.log('🔥 Set projects from Firebase SDK:', result.projects);
                 } else {
                   // Fallback to localStorage if Firebase fails
                   const localProjects = JSON.parse(localStorage.getItem(`projects_${currentUser.uid}`) || '[]');
                   if (localProjects.length > 0) {
                     setProjects(localProjects);
                     setLoading(false);
                     // console.log('🔥 Set projects from localStorage fallback:', localProjects);
                   } else {
                     setProjects([]);
                     setLoading(false);
                     // console.log('🔥 No projects found');
                   }
                 }
               } catch (error: any) {
                 // console.error('🔥 Error loading projects in useEffect:', error);
                 setLoading(false);
                 // Fallback to localStorage if Firebase fails
                 const localProjects = JSON.parse(localStorage.getItem(`projects_${currentUser.uid}`) || '[]');
                 if (localProjects.length > 0) {
                   setProjects(localProjects);
                   // console.log('🔥 Set projects from localStorage fallback due to error:', localProjects);
                 } else {
                   setProjects([]);
                 }
               }
             };
             
             loadProjects();
           } else {
             // console.log('🔥 No current user, clearing projects');
             setProjects([]);
             setLoading(false);
           }
         }, [currentUser, signingOut]);

  const handleCreateProject = async () => {
    if (!currentUser) {
      alert('Please sign in to create a project.');
      return;
    }
    
    if (!newProject.name.trim() || !newProject.description.trim()) {
      alert('Please fill in both project name and description.');
      return;
    }

    // console.log('🔥 Creating project for user:', currentUser.uid, currentUser.email);
    // console.log('🔥 Project data:', newProject);

    try {
      // Get fresh Bearer token using the simple signUp approach
      // console.log('🔥 Fetching fresh Bearer token using signUp endpoint...');
      const tokenResult = await fetchBearerToken();
      
      if (tokenResult.success) {
        // console.log('🔥 Using REST API with fresh Bearer token...');
        // Use REST API with fresh Bearer token
        const result = await createProjectREST({
          name: newProject.name,
          description: newProject.description,
          priority: newProject.priority,
          status: 'Draft',
          legalPartnerEmail: newProject.legalPartnerEmail,
          legalUserId: newProject.legalPartnerEmail // Use email as legalUserId for now
        }, currentUser.uid, tokenResult.idToken);

        // console.log('🔥 Project creation result:', result);

        if (result.success) {
          setNewProject({ name: '', description: '', priority: 'Medium', legalPartnerEmail: '' });
          setShowNewProjectForm(false);
          // console.log('🔥 Project created successfully via REST API, ID:', result.projectId);
          
          // Show success message
          alert('Project created successfully via REST API! Check console for details.');
          
          // Refresh projects list
          await handleForceRefreshProjects();
          return;
        } else {
          // console.log('🔥 REST API failed, trying SDK fallback...');
        }
      } else {
        // console.log('🔥 Failed to get Bearer token, trying SDK fallback...');
      }

      // Fallback to SDK method
      const result = await createProject({
        name: newProject.name,
        description: newProject.description,
        priority: newProject.priority,
        status: 'Draft',
        legalPartnerEmail: newProject.legalPartnerEmail,
        legalUserId: newProject.legalPartnerEmail // Use email as legalUserId for now
      }, currentUser.uid);

      if (result.success) {
        setNewProject({ name: '', description: '', priority: 'Medium', legalPartnerEmail: '' });
        setShowNewProjectForm(false);
        alert('Project created successfully via SDK fallback!');
        await handleForceRefreshProjects();
      } else {
        alert('Failed to create project: ' + result.error);
      }
    } catch (error: any) {
      // console.error('🔥 Error creating project:', error);
      alert('An error occurred while creating the project: ' + error.message);
    }
  };







  // Force refresh projects
  const handleForceRefreshProjects = async () => {
    if (!currentUser) {
      alert('Please sign in to refresh projects.');
      return;
    }

    // console.log('🔥 Force refreshing projects for user:', currentUser.uid);
    setLoading(true);
    
    try {
      // Get fresh Bearer token using the simple signUp approach
      // console.log('🔥 Force refresh - fetching fresh Bearer token...');
      const tokenResult = await fetchBearerToken();
      
      if (tokenResult.success) {
        // console.log('🔥 Force refresh - using REST API with fresh Bearer token...');
        const result = await getUserProjectsREST(currentUser.uid, currentUser.email || '', tokenResult.idToken);
        
        if (result.success) {
          setProjects(result.projects);
          setLoading(false);
          // console.log('🔥 Force refresh - set projects from REST API:', result.projects);
          alert(`Force refresh complete:\n\nREST API: ${result.projects.length} projects\n\nProjects loaded successfully!`);
          return;
        } else {
          // console.log('🔥 REST API failed, trying SDK fallback...');
        }
      } else {
        // console.log('🔥 Failed to get Bearer token, trying SDK fallback...');
      }

      // Fallback to SDK method
      const result = await initializeUserProjects(currentUser.uid);
      // console.log('🔥 Force refresh - Firebase SDK result:', result);
      
      if (result.success) {
        setProjects(result.projects);
        setLoading(false);
        // console.log('🔥 Force refresh - set projects from Firebase SDK:', result.projects);
        alert(`Force refresh complete:\n\nFirebase SDK: ${result.projects.length} projects\n\nProjects loaded successfully!`);
      } else {
        // Fallback to localStorage
        const localProjects = JSON.parse(localStorage.getItem(`projects_${currentUser.uid}`) || '[]');
        setProjects(localProjects);
        setLoading(false);
        // console.log('🔥 Force refresh - fallback to localStorage:', localProjects);
        alert(`Force refresh complete:\n\nFirebase SDK: Error (${result.error})\nlocalStorage: ${localProjects.length} projects\n\nUsing localStorage fallback.`);
      }
    } catch (error: any) {
      // console.error('🔥 Force refresh error:', error);
      setLoading(false);
      // Fallback to localStorage
      const localProjects = JSON.parse(localStorage.getItem(`projects_${currentUser.uid}`) || '[]');
      setProjects(localProjects);
      alert('Force refresh failed: ' + error.message + '\n\nUsing localStorage fallback.');
    }
  };

  // Manual save to Firebase function using REST API with fresh Bearer token
  const handleSaveToFirebase = async () => {
    if (!currentUser) {
      alert('Please sign in to save projects.');
      return;
    }

    // console.log('🔥 Manual save to Firebase for user:', currentUser.uid);
    
    try {
      // Get fresh Bearer token using the simple signUp approach
      // console.log('🔥 Fetching fresh Bearer token for save operation...');
      const tokenResult = await fetchBearerToken();
      
      if (!tokenResult.success) {
        alert('Failed to get Bearer token: ' + tokenResult.error);
        return;
      }

      // Get projects from localStorage
      const localProjects = JSON.parse(localStorage.getItem(`projects_${currentUser.uid}`) || '[]');
      // console.log('🔥 Local projects to save:', localProjects.length);

      let syncedCount = 0;
      let errorCount = 0;

      // Save each project to Firebase using REST API
      for (const project of localProjects) {
        try {
          // console.log('🔥 Saving project to Firebase:', project.name);
          
          const result = await createProjectREST({
            name: project.name,
            description: project.description,
            priority: project.priority,
            status: project.status
          }, currentUser.uid, tokenResult.idToken);

          if (result.success) {
            syncedCount++;
            // console.log('🔥 Project saved successfully:', project.name);
          } else {
            errorCount++;
            // console.error('🔥 Failed to save project:', project.name, result.error);
          }
        } catch (error: any) {
          errorCount++;
          // console.error('🔥 Error saving project:', project.name, error.message);
        }
      }

      // Show results
      if (syncedCount > 0) {
        alert(`Successfully synced ${syncedCount} projects to Firebase!\n${errorCount > 0 ? `\n${errorCount} projects failed to sync.` : ''}`);
        // Refresh projects after sync
        await handleForceRefreshProjects();
      } else {
        alert(`Failed to sync any projects to Firebase.\n${errorCount} projects failed.`);
      }
    } catch (error: any) {
      // console.error('🔥 Manual sync error:', error);
      alert('Error syncing projects: ' + error.message);
    }
  };
  
  const getStatusColor = (status: Project['status']) => {
    switch (status) {
      case 'In Progress': return '#059669';
      case 'Pending': return '#d97706';
      case 'Draft': return '#6b7280';
      case 'Completed': return '#10b981';
      default: return '#6b7280';
    }
  };
  
  const getPriorityColor = (priority: Project['priority']) => {
    switch (priority) {
      case 'High': return '#dc2626';
      case 'Medium': return '#d97706';
      case 'Low': return '#059669';
      default: return '#6b7280';
    }
  };
  
  // Show loading while authentication is being checked
  if (authLoading) {
    return (
      <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
        <div style={{ 
          width: '32px', 
          height: '32px', 
          border: '3px solid #0369a1', 
          borderTop: '3px solid transparent', 
          borderRadius: '50%', 
          animation: 'spin 1s linear infinite',
          margin: '0 auto 16px'
        }}></div>
        <p style={{ color: '#64748b', fontSize: '16px' }}>Checking authentication...</p>
      </div>
    );
  }

  // Show message if not authenticated
  if (!authLoading && !currentUser) {
    return (
      <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto', textAlign: 'center' }}>
        <h1 style={{ fontSize: '32px', fontWeight: '700', color: '#1f2937', marginBottom: '16px' }}>
          Authentication Required
        </h1>
        <p style={{ color: '#64748b', fontSize: '16px', marginBottom: '24px' }}>
          Please sign in to access the compliance dashboard.
        </p>
        
        
        <button
          onClick={() => navigate('/')}
          style={{
            padding: '12px 24px',
            backgroundColor: '#2563eb',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: '500',
            cursor: 'pointer'
          }}
        >
          Go to Login
        </button>
      </div>
    );
  }
  
  return (
    <div style={{ padding: '24px', maxWidth: '1200px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <div>
        <h1 style={{ fontSize: '32px', fontWeight: '700', color: '#1f2937' }}>
          Product Compliance Council
        </h1>
            <div style={{ fontSize: '14px', color: '#6b7280', marginTop: '4px' }}>
              Signed in as: {currentUser.email}
            </div>
          </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <PayPalPayment userEmail={currentUser.email} />
          <button
            onClick={() => {
              setSigningOut(true);
              
              // Set disable flag BEFORE clearing storage to prevent re-authentication
              localStorage.setItem('FORCE_DISABLE_FIREBASE_AUTH', 'true');
              localStorage.setItem('FORCE_DISABLE_TIMESTAMP', Date.now().toString());
              
              // Clear all browser storage immediately
              localStorage.clear();
              sessionStorage.clear();
              
              // Re-set the disable flag after clearing (this is the key!)
              localStorage.setItem('FORCE_DISABLE_FIREBASE_AUTH', 'true');
              localStorage.setItem('FORCE_DISABLE_TIMESTAMP', Date.now().toString());
              
              // Force redirect to home page with page reload immediately
              window.location.href = '/';
            }}
            disabled={signingOut}
          style={{
            padding: '12px 24px',
              backgroundColor: signingOut ? '#9ca3af' : '#dc2626',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: '500',
              cursor: signingOut ? 'not-allowed' : 'pointer'
          }}
        >
            {signingOut ? 'Signing Out...' : 'Sign Out'}
        </button>
        </div>
      </div>
      
      {/* New Project Form */}
      {showNewProjectForm && (
        <div style={{ 
          backgroundColor: 'white', 
          padding: '24px', 
          borderRadius: '12px', 
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
          marginBottom: '24px'
        }}>
          <h2 style={{ fontSize: '24px', fontWeight: '600', marginBottom: '20px', color: '#1f2937' }}>
            Create New Compliance Review
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px', display: 'block' }}>
                Project Name
              </label>
              <input
                type="text"
                value={newProject.name}
                onChange={(e) => setNewProject({...newProject, name: e.target.value})}
                placeholder="Enter project name"
                style={{
                  width: '100%',
                  height: '44px',
                  padding: '0 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '16px'
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px', display: 'block' }}>
                Legal Partner Email
              </label>
              <input
                type="email"
                value={newProject.legalPartnerEmail}
                onChange={(e) => setNewProject({...newProject, legalPartnerEmail: e.target.value})}
                placeholder="Enter legal partner's email address"
                style={{
                  width: '100%',
                  height: '44px',
                  padding: '0 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '16px'
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px', display: 'block' }}>
                Description
              </label>
              <textarea
                value={newProject.description}
                onChange={(e) => setNewProject({...newProject, description: e.target.value})}
                placeholder="Describe the compliance requirements"
                rows={3}
                style={{
                  width: '100%',
                  padding: '12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '16px',
                  resize: 'vertical'
                }}
              />
            </div>
            <div>
              <label style={{ fontSize: '14px', fontWeight: '500', color: '#374151', marginBottom: '8px', display: 'block' }}>
                Priority
              </label>
              <select
                value={newProject.priority}
                  onChange={(e) => setNewProject({...newProject, priority: e.target.value as 'Low' | 'Medium' | 'High'})}
                style={{
                  width: '100%',
                  height: '44px',
                  padding: '0 12px',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '16px'
                }}
              >
                <option value="Low">Low</option>
                <option value="Medium">Medium</option>
                <option value="High">High</option>
              </select>
            </div>
            <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
              <button
                onClick={() => setShowNewProjectForm(false)}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#f3f4f6',
                  color: '#374151',
                  border: '1px solid #d1d5db',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleCreateProject}
                style={{
                  padding: '12px 24px',
                  backgroundColor: '#2563eb',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '16px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}
              >
                Create Project
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Project Cards */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
          <h2 style={{ fontSize: '24px', fontWeight: '600', color: '#1f2937' }}>
            Compliance Projects
          </h2>
          <button
            onClick={() => setShowNewProjectForm(!showNewProjectForm)}
            style={{
              padding: '12px 24px',
              backgroundColor: '#2563eb',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: '500',
              cursor: 'pointer'
            }}
          >
            {showNewProjectForm ? 'Cancel' : 'New Compliance Review'}
          </button>
        </div>
        
        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px' }}>
            <div style={{ 
              width: '32px', 
              height: '32px', 
              border: '3px solid #0369a1', 
              borderTop: '3px solid transparent', 
              borderRadius: '50%', 
              animation: 'spin 1s linear infinite',
              margin: '0 auto 16px'
            }}></div>
            <p style={{ color: '#64748b', fontSize: '16px' }}>Loading your projects...</p>
          </div>
        ) : projects.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '40px',
            backgroundColor: 'white',
            borderRadius: '12px',
            boxShadow: '0 1px 3px rgba(0,0,0,0.1)'
          }}>
            <div style={{ fontSize: '48px', marginBottom: '16px' }}>📋</div>
            <h3 style={{ fontSize: '20px', fontWeight: '600', color: '#1f2937', marginBottom: '8px' }}>
              No projects yet
            </h3>
            <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '20px' }}>
              Create your first compliance project to get started
            </p>
            <button
              onClick={() => setShowNewProjectForm(true)}
              style={{
                padding: '12px 24px',
                backgroundColor: '#2563eb',
                color: 'white',
                border: 'none',
                borderRadius: '8px',
                fontSize: '16px',
                fontWeight: '500',
                cursor: 'pointer'
              }}
            >
              Create Your First Project
            </button>
          </div>
        ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))', gap: '20px' }}>
          {projects.map((project) => (
            <div key={project.id} style={{
              backgroundColor: 'white',
              padding: '20px',
              borderRadius: '12px',
              boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
              border: '1px solid #e5e7eb'
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <h3 style={{ fontSize: '18px', fontWeight: '600', color: '#1f2937', margin: 0 }}>
                    {project.name}
                  </h3>
                  {project.isLegalPartner && (
                    <div style={{
                      padding: '2px 8px',
                      backgroundColor: '#f59e0b',
                      color: 'white',
                      borderRadius: '12px',
                      fontSize: '10px',
                      fontWeight: '600',
                      textTransform: 'uppercase'
                    }}>
                      Legal Partner
                    </div>
                  )}
                </div>
                <div style={{
                  padding: '4px 12px',
                  backgroundColor: getStatusColor(project.status) + '20',
                  color: getStatusColor(project.status),
                  borderRadius: '20px',
                  fontSize: '12px',
                  fontWeight: '500'
                }}>
                  {project.status}
                </div>
              </div>
              
              <p style={{ color: '#6b7280', fontSize: '14px', lineHeight: '1.5', marginBottom: '16px' }}>
                {project.description}
              </p>
              
              {project.legalPartnerEmail && (
                <div style={{ marginBottom: '12px' }}>
                  <div style={{ fontSize: '12px', fontWeight: '500', color: '#374151', marginBottom: '4px' }}>
                    Legal Partner:
                  </div>
                  <div style={{ fontSize: '14px', color: '#6b7280' }}>
                    {project.legalPartnerEmail}
                  </div>
                </div>
              )}
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{
                  padding: '4px 8px',
                  backgroundColor: getPriorityColor(project.priority) + '20',
                  color: getPriorityColor(project.priority),
                  borderRadius: '6px',
                  fontSize: '12px',
                  fontWeight: '500'
                }}>
                  {project.priority} Priority
                </div>
                <span style={{ color: '#9ca3af', fontSize: '12px' }}>
                  Created: {project.createdAt}
                </span>
              </div>
              
              <div style={{ marginTop: '16px', display: 'flex', gap: '8px' }}>
                <button style={{
                  padding: '8px 16px',
                  backgroundColor: '#f3f4f6',
                  color: '#374151',
                  border: '1px solid #d1d5db',
                  borderRadius: '6px',
                  fontSize: '14px',
                  fontWeight: '500',
                  cursor: 'pointer'
                }}>
                  View Details
                </button>
                <button 
                  onClick={() => navigate(`/compliance-review/${project.id}`)}
                  style={{
                    padding: '8px 16px',
                    backgroundColor: '#10b981',
                    color: 'white',
                    border: 'none',
                    borderRadius: '6px',
                    fontSize: '14px',
                    fontWeight: '500',
                    cursor: 'pointer'
                  }}
                >
                  Start Review
                </button>
              </div>
            </div>
          ))}
        </div>
        )}
      </div>
      
    </div>
  );
}

// Simple working LoginForm component with Firebase auth (temporarily disabled)
function SimpleLoginForm() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();
  
  // Redirect to compliance council after successful auth
  useEffect(() => {
    if (success && success.includes('successfully')) {
      const timer = setTimeout(() => {
        navigate('/compliance-council');
      }, 2000); // Wait 2 seconds to show success message
      
      return () => clearTimeout(timer);
    }
  }, [success, navigate]);
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    
    console.log('Starting authentication process...');
    console.log('Form data:', { isSignUp, email, password, displayName });
    
    try {
      if (isSignUp) {
        console.log('Attempting to sign up user...');
        const result = await signUpUser(email, password, displayName);
        console.log('Sign up result:', result);
        
        if (result.success && result.user) {
          console.log('User created successfully, creating profile...');
          // Create user profile
          const profileResult = await createUserProfile(result.user.uid, {
            displayName,
            email,
            role: 'user'
          });
          console.log('Profile creation result:', profileResult);
          
          setSuccess('Account created successfully! Welcome to Combo AI! 🎉');
          // Clear form
          setEmail('');
          setPassword('');
          setDisplayName('');
        } else {
          console.error('Sign up failed:', result.error);
          setError(result.error || 'Sign up failed');
        }
      } else {
        console.log('Attempting to sign in user...');
        const result = await signInUser(email, password);
        console.log('Sign in result:', result);
        
        if (result.success) {
          setSuccess('Signed in successfully! Welcome back! 🎉');
          // Clear form
          setEmail('');
          setPassword('');
        } else {
          console.error('Sign in failed:', result.error);
          setError(result.error || 'Sign in failed');
        }
      }
    } catch (err) {
      console.error('Authentication error caught:', err);
      setError('An unexpected error occurred');
      console.error('Auth error:', err);
    } finally {
      console.log('Authentication process completed, setting loading to false');
      setLoading(false);
    }
  };
  
  return (
    <div style={{ width: '100%' }}>
      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: '24px' }}>
        <div style={{ display: 'flex', backgroundColor: '#f3f4f6', borderRadius: '8px', padding: '4px' }}>
          <button
            type="button"
            onClick={() => setIsSignUp(false)}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500',
              backgroundColor: !isSignUp ? 'white' : 'transparent',
              color: !isSignUp ? '#1f2937' : '#6b7280',
              border: 'none',
              cursor: 'pointer',
              boxShadow: !isSignUp ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
            }}
          >
            Sign In
          </button>
          <button
            type="button"
            onClick={() => setIsSignUp(true)}
            style={{
              padding: '8px 16px',
              borderRadius: '6px',
              fontSize: '14px',
              fontWeight: '500',
              backgroundColor: isSignUp ? 'white' : 'transparent',
              color: isSignUp ? '#1f2937' : '#6b7280',
              border: 'none',
              cursor: 'pointer',
              boxShadow: isSignUp ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
            }}
          >
            Sign Up
          </button>
        </div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {isSignUp && (
          <div>
            <label htmlFor="displayName" style={{ fontSize: '14px', fontWeight: '500', color: '#1f293b', marginBottom: '8px', display: 'block' }}>
              Display Name
            </label>
            <input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Enter your full name"
              required={isSignUp}
              style={{
                width: '100%',
                height: '44px',
                padding: '0 12px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '16px'
              }}
            />
          </div>
        )}
        
        <div>
          <label htmlFor="email" style={{ fontSize: '14px', fontWeight: '500', color: '#1f293b', marginBottom: '8px', display: 'block' }}>
            Email Address
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Enter your email address"
            required
            style={{
              width: '100%',
              height: '44px',
              padding: '0 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '16px'
            }}
          />
        </div>
        
        <div>
          <label htmlFor="password" style={{ fontSize: '14px', fontWeight: '500', color: '#1f293b', marginBottom: '8px', display: 'block' }}>
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter your password"
            required
            style={{
              width: '100%',
              height: '44px',
              padding: '0 12px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              fontSize: '16px'
            }}
          />
        </div>

        {error && (
          <div style={{ padding: '16px', backgroundColor: '#fef2f2', border: '1px solid #fecaca', color: '#dc2626', borderRadius: '8px', fontSize: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>⚠️</span>
              {error}
            </div>
          </div>
        )}

        {success && (
          <div style={{ padding: '16px', backgroundColor: '#f0fdf4', border: '1px solid #bbf7d0', color: '#16a34a', borderRadius: '8px', fontSize: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span>✅</span>
              {success}
            </div>
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            width: '100%',
            height: '44px',
            background: loading ? '#9ca3af' : 'linear-gradient(to right, #2563eb, #4f46e5)',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            fontSize: '16px',
            fontWeight: '500',
            cursor: loading ? 'not-allowed' : 'pointer',
            opacity: loading ? 0.7 : 1
          }}
        >
          {loading ? (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
              <div style={{ width: '16px', height: '16px', border: '2px solid #ffffff', borderTop: '2px solid transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
              Processing...
            </div>
          ) : (
            isSignUp ? 'Create Account' : 'Sign In'
          )}
        </button>

        <div style={{ textAlign: 'center', paddingTop: '8px' }}>
          <p style={{ fontSize: '14px', color: '#6b7280' }}>
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}
            <button
              type="button"
              onClick={() => setIsSignUp(!isSignUp)}
              style={{
                marginLeft: '4px',
                color: '#2563eb',
                background: 'none',
                border: 'none',
                textDecoration: 'underline',
                cursor: 'pointer',
                fontWeight: '500'
              }}
            >
              {isSignUp ? 'Sign in here' : 'Sign up here'}
            </button>
          </p>
        </div>
      </form>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

// Simple Index component
function Index() {
  console.log("Index component rendering");
  const { currentUser, loading } = useAuth();
  const navigate = useNavigate();
  const [forceShowLogin, setForceShowLogin] = useState(false);
  
  console.log("Index - currentUser:", currentUser);
  console.log("Index - loading:", loading);
  console.log("Index - forceShowLogin:", forceShowLogin);
  
  // Check for force sign out parameters
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('forceSignOut') || urlParams.has('clearCache')) {
      console.log("🚨 FORCE SIGN OUT DETECTED - BYPASSING AUTHENTICATION 🚨");
      setForceShowLogin(true);
      // Clear URL parameters
      window.history.replaceState({}, document.title, '/');
    }
  }, []);
  
  // Check if we're coming from a sign out (no localStorage items)
  useEffect(() => {
    const hasAuthData = localStorage.getItem('firebase:authUser') || 
                       localStorage.getItem('firebase:host:') ||
                       sessionStorage.getItem('firebase:authUser') ||
                       localStorage.getItem('firebase:authUser:turbocompliance-4a899') ||
                       localStorage.getItem('firebase:host:turbocompliance-4a899.firebaseapp.com');
    
    if (!hasAuthData && !loading) {
      console.log("No auth data found, forcing login display");
      setForceShowLogin(true);
    }
  }, [loading]);
  
  // Always show login after 2 seconds regardless of loading state
  useEffect(() => {
    const timer = setTimeout(() => {
      console.log("Force showing login form after timeout");
      setForceShowLogin(true);
    }, 2000); // 2 second timeout
    
    return () => clearTimeout(timer);
  }, []);
  
  // Redirect authenticated users to compliance council
  useEffect(() => {
    console.log("Redirect useEffect triggered:");
    console.log("- loading:", loading);
    console.log("- currentUser:", currentUser);
    console.log("- forceShowLogin:", forceShowLogin);
    
    if (!loading && currentUser) {
      console.log("User authenticated, redirecting to compliance council");
      navigate('/compliance-council');
    } else {
      console.log("Not redirecting - loading:", loading, "currentUser:", currentUser);
    }
  }, [currentUser, loading, navigate]);
  
  // Don't show login form if user is authenticated
  if (!loading && currentUser) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '100vh',
        backgroundColor: '#e0f2fe'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            width: '32px', 
            height: '32px', 
            border: '3px solid #0369a1', 
            borderTop: '3px solid transparent', 
            borderRadius: '50%', 
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }}></div>
          <p style={{ color: '#0369a1', fontSize: '16px' }}>Redirecting...</p>
        </div>
      </div>
    );
  }
  
  // Show loading only briefly, then always show login
  if (loading && !forceShowLogin) {
    return (
      <div style={{ 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        minHeight: '100vh',
        backgroundColor: '#e0f2fe'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            width: '32px', 
            height: '32px', 
            border: '3px solid #0369a1', 
            borderTop: '3px solid transparent', 
            borderRadius: '50%', 
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }}></div>
          <p style={{ color: '#0369a1', fontSize: '16px' }}>Loading...</p>
          <p style={{ color: '#64748b', fontSize: '14px', marginTop: '8px' }}>
            <button 
              onClick={() => setForceShowLogin(true)}
              style={{ 
                color: '#2563eb', 
                background: 'none', 
                border: 'none', 
                textDecoration: 'underline', 
                cursor: 'pointer'
              }}
            >
              Skip to login
            </button>
          </p>
        </div>
      </div>
    );
  }
  
  // If user is authenticated and we're not forcing login, don't render the login form
  if (currentUser && !forceShowLogin) {
    return null;
  }
  
  return (
    <div style={{ 
      padding: '40px', 
      background: 'radial-gradient(circle at center, #1a1a2e 0%, #0f0f23 100%)',
      color: 'white', 
      fontSize: '20px',
      minHeight: '100vh',
      textAlign: 'center'
    }}>
      {/* Header with Logo */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginBottom: '60px',
        maxWidth: '1200px',
        margin: '0 auto 60px'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <img 
            src="/greymatter-logo.svg" 
            alt="GreyMatter Logo" 
            style={{ 
              width: '32px', 
              height: '32px'
            }}
          />
          <span style={{ fontSize: '24px', fontWeight: 'bold', color: 'white' }}>GreyMatter</span>
        </div>
        <div style={{ display: 'flex', gap: '24px', alignItems: 'center' }}>
          <span style={{ color: 'white', fontSize: '16px' }}>Features</span>
          <span style={{ color: 'white', fontSize: '16px' }}>Pricing</span>
          <button style={{
            background: '#8b5cf6',
            color: 'white',
            border: 'none',
            padding: '8px 16px',
            borderRadius: '6px',
            fontSize: '14px',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '6px'
          }}>
            📅 Book Demo
          </button>
        </div>
      </div>

      {/* Hero Section */}
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <h1 style={{ 
          background: 'linear-gradient(90deg, #8b5cf6 0%, #3b82f6 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          backgroundClip: 'text',
          fontSize: '48px',
          fontWeight: 'bold',
          marginBottom: '24px',
          lineHeight: '1.2'
        }}>
          Welcome to GreyMatter AI
        </h1>
        
        <p style={{ 
          color: 'white', 
          fontSize: '18px', 
          marginBottom: '40px',
          maxWidth: '600px',
          margin: '0 auto 60px',
          lineHeight: '1.6'
        }}>
          GreyMatter is a compliance collaboration platform that surfaces regulatory risks in features, systems, and user flows before they're built. Get organized workspaces to resolve complex compliance decisions and balance product vision with legal obligations.
        </p>
      </div>
      
      {/* Login Form Card */}
      <div style={{ 
        background: 'rgba(255, 255, 255, 0.05)', 
        backdropFilter: 'blur(10px)',
        border: '1px solid rgba(255, 255, 255, 0.1)',
        padding: '40px', 
        borderRadius: '16px', 
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
        maxWidth: '500px',
        margin: '0 auto'
      }}>
        <h2 style={{ 
          color: 'white', 
          fontSize: '28px', 
          marginBottom: '16px',
          fontWeight: '600'
        }}>
          Access Your Dashboard
        </h2>
        <p style={{ 
          color: 'rgba(255, 255, 255, 0.7)', 
          marginBottom: '32px',
          fontSize: '16px'
        }}>
          Sign in to continue your compliance review
        </p>
        
        {/* Firebase LoginForm component */}
        <LoginForm onSuccess={() => {
          navigate('/compliance-council');
        }} />
      </div>
    </div>
  );
}

const App = () => (
  <AuthProvider>
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<Index />} />
      <Route path="/compliance-council" element={<ProductComplianceCouncil />} />
      <Route path="/compliance-review/:projectId" element={<ComplianceReviewPage />} />
      <Route path="/compliance-review" element={<ComplianceReviewPage />} />
        <Route path="*" element={<Index />} />
    </Routes>
  </BrowserRouter>
  </AuthProvider>
);

createRoot(document.getElementById("root")!).render(<App />);

// Add CSS for loading animation
const style = document.createElement('style');
style.textContent = `
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`;
document.head.appendChild(style);