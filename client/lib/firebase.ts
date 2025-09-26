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
}

export const createProject = async (projectData: Omit<Project, 'id' | 'userId' | 'createdAt'>, userId: string) => {
  try {
    const project: Project = {
      ...projectData,
      userId,
      createdAt: new Date().toISOString().split('T')[0]
    };
    
    const docRef = await addDoc(collection(db, 'projects'), project);
    return { success: true, projectId: docRef.id };
  } catch (error: any) {
    console.error('Error creating project:', error);
    return { success: false, error: error.message };
  }
};

export const getUserProjects = async (userId: string) => {
  try {
    const q = query(
      collection(db, 'projects'),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );
    
    const querySnapshot = await getDocs(q);
    const projects: Project[] = [];
    
    querySnapshot.forEach((doc) => {
      projects.push({
        id: doc.id,
        ...doc.data()
      } as Project);
    });
    
    return { success: true, projects };
  } catch (error: any) {
    console.error('Error fetching user projects:', error);
    return { success: false, error: error.message, projects: [] };
  }
};

export const updateProject = async (projectId: string, updates: Partial<Project>) => {
  try {
    const projectRef = doc(db, 'projects', projectId);
    await updateDoc(projectRef, updates);
    return { success: true };
  } catch (error: any) {
    console.error('Error updating project:', error);
    return { success: false, error: error.message };
  }
};

export const deleteProject = async (projectId: string) => {
  try {
    const projectRef = doc(db, 'projects', projectId);
    await updateDoc(projectRef, { status: 'Deleted' });
    return { success: true };
  } catch (error: any) {
    console.error('Error deleting project:', error);
    return { success: false, error: error.message };
  }
};

export const subscribeToUserProjects = (userId: string, callback: (projects: Project[]) => void) => {
  const q = query(
    collection(db, 'projects'),
    where('userId', '==', userId),
    orderBy('createdAt', 'desc')
  );
  
  return onSnapshot(q, (querySnapshot) => {
    const projects: Project[] = [];
    querySnapshot.forEach((doc) => {
      projects.push({
        id: doc.id,
        ...doc.data()
      } as Project);
    });
    callback(projects);
  });
};

export default app;
