import { initializeApp } from 'firebase/app';
import { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged, User } from 'firebase/auth';
import { getFirestore, doc, setDoc, getDoc, updateDoc, collection, addDoc, getDocs, query, where, orderBy, onSnapshot } from 'firebase/firestore';

// Debug: Log environment variables
console.log('Environment variables loaded:');
console.log('VITE_FIREBASE_API_KEY:', import.meta.env.VITE_FIREBASE_API_KEY);
console.log('VITE_FIREBASE_AUTH_DOMAIN:', import.meta.env.VITE_FIREBASE_AUTH_DOMAIN);
console.log('VITE_FIREBASE_PROJECT_ID:', import.meta.env.VITE_FIREBASE_PROJECT_ID);
console.log('VITE_FIREBASE_STORAGE_BUCKET:', import.meta.env.VITE_FIREBASE_STORAGE_BUCKET);
console.log('VITE_FIREBASE_MESSAGING_SENDER_ID:', import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID);
console.log('VITE_FIREBASE_APP_ID:', import.meta.env.VITE_FIREBASE_APP_ID);

// Your Firebase configuration
// Replace these values with your actual Firebase project configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "your-api-key",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "your-project.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "your-project-id",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "your-project.appspot.com",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "your-sender-id",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "your-app-id"
};

// Debug: Log final config
console.log('Final Firebase config:', firebaseConfig);

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Firebase Authentication and get a reference to the service
export const auth = getAuth(app);

// Initialize Cloud Firestore and get a reference to the service
export const db = getFirestore(app);

