"use client";
import { useEffect, useState } from "react";
import { Search, MapPin, Clock, Mail, Star, Award } from "lucide-react";
import AssignmentConfirmationModal from '../components/AssignmentConfirmationModal';
import { useUserManagement } from '@/hooks/useUserManagement';
import { useRouter } from 'next/navigation';

export default function BrowsePSMs() {
  const router = useRouter();
  const { offChainUserData, authenticated } = useUserManagement();
  const [psms, setPsms] = useState<any[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedPSM, setSelectedPSM] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEspecialidad, setSelectedEspecialidad] = useState('');
  const [loading, setLoading] = useState(true);
  const [psmRatings, setPsmRatings] = useState<Record<string, any>>({});

  // Fetch PSMs from the API
  useEffect(() => {
    fetchPSMs();
  }, []);

  const fetchPSMs = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/psms?status=certified');
      const data = await res.json();
      setPsms(data);
      
      // Fetch ratings for each PSM
      data.forEach(async (psm: any) => {
        try {
          const ratingRes = await fetch('/api/evaluations', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ psmId: psm.id })
          });
          const ratingData = await ratingRes.json();
          setPsmRatings(prev => ({ ...prev, [psm.id]: ratingData }));
        } catch (err) {
          console.error('Failed to fetch rating for PSM:', psm.id);
        }
      });
    } catch (error) {
      console.error("Failed to fetch PSMs:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleHire = (psm: any) => {
    if (!authenticated || !offChainUserData) {
      router.push('/user-register');
      return;
    }
    setSelectedPSM(psm);
    setShowModal(true);
  };

  const handleAssignmentSuccess = () => {
    setShowModal(false);
    router.push('/sessions');
  };

  // Filter PSMs
  const filteredPSMs = psms.filter(psm => {
    const matchesSearch = !searchTerm || 
      psm.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      psm.apellido.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesEspecialidad = !selectedEspecialidad ||
      psm.especialidades?.includes(selectedEspecialidad);
    
    return matchesSearch && matchesEspecialidad;
  });

  // Get unique specializations for filter
  const allEspecialidades = Array.from(
    new Set(psms.flatMap(psm => psm.especialidades || []))
  ).sort();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-[#635BFF] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading therapists...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 px-4 py-8" style={{ background: 'linear-gradient(135deg, #f7f7f8 0%, #e0c3fc 100%)', minHeight: '100vh' }}>
      <h1 className="text-center mb-2" style={{ fontFamily: 'Jura, Arial, Helvetica, sans-serif', color: '#222', fontSize: '2rem', fontWeight: 600 }}>Find Your Therapist</h1>
      <p className="text-center text-gray-600 mb-8">Browse certified mental health professionals</p>
      
      {/* Search and Filters */}
      <div className="max-w-6xl mx-auto flex flex-col sm:flex-row gap-4 mb-8">
        <div className="relative flex-1">
          <Search className="w-5 h-5 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 bg-white border border-gray-200 rounded-full text-black placeholder-gray-400 focus:border-[#635BFF] w-full"
          />
        </div>
        <select
          value={selectedEspecialidad}
          onChange={(e) => setSelectedEspecialidad(e.target.value)}
          className="px-4 py-2 bg-white border border-gray-200 rounded-full text-black focus:border-[#635BFF]"
        >
          <option value="">All Specializations</option>
          {allEspecialidades.map(esp => (
            <option key={esp} value={esp}>{esp}</option>
          ))}
        </select>
      </div>

      {filteredPSMs.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-600 text-lg">No therapists found matching your criteria</p>
        </div>
      )}

      <div className="w-full max-w-6xl mx-auto">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPSMs.map((psm, idx) => {
            const rating = psmRatings[psm.id];
            return (
              <div
                key={psm.id}
                className="bg-white rounded-2xl shadow-lg p-6 hover:shadow-xl transition-shadow border border-gray-100"
              >
                {/* Avatar Header */}
                <div className="flex items-center mb-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white text-2xl font-bold mr-4 flex-shrink-0">
                    {psm.nombre[0]}{psm.apellido[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-lg text-gray-900 truncate" style={{ fontFamily: 'Jura, Arial, Helvetica, sans-serif' }}>
                      {psm.nombre} {psm.apellido}
                    </h3>
                    {rating && rating.totalReviews > 0 ? (
                      <div className="flex items-center mt-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`w-4 h-4 ${i < Math.floor(parseFloat(rating.averageRating)) ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'}`}
                          />
                        ))}
                        <span className="text-sm text-gray-600 ml-2">
                          {rating.averageRating} ({rating.totalReviews})
                        </span>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500">New therapist</p>
                    )}
                  </div>
                </div>

                {/* Specializations */}
                {psm.especialidades && psm.especialidades.length > 0 && (
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-2">
                      {psm.especialidades.slice(0, 3).map((esp: string, i: number) => (
                        <span key={i} className="px-3 py-1 bg-purple-50 text-purple-700 rounded-full text-xs font-medium">
                          {esp}
                        </span>
                      ))}
                      {psm.especialidades.length > 3 && (
                        <span className="px-3 py-1 bg-gray-100 text-gray-600 rounded-full text-xs font-medium">
                          +{psm.especialidades.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Stats */}
                <div className="flex items-center gap-4 mb-4 text-sm text-gray-600">
                  {psm.experienciaAnios && (
                    <div className="flex items-center">
                      <Award className="w-4 h-4 mr-1 text-[#635BFF]" />
                      <span>{psm.experienciaAnios} yrs</span>
                    </div>
                  )}
                  <div className="flex items-center">
                    <MapPin className="w-4 h-4 mr-1 text-[#635BFF]" />
                    <span className="truncate">{psm.lugarResidencia || "Remote"}</span>
                  </div>
                </div>

                {/* Biography snippet */}
                {psm.biografia && (
                  <p className="text-sm text-gray-600 mb-4 line-clamp-2">
                    {psm.biografia}
                  </p>
                )}

                {/* Action Button */}
                <button
                  onClick={() => handleHire(psm)}
                  className="w-full rounded-full bg-[#635BFF] hover:bg-[#7d4875] text-white py-3 px-4 font-bold transition"
                  style={{ fontFamily: 'Jura, Arial, Helvetica, sans-serif' }}
                >
                  Select Therapist
                </button>
              </div>
            );
          })}
        </div>
      </div>
      {/* Assignment Confirmation Modal */}
      {showModal && selectedPSM && offChainUserData && (
        <AssignmentConfirmationModal
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          psm={selectedPSM}
          userId={offChainUserData.id}
          onSuccess={handleAssignmentSuccess}
        />
      )}
    </div>
  );
}
