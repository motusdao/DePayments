'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { usePrivy } from '@privy-io/react-auth'
import EvaluationModal from '@/app/components/EvaluationModal'
import SessionBookingModal from '@/app/components/SessionBookingModal'
import { Calendar, Clock, User, DollarSign, Star, Video, XCircle, CheckCircle, Plus } from 'lucide-react'

type TabType = 'upcoming' | 'past' | 'all'
type SessionStatus = 'programada' | 'completada' | 'cancelada'

interface Session {
  id: string
  fechaSesion: string
  tipoSesion: string
  duracionMinutos: number
  montoCobrado: number | null
  comisionPlataforma: number
  estado: SessionStatus
  notasSesion: string | null
  usuario: {
    id: string
    nombre: string
    apellido: string
    email: string
  }
  psm: {
    id: string
    nombre: string
    apellido: string
    especialidades: string[]
  }
  evaluacion: any | null
}

interface UserProfile {
  id: string
  nombre: string
  apellido: string
  currentPsmId: string | null
  currentPsm?: {
    id: string
    nombre: string
    apellido: string
  }
}

interface PsmProfile {
  id: string
  nombre: string
  apellido: string
}

export default function SessionsPage() {
  const router = useRouter()
  const { authenticated, user } = usePrivy()
  
  const [activeTab, setActiveTab] = useState<TabType>('upcoming')
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null)
  const [psmProfile, setPsmProfile] = useState<PsmProfile | null>(null)
  const [isPsm, setIsPsm] = useState(false)
  
  // Modal states
  const [evaluationModal, setEvaluationModal] = useState<{ show: boolean; session: Session | null }>({
    show: false,
    session: null
  })
  const [bookingModal, setBookingModal] = useState(false)

  // Fetch user/PSM profile and sessions
  useEffect(() => {
    if (!authenticated) {
      router.push('/')
      return
    }

    const fetchData = async () => {
      try {
        setLoading(true)
        const walletAddress = user?.wallet?.address

        // Try to fetch as PSM first
        const psmRes = await fetch(`/api/psms?walletAddress=${walletAddress}`)
        if (psmRes.ok) {
          const psms = await psmRes.json()
          if (psms.length > 0) {
            const psm = psms[0]
            setPsmProfile(psm)
            setIsPsm(true)
            
            // Fetch PSM's sessions
            const sessionsRes = await fetch(`/api/sessions?psmId=${psm.id}`)
            if (sessionsRes.ok) {
              const data = await sessionsRes.json()
              setSessions(data)
            }
            
            setLoading(false)
            return
          }
        }

        // If not PSM, fetch as User
        const userRes = await fetch(`/api/users?walletAddress=${walletAddress}`)
        if (userRes.ok) {
          const users = await userRes.json()
          if (users.length > 0) {
            const userProf = users[0]
            setUserProfile(userProf)
            
            // Fetch User's sessions
            const sessionsRes = await fetch(`/api/sessions?usuarioId=${userProf.id}`)
            if (sessionsRes.ok) {
              const data = await sessionsRes.json()
              setSessions(data)
            }
            
            setLoading(false)
            return
          }
        }

        setError('Profile not found')
        setLoading(false)
      } catch (err: any) {
        setError(err.message || 'Failed to load data')
        setLoading(false)
      }
    }

    fetchData()
  }, [authenticated, user, router])

  const handleCancelSession = async (sessionId: string) => {
    if (!confirm('Are you sure you want to cancel this session?')) return

    try {
      const response = await fetch('/api/sessions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          estado: 'cancelada'
        })
      })

      if (!response.ok) throw new Error('Failed to cancel session')

      // Update local state
      setSessions(prev => 
        prev.map(s => s.id === sessionId ? { ...s, estado: 'cancelada' as SessionStatus } : s)
      )
    } catch (err: any) {
      alert(err.message || 'Failed to cancel session')
    }
  }

  const handleMarkComplete = async (sessionId: string, montoCobrado: number) => {
    try {
      const response = await fetch('/api/sessions', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId,
          estado: 'completada',
          montoCobrado
        })
      })

      if (!response.ok) throw new Error('Failed to complete session')

      const data = await response.json()
      
      // Update local state
      setSessions(prev => 
        prev.map(s => s.id === sessionId ? { ...s, estado: 'completada' as SessionStatus, montoCobrado } : s)
      )

      alert('Session marked as complete! Rewards have been distributed.')
    } catch (err: any) {
      alert(err.message || 'Failed to complete session')
    }
  }

  const openEvaluationModal = (session: Session) => {
    setEvaluationModal({ show: true, session })
  }

  const handleEvaluationSuccess = () => {
    setEvaluationModal({ show: false, session: null })
    // Refresh sessions to update evaluation status
    window.location.reload()
  }

  // Filter sessions based on active tab
  const filteredSessions = sessions.filter(session => {
    const sessionDate = new Date(session.fechaSesion)
    const now = new Date()

    if (activeTab === 'upcoming') {
      return session.estado === 'programada' && sessionDate >= now
    } else if (activeTab === 'past') {
      return session.estado === 'completada' || session.estado === 'cancelada' || sessionDate < now
    }
    return true // 'all' tab
  }).sort((a, b) => {
    // Sort upcoming sessions ascending, past sessions descending
    if (activeTab === 'upcoming') {
      return new Date(a.fechaSesion).getTime() - new Date(b.fechaSesion).getTime()
    }
    return new Date(b.fechaSesion).getTime() - new Date(a.fechaSesion).getTime()
  })

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('es-MX', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }

  const formatTime = (dateString: string) => {
    const date = new Date(dateString)
    return date.toLocaleTimeString('es-MX', { 
      hour: '2-digit', 
      minute: '2-digit' 
    })
  }

  const getStatusBadge = (estado: SessionStatus) => {
    const badges = {
      programada: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Programada', icon: Clock },
      completada: { bg: 'bg-green-100', text: 'text-green-800', label: 'Completada', icon: CheckCircle },
      cancelada: { bg: 'bg-red-100', text: 'text-red-800', label: 'Cancelada', icon: XCircle }
    }
    const badge = badges[estado]
    const Icon = badge.icon

    return (
      <span className={`inline-flex items-center space-x-1 px-3 py-1 rounded-full text-xs font-medium ${badge.bg} ${badge.text}`}>
        <Icon size={14} />
        <span>{badge.label}</span>
      </span>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#635BFF]"></div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Mis Sesiones</h1>
            <p className="text-gray-600 mt-1">
              {isPsm 
                ? `Bienvenido, ${psmProfile?.nombre} ${psmProfile?.apellido}` 
                : `Bienvenido, ${userProfile?.nombre} ${userProfile?.apellido}`}
            </p>
          </div>

          {!isPsm && userProfile?.currentPsmId && (
            <button
              onClick={() => setBookingModal(true)}
              className="flex items-center space-x-2 bg-[#635BFF] text-white px-6 py-3 rounded-full font-bold hover:bg-[#5347e8] transition-colors"
            >
              <Plus size={20} />
              <span>Nueva Sesión</span>
            </button>
          )}
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {/* Tabs */}
        <div className="flex space-x-2 mb-6 border-b border-gray-200">
          {(['upcoming', 'past', 'all'] as TabType[]).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === tab
                  ? 'border-b-2 border-[#635BFF] text-[#635BFF]'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab === 'upcoming' ? 'Próximas' : tab === 'past' ? 'Pasadas' : 'Todas'}
              <span className="ml-2 text-sm">
                ({sessions.filter(s => {
                  const sessionDate = new Date(s.fechaSesion)
                  const now = new Date()
                  if (tab === 'upcoming') return s.estado === 'programada' && sessionDate >= now
                  if (tab === 'past') return s.estado === 'completada' || s.estado === 'cancelada' || sessionDate < now
                  return true
                }).length})
              </span>
            </button>
          ))}
        </div>

        {/* Sessions List */}
        {filteredSessions.length === 0 ? (
          <div className="text-center py-16">
            <Calendar className="mx-auto text-gray-300 mb-4" size={64} />
            <h3 className="text-xl font-semibold text-gray-600 mb-2">
              No hay sesiones {activeTab === 'upcoming' ? 'próximas' : activeTab === 'past' ? 'pasadas' : ''}
            </h3>
            <p className="text-gray-500">
              {!isPsm && activeTab === 'upcoming' && userProfile?.currentPsmId && (
                <button
                  onClick={() => setBookingModal(true)}
                  className="mt-4 text-[#635BFF] hover:underline font-medium"
                >
                  Agenda tu primera sesión
                </button>
              )}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredSessions.map(session => (
              <div key={session.id} className="bg-white rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start mb-4">
                  <div className="flex-1">
                    {/* Date & Time */}
                    <div className="flex items-center space-x-4 mb-3">
                      <div className="flex items-center space-x-2 text-gray-700">
                        <Calendar size={18} />
                        <span className="font-medium">{formatDate(session.fechaSesion)}</span>
                      </div>
                      <div className="flex items-center space-x-2 text-gray-600">
                        <Clock size={18} />
                        <span>{formatTime(session.fechaSesion)}</span>
                        <span className="text-gray-400">•</span>
                        <span>{session.duracionMinutos} min</span>
                      </div>
                    </div>

                    {/* Participant Info */}
                    <div className="flex items-center space-x-2 text-gray-700 mb-2">
                      <User size={18} />
                      <span>
                        {isPsm 
                          ? `Paciente: ${session.usuario.nombre} ${session.usuario.apellido}`
                          : `Terapeuta: ${session.psm.nombre} ${session.psm.apellido}`}
                      </span>
                    </div>

                    {/* Session Type & Payment */}
                    <div className="flex items-center space-x-4 text-sm text-gray-600">
                      <span className="capitalize">{session.tipoSesion}</span>
                      {session.montoCobrado !== null && (
                        <>
                          <span className="text-gray-400">•</span>
                          <div className="flex items-center space-x-1">
                            <DollarSign size={14} />
                            <span>${session.montoCobrado} USD</span>
                          </div>
                        </>
                      )}
                      {session.montoCobrado === null && session.tipoSesion === 'framing' && (
                        <>
                          <span className="text-gray-400">•</span>
                          <span className="text-green-600 font-medium">GRATIS</span>
                        </>
                      )}
                    </div>

                    {/* Specializations (for users viewing PSM) */}
                    {!isPsm && session.psm.especialidades && session.psm.especialidades.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {session.psm.especialidades.slice(0, 3).map((esp, idx) => (
                          <span key={idx} className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
                            {esp}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Status Badge */}
                  <div>
                    {getStatusBadge(session.estado)}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex space-x-3 mt-4 pt-4 border-t border-gray-100">
                  {/* Upcoming Sessions */}
                  {session.estado === 'programada' && new Date(session.fechaSesion) >= new Date() && (
                    <>
                      <button
                        onClick={() => handleCancelSession(session.id)}
                        className="flex-1 px-4 py-2 border border-red-200 text-red-600 rounded-full text-sm font-medium hover:bg-red-50 transition-colors"
                      >
                        Cancelar
                      </button>
                      <button
                        onClick={() => window.open(`https://meet.google.com/new`, '_blank')}
                        className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-[#635BFF] text-white rounded-full text-sm font-medium hover:bg-[#5347e8] transition-colors"
                      >
                        <Video size={16} />
                        <span>Unirse</span>
                      </button>
                    </>
                  )}

                  {/* Completed Sessions (PSM can mark as complete) */}
                  {isPsm && session.estado === 'programada' && new Date(session.fechaSesion) < new Date() && (
                    <button
                      onClick={() => {
                        const amount = prompt('Enter session payment amount (USD):', '30')
                        if (amount && !isNaN(parseFloat(amount))) {
                          handleMarkComplete(session.id, parseFloat(amount))
                        }
                      }}
                      className="flex-1 px-4 py-2 bg-green-500 text-white rounded-full text-sm font-medium hover:bg-green-600 transition-colors"
                    >
                      Marcar como Completada
                    </button>
                  )}

                  {/* Completed Sessions - Rate Button (for users, if not rated) */}
                  {!isPsm && session.estado === 'completada' && !session.evaluacion && (
                    <button
                      onClick={() => openEvaluationModal(session)}
                      className="flex-1 flex items-center justify-center space-x-2 px-4 py-2 bg-[#635BFF] text-white rounded-full text-sm font-medium hover:bg-[#5347e8] transition-colors"
                    >
                      <Star size={16} />
                      <span>Evaluar Sesión</span>
                    </button>
                  )}

                  {/* Already Rated */}
                  {!isPsm && session.estado === 'completada' && session.evaluacion && (
                    <div className="flex-1 text-center text-sm text-gray-500 py-2">
                      <span className="flex items-center justify-center space-x-1">
                        <CheckCircle size={16} className="text-green-500" />
                        <span>Sesión evaluada</span>
                      </span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Evaluation Modal */}
      {evaluationModal.show && evaluationModal.session && (
        <EvaluationModal
          isOpen={evaluationModal.show}
          onClose={() => setEvaluationModal({ show: false, session: null })}
          sessionId={evaluationModal.session.id}
          psmId={evaluationModal.session.psm.id}
          usuarioId={evaluationModal.session.usuario.id}
          onSuccess={handleEvaluationSuccess}
        />
      )}

      {/* Session Booking Modal */}
      {bookingModal && userProfile?.currentPsmId && (
        <SessionBookingModal
          isOpen={bookingModal}
          onClose={() => setBookingModal(false)}
          psmId={userProfile.currentPsmId}
          usuarioId={userProfile.id}
          onSuccess={() => {
            setBookingModal(false)
            window.location.reload() // Refresh to show new session
          }}
        />
      )}
    </div>
  )
}
