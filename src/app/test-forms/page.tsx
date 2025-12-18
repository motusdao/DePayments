"use client";
import Link from "next/link";

export default function TestForms() {
  return (
    <div className="min-h-screen bg-gray-100 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-center mb-8 text-gray-800">
          MotusDAO Registration Forms Test
        </h1>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* User Registration Card */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-semibold mb-4 text-blue-600">
              Patient Registration
            </h2>
            <p className="text-gray-600 mb-6">
              Test the patient registration form with therapeutic profiling and PSM assignment preferences.
            </p>
            
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-800 mb-2">Features Tested:</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Basic personal information</li>
                  <li>• Therapeutic needs assessment</li>
                  <li>• PSM assignment preferences</li>
                  <li>• Form validation</li>
                  <li>• Mock data fallback</li>
                </ul>
              </div>
              
              <Link
                href="/user-register"
                className="block w-full bg-blue-600 hover:bg-blue-700 text-white text-center py-3 px-6 rounded-lg font-semibold transition-colors"
              >
                Test Patient Registration
              </Link>
            </div>
          </div>
          
          {/* PSM Registration Card */}
          <div className="bg-white rounded-xl shadow-lg p-8">
            <h2 className="text-2xl font-semibold mb-4 text-purple-600">
              Therapist Registration
            </h2>
            <p className="text-gray-600 mb-6">
              Test the PSM (therapist) registration form with professional credentials and specializations.
            </p>
            
            <div className="space-y-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="font-semibold text-gray-800 mb-2">Features Tested:</h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Professional credentials</li>
                  <li>• Multiple specializations</li>
                  <li>• Platform participation preferences</li>
                  <li>• Professional validation</li>
                  <li>• Mock data fallback</li>
                </ul>
              </div>
              
              <Link
                href="/psms-register"
                className="block w-full bg-purple-600 hover:bg-purple-700 text-white text-center py-3 px-6 rounded-lg font-semibold transition-colors"
              >
                Test Therapist Registration
              </Link>
            </div>
          </div>
        </div>
        
        {/* Status Information */}
        <div className="mt-12 bg-yellow-50 border border-yellow-200 rounded-xl p-6">
          <h3 className="text-lg font-semibold text-yellow-800 mb-2">
            🚧 Development Mode Active
          </h3>
          <p className="text-yellow-700">
            The app is currently running in mock data mode because the database connection is unavailable. 
            When you submit forms, you'll receive success responses but data won't be permanently stored.
          </p>
          <p className="text-yellow-700 mt-2">
            To enable real database functionality, fix the DATABASE_URL in your .env file and set USE_MOCK_DATA=false.
          </p>
        </div>
        
        {/* API Status */}
        <div className="mt-8 bg-white rounded-xl shadow-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">API Endpoints Available</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="font-medium text-green-600">✅ Working Endpoints:</h4>
              <ul className="text-sm text-gray-600 mt-2 space-y-1">
                <li>• POST /api/users (with mock fallback)</li>
                <li>• POST /api/psms (with mock fallback)</li>
                <li>• GET /api/users (basic structure)</li>
                <li>• GET /api/psms (basic structure)</li>
              </ul>
            </div>
            <div>
              <h4 className="font-medium text-blue-600">🚧 Future Endpoints:</h4>
              <ul className="text-sm text-gray-600 mt-2 space-y-1">
                <li>• /api/sessions (session management)</li>
                <li>• /api/certifications (PSM verification)</li>
                <li>• /api/assignments (PSM-user matching)</li>
                <li>• /api/evaluations (feedback system)</li>
              </ul>
            </div>
          </div>
        </div>
        
        <div className="mt-8 text-center">
          <Link
            href="/"
            className="inline-flex items-center text-gray-600 hover:text-gray-800 transition-colors"
          >
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    </div>
  );
}
