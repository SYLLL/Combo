import { useState } from "react";
import { LoginForm } from "@/components/LoginForm";

export default function Index() {
  const [count, setCount] = useState(0);
  
  console.log("Index component rendering");
  
  return (
    <div className="min-h-screen bg-blue-50 p-8">
      <div className="max-w-4xl mx-auto text-center">
        <h1 className="text-4xl font-bold text-blue-800 mb-8">
          🎯 Combo AI - Product Compliance Council
        </h1>
        
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            Welcome! 🎉
          </h2>
          <p className="text-lg text-gray-600 mb-6">
            Sign up or sign in to access the compliance dashboard.
          </p>
          
          <div className="bg-yellow-100 p-4 rounded-lg mb-6">
            <p className="text-yellow-800 font-bold mb-3">
              Test Counter: {count}
            </p>
            <div className="space-x-3">
              <button 
                className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                onClick={() => setCount(count + 1)}
              >
                Increment
              </button>
              <button 
                className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                onClick={() => setCount(0)}
              >
                Reset
              </button>
            </div>
          </div>
          
          {/* LoginForm component */}
          <LoginForm />
        </div>
        
        <div className="bg-gray-100 p-4 rounded-lg">
          <p className="text-gray-700 text-sm">
            ✅ React is working | ✅ Routing is working | ✅ State management is working | 🔄 Adding authentication...
          </p>
        </div>
      </div>
    </div>
  );
}
