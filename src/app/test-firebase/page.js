'use client';

import { useState } from 'react';
import { storage, auth } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';

export default function TestFirebasePage() {
  const [results, setResults] = useState([]);
  const [error, setError] = useState(null);

  const addResult = (message, type = 'info') => {
    const timestamp = new Date().toLocaleTimeString();
    setResults(prev => [...prev, { timestamp, message, type }]);
  };

  const testFirebaseConnection = async () => {
    addResult('🔍 Testing Firebase Storage connection...', 'info');
    
    try {
      // Test 1: Check if storage is initialized
      if (!storage) {
        addResult('❌ Firebase Storage not initialized', 'error');
        return;
      }
      addResult('✅ Firebase Storage instance found', 'success');

      // Test 2: Check auth state
      addResult(`🔍 Auth state: ${auth.currentUser ? 'Authenticated' : 'Not authenticated'}`, 'info');

      // Test 3: Try to create a storage reference
      const testRef = ref(storage, 'test/connection-test.txt');
      addResult('✅ Storage reference created successfully', 'success');
      addResult(`📁 Reference path: ${testRef.fullPath}`, 'info');
      addResult(`🏠 Bucket: ${testRef.bucket}`, 'info');

      // Test 4: Try a simple upload (this should fail due to auth, but we'll see the specific error)
      const testData = new Blob(['Hello Firebase Storage'], { type: 'text/plain' });
      
      try {
        addResult('🔍 Attempting test upload (expected to fail due to auth)...', 'info');
        await uploadBytes(testRef, testData);
        addResult('✅ Upload succeeded (unexpected!)', 'success');
      } catch (uploadError) {
        if (uploadError.code === 'storage/unauthorized') {
          addResult('✅ Got expected auth error - Firebase Storage is configured correctly', 'success');
          addResult('🔒 Error: storage/unauthorized (this is expected)', 'info');
        } else {
          addResult(`❌ Upload failed with unexpected error: ${uploadError.message}`, 'error');
          addResult(`🔍 Error code: ${uploadError.code}`, 'error');
        }
      }

    } catch (error) {
      addResult(`❌ Firebase connection test failed: ${error.message}`, 'error');
      addResult(`🔍 Error code: ${error.code}`, 'error');
      setError(error.message);
    }
  };

  const testStorageRules = async () => {
    addResult('🔍 Testing Firebase Storage rules...', 'info');
    
    try {
      // Try to read from storage without auth
      const testRef = ref(storage, 'test/public-read-test.txt');
      
      try {
        const url = await getDownloadURL(testRef);
        addResult('✅ Public read access works', 'success');
      } catch (readError) {
        if (readError.code === 'storage/object-not-found') {
          addResult('✅ Storage rules working - file not found (expected)', 'success');
        } else if (readError.code === 'storage/unauthorized') {
          addResult('⚠️ Public read access denied - check storage rules', 'warning');
        } else {
          addResult(`❌ Read test failed: ${readError.message}`, 'error');
        }
      }
    } catch (error) {
      addResult(`❌ Storage rules test failed: ${error.message}`, 'error');
    }
  };

  const clearResults = () => {
    setResults([]);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-4xl mx-auto p-6 bg-white rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Firebase Storage Configuration Test</h2>
        
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-6">
            <p className="font-medium">Error: {error}</p>
          </div>
        )}

        <div className="space-y-4 mb-8">
          <button
            onClick={testFirebaseConnection}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Test Firebase Connection
          </button>
          
          <button
            onClick={testStorageRules}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors ml-4"
          >
            Test Storage Rules
          </button>
          
          <button
            onClick={clearResults}
            className="px-3 py-2 text-sm bg-gray-500 text-white rounded hover:bg-gray-600 transition-colors ml-4"
          >
            Clear Results
          </button>
        </div>

        {/* Configuration Info */}
        <div className="bg-blue-50 rounded-lg p-4 mb-6">
          <h3 className="text-lg font-semibold text-blue-800 mb-2">Current Configuration</h3>
          <div className="text-sm text-blue-700 space-y-1">
            <p><strong>Project ID:</strong> {process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID}</p>
            <p><strong>Storage Bucket:</strong> {process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET}</p>
            <p><strong>Auth Domain:</strong> {process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN}</p>
          </div>
        </div>

        {/* Results */}
        <div className="mt-8">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-gray-700">Test Results</h3>
          </div>
          
          <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
            {results.length === 0 ? (
              <p className="text-gray-500 text-sm">No test results yet. Click the test buttons above.</p>
            ) : (
              <div className="space-y-1">
                {results.map((result, index) => (
                  <div
                    key={index}
                    className={`text-sm font-mono ${
                      result.type === 'error' ? 'text-red-600' :
                      result.type === 'success' ? 'text-green-600' :
                      result.type === 'warning' ? 'text-orange-600' :
                      'text-gray-600'
                    }`}
                  >
                    <span className="text-gray-400">[{result.timestamp}]</span> {result.message}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Setup Instructions */}
        <div className="mt-8 bg-yellow-50 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">Firebase Storage Setup Required</h3>
          <div className="text-sm text-yellow-700 space-y-2">
            <p><strong>1. Enable Firebase Storage:</strong></p>
            <p className="ml-4">Go to Firebase Console → Storage → Get Started</p>
            
            <p><strong>2. Configure Storage Rules:</strong></p>
            <pre className="bg-yellow-100 p-2 rounded text-xs overflow-x-auto ml-4">
{`rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    match /family-images/{allPaths=**} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}