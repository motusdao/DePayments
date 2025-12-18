"use client";
import React, { useState, useEffect } from 'react';
import { CheckCircle, Loader, X, Star, Clock, Calendar } from 'lucide-react';

type AssignmentStep = 'confirm' | 'schedule' | 'success';

interface PSMData {
  id: string;
  nombre: string;
  apellido: string;
  especialidades: string[];
  biografia?: string;
  reputacionPuntos: number;
  totalSesiones: number;
  experienciaAnios?: number;
}

interface AssignmentConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  psm: PSMData;
  userId: string;
  onSuccess?: () => void;
}

export default function AssignmentConfirmationModal({
  isOpen,
  onClose,
  psm,
  userId,
  onSuccess
}: AssignmentConfirmationModalProps) {
  const [step, setStep] = useState<AssignmentStep>('confirm');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Calculate average rating (rough estimate from reputation points)
  const averageRating = Math.min(5, Math.max(1, psm.reputacionPuntos / (psm.totalSesiones * 2 || 1)));
  const fullStars = Math.floor(averageRating);

  // Generate next 7 days for date selection
  const getNextDays = () => {
    const days = [];
    for (let i = 1; i <= 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      days.push(date.toISOString().split('T')[0]);
    }
    return days;
  };

  const availableDates = getNextDays();

  // Fetch availability when step changes to schedule
  useEffect(() => {
    if (step === 'schedule' && selectedDate) {
      fetchAvailability();
    }
  }, [step, selectedDate]);

  const fetchAvailability = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/sessions/availability?psmId=${psm.id}&date=${selectedDate}`);
      if (!response.ok) throw new Error('Failed to fetch availability');
      
      const data = await response.json();
      setAvailableSlots(data.availableSlots || []);
      
      if (data.availableSlots.length === 0) {
        setError('No slots available for this date. Please choose another.');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmAssignment = async () => {
    if (!selectedDate || !selectedTime) {
      setError('Please select both date and time');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Create assignment (this will also create framing session via API)
      const response = await fetch('/api/assignments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usuarioId: userId,
          psmId: psm.id,
          assignmentType: 'manual'
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to create assignment');
      }

      setStep('success');
      
      // Call success callback
      if (onSuccess) {
        setTimeout(() => {
          onSuccess();
        }, 2000);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep('confirm');
    setSelectedDate('');
    setSelectedTime('');
    setAvailableSlots([]);
    setError(null);
    onClose();
  };

  if (!isOpen) return null;

  // Success screen
  if (step === 'success') {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-2xl font-bold mb-2" style={{ fontFamily: 'Jura, Arial, Helvetica, sans-serif', color: '#222' }}>
            🎉 Assignment Successful!
          </h3>
          <p className="text-gray-600 mb-4">
            You're now connected with<br />
            <span className="font-bold">{psm.nombre} {psm.apellido}</span>
          </p>
          <div className="bg-purple-50 p-4 rounded-lg mb-4">
            <p className="text-sm font-medium text-gray-800 mb-1">📅 Framing Session Scheduled:</p>
            <p className="text-[#635BFF] font-bold">
              {selectedDate && new Date(selectedDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })} at {selectedTime}
            </p>
          </div>
          <p className="text-sm text-gray-500">
            We've sent confirmation details to your email.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-8 max-w-2xl w-full relative max-h-[90vh] overflow-y-auto">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          disabled={loading}
        >
          <X className="w-6 h-6" />
        </button>

        {/* Step 1: Confirm Selection */}
        {step === 'confirm' && (
          <div>
            <h3 className="text-2xl font-bold mb-4" style={{ fontFamily: 'Jura, Arial, Helvetica, sans-serif', color: '#222' }}>
              Confirm Your Therapist Selection
            </h3>

            <div className="bg-gray-50 p-6 rounded-xl mb-6">
              <div className="flex items-start">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white text-2xl font-bold mr-4 flex-shrink-0">
                  {psm.nombre[0]}{psm.apellido[0]}
                </div>
                <div className="flex-1">
                  <h4 className="text-xl font-bold text-gray-800 mb-1">
                    {psm.nombre} {psm.apellido}
                  </h4>
                  <div className="flex items-center mb-2">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`w-4 h-4 ${
                          i < fullStars
                            ? 'fill-yellow-400 text-yellow-400'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                    <span className="text-sm text-gray-600 ml-2">
                      {averageRating.toFixed(1)} ({psm.totalSesiones} sessions)
                    </span>
                  </div>
                  {psm.experienciaAnios && (
                    <p className="text-sm text-gray-600 mb-2">
                      🎓 {psm.experienciaAnios} years of experience
                    </p>
                  )}
                </div>
              </div>

              {psm.especialidades && psm.especialidades.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Specializations:</p>
                  <div className="flex flex-wrap gap-2">
                    {psm.especialidades.slice(0, 5).map((especialidad, i) => (
                      <span
                        key={i}
                        className="px-3 py-1 bg-white rounded-full text-sm text-gray-700 border border-gray-200"
                      >
                        {especialidad}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {psm.biografia && (
                <div className="mt-4">
                  <p className="text-sm text-gray-600 line-clamp-3">
                    {psm.biografia}
                  </p>
                </div>
              )}
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <p className="font-medium text-gray-800 mb-2">Next Steps:</p>
              <ol className="text-sm text-gray-700 space-y-1">
                <li>1. Schedule framing session (free)</li>
                <li>2. Discuss therapeutic goals and approach</li>
                <li>3. Begin regular sessions</li>
              </ol>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={handleClose}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-full hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={() => setStep('schedule')}
                className="flex-1 px-6 py-3 bg-[#635BFF] hover:bg-[#7d4875] text-white rounded-full font-bold transition-colors"
                style={{ fontFamily: 'Jura, Arial, Helvetica, sans-serif' }}
              >
                Confirm Selection
              </button>
            </div>
          </div>
        )}

        {/* Step 2: Schedule Framing Session */}
        {step === 'schedule' && (
          <div>
            <h3 className="text-2xl font-bold mb-2" style={{ fontFamily: 'Jura, Arial, Helvetica, sans-serif', color: '#222' }}>
              Schedule Your Framing Session
            </h3>
            <p className="text-gray-600 mb-6">
              A framing session helps establish therapeutic goals and expectations.
            </p>

            {/* Date Selection */}
            <div className="mb-6">
              <div className="flex items-center mb-3">
                <Calendar className="w-5 h-5 text-[#635BFF] mr-2" />
                <label className="font-medium text-gray-800">Select Date</label>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {availableDates.map(date => {
                  const d = new Date(date);
                  return (
                    <button
                      key={date}
                      onClick={() => setSelectedDate(date)}
                      className={`p-3 rounded-lg border-2 transition-colors ${
                        selectedDate === date
                          ? 'border-[#635BFF] bg-purple-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-xs text-gray-500">{d.toLocaleDateString('en-US', { weekday: 'short' })}</div>
                      <div className="font-bold">{d.getDate()}</div>
                      <div className="text-xs">{d.toLocaleDateString('en-US', { month: 'short' })}</div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Time Selection */}
            {selectedDate && (
              <div className="mb-6">
                <div className="flex items-center mb-3">
                  <Clock className="w-5 h-5 text-[#635BFF] mr-2" />
                  <label className="font-medium text-gray-800">Select Time</label>
                </div>
                
                {loading ? (
                  <div className="flex justify-center py-8">
                    <Loader className="w-8 h-8 text-[#635BFF] animate-spin" />
                  </div>
                ) : availableSlots.length > 0 ? (
                  <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto">
                    {availableSlots.map(time => (
                      <button
                        key={time}
                        onClick={() => setSelectedTime(time)}
                        className={`p-2 rounded-lg border-2 transition-colors ${
                          selectedTime === time
                            ? 'border-[#635BFF] bg-purple-50 font-bold'
                            : 'border-gray-200 hover:border-gray-300'
                        }`}
                      >
                        {time}
                      </button>
                    ))}
                  </div>
                ) : (
                  <p className="text-center text-gray-500 py-4">No available slots</p>
                )}
              </div>
            )}

            {/* Session Info */}
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-800">Duration: 50 minutes</p>
                  <p className="text-sm text-gray-600">Cost: <span className="font-bold text-green-600">FREE</span> (first session)</p>
                </div>
              </div>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={() => setStep('confirm')}
                disabled={loading}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-full hover:bg-gray-50 transition-colors disabled:opacity-50"
              >
                Back
              </button>
              <button
                onClick={handleConfirmAssignment}
                disabled={loading || !selectedDate || !selectedTime}
                className="flex-1 px-6 py-3 bg-[#635BFF] hover:bg-[#7d4875] text-white rounded-full font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
                style={{ fontFamily: 'Jura, Arial, Helvetica, sans-serif' }}
              >
                {loading ? (
                  <>
                    <Loader className="w-5 h-5 mr-2 animate-spin" />
                    Confirming...
                  </>
                ) : (
                  'Confirm & Schedule'
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
