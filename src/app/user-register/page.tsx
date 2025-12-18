"use client";
import { useState } from "react";
import { useUserManagement } from '@/hooks/useUserManagement';
import { usePrivy } from '@privy-io/react-auth';
import { CheckCircle, Loader, Wallet } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function RegisterUser() {
  const { authenticated } = usePrivy();
  const router = useRouter();
  const {
    smartAccountAddress,
    isRegisteredOnChain,
    completeRegistration,
    isLoading: userManagementLoading,
    error: userManagementError,
    clearError
  } = useUserManagement();
  
  const [form, setForm] = useState({
    // Basic Info
    nombre: "",
    apellido: "",
    email: "",
    fechaNacimiento: "",
    telefono: "",
    lugarResidencia: "",
    
    // Therapeutic Profile
    problematicaPrincipal: "",
    tipoAtencion: "",
    preferenciaAsignacion: "automatica" as "automatica" | "explorar",
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registrationStep, setRegistrationStep] = useState<'form' | 'blockchain' | 'complete'>('form');

  const tiposAtencionOptions = [
    "Ansiedad", "Depresión", "Trauma", "Terapia de Pareja", "Terapia Familiar",
    "Trastornos Alimentarios", "Adicciones", "Duelo", "Autoestima", "Estrés",
    "Otros"
  ];

  const validate = () => {
    const newErrors: { [key: string]: string } = {};

    // Basic Info Validation
    if (!form.nombre.trim()) newErrors.nombre = "First name is required";
    if (!form.apellido.trim()) newErrors.apellido = "Last name is required";
    if (!form.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) newErrors.email = "Invalid email";
    if (!form.fechaNacimiento) newErrors.fechaNacimiento = "Date of birth is required";
    if (!form.telefono.match(/^\+?[0-9\s\-]{7,15}$/)) newErrors.telefono = "Invalid phone number";
    if (!form.lugarResidencia.trim()) newErrors.lugarResidencia = "Location is required";

    // Therapeutic Info
    if (!form.problematicaPrincipal.trim()) newErrors.problematicaPrincipal = "Please describe your main concern";
    if (!form.tipoAtencion) newErrors.tipoAtencion = "Please select the type of attention you need";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'radio') {
      setForm({ ...form, [name]: value });
    } else {
      setForm({ ...form, [name]: value });
    }
    setErrors({ ...errors, [name]: "" }); // clear individual error
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    if (!authenticated || !smartAccountAddress) {
      setErrors({ general: "Please connect your smart wallet first." });
      return;
    }

    setIsSubmitting(true);
    setErrors({});
    clearError();

    try {
      console.log('Starting user registration process...');
      
      // Step 1: Show blockchain registration step
      setRegistrationStep('blockchain');
      
      // Step 2: Complete registration (both off-chain and on-chain)
      const result = await completeRegistration(form, 'patient');
      
      console.log('Registration completed:', result);
      
      // Step 3: Show success
      setRegistrationStep('complete');
      setSuccess(true);
      
      // Redirect to dashboard after a delay
      setTimeout(() => {
        router.push('/');
      }, 3000);
      
    } catch (error: any) {
      console.error("Registration error:", error);
      
      // Check if this is a 409 conflict (user already exists)
      if (error.message?.includes('already exists') || error.message?.includes('409')) {
        setErrors({ general: "You already have an account with this wallet. Please use the profile page to update your information." });
        // Redirect to profile after a delay
        setTimeout(() => {
          router.push('/profile');
        }, 3000);
      } else {
        setErrors({ general: error.message || "Registration failed. Please try again." });
      }
      
      setRegistrationStep('form');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderInput = (
    name: keyof typeof form,
    label: string,
    type: string = "text",
    placeholder?: string,
    required: boolean = true
  ) => (
    <div key={name}>
      <label className="block text-sm font-medium text-black mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type={type}
        name={name}
        value={form[name]}
        onChange={handleChange}
        placeholder={placeholder}
        required={required}
        className={`w-full px-3 py-2 bg-white border ${
          errors[name] ? "border-red-500" : "border-gray-300"
        } rounded-lg text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary`}
      />
      {errors[name] && (
        <p className="text-sm text-red-400 mt-1">{errors[name]}</p>
      )}
    </div>
  );

  // Redirect if already registered
  if (isRegisteredOnChain && !userManagementLoading) {
    router.push('/');
    return null;
  }

  if (!authenticated) {
    return (
      <div className="space-y-8 px-4 py-8" style={{ background: 'linear-gradient(135deg, #f7f7f8 0%, #e0c3fc 100%)', minHeight: '100vh' }}>
        <div className="max-w-2xl mx-auto">
          <div className="rounded-2xl shadow-lg p-8 bg-white text-center">
            <Wallet className="w-16 h-16 text-[#635BFF] mx-auto mb-4" />
            <h1 className="text-2xl font-bold text-gray-800 mb-4" style={{ fontFamily: 'Jura, Arial, Helvetica, sans-serif' }}>
              Connect Your Wallet
            </h1>
            <p className="text-gray-600 mb-6">
              Please connect your smart wallet to register as a patient on MotusDAO
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 px-4 py-8" style={{ background: 'linear-gradient(135deg, #f7f7f8 0%, #e0c3fc 100%)', minHeight: '100vh' }}>
      <div className="max-w-2xl mx-auto">
        <div className="rounded-2xl shadow-lg p-8 bg-white">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2" style={{ fontFamily: 'Jura, Arial, Helvetica, sans-serif' }}>
              Start Your Therapeutic Journey
            </h1>
            <p className="text-gray-600">
              Join MotusDAO and connect with certified mental health professionals worldwide
            </p>
            
            {smartAccountAddress && (
              <div className="flex items-center justify-center mt-4">
                <CheckCircle className="w-5 h-5 text-green-500 mr-2" />
                <span className="text-sm text-gray-600">
                  Smart Wallet: {smartAccountAddress.slice(0, 8)}...{smartAccountAddress.slice(-6)}
                </span>
              </div>
            )}
          </div>
          
          {/* Registration Steps Indicator */}
          <div className="flex items-center justify-center mb-8">
            <div className={`flex items-center ${registrationStep === 'form' ? 'text-[#635BFF]' : 'text-green-500'}`}>
              <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center mr-2 ${
                registrationStep === 'form' ? 'border-[#635BFF] bg-[#635BFF] text-white' : 'border-green-500 bg-green-500 text-white'
              }`}>
                {registrationStep === 'form' ? '1' : '✓'}
              </div>
              <span className="text-sm font-medium mr-4">Profile Info</span>
            </div>
            
            <div className={`w-8 h-0.5 mx-2 ${
              registrationStep === 'blockchain' || registrationStep === 'complete' ? 'bg-green-500' : 'bg-gray-300'
            }`}></div>
            
            <div className={`flex items-center ${
              registrationStep === 'blockchain' ? 'text-[#635BFF]' : 
              registrationStep === 'complete' ? 'text-green-500' : 'text-gray-400'
            }`}>
              <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center mr-2 ${
                registrationStep === 'blockchain' ? 'border-[#635BFF] bg-[#635BFF] text-white' :
                registrationStep === 'complete' ? 'border-green-500 bg-green-500 text-white' : 'border-gray-300'
              }`}>
                {registrationStep === 'complete' ? '✓' : '2'}
              </div>
              <span className="text-sm font-medium">Blockchain Registration</span>
            </div>
          </div>
          
          {registrationStep === 'blockchain' && (
            <div className="mb-6 p-6 bg-blue-50 border border-blue-200 rounded-lg text-center">
              <Loader className="w-8 h-8 text-[#635BFF] mx-auto mb-4 animate-spin" />
              <div className="text-[#635BFF] font-medium mb-2">
                Registering on Blockchain...
              </div>
              <p className="text-blue-700 text-sm">
                Please confirm the transaction in your wallet to complete your registration on the smart contract.
              </p>
            </div>
          )}
          
          {registrationStep === 'complete' && (
            <div className="mb-6 p-6 bg-green-50 border border-green-200 rounded-lg text-center">
              <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <div className="text-green-800 font-medium text-lg mb-2">
                🎉 Welcome to MotusDAO! 
              </div>
              <p className="text-green-700 text-sm mb-4">
                Your registration is complete on both our platform and the blockchain. 
                We'll help you find the right therapist based on your needs.
              </p>
              <p className="text-green-600 text-xs">
                Redirecting to dashboard in a few seconds...
              </p>
            </div>
          )}

          {(errors.general || userManagementError) && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-800 text-sm">{errors.general || userManagementError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-800">Personal Information</h3>
              
              <div className="grid grid-cols-2 gap-4">
                {renderInput("nombre", "First Name")}
                {renderInput("apellido", "Last Name")}
              </div>
              
              {renderInput("email", "Email", "email")}
              
              <div className="grid grid-cols-2 gap-4">
                {renderInput("fechaNacimiento", "Date of Birth", "date")}
                {renderInput("telefono", "Phone Number", "tel", "+52 555 123 4567")}
              </div>
              
            {renderInput("lugarResidencia", "Location/City")}
            </div>

            {/* Therapeutic Profile */}
            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-800">What brings you here?</h3>
              
              <div>
                <label className="block text-sm font-medium text-black mb-1">
                  Type of Attention Needed <span className="text-red-500">*</span>
                </label>
                <select
                  name="tipoAtencion"
                  value={form.tipoAtencion}
                  onChange={handleChange}
                  className={`w-full px-3 py-2 bg-white border ${
                    errors.tipoAtencion ? "border-red-500" : "border-gray-300"
                  } rounded-lg text-black focus:outline-none focus:ring-2 focus:ring-primary`}
                  required
                >
                  <option value="">Select what you'd like help with...</option>
                  {tiposAtencionOptions.map((tipo) => (
                    <option key={tipo} value={tipo}>{tipo}</option>
                  ))}
                </select>
                {errors.tipoAtencion && (
                  <p className="text-sm text-red-400 mt-1">{errors.tipoAtencion}</p>
                )}
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-black mb-1">
                  Tell us about your main concern <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="problematicaPrincipal"
                  value={form.problematicaPrincipal}
                  onChange={handleChange}
                  placeholder="Briefly describe what you'd like to work on in therapy..."
                  rows={3}
                  required
                  className={`w-full px-3 py-2 bg-white border ${
                    errors.problematicaPrincipal ? "border-red-500" : "border-gray-300"
                  } rounded-lg text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary`}
                />
                {errors.problematicaPrincipal && (
                  <p className="text-sm text-red-400 mt-1">{errors.problematicaPrincipal}</p>
                )}
              </div>
            </div>

            {/* Therapist Assignment Preference */}
            <div className="pb-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-800">How would you like to find your therapist?</h3>
              
              <div className="space-y-3">
                <label className="flex items-start space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="radio"
                    name="preferenciaAsignacion"
                    value="automatica"
                    checked={form.preferenciaAsignacion === "automatica"}
                    onChange={handleChange}
                    className="mt-1 text-primary focus:ring-primary"
                  />
                  <div>
                    <div className="font-medium text-gray-800">Match me automatically</div>
                    <div className="text-sm text-gray-600">
                      We'll assign you to a qualified therapist based on your needs and preferences
                    </div>
                  </div>
                </label>
                
                <label className="flex items-start space-x-3 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 cursor-pointer">
                  <input
                    type="radio"
                    name="preferenciaAsignacion"
                    value="explorar"
                    checked={form.preferenciaAsignacion === "explorar"}
                    onChange={handleChange}
                    className="mt-1 text-primary focus:ring-primary"
                  />
                  <div>
                    <div className="font-medium text-gray-800">Let me explore profiles</div>
                    <div className="text-sm text-gray-600">
                      I'd like to browse therapist profiles and choose who feels right for me
                    </div>
                  </div>
                </label>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || userManagementLoading || registrationStep !== 'form'}
              className="w-full rounded-full bg-[#635BFF] hover:bg-[#7d4875] disabled:bg-gray-400 disabled:cursor-not-allowed text-white py-3 px-6 font-bold transition-colors flex items-center justify-center"
              style={{ fontFamily: 'Jura, Arial, Helvetica, sans-serif' }}
            >
              {isSubmitting || userManagementLoading ? (
                <>
                  <Loader className="w-5 h-5 mr-2 animate-spin" />
                  {registrationStep === 'blockchain' ? 'Registering on Blockchain...' : 'Processing...'}
                </>
              ) : (
                'Begin My Therapeutic Journey'
              )}
            </button>

            <div className="text-xs text-gray-500 text-center space-y-2">
              <p>By registering, you agree to our terms of service and privacy policy.</p>
              <p>Your information is secure and will only be shared with your assigned therapist.</p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
