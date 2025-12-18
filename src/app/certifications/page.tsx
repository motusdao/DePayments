'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { usePrivy } from '@privy-io/react-auth'
import FileUploader from '@/app/components/FileUploader'
import { CheckCircle, AlertCircle, Clock, Upload, CreditCard, FileText } from 'lucide-react'

type CertificationStep = 'upload' | 'payment' | 'pending' | 'approved' | 'rejected'

interface Certification {
  id: string
  estado: 'pendiente' | 'aprobada' | 'rechazada'
  pagado: boolean
  tipoCertificacion: string
  documentoUrl: string
  createdDate: string
  fechaPago?: string
}

export default function CertificationsPage() {
  const router = useRouter()
  const { authenticated, user } = usePrivy()
  
  const [step, setStep] = useState<CertificationStep>('upload')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [uploadedFile, setUploadedFile] = useState<string | null>(null)
  const [certification, setCertification] = useState<Certification | null>(null)
  const [psmId, setPsmId] = useState<string>('')
  const [processingPayment, setProcessingPayment] = useState(false)

  // Fetch PSM data and certification status
  useEffect(() => {
    if (!authenticated) {
      router.push('/psms-register')
      return
    }

    const fetchPsmData = async () => {
      try {
        setLoading(true)
        
        // Get PSM by wallet address
        const psmRes = await fetch(`/api/psms?walletAddress=${user?.wallet?.address}`)
        if (!psmRes.ok) throw new Error('PSM not found')
        
        const psms = await psmRes.json()
        const psm = psms[0]
        
        if (!psm) {
          setError('PSM profile not found. Please register first.')
          setTimeout(() => router.push('/psms-register'), 2000)
          return
        }
        
        setPsmId(psm.id)

        // Check if already certified
        if (psm.certificado && psm.activo) {
          setStep('approved')
          setLoading(false)
          return
        }

        // Check for existing certification
        const certRes = await fetch(`/api/certifications?psmId=${psm.id}`)
        if (certRes.ok) {
          const certs = await certRes.json()
          if (certs.length > 0) {
            const cert = certs[0]
            setCertification(cert)
            
            // Determine step based on certification state
            if (cert.estado === 'aprobada' && cert.pagado) {
              setStep('approved')
            } else if (cert.estado === 'rechazada') {
              setStep('rejected')
            } else if (cert.estado === 'aprobada' && !cert.pagado) {
              setStep('payment')
            } else if (cert.estado === 'pendiente' && cert.pagado) {
              setStep('pending')
            } else if (cert.estado === 'pendiente' && !cert.pagado) {
              setStep('payment')
            }
          }
        }
        
        setLoading(false)
      } catch (err: any) {
        setError(err.message)
        setLoading(false)
      }
    }

    fetchPsmData()
  }, [authenticated, user, router])

  const handleFileUpload = async (fileData: string) => {
    try {
      setUploadedFile(fileData)
      setError('')
      
      // Create certification record
      const response = await fetch('/api/certifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          psmId,
          tipoCertificacion: 'Licencia Profesional',
          documentoUrl: fileData,
          montoActivacion: 65
        })
      })

      if (!response.ok) throw new Error('Failed to upload certification')

      const data = await response.json()
      setCertification(data)
      setStep('payment')
    } catch (err: any) {
      setError(err.message || 'Upload failed')
    }
  }

  const handlePayment = async () => {
    if (!certification) return
    
    setProcessingPayment(true)
    setError('')

    try {
      // In production, integrate with Transak here
      // For now, simulate payment processing
      const response = await fetch('/api/certifications', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          certificationId: certification.id,
          paymentMethod: 'transak',
          paymentReference: `TXN-${Date.now()}`,
          amount: 65
        })
      })

      if (!response.ok) throw new Error('Payment failed')

      const data = await response.json()
      setCertification(data)
      setStep('pending')
    } catch (err: any) {
      setError(err.message || 'Payment processing failed')
    } finally {
      setProcessingPayment(false)
    }
  }

  const handleTransakPayment = () => {
    // TODO: Integrate with DepositModal or Transak SDK
    // For MVP, use simplified payment flow
    handlePayment()
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#635BFF]"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Certificación Profesional
          </h1>
          <p className="text-gray-600">
            Completa tu certificación para comenzar a recibir pacientes
          </p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-12">
          <div className="flex items-center space-x-4">
            {/* Upload Step */}
            <div className="flex flex-col items-center">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                ['upload', 'payment', 'pending', 'approved'].includes(step)
                  ? 'bg-[#635BFF] text-white'
                  : 'bg-gray-200 text-gray-400'
              }`}>
                <Upload size={20} />
              </div>
              <span className="text-xs mt-2 text-gray-600">Documentos</span>
            </div>

            <div className={`w-16 h-1 ${
              ['payment', 'pending', 'approved'].includes(step)
                ? 'bg-[#635BFF]'
                : 'bg-gray-200'
            }`} />

            {/* Payment Step */}
            <div className="flex flex-col items-center">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                ['payment', 'pending', 'approved'].includes(step)
                  ? 'bg-[#635BFF] text-white'
                  : 'bg-gray-200 text-gray-400'
              }`}>
                <CreditCard size={20} />
              </div>
              <span className="text-xs mt-2 text-gray-600">Pago</span>
            </div>

            <div className={`w-16 h-1 ${
              ['pending', 'approved'].includes(step)
                ? 'bg-[#635BFF]'
                : 'bg-gray-200'
            }`} />

            {/* Approval Step */}
            <div className="flex flex-col items-center">
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                ['pending', 'approved'].includes(step)
                  ? 'bg-[#635BFF] text-white'
                  : 'bg-gray-200 text-gray-400'
              }`}>
                <CheckCircle size={20} />
              </div>
              <span className="text-xs mt-2 text-gray-600">Aprobación</span>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-start space-x-3">
            <AlertCircle className="text-red-500 mt-0.5" size={20} />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Content Area */}
        <div className="bg-white rounded-2xl shadow-sm p-8">
          {/* UPLOAD STEP */}
          {step === 'upload' && (
            <div>
              <div className="mb-6">
                <h2 className="text-xl font-bold mb-2">Sube tus Documentos</h2>
                <p className="text-gray-600 text-sm">
                  Sube tu cédula profesional o certificado de estudios. Formatos aceptados: PDF, JPG, PNG.
                </p>
              </div>

              <FileUploader
                onUploadComplete={handleFileUpload}
                acceptedFileTypes={['application/pdf', 'image/jpeg', 'image/png']}
                maxSizeMB={5}
              />

              <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="font-semibold text-blue-900 mb-2">📋 Requisitos</h3>
                <ul className="text-sm text-blue-800 space-y-1">
                  <li>✓ Cédula profesional vigente</li>
                  <li>✓ Documento legible y completo</li>
                  <li>✓ Tamaño máximo: 5MB</li>
                </ul>
              </div>
            </div>
          )}

          {/* PAYMENT STEP */}
          {step === 'payment' && (
            <div>
              <div className="text-center mb-8">
                <CheckCircle className="mx-auto text-green-500 mb-4" size={48} />
                <h2 className="text-2xl font-bold mb-2">Documentos Recibidos</h2>
                <p className="text-gray-600">
                  Tu documentación ha sido cargada exitosamente
                </p>
              </div>

              <div className="bg-gray-50 rounded-lg p-6 mb-6">
                <h3 className="font-bold text-lg mb-4">Cuota de Activación</h3>
                <div className="flex justify-between items-center mb-6">
                  <span className="text-gray-700">Certificación profesional</span>
                  <span className="text-3xl font-bold text-[#635BFF]">$65 USD</span>
                </div>
                
                <div className="border-t pt-4 mb-4">
                  <p className="text-sm text-gray-600 mb-2">
                    <strong>¿Qué incluye?</strong>
                  </p>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>✓ Verificación de documentos profesionales</li>
                    <li>✓ Activación de perfil en plataforma</li>
                    <li>✓ Acceso a pacientes y sistema de sesiones</li>
                    <li>✓ 50 puntos de recompensa de bienvenida</li>
                  </ul>
                </div>
              </div>

              <button
                onClick={handleTransakPayment}
                disabled={processingPayment}
                className="w-full bg-[#635BFF] text-white rounded-full py-4 font-bold hover:bg-[#5347e8] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {processingPayment ? 'Procesando...' : 'Pagar $65 USD'}
              </button>

              <p className="text-center text-xs text-gray-500 mt-4">
                Pago seguro procesado por Transak
              </p>
            </div>
          )}

          {/* PENDING STEP */}
          {step === 'pending' && (
            <div className="text-center py-8">
              <Clock className="mx-auto text-yellow-500 mb-4" size={64} />
              <h2 className="text-2xl font-bold mb-2">En Revisión</h2>
              <p className="text-gray-600 mb-6">
                Tu pago ha sido confirmado. Estamos revisando tu documentación.
              </p>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                <p className="text-sm text-yellow-800">
                  <strong>Tiempo estimado:</strong> 24-48 horas
                </p>
              </div>

              <div className="text-left bg-gray-50 rounded-lg p-6">
                <h3 className="font-bold mb-3">Estado de tu solicitud:</h3>
                <div className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="text-green-500" size={20} />
                    <span className="text-sm">Documentos recibidos</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="text-green-500" size={20} />
                    <span className="text-sm">Pago confirmado ($65 USD)</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Clock className="text-yellow-500" size={20} />
                    <span className="text-sm">Revisión de credenciales en proceso</span>
                  </div>
                </div>
              </div>

              <p className="text-sm text-gray-500 mt-6">
                Te notificaremos por email cuando tu certificación sea aprobada
              </p>
            </div>
          )}

          {/* APPROVED STEP */}
          {step === 'approved' && (
            <div className="text-center py-8">
              <CheckCircle className="mx-auto text-green-500 mb-4" size={64} />
              <h2 className="text-2xl font-bold mb-2">¡Certificación Aprobada!</h2>
              <p className="text-gray-600 mb-6">
                Felicidades, tu perfil ha sido activado
              </p>

              <div className="bg-green-50 border border-green-200 rounded-lg p-6 mb-6">
                <h3 className="font-bold text-green-900 mb-3">Ya puedes:</h3>
                <ul className="text-sm text-green-800 space-y-2 text-left">
                  <li>✓ Recibir pacientes asignados</li>
                  <li>✓ Programar sesiones</li>
                  <li>✓ Recibir pagos por terapias</li>
                  <li>✓ Construir tu reputación en la plataforma</li>
                </ul>
              </div>

              <button
                onClick={() => router.push('/sessions')}
                className="w-full bg-[#635BFF] text-white rounded-full py-4 font-bold hover:bg-[#5347e8] transition-colors"
              >
                Ver Mis Sesiones
              </button>
            </div>
          )}

          {/* REJECTED STEP */}
          {step === 'rejected' && (
            <div className="text-center py-8">
              <AlertCircle className="mx-auto text-red-500 mb-4" size={64} />
              <h2 className="text-2xl font-bold mb-2">Certificación Rechazada</h2>
              <p className="text-gray-600 mb-6">
                No pudimos verificar tu documentación
              </p>

              <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-left">
                <h3 className="font-bold text-red-900 mb-2">Motivos posibles:</h3>
                <ul className="text-sm text-red-800 space-y-1">
                  <li>• Documento ilegible o incompleto</li>
                  <li>• Cédula no vigente o no válida</li>
                  <li>• Información no coincide con registro</li>
                </ul>
              </div>

              <button
                onClick={() => {
                  setStep('upload')
                  setUploadedFile(null)
                  setCertification(null)
                  setError('')
                }}
                className="w-full bg-[#635BFF] text-white rounded-full py-4 font-bold hover:bg-[#5347e8] transition-colors"
              >
                Intentar Nuevamente
              </button>

              <p className="text-sm text-gray-500 mt-4">
                O contacta a soporte para más información
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