// Authentication functions
export const signInUser = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { success: true, user: userCredential.user };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const signUpUser = async (email: string, password: string, displayName?: string) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    
    // Update display name if provided
    if (displayName) {
      await updateDoc(doc(db, 'users', userCredential.user.uid), {
        displayName: displayName,
        email: email,
        createdAt: new Date().toISOString()
      });
    }
    
    return { success: true, user: userCredential.user };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const signOutUser = async () => {
  try {
    await signOut(auth);
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// User data management
export const createUserProfile = async (userId: string, userData: {
  displayName?: string;
  email: string;
  role?: string;
  company?: string;
}) => {
  try {
    await setDoc(doc(db, 'users', userId), {
      ...userData,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const getUserProfile = async (userId: string) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    if (userDoc.exists()) {
      return { success: true, data: userDoc.data() };
    } else {
      return { success: false, error: 'User profile not found' };
    }
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

export const updateUserProfile = async (userId: string, updates: any) => {
  try {
    await updateDoc(doc(db, 'users', userId), {
      ...updates,
      updatedAt: new Date().toISOString()
    });
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
};

// Auth state observer
export const onAuthStateChange = (callback: (user: User | null) => void) => {
  return onAuthStateChanged(auth, callback);
};

// Project management functions for user-specific projects
export interface Project {
  id?: string;
  name: string;
  description: string;
  status: 'Draft' | 'In Progress' | 'Pending' | 'Completed';
  priority: 'Low' | 'Medium' | 'High';
  createdAt: string;
  userId: string;
  legalPartnerEmail?: string;
  legalUserId?: string;
  isLegalPartner?: boolean; // Flag to indicate if user is viewing as legal partner
}

export const createProject = async (projectData: Omit<Project, 'id' | 'userId' | 'createdAt'>, userId: string) => {
  try {
    console.log('🔥 Creating project with Bearer token authentication...');
    
    // Check if user is authenticated
    if (!auth.currentUser) {
      console.log('🔥 No authenticated user, cannot create project');
      return { success: false, error: 'No authenticated user' };
    }
    
    // Get fresh ID token for authentication
    const idToken = await auth.currentUser.getIdToken();
    console.log('🔥 Got ID token for project creation');
    
    const project: Project = {
      ...projectData,
      userId,
      createdAt: new Date().toISOString().split('T')[0]
    };
    
    console.log('🔥 Project data to save:', project);
    
    // Save to localStorage first (immediate feedback)
    const existingProjects = JSON.parse(localStorage.getItem(`projects_${userId}`) || '[]');
    const tempId = `temp_${Date.now()}`;
    const projectWithTempId = { ...project, id: tempId };
    existingProjects.push(projectWithTempId);
    localStorage.setItem(`projects_${userId}`, JSON.stringify(existingProjects));
    console.log('🔥 Project saved to localStorage with temp ID:', tempId);
    
    try {
      // Save to Firebase with Bearer token
      const docRef = await addDoc(collection(db, 'projects'), project);
      console.log('🔥 Project saved to Firebase with ID:', docRef.id);
      
      // Update localStorage with real Firebase ID
      const updatedProjects = existingProjects.map(p => 
        p.id === tempId ? { ...p, id: docRef.id } : p
      );
      localStorage.setItem(`projects_${userId}`, JSON.stringify(updatedProjects));
      
      return { success: true, projectId: docRef.id };
    } catch (firebaseError: any) {
      console.error('🔥 Firebase save failed, keeping localStorage version:', firebaseError);
      return { success: true, projectId: tempId }; // Still return success with temp ID
    }
    
  } catch (error: any) {
    console.error('Error creating project:', error);
    return { success: false, error: error.message };
  }
};

export const getUserProjects = async (userId: string) => {
  try {
    console.log('🔥 Getting user projects with Bearer token authentication...');
    
    // Check if user is authenticated
    if (!auth.currentUser) {
      console.log('🔥 No authenticated user, using localStorage only');
      const localProjects = JSON.parse(localStorage.getItem(`projects_${userId}`) || '[]');
      localProjects.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      return { success: true, projects: localProjects };
    }
    
    // Get fresh ID token for authentication
    const idToken = await auth.currentUser.getIdToken();
    console.log('🔥 Got ID token for project retrieval');
    
    // Load from localStorage first (immediate response)
    const localProjects = JSON.parse(localStorage.getItem(`projects_${userId}`) || '[]');
    console.log('🔥 Local projects:', localProjects);
    
    try {
      // Load from Firebase with Bearer token
      const q = query(
        collection(db, 'projects'),
        where('userId', '==', userId),
        orderBy('createdAt', 'desc')
      );
      
      const querySnapshot = await getDocs(q);
      console.log('🔥 Firebase projects found:', querySnapshot.size);
      
      const firebaseProjects: Project[] = [];
      querySnapshot.forEach((doc) => {
        const projectData = {
          id: doc.id,
          ...doc.data()
        } as Project;
        firebaseProjects.push(projectData);
      });
      
      // Merge Firebase projects with localStorage (Firebase takes priority)
      const mergedProjects = [...firebaseProjects];
      localProjects.forEach(localProject => {
        if (!firebaseProjects.find(fp => fp.id === localProject.id)) {
          mergedProjects.push(localProject);
        }
      });
      
      // Sort projects by createdAt
      mergedProjects.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      
      // Update localStorage with merged projects
      localStorage.setItem(`projects_${userId}`, JSON.stringify(mergedProjects));
      
      console.log('🔥 Final merged projects:', mergedProjects);
      return { success: true, projects: mergedProjects };
      
    } catch (firebaseError: any) {
      console.error('🔥 Firebase retrieval failed, using localStorage:', firebaseError);
      localProjects.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      return { success: true, projects: localProjects };
    }
    
  } catch (error: any) {
    console.error('Error fetching user projects:', error);
    return { success: false, error: error.message, projects: [] };
  }
};

export const updateProject = async (projectId: string, updates: Partial<Project>) => {
  try {
    console.log('🔥 Updating project with Bearer token authentication...');
    
    // Check if user is authenticated
    if (!auth.currentUser) {
      console.log('🔥 No authenticated user, cannot update project');
      return { success: false, error: 'No authenticated user' };
    }
    
    // Get fresh ID token for authentication
    const idToken = await auth.currentUser.getIdToken();
    console.log('🔥 Got ID token for project update');
    
    const projectRef = doc(db, 'projects', projectId);
    await updateDoc(projectRef, updates);
    
    // Also update localStorage
    const userId = auth.currentUser.uid;
    const localProjects = JSON.parse(localStorage.getItem(`projects_${userId}`) || '[]');
    const updatedProjects = localProjects.map((p: Project) => 
      p.id === projectId ? { ...p, ...updates } : p
    );
    localStorage.setItem(`projects_${userId}`, JSON.stringify(updatedProjects));
    
    console.log('🔥 Project updated successfully');
    return { success: true };
  } catch (error: any) {
    console.error('Error updating project:', error);
    return { success: false, error: error.message };
  }
};

export const deleteProject = async (projectId: string) => {
  try {
    console.log('🔥 Deleting project with Bearer token authentication...');
    
    // Check if user is authenticated
    if (!auth.currentUser) {
      console.log('🔥 No authenticated user, cannot delete project');
      return { success: false, error: 'No authenticated user' };
    }
    
    // Get fresh ID token for authentication
    const idToken = await auth.currentUser.getIdToken();
    console.log('🔥 Got ID token for project deletion');
    
    const projectRef = doc(db, 'projects', projectId);
    await updateDoc(projectRef, { status: 'Deleted' });
    
    // Also update localStorage
    const userId = auth.currentUser.uid;
    const localProjects = JSON.parse(localStorage.getItem(`projects_${userId}`) || '[]');
    const updatedProjects = localProjects.map((p: Project) => 
      p.id === projectId ? { ...p, status: 'Deleted' } : p
    );
    localStorage.setItem(`projects_${userId}`, JSON.stringify(updatedProjects));
    
    console.log('🔥 Project deleted successfully');
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting project:', error);
    return { success: false, error: error.message };
  }
};

export const subscribeToUserProjects = (userId: string, callback: (projects: Project[]) => void) => {
  console.log('🔥 Setting up project subscription with Bearer token authentication...');
  
  // Check if user is authenticated
  if (!auth.currentUser) {
    console.log('🔥 No authenticated user, using localStorage only');
    const localProjects = JSON.parse(localStorage.getItem(`projects_${userId}`) || '[]');
    callback(localProjects);
    return () => {}; // Return empty unsubscribe function
  }
  
  // Get fresh ID token for authentication
  auth.currentUser.getIdToken().then(idToken => {
    console.log('🔥 Got ID token for project subscription');
  }).catch(error => {
    console.error('🔥 Failed to get ID token for subscription:', error);
  });
  
  const q = query(
    collection(db, 'projects'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  
  return onSnapshot(q, (querySnapshot) => {
    console.log('🔥 Project subscription update received:', querySnapshot.size, 'projects');
    
    const projects: Project[] = [];
    querySnapshot.forEach((doc) => {
      const projectData = {
        id: doc.id,
        ...doc.data()
      } as Project;
      projects.push(projectData);
    });
    
    // Also update localStorage
    localStorage.setItem(`projects_${userId}`, JSON.stringify(projects));
    
    console.log('🔥 Projects updated via subscription:', projects);
    callback(projects);
  }, (error) => {
    console.error('🔥 Project subscription error:', error);
    // Fallback to localStorage on error
    const localProjects = JSON.parse(localStorage.getItem(`projects_${userId}`) || '[]');
    callback(localProjects);
  });
};

// Function to fetch fresh Bearer token using signUp endpoint (simpler approach)
export const fetchBearerToken = async () => {
  try {
    console.log('🔥 Fetching fresh Bearer token using signUp endpoint...');
    
    const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
    if (!apiKey) {
      throw new Error('Firebase API key not found');
    }
    
    const response = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        returnSecureToken: true
      })
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`Identity Toolkit API error: ${response.status} - ${errorData.error?.message || 'Unknown error'}`);
    }
    
    const data = await response.json();
    console.log('🔥 Bearer token fetched successfully via signUp endpoint');
    
    return {
      success: true,
      idToken: data.idToken,
      refreshToken: data.refreshToken,
      expiresIn: data.expiresIn
    };
    
  } catch (error: any) {
    console.error('🔥 Error fetching Bearer token:', error);
    return {
      success: false,
      error: error.message
    };
  }
};

// Function to create project using direct REST API with fresh Bearer token
export const createProjectREST = async (projectData: Omit<Project, 'id' | 'userId' | 'createdAt'>, userId: string, bearerToken: string) => {
  try {
    console.log('🔥 Creating project via REST API with fresh Bearer token...');
    
    const project: Project = {
      ...projectData,
      userId,
      createdAt: new Date().toISOString().split('T')[0]
    };
    
    // Prepare the document data for Firestore REST API
    const documentData = {
      fields: {
        name: { stringValue: project.name },
        description: { stringValue: project.description },
        priority: { stringValue: project.priority },
        status: { stringValue: project.status },
        userId: { stringValue: userId },
        createdAt: { stringValue: project.createdAt },
        ...(project.legalPartnerEmail && { legalPartnerEmail: { stringValue: project.legalPartnerEmail } }),
        ...(project.legalUserId && { legalUserId: { stringValue: project.legalUserId } })
      }
    };
    
    // Generate project ID
    const projectId = `project_${Date.now()}`;
    const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
    const projectId_env = import.meta.env.VITE_FIREBASE_PROJECT_ID;
    
    // Use the exact URL format you specified: combodb database, test collection
    const url = `https://firestore.googleapis.com/v1/projects/${projectId_env}/databases/combodb/documents/test/${projectId}?key=${apiKey}`;
    
    console.log('🔥 Making REST API call to:', url);
    
    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${bearerToken}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(documentData)
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('🔥 REST API error:', response.status, errorText);
      throw new Error(`REST API error: ${response.status} - ${errorText}`);
    }
    
    const result = await response.json();
    console.log('🔥 Project saved via REST API:', result);
    
    // Also save to localStorage
    const existingProjects = JSON.parse(localStorage.getItem(`projects_${userId}`) || '[]');
    const projectWithId = { ...project, id: projectId };
    existingProjects.push(projectWithId);
    localStorage.setItem(`projects_${userId}`, JSON.stringify(existingProjects));
    
    return { success: true, projectId: projectId };
    
  } catch (error: any) {
    console.error('🔥 Error creating project via REST API:', error);
    return { success: false, error: error.message };
  }
};

// Function to get user projects using direct REST API with fresh Bearer token
export const getUserProjectsREST = async (userId: string, userEmail: string, bearerToken: string) => {
  try {
    console.log('🔥 Getting user projects via REST API with fresh Bearer token...');
    console.log('🔥 Looking for projects owned by:', userId, 'and legal partner projects for:', userEmail);
    
    const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
    const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID;
    
    // Use the exact URL format you specified: combodb database, test collection
    const url = `https://firestore.googleapis.com/v1/projects/${projectId}/databases/combodb/documents/test?key=${apiKey}`;
    
    console.log('🔥 Making REST API call to:', url);
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${bearerToken}`,
        'Content-Type': 'application/json'
      }
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('🔥 REST API error:', response.status, errorText);
      throw new Error(`REST API error: ${response.status} - ${errorText}`);
    }
    
    const result = await response.json();
    console.log('🔥 Projects retrieved via REST API:', result);
    
    // Parse the response and filter by userId or legalPartnerEmail
    const projects: Project[] = [];
    if (result.documents) {
      result.documents.forEach((doc: any) => {
        const fields = doc.fields;
        const isOwner = fields && fields.userId && fields.userId.stringValue === userId;
        const isLegalPartner = fields && fields.legalPartnerEmail && fields.legalPartnerEmail.stringValue === userEmail;
        
        if (isOwner || isLegalPartner) {
          projects.push({
            id: doc.name.split('/').pop(),
            name: fields.name?.stringValue || '',
            description: fields.description?.stringValue || '',
            priority: fields.priority?.stringValue || 'Medium',
            status: fields.status?.stringValue || 'Draft',
            userId: fields.userId?.stringValue || userId,
            createdAt: fields.createdAt?.stringValue || new Date().toISOString().split('T')[0],
            legalPartnerEmail: fields.legalPartnerEmail?.stringValue || undefined,
            legalUserId: fields.legalUserId?.stringValue || undefined,
            isLegalPartner: isLegalPartner // Add flag to distinguish legal partner projects
          });
        }
      });
    }
    
    // Sort projects by createdAt
    projects.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    // Update localStorage
    localStorage.setItem(`projects_${userId}`, JSON.stringify(projects));
    
    console.log('🔥 Final projects from REST API:', projects);
    return { success: true, projects: projects };
    
  } catch (error: any) {
    console.error('🔥 Error fetching user projects via REST API:', error);
    // Fallback to localStorage
    const localProjects = JSON.parse(localStorage.getItem(`projects_${userId}`) || '[]');
    return { success: false, error: error.message, projects: localProjects };
  }
};

// Function to initialize user projects when they sign in
export const initializeUserProjects = async (userId: string) => {
  console.log('🔥 Initializing projects for user:', userId);
  
  try {
    // Load projects from Firebase with Bearer token
    const result = await getUserProjects(userId);
    
    if (result.success) {
      console.log('🔥 Projects initialized successfully:', result.projects.length, 'projects');
      return result;
    } else {
      console.error('🔥 Failed to initialize projects:', result.error);
      return result;
    }
  } catch (error: any) {
    console.error('🔥 Error initializing user projects:', error);
    return { success: false, error: error.message, projects: [] };
  }
};

// Function to sync projects from localStorage to Firebase using REST API
export const syncProjectsToFirebase = async (userId: string) => {
  console.log('🔥 Syncing projects to Firebase for user:', userId);
  
  try {
    // Get fresh Bearer token using the simple signUp approach
    const tokenResult = await fetchBearerToken();
    
    if (!tokenResult.success) {
      console.log('🔥 Failed to get Bearer token for sync');
      return { success: false, error: tokenResult.error };
    }
    
    const localProjects = JSON.parse(localStorage.getItem(`projects_${userId}`) || '[]');
    console.log('🔥 Local projects to sync:', localProjects.length);
    
    let syncedCount = 0;
    let errorCount = 0;
    
    for (const project of localProjects) {
      // Skip if it's already a Firebase project (has a real ID, not temp)
      if (project.id && !project.id.startsWith('temp_')) {
        console.log('🔥 Project already synced:', project.id);
        syncedCount++;
        continue;
      }
      
      try {
        // Use REST API to create project
        const result = await createProjectREST({
          name: project.name,
          description: project.description,
          priority: project.priority,
          status: project.status,
          legalPartnerEmail: project.legalPartnerEmail,
          legalUserId: project.legalUserId
        }, userId, tokenResult.idToken);
        
        if (result.success) {
          console.log('🔥 Synced project to Firebase via REST API:', result.projectId);
          
          // Update localStorage with Firebase ID
          const updatedProjects = localProjects.map((p: Project) => 
            p.id === project.id ? { ...p, id: result.projectId } : p
          );
          localStorage.setItem(`projects_${userId}`, JSON.stringify(updatedProjects));
          
          syncedCount++;
        } else {
          errorCount++;
          console.error('🔥 Failed to sync project via REST API:', project.name, result.error);
        }
      } catch (error: any) {
        errorCount++;
        console.error('🔥 Failed to sync project to Firebase:', error);
      }
    }
    
    console.log('🔥 Sync completed:', syncedCount, 'projects synced,', errorCount, 'errors');
    return { 
      success: syncedCount > 0, 
      syncedCount,
      errorCount,
      error: errorCount > 0 ? `${errorCount} projects failed to sync` : undefined
    };
    
  } catch (error: any) {
    console.error('🔥 Error syncing projects to Firebase:', error);
    return { success: false, error: error.message };
  }
};

// Chat History Management Functions
export interface ChatMessage {
  id: string;
  type: 'user' | 'ai' | 'system';
  message: string;
  timestamp: string;
}

export interface ChatConversation {
  id: string;
  projectId: string;
  riskId: string;
  messages: ChatMessage[];
  createdAt: string;
  updatedAt: string;
  participants: string[]; // Array of user emails who participated
}

export const saveChatConversation = async (
  projectId: string,
  riskId: string,
  messages: ChatMessage[],
  participants: string[],
  bearerToken: string
) => {
  try {
    console.log('🔥 Saving chat conversation to Firebase...');
    
    const conversationId = `${projectId}-${riskId}`;
    const conversation: ChatConversation = {
      id: conversationId,
      projectId,
      riskId,
      messages,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      participants
    };

    const documentData = {
      fields: {
        id: { stringValue: conversation.id },
        projectId: { stringValue: conversation.projectId },
        riskId: { stringValue: conversation.riskId },
        messages: { 
          arrayValue: {
            values: conversation.messages.map(msg => ({
              mapValue: {
                fields: {
                  id: { stringValue: msg.id },
                  type: { stringValue: msg.type },
                  message: { stringValue: msg.message },
                  timestamp: { stringValue: msg.timestamp }
                }
              }
            }))
          }
        },
        createdAt: { stringValue: conversation.createdAt },
        updatedAt: { stringValue: conversation.updatedAt },
        participants: {
          arrayValue: {
            values: conversation.participants.map(email => ({ stringValue: email }))
          }
        }
      }
    };

    const response = await fetch(
      `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/combodb/documents/test/${conversationId}?key=${firebaseConfig.apiKey}`,
      {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${bearerToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(documentData),
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('🔥 Firestore write error:', response.status, errorText);
      console.error('🔥 Request details:', {
        url: `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/combodb/documents/test/${conversationId}?key=${firebaseConfig.apiKey}`,
        method: 'PATCH',
        bearerToken: bearerToken ? `${bearerToken.substring(0, 20)}...` : 'MISSING',
        projectId: firebaseConfig.projectId,
        conversationId
      });
      return { success: false, error: `Firestore write failed: ${response.status} - ${errorText}` };
    }

    console.log('🔥 Chat conversation saved successfully');
    return { success: true, conversationId };
  } catch (error: any) {
    console.error('🔥 Error saving chat conversation:', error);
    return { success: false, error: error.message };
  }
};

export const loadChatConversation = async (
  projectId: string,
  riskId: string,
  bearerToken: string
): Promise<{ success: boolean; conversation?: ChatConversation; error?: string }> => {
  try {
    console.log('🔥 Loading chat conversation from Firebase...');
    
    const conversationId = `${projectId}-${riskId}`;
    
    const response = await fetch(
      `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/combodb/documents/test/${conversationId}?key=${firebaseConfig.apiKey}`,
      {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${bearerToken}`,
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      if (response.status === 404) {
        console.log('🔥 No existing conversation found');
        return { success: true, conversation: undefined };
      }
      const errorText = await response.text();
      console.error('🔥 Firestore read error:', response.status, errorText);
      return { success: false, error: `Firestore read failed: ${response.status}` };
    }

    const data = await response.json();
    const fields = data.fields;

    const conversation: ChatConversation = {
      id: fields.id?.stringValue || conversationId,
      projectId: fields.projectId?.stringValue || projectId,
      riskId: fields.riskId?.stringValue || riskId,
      messages: fields.messages?.arrayValue?.values?.map((msg: any) => ({
        id: msg.mapValue.fields.id.stringValue,
        type: msg.mapValue.fields.type.stringValue,
        message: msg.mapValue.fields.message.stringValue,
        timestamp: msg.mapValue.fields.timestamp.stringValue
      })) || [],
      createdAt: fields.createdAt?.stringValue || new Date().toISOString(),
      updatedAt: fields.updatedAt?.stringValue || new Date().toISOString(),
      participants: fields.participants?.arrayValue?.values?.map((p: any) => p.stringValue) || []
    };

    console.log('🔥 Chat conversation loaded successfully:', conversation.messages.length, 'messages');
    return { success: true, conversation };
  } catch (error: any) {
    console.error('🔥 Error loading chat conversation:', error);
    return { success: false, error: error.message };
  }
};

export const testFirebaseConnection = async () => {
  try {
    console.log('🔥 Testing Firebase connection...');
    console.log('🔥 Project ID:', firebaseConfig.projectId);
    console.log('🔥 API Key:', firebaseConfig.apiKey ? `${firebaseConfig.apiKey.substring(0, 10)}...` : 'MISSING');
    
    // Test 1: Try to get a Bearer token
    const tokenResult = await fetchBearerToken();
    if (!tokenResult.success) {
      console.error('🔥 Failed to get Bearer token:', tokenResult.error);
      return { success: false, error: 'Bearer token failed', step: 'token' };
    }
    
    console.log('🔥 Bearer token obtained successfully');
    
    // Test 2: Try to access the database root
    const testUrl = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/combodb?key=${firebaseConfig.apiKey}`;
    console.log('🔥 Testing database access:', testUrl);
    
    const response = await fetch(testUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${tokenResult.idToken}`,
        'Content-Type': 'application/json',
      },
    });
    
    console.log('🔥 Database test response:', response.status, response.statusText);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('🔥 Database access failed:', errorText);
      return { success: false, error: `Database access failed: ${response.status} - ${errorText}`, step: 'database' };
    }
    
    // Test 3: Try to create a test document in test collection
    const testDocId = `test-${Date.now()}`;
    const testDocUrl = `https://firestore.googleapis.com/v1/projects/${firebaseConfig.projectId}/databases/combodb/documents/test/${testDocId}?key=${firebaseConfig.apiKey}`;
    
    const testDocData = {
      fields: {
        test: { stringValue: 'test-value' },
        timestamp: { stringValue: new Date().toISOString() }
      }
    };
    
    console.log('🔥 Testing document creation:', testDocUrl);
    
    const docResponse = await fetch(testDocUrl, {
      method: 'PATCH',
      headers: {
        'Authorization': `Bearer ${tokenResult.idToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(testDocData),
    });
    
    console.log('🔥 Document creation response:', docResponse.status, docResponse.statusText);
    
    if (!docResponse.ok) {
      const errorText = await docResponse.text();
      console.error('🔥 Document creation failed:', errorText);
      return { success: false, error: `Document creation failed: ${docResponse.status} - ${errorText}`, step: 'document' };
    }
    
    console.log('🔥 All Firebase tests passed!');
    return { success: true, message: 'Firebase connection working' };
    
  } catch (error: any) {
    console.error('🔥 Firebase connection test failed:', error);
    return { success: false, error: error.message, step: 'exception' };
  }
};

export default app;
