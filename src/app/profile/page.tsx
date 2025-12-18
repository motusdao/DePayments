'use client'
import { useState, useEffect } from 'react';
import { Save, User, CheckCircle, AlertCircle, Wallet } from 'lucide-react';
import { useUserManagement } from '@/hooks/useUserManagement';
import LoginPrompt from '../components/LoginPrompt';

// Define the user data type
type UserData = {
  nombre: string;
  apellido: string;
  email: string;
  telefono: string;
  lugarResidencia: string;
  fechaNacimiento: string;
};

export default function Profile() {
  const {
    authenticated,
    smartAccountAddress,
    offChainUserData,
    userOnChainData,
    isRegisteredOnChain,
    updateProfile,
    isLoading: userManagementLoading,
    error: userManagementError,
    getUserRole
  } = useUserManagement();
  
  const [formData, setFormData] = useState<UserData>({
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    lugarResidencia: '',
    fechaNacimiento: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  // Load user data when off-chain data is available
  useEffect(() => {
    if (offChainUserData) {
      // Convert date to format expected by input[type="date"]
      const formattedDate = offChainUserData.fechaNacimiento 
        ? new Date(offChainUserData.fechaNacimiento).toISOString().split('T')[0]
        : '';
      
      setFormData({
        nombre: offChainUserData.nombre || '',
        apellido: offChainUserData.apellido || '',
        email: offChainUserData.email || '',
        telefono: offChainUserData.telefono || '',
        lugarResidencia: offChainUserData.lugarResidencia || '',
        fechaNacimiento: formattedDate,
      });
    }
  }, [offChainUserData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!smartAccountAddress) return;

    setIsLoading(true);
    setSaveMessage(null);

    try {
      const updatedData = {
        ...formData,
        fechaNacimiento: new Date(formData.fechaNacimiento).toISOString(),
      };
      
      await updateProfile(updatedData);
      setSaveMessage('Profile updated successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSaveMessage(null), 3000);
    } catch (error: any) {
      console.error('Error saving profile:', error);
      setSaveMessage('Error saving profile: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  if (!authenticated) {
    return <LoginPrompt />;
  }

  const userRole = getUserRole();
  const isPsychologist = userRole === 'psm';

  if (userManagementLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#635BFF] mx-auto mb-4"></div>
          <p className="text-gray-400">Loading profile data...</p>
        </div>
      </div>
    );
  }

  // Show registration prompt if user has no profile data
  if (!smartAccountAddress) {
    return (
      <div className="space-y-8 px-4 py-8" style={{ background: 'linear-gradient(135deg, #f7f7f8 0%, #e0c3fc 100%)', minHeight: '100vh' }}>
        <div className="max-w-2xl mx-auto">
          <div className="rounded-2xl shadow-lg p-8 bg-white text-center">
            <Wallet className="w-16 h-16 text-[#635BFF] mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-800 mb-4" style={{ fontFamily: 'Jura, Arial, Helvetica, sans-serif' }}>
              Connect Your Wallet
            </h1>
            <p className="text-gray-600 mb-6">
              Please connect your smart wallet to access your profile.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 px-4 py-8" style={{ background: 'linear-gradient(135deg, #f7f7f8 0%, #e0c3fc 100%)', minHeight: '100vh' }}>
      <h1 className="text-center" style={{ fontFamily: 'Jura, Arial, Helvetica, sans-serif', color: '#222', fontSize: '1rem', fontWeight: 500, marginBottom: '2.5rem' }}>Profile Settings</h1>
      <div className="max-w-2xl mx-auto">
        <form onSubmit={handleSubmit}>
          <div className="rounded-2xl shadow-lg p-8 bg-white transition-transform duration-300 ease-out transform hover:-translate-y-2 hover:scale-105 cursor-pointer">
            <div className="flex items-center mb-8">
              <div className="w-16 h-16 bg-[#635BFF] rounded-full flex items-center justify-center text-white text-2xl font-bold mr-4">
                <User className="w-8 h-8" />
              </div>
              <div>
                <h2 className="text-2xl font-bold" style={{ fontFamily: 'Jura, Arial, Helvetica, sans-serif', color: '#222' }}>
                  {isPsychologist ? 'Therapist Profile' : 'Patient Profile'}
                </h2>
                <p className="text-[#635BFF] font-medium" style={{ fontFamily: 'Inter, Arial, Helvetica, sans-serif' }}>
                  {smartAccountAddress ? smartAccountAddress.slice(0, 8) + '...' + smartAccountAddress.slice(-6) : ''}
                </p>
                {isRegisteredOnChain && (
                  <div className="flex items-center mt-2">
                    <CheckCircle className="w-4 h-4 text-green-500 mr-1" />
                    <span className="text-sm text-green-600">Verified on blockchain</span>
                  </div>
                )}
              </div>
            </div>
            
            {/* Status Messages */}
            {saveMessage && (
              <div className={`mb-6 p-4 rounded-lg border ${
                saveMessage.includes('Error') 
                  ? 'bg-red-50 border-red-200 text-red-800'
                  : 'bg-green-50 border-green-200 text-green-800'
              }`}>
                <div className="flex items-center">
                  {saveMessage.includes('Error') 
                    ? <AlertCircle className="w-5 h-5 mr-2" />
                    : <CheckCircle className="w-5 h-5 mr-2" />
                  }
                  {saveMessage}
                </div>
              </div>
            )}
            
            {userManagementError && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="flex items-center text-red-800">
                  <AlertCircle className="w-5 h-5 mr-2" />
                  {userManagementError}
                </div>
              </div>
            )}
            
            {/* Registration Status Information */}
            {!offChainUserData && (
              <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-center text-blue-800">
                  <AlertCircle className="w-5 h-5 mr-2" />
                  <div>
                    <p className="font-medium">No profile data found</p>
                    <p className="text-sm text-blue-600">You may need to register first. This form will create your profile when you save it.</p>
                  </div>
                </div>
              </div>
            )}
            
            {offChainUserData && !isRegisteredOnChain && (
              <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-center text-yellow-800">
                  <AlertCircle className="w-5 h-5 mr-2" />
                  <div>
                    <p className="font-medium">Profile incomplete</p>
                    <p className="text-sm text-yellow-600">Your profile exists but needs blockchain verification to access all platform features.</p>
                  </div>
                </div>
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-gray-400 text-sm font-medium mb-2">First Name</label>
                <input
                  type="text"
                  name="nombre"
                  value={formData.nombre}
                  onChange={handleChange}
                  placeholder="Enter your first name"
                  className="w-full px-3 py-2 bg-[#F7F7F8] border border-gray-200 rounded-lg text-black focus:border-[#635BFF]"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-400 text-sm font-medium mb-2">Last Name</label>
                <input
                  type="text"
                  name="apellido"
                  value={formData.apellido}
                  onChange={handleChange}
                  placeholder="Enter your last name"
                  className="w-full px-3 py-2 bg-[#F7F7F8] border border-gray-200 rounded-lg text-black focus:border-[#635BFF]"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-400 text-sm font-medium mb-2">Email</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Enter your email"
                  className="w-full px-3 py-2 bg-[#F7F7F8] border border-gray-200 rounded-lg text-black focus:border-[#635BFF]"
                  required
                />
              </div>

              <div>
                <label className="block text-gray-400 text-sm font-medium mb-2">Phone</label>
                <input
                  type="tel"
                  name="telefono"
                  value={formData.telefono}
                  onChange={handleChange}
                  placeholder="Enter your phone number"
                  className="w-full px-3 py-2 bg-[#F7F7F8] border border-gray-200 rounded-lg text-black focus:border-[#635BFF]"
                />
              </div>

              <div>
                <label className="block text-gray-400 text-sm font-medium mb-2">Location</label>
                <input
                  type="text"
                  name="lugarResidencia"
                  value={formData.lugarResidencia}
                  onChange={handleChange}
                  placeholder="Enter your location"
                  className="w-full px-3 py-2 bg-[#F7F7F8] border border-gray-200 rounded-lg text-black focus:border-[#635BFF]"
                />
              </div>

              <div>
                <label className="block text-gray-400 text-sm font-medium mb-2">Birth Date</label>
                <input
                  type="date"
                  name="fechaNacimiento"
                  value={formData.fechaNacimiento}
                  onChange={handleChange}
                  className="w-full px-3 py-2 bg-[#F7F7F8] border border-gray-200 rounded-lg text-black focus:border-[#635BFF]"
                />
              </div>
            </div>

            <button 
              type="submit"
              disabled={isLoading || !formData.nombre || !formData.apellido}
              className="mt-8 w-full rounded-full bg-[#635BFF] hover:bg-[#7d4875] disabled:bg-gray-400 disabled:cursor-not-allowed text-white py-3 px-4 font-bold flex items-center justify-center space-x-2 transition"
              style={{ fontFamily: 'Jura, Arial, Helvetica, sans-serif' }}
            >
              <Save className="w-4 h-4" />
              <span>{isLoading ? 'Saving...' : 'Save Changes'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}