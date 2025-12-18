"use client";
import React, { useState } from 'react';
import { Star, CheckCircle, Loader, X } from 'lucide-react';

interface EvaluationModalProps {
  isOpen: boolean;
  onClose: () => void;
  session?: {
    id: string;
    psmId: string;
    psmName: string;
    usuarioId: string;
    fechaSesion: Date;
  };
  sessionId?: string;
  psmId?: string;
  psmName?: string;
  usuarioId?: string;
  onSubmitSuccess?: () => void;
  onSuccess?: () => void;
}

export default function EvaluationModal({
  isOpen,
  onClose,
  session,
  sessionId: propSessionId,
  psmId: propPsmId,
  psmName: propPsmName,
  usuarioId: propUsuarioId,
  onSubmitSuccess,
  onSuccess
}: EvaluationModalProps) {
  // Support both patterns - session object or individual props
  const sessionId = session?.id || propSessionId || '';
  const psmId = session?.psmId || propPsmId || '';
  const psmName = session?.psmName || propPsmName || 'Therapist';
  const usuarioId = session?.usuarioId || propUsuarioId || '';
  const fechaSesion = session?.fechaSesion || new Date();
  const [serviceRating, setServiceRating] = useState(0);
  const [psmRating, setPsmRating] = useState(0);
  const [recommend, setRecommend] = useState<boolean | null>(null);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (serviceRating === 0 || psmRating === 0 || recommend === null) {
      setError('Please complete all required fields');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/evaluations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sesionId: sessionId,
          usuarioId: usuarioId,
          psmId: psmId,
          calificacionServicio: serviceRating,
          calificacionPsm: psmRating,
          recomendaria: recommend,
          comentario: comment || undefined
        })
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Failed to submit evaluation');
      }

      // Show success state
      setShowSuccess(true);
      
      // Wait 2 seconds then call success callback
      setTimeout(() => {
        if (onSubmitSuccess) onSubmitSuccess();
        if (onSuccess) onSuccess();
        handleClose();
      }, 2000);
    } catch (err: any) {
      setError(err.message || 'Failed to submit evaluation');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setServiceRating(0);
      setPsmRating(0);
      setRecommend(null);
      setComment('');
      setShowSuccess(false);
      setError(null);
      onClose();
    }
  };

  if (!isOpen) return null;

  // Success view
  if (showSuccess) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-2xl font-bold mb-2" style={{ fontFamily: 'Jura, Arial, Helvetica, sans-serif', color: '#222' }}>
            Thank You!
          </h3>
          <p className="text-gray-600 mb-4">
            Your feedback helps us improve our services and assists others in finding the right therapist.
          </p>
          <div className="text-sm text-gray-500">
            You earned 3 reward points!
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl p-8 max-w-md w-full relative">
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600"
          disabled={isSubmitting}
        >
          <X className="w-6 h-6" />
        </button>

        <h3 className="text-2xl font-bold mb-2" style={{ fontFamily: 'Jura, Arial, Helvetica, sans-serif', color: '#222' }}>
          Rate Your Session
        </h3>
        <p className="text-gray-600 mb-1">
          Session with {psmName}
        </p>
        <p className="text-sm text-gray-500 mb-6">
          {new Date(fechaSesion).toLocaleDateString('en-US', {
            year: 'numeric', 
            month: 'long', 
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          })}
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-800 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Service Rating */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              How would you rate the overall service? <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2 justify-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setServiceRating(star)}
                  className="focus:outline-none transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-10 h-10 ${
                      star <= serviceRating
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* PSM Rating */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              How would you rate your therapist? <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-2 justify-center">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setPsmRating(star)}
                  className="focus:outline-none transition-transform hover:scale-110"
                >
                  <Star
                    className={`w-10 h-10 ${
                      star <= psmRating
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Recommendation */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Would you recommend this therapist? <span className="text-red-500">*</span>
            </label>
            <div className="flex gap-4 justify-center">
              <button
                type="button"
                onClick={() => setRecommend(true)}
                className={`px-8 py-3 rounded-full font-medium transition-colors ${
                  recommend === true
                    ? 'bg-green-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Yes
              </button>
              <button
                type="button"
                onClick={() => setRecommend(false)}
                className={`px-8 py-3 rounded-full font-medium transition-colors ${
                  recommend === false
                    ? 'bg-red-500 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                No
              </button>
            </div>
          </div>

          {/* Comment */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Additional comments (optional)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="Share your experience to help others..."
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#635BFF] text-gray-700 placeholder-gray-400"
              maxLength={500}
            />
            <div className="text-xs text-gray-500 text-right mt-1">
              {comment.length}/500
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1 px-6 py-3 border border-gray-300 text-gray-700 rounded-full hover:bg-gray-50 transition-colors disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || serviceRating === 0 || psmRating === 0 || recommend === null}
              className="flex-1 px-6 py-3 bg-[#635BFF] hover:bg-[#7d4875] text-white rounded-full font-bold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              style={{ fontFamily: 'Jura, Arial, Helvetica, sans-serif' }}
            >
              {isSubmitting ? (
                <>
                  <Loader className="w-5 h-5 mr-2 animate-spin" />
                  Submitting...
                </>
              ) : (
                'Submit Evaluation'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
