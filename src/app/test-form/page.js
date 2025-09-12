'use client';

import { useState } from 'react';
import AddFamilyMemberForm from '@/components/AddFamilyMemberForm';

export default function TestFormPage() {
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const handleMemberAdded = (memberData) => {
    console.log('✅ Member added successfully:', memberData);
    setResult(memberData);
    setError(null);
  };

  const handleError = (err) => {
    console.error('❌ Error adding member:', err);
    setError(err.message || 'Unknown error');
    setResult(null);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            Add Family Member Form Test
          </h1>
          <p className="text-gray-600 mb-6">
            This is a test page to debug the Add Family Member form functionality.
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">
            Form Results
          </h2>
          
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg mb-4">
              <h3 className="font-medium">Error:</h3>
              <p>{error}</p>
            </div>
          )}
          
          {result && (
            <div className="bg-green-50 border border-green-200 text-green-800 px-4 py-3 rounded-lg mb-4">
              <h3 className="font-medium">Success!</h3>
              <pre className="text-xs mt-2 overflow-auto bg-white p-2 rounded border">
                {JSON.stringify(result, null, 2)}
              </pre>
            </div>
          )}
          
          {!result && !error && (
            <p className="text-gray-500">No form submission yet. Fill out and submit the form below.</p>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">
            Add Family Member Form
          </h2>
          
          <div className="border-t border-gray-200 pt-6">
            <AddFamilyMemberForm 
              onMemberAdded={handleMemberAdded}
              onError={handleError}
            />
          </div>
        </div>
      </div>
    </div>
  );
}