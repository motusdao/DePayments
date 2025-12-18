"use client";
import { useState } from "react";
import { useUserManagement } from '@/hooks/useUserManagement';
import { usePrivy } from '@privy-io/react-auth';
import { CheckCircle, Loader, Wallet } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function RegisterPSM() {
  const { authenticated } = usePrivy();
  const router = useRouter();
  const {
    smartAccountAddress,
    isRegisteredOnChain,
    registerOffChain,
    registerOnChain,
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
    
    // Professional Info
    cedulaProfesional: "",
    especialidades: [] as string[],
    formacionAcademica: "",
    experienciaAnios: "",
    biografia: "",
    
    // Platform Preferences
    participaSupervision: false,
    participaCursos: false,
    participaInvestigacion: false,
    participaComunidad: false,
  });

  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [success, setSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registrationStep, setRegistrationStep] = useState<'form' | 'blockchain' | 'complete'>('form');

  const especialidadesOptions = [
    "Ansiedad", "Depresión", "Trauma", "Terapia de Pareja", "Terapia Familiar",
    "Trastornos Alimentarios", "Adicciones", "Duelo", "Autoestima", "Estrés",
    "Terapia Cognitivo-Conductual", "Psicoanálisis", "Terapia Humanista"
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
    // Owner ID will be smart wallet address, so skip this validation

    // Professional Info Validation
    if (!form.cedulaProfesional.trim()) newErrors.cedulaProfesional = "Professional license number is required";
    if (!form.formacionAcademica.trim()) newErrors.formacionAcademica = "Academic background is required";
    if (!form.experienciaAnios || parseInt(form.experienciaAnios) < 0) newErrors.experienciaAnios = "Valid years of experience required";
    if (form.especialidades.length === 0) newErrors.especialidades = "At least one specialization is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setForm({ ...form, [name]: checked });
    } else {
      setForm({ ...form, [name]: value });
    }
    setErrors({ ...errors, [name]: "" }); // clear individual error
  };

  const handleEspecialidadChange = (especialidad: string, checked: boolean) => {
    let newEspecialidades = [...form.especialidades];
    if (checked) {
      newEspecialidades.push(especialidad);
    } else {
      newEspecialidades = newEspecialidades.filter(e => e !== especialidad);
    }
    setForm({ ...form, especialidades: newEspecialidades });
    setErrors({ ...errors, especialidades: "" });
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
      console.log('Starting PSM registration process...');
      
      // Step 1: Show blockchain registration step
      setRegistrationStep('blockchain');
      
      // Step 2: Register off-chain first
      const psmData = {
        ...form,
        owner: smartAccountAddress
      };
      
      const response = await fetch('/api/psms', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(psmData),
      });

      if (!response.ok) {
        throw new Error('Failed to register PSM off-chain');
      }

      const offChainResult = await response.json();
      console.log('PSM registered off-chain:', offChainResult);
      
      // Step 3: Register on-chain with the off-chain ID
      const onChainResult = await registerOnChain('psm', offChainResult.id);
      
      if (!onChainResult.success) {
        throw new Error(onChainResult.error || 'Blockchain registration failed');
      }
      
      console.log('PSM registration completed:', { offChain: offChainResult, onChain: onChainResult });
      
      // Step 4: Show success
      setRegistrationStep('complete');
      setSuccess(true);
      
      // Redirect to dashboard after a delay
      setTimeout(() => {
        router.push('/');
      }, 3000);
      
    } catch (error: any) {
      console.error("PSM registration error:", error);
      setErrors({ general: error.message || "Registration failed. Please try again." });
      setRegistrationStep('form');
    } finally {
      setIsSubmitting(false);
    }
  };

  const renderInput = (
    name: keyof typeof form,
    label: string,
    type: string = "text",
    placeholder?: string
  ) => {
    // Handle array and boolean values properly
    const value = Array.isArray(form[name]) || typeof form[name] === 'boolean' ? '' : String(form[name]);
    
    return (
      <div key={name}>
        <label className="block text-sm font-medium text-black mb-1">{label}</label>
        <input
          type={type}
          name={name}
          value={value}
          onChange={handleChange}
          placeholder={placeholder}
          className={`w-full px-3 py-2 bg-white border ${
            errors[name] ? "border-red-500" : "border-gray-300"
          } rounded-lg text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary`}
        />
        {errors[name] && (
          <p className="text-sm text-red-400 mt-1">{errors[name]}</p>
        )}
      </div>
    );
  };

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
              Please connect your smart wallet to register as a therapist on MotusDAO
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 px-4 py-8" style={{ background: 'linear-gradient(135deg, #f7f7f8 0%, #e0c3fc 100%)', minHeight: '100vh' }}>
      <div className="max-w-xl mx-auto">
        <div className="rounded-2xl shadow-lg p-8 bg-white">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold mb-4" style={{ fontFamily: 'Jura, Arial, Helvetica, sans-serif', color: '#222' }}>
              Join as Mental Health Professional
            </h2>
            <p className="text-gray-600">
              Register to become a certified therapist in our decentralized network
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
              <span className="text-sm font-medium mr-4">Professional Info</span>
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
                🎉 Welcome to MotusDAO Professional Network!
              </div>
              <p className="text-green-700 text-sm mb-4">
                Your registration is complete on both our platform and the blockchain. 
                You can now start receiving patients after completing your certification ($65 USD).
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
            {/* Basic Information Section */}
            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-800">Basic Information</h3>
              <div className="grid grid-cols-2 gap-4">
                {renderInput("nombre", "First Name")}
                {renderInput("apellido", "Last Name")}
              </div>
              {renderInput("email", "Email", "email")}
              {renderInput("fechaNacimiento", "Date of Birth", "date")}
              {renderInput("telefono", "Phone Number", "tel", "+52 555 123 4567")}
              {renderInput("lugarResidencia", "Location")}
            </div>
            
            {/* Professional Information Section */}
            <div className="border-b border-gray-200 pb-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-800">Professional Information</h3>
              {renderInput("cedulaProfesional", "Professional License Number")}
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-black mb-1">Academic Background</label>
                  <textarea
                    name="formacionAcademica"
                    value={form.formacionAcademica}
                    onChange={handleChange}
                    placeholder="Describe your education, degrees, and certifications..."
                    rows={3}
                    className={`w-full px-3 py-2 bg-white border ${
                      errors.formacionAcademica ? "border-red-500" : "border-gray-300"
                    } rounded-lg text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary`}
                  />
                  {errors.formacionAcademica && (
                    <p className="text-sm text-red-400 mt-1">{errors.formacionAcademica}</p>
                  )}
                </div>
                
                <div>
                  {renderInput("experienciaAnios", "Years of Experience", "number", "5")}
                  
                  <label className="block text-sm font-medium text-black mb-1 mt-4">Professional Biography</label>
                  <textarea
                    name="biografia"
                    value={form.biografia}
                    onChange={handleChange}
                    placeholder="Brief description of your therapeutic approach and experience..."
                    rows={2}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-lg text-black placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
              </div>
              
              {/* Specializations */}
              <div className="mt-4">
                <label className="block text-sm font-medium text-black mb-2">Specializations</label>
                <div className="grid grid-cols-2 gap-2">
                  {especialidadesOptions.map((especialidad) => (
                    <label key={especialidad} className="flex items-center space-x-2 text-sm">
                      <input
                        type="checkbox"
                        checked={form.especialidades.includes(especialidad)}
                        onChange={(e) => handleEspecialidadChange(especialidad, e.target.checked)}
                        className="rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <span className="text-gray-700">{especialidad}</span>
                    </label>
                  ))}
                </div>
                {errors.especialidades && (
                  <p className="text-sm text-red-400 mt-1">{errors.especialidades}</p>
                )}
              </div>
            </div>
            
            {/* Platform Preferences */}
            <div className="pb-6">
              <h3 className="text-lg font-semibold mb-4 text-gray-800">Platform Participation</h3>
              <p className="text-sm text-gray-600 mb-4">Choose the activities you'd like to participate in (optional):</p>
              
              <div className="space-y-2">
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    name="participaSupervision"
                    checked={form.participaSupervision}
                    onChange={handleChange}
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <span className="text-gray-700">Clinical Supervision</span>
                </label>
                
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    name="participaCursos"
                    checked={form.participaCursos}
                    onChange={handleChange}
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <span className="text-gray-700">Courses & Workshops</span>
                </label>
                
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    name="participaInvestigacion"
                    checked={form.participaInvestigacion}
                    onChange={handleChange}
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <span className="text-gray-700">Research & Publications</span>
                </label>
                
                <label className="flex items-center space-x-3">
                  <input
                    type="checkbox"
                    name="participaComunidad"
                    checked={form.participaComunidad}
                    onChange={handleChange}
                    className="rounded border-gray-300 text-primary focus:ring-primary"
                  />
                  <span className="text-gray-700">Community Activities</span>
                </label>
              </div>
            </div>
            
            <button
              type="submit"
              disabled={isSubmitting || userManagementLoading || registrationStep !== 'form'}
              className="w-full rounded-full bg-[#635BFF] hover:bg-[#7d4875] disabled:bg-gray-400 disabled:cursor-not-allowed text-white py-3 px-4 font-bold transition mt-6 flex items-center justify-center"
              style={{ fontFamily: 'Jura, Arial, Helvetica, sans-serif' }}
            >
              {isSubmitting || userManagementLoading ? (
                <>
                  <Loader className="w-5 h-5 mr-2 animate-spin" />
                  {registrationStep === 'blockchain' ? 'Registering on Blockchain...' : 'Processing...'}
                </>
              ) : (
                'Register as PSM Professional'
              )}
            </button>
            
            <p className="text-xs text-gray-500 text-center mt-4">
              After registration, you'll need to complete certification ($65 USD) to start receiving patients.
            </p>
          </form>
        </div>
      </div>
    </div>
  );
}
