"use client";
import React, { useState, useEffect } from 'react';
import { Calendar, Clock, CheckCircle, Loader, X, DollarSign } from 'lucide-react';

type BookingStep = 'date' | 'time' | 'payment' | 'success';

interface SessionBookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  psmId: string;
  psmName?: string;
  userId?: string;
  usuarioId?: string;
  onSuccess?: () => void;
}

export default function SessionBookingModal({
  isOpen,
  onClose,
  psmId,
  psmName = 'Your Therapist',
  userId,
  usuarioId,
  onSuccess
}: SessionBookingModalProps) {
  const actualUserId = userId || usuarioId || '';
  const [step, setStep] = useState<BookingStep>('date');
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [paymentAmount, setPaymentAmount] = useState<number>(45);
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Generate next 14 days for date selection
  const getNextDays = (count: number = 14) => {
    const days = [];
    for (let i = 1; i <= count; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      days.push(date.toISOString().split('T')[0]);
    }
    return days;
  };

  const availableDates = getNextDays();

  // Fetch available time slots when date is selected
  useEffect(() => {
    if (selectedDate && step === 'time') {
      fetchAvailability();
    }
  }, [selectedDate, step]);

  const fetchAvailability = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(`/api/sessions/availability?psmId=${psmId}&date=${selectedDate}`);
      if (!response.ok) throw new Error('Failed to fetch availability');
      
      const data = await response.json();
      setAvailableSlots(data.availableSlots || []);
      
      if (data.availableSlots.length === 0) {
        setError('No slots available for this date');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleBookSession = async () => {
    setLoading(true);
    setError(null);

    try {
      // Combine date and time
      const sessionDateTime = new Date(`${selectedDate}T${selectedTime}:00`);

      const response = await fetch('/api/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          usuarioId: actualUserId,
          psmId: psmId,
          fechaSesion: sessionDateTime.toISOString(),
          tipoSesion: 'individual',
          duracionMinutos: 50,
          montoCobrado: paymentAmount,
          metodoPago: 'pendiente'
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to book session');
      }

      setStep('success');
      
      // Auto-close after 3 seconds
      setTimeout(() => {
        if (onSuccess) onSuccess();
        handleClose();
      }, 3000);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setStep('date');
    setSelectedDate('');
    setSelectedTime('');
    setPaymentAmount(45);
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
            Session Booked!
          </h3>
          <p className="text-gray-600 mb-4">
            Your session with {psmName} on {new Date(selectedDate).toLocaleDateString()} at {selectedTime} has been confirmed.
          </p>
          <p className="text-sm text-gray-500">
            We'll send you a reminder before your session.
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

        <h3 className="text-2xl font-bold mb-2" style={{ fontFamily: 'Jura, Arial, Helvetica, sans-serif', color: '#222' }}>
          Book Session
        </h3>
        <p className="text-gray-600 mb-6">with {psmName}</p>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          {(['date', 'time', 'payment'] as const).map((s, i) => {
            const steps = ['date', 'time', 'payment'] as const;
            // Type-safe step index calculation
            let currentStepIndex = 0;
            if (step === 'date') currentStepIndex = 0;
            else if (step === 'time') currentStepIndex = 1;
            else if (step === 'payment') currentStepIndex = 2;
            else if (step === 'success') currentStepIndex = 3; // After payment
            
            const thisStepIndex = steps.indexOf(s);
            const isCompleted = thisStepIndex < currentStepIndex;
            const isCurrent = step === s;
            
            return (
              <React.Fragment key={s}>
                <div className={`flex items-center ${isCurrent ? 'text-[#635BFF]' : isCompleted ? 'text-green-500' : 'text-gray-400'}`}>
                  <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center ${
                    isCurrent ? 'border-[#635BFF] bg-[#635BFF] text-white' : 
                    isCompleted ? 'border-green-500 bg-green-500 text-white' : 
                    'border-gray-300'
                  }`}>
                    {i + 1}
                  </div>
                  <span className="ml-2 text-sm font-medium capitalize hidden sm:inline">{s}</span>
                </div>
                {i < 2 && <div className={`w-12 h-0.5 mx-2 ${isCompleted ? 'bg-green-500' : 'bg-gray-300'}`}></div>}
              </React.Fragment>
            );
          })}
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
            {error}
          </div>
        )}

        {/* Step 1: Select Date */}
        {step === 'date' && (
          <div>
            <div className="flex items-center mb-4">
              <Calendar className="w-5 h-5 text-[#635BFF] mr-2" />
              <h4 className="font-semibold text-gray-800">Select a Date</h4>
            </div>
            <div className="grid grid-cols-4 gap-2">
              {availableDates.map(date => {
                const d = new Date(date);
                return (
                  <button
                    key={date}
                    onClick={() => {
                      setSelectedDate(date);
                      setStep('time');
                    }}
                    className={`p-3 rounded-lg border-2 transition-colors ${
                      selectedDate === date
                        ? 'border-[#635BFF] bg-purple-50 text-[#635BFF]'
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
        )}

        {/* Step 2: Select Time */}
        {step === 'time' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center">
                <Clock className="w-5 h-5 text-[#635BFF] mr-2" />
                <h4 className="font-semibold text-gray-800">Select Time</h4>
              </div>
              <button
                onClick={() => setStep('date')}
                className="text-sm text-gray-600 hover:text-gray-800"
              >
                Change Date
              </button>
            </div>
            <p className="text-sm text-gray-600 mb-4">
              {new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>

            {loading ? (
              <div className="flex justify-center py-8">
                <Loader className="w-8 h-8 text-[#635BFF] animate-spin" />
              </div>
            ) : availableSlots.length > 0 ? (
              <div className="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto">
                {availableSlots.map(time => (
                  <button
                    key={time}
                    onClick={() => setSelectedTime(time)}
                    className={`p-3 rounded-lg border-2 transition-colors ${
                      selectedTime === time
                        ? 'border-[#635BFF] bg-purple-50 text-[#635BFF] font-bold'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    {time}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-center text-gray-500 py-8">No available slots for this date</p>
            )}

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setStep('date')}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-full hover:bg-gray-50 transition-colors"
              >
                Back
              </button>
              <button
                onClick={() => setStep('payment')}
                disabled={!selectedTime}
                className="flex-1 px-6 py-3 bg-[#635BFF] hover:bg-[#7d4875] text-white rounded-full font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ fontFamily: 'Jura, Arial, Helvetica, sans-serif' }}
              >
                Continue
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Payment Amount */}
        {step === 'payment' && (
          <div>
            <div className="flex items-center mb-4">
              <DollarSign className="w-5 h-5 text-[#635BFF] mr-2" />
              <h4 className="font-semibold text-gray-800">Select Payment Tier</h4>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg mb-6">
              <p className="text-sm text-gray-600 mb-2">Session Details:</p>
              <p className="font-medium">{new Date(selectedDate).toLocaleDateString()} at {selectedTime}</p>
              <p className="text-sm text-gray-500">Duration: 50 minutes</p>
            </div>

            <div className="space-y-3">
              {[
                { value: 10, label: 'Symbolic', range: '$5-$15', commission: '$0' },
                { value: 30, label: 'Accessible', range: '$20-$40', commission: '$5' },
                { value: 45, label: 'Full Rate', range: '$45', commission: '$10' }
              ].map(tier => (
                <button
                  key={tier.value}
                  onClick={() => setPaymentAmount(tier.value)}
                  className={`w-full p-4 rounded-lg border-2 transition-colors text-left ${
                    paymentAmount === tier.value
                      ? 'border-[#635BFF] bg-purple-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <div className="font-bold text-gray-800">{tier.label}</div>
                      <div className="text-sm text-gray-500">{tier.range}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-[#635BFF]">${tier.value}</div>
                      <div className="text-xs text-gray-500">Platform: {tier.commission}</div>
                    </div>
                  </div>
                </button>
              ))}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setStep('time')}
                className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-full hover:bg-gray-50 transition-colors"
              >
                Back
              </button>
              <button
                onClick={handleBookSession}
                disabled={loading}
                className="flex-1 px-6 py-3 bg-[#635BFF] hover:bg-[#7d4875] text-white rounded-full font-bold transition-colors disabled:opacity-50 flex items-center justify-center"
                style={{ fontFamily: 'Jura, Arial, Helvetica, sans-serif' }}
              >
                {loading ? (
                  <>
                    <Loader className="w-5 h-5 mr-2 animate-spin" />
                    Booking...
                  </>
                ) : (
                  `Confirm Booking ($${paymentAmount})`
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
