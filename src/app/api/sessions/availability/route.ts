// Session Availability API - Returns available time slots for PSMs
import { NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'

// Helper function to generate time slots
function generateTimeSlots(date: Date, existingSessions: any[]): string[] {
  const slots: string[] = []
  const workingHours = { start: 9, end: 20 } // 9 AM to 8 PM
  
  // Generate 50-minute session slots with 10-minute breaks
  for (let hour = workingHours.start; hour < workingHours.end; hour++) {
    const slot = `${hour.toString().padStart(2, '0')}:00`
    slots.push(slot)
    
    // Add half-hour slot if there's time
    if (hour < workingHours.end - 1) {
      slots.push(`${hour.toString().padStart(2, '0')}:30`)
    }
  }
  
  // Remove slots that are already booked
  const bookedSlots = existingSessions.map(session => {
    const sessionDate = new Date(session.fechaSesion)
    const hours = sessionDate.getHours().toString().padStart(2, '0')
    const minutes = sessionDate.getMinutes().toString().padStart(2, '0')
    return `${hours}:${minutes}`
  })
  
  return slots.filter(slot => !bookedSlots.includes(slot))
}

// Helper to check if date is in the past
function isPastDate(dateString: string): boolean {
  const date = new Date(dateString)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  return date < today
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const psmId = searchParams.get('psmId')
  const dateParam = searchParams.get('date') // Format: YYYY-MM-DD
  
  try {
    // Validate required parameters
    if (!psmId) {
      return NextResponse.json(
        { error: 'PSM ID is required' },
        { status: 400 }
      )
    }

    if (!dateParam) {
      return NextResponse.json(
        { error: 'Date is required (format: YYYY-MM-DD)' },
        { status: 400 }
      )
    }

    // Check if date is in the past
    if (isPastDate(dateParam)) {
      return NextResponse.json({
        psmId,
        date: dateParam,
        availableSlots: [],
        message: 'Cannot book sessions in the past'
      })
    }

    // Verify PSM exists and is available
    const psm = await prisma.pSM.findUnique({
      where: { id: psmId },
      select: {
        id: true,
        nombre: true,
        apellido: true,
        activo: true,
        disponible: true,
        certificado: true
      }
    })

    if (!psm) {
      return NextResponse.json(
        { error: 'PSM not found' },
        { status: 404 }
      )
    }

    if (!psm.activo || !psm.disponible || !psm.certificado) {
      return NextResponse.json({
        psmId,
        date: dateParam,
        availableSlots: [],
        message: 'This PSM is currently unavailable for bookings',
        psmStatus: {
          activo: psm.activo,
          disponible: psm.disponible,
          certificado: psm.certificado
        }
      })
    }

    // Parse the date
    const targetDate = new Date(dateParam)
    const startOfDay = new Date(targetDate)
    startOfDay.setHours(0, 0, 0, 0)
    
    const endOfDay = new Date(targetDate)
    endOfDay.setHours(23, 59, 59, 999)

    // Get existing sessions for this PSM on the specified date
    const existingSessions = await prisma.sesion.findMany({
      where: {
        psmId,
        fechaSesion: {
          gte: startOfDay,
          lte: endOfDay
        },
        estado: {
          notIn: ['cancelada'] // Don't block cancelled sessions
        }
      },
      select: {
        id: true,
        fechaSesion: true,
        estado: true,
        duracionMinutos: true
      },
      orderBy: {
        fechaSesion: 'asc'
      }
    })

    // Generate available slots
    const availableSlots = generateTimeSlots(targetDate, existingSessions)

    // Calculate next available date if no slots available
    let nextAvailableDate = null
    if (availableSlots.length === 0) {
      const tomorrow = new Date(targetDate)
      tomorrow.setDate(tomorrow.getDate() + 1)
      nextAvailableDate = tomorrow.toISOString().split('T')[0]
    }

    return NextResponse.json({
      psmId,
      psmName: `${psm.nombre} ${psm.apellido}`,
      date: dateParam,
      availableSlots,
      bookedSessions: existingSessions.length,
      nextAvailableDate,
      workingHours: {
        start: '09:00',
        end: '20:00'
      },
      sessionDuration: 50, // minutes
      message: availableSlots.length > 0 
        ? `${availableSlots.length} slots available` 
        : 'No slots available for this date'
    })
  } catch (error) {
    console.error('Availability fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch availability' },
      { status: 500 }
    )
  }
}

// POST endpoint to check multiple dates at once
export async function POST(request: Request) {
  try {
    const { psmId, dates } = await request.json()

    if (!psmId || !dates || !Array.isArray(dates)) {
      return NextResponse.json(
        { error: 'PSM ID and dates array are required' },
        { status: 400 }
      )
    }

    if (dates.length > 14) {
      return NextResponse.json(
        { error: 'Maximum 14 dates can be checked at once' },
        { status: 400 }
      )
    }

    // Verify PSM exists
    const psm = await prisma.pSM.findUnique({
      where: { id: psmId },
      select: {
        id: true,
        nombre: true,
        apellido: true,
        activo: true,
        disponible: true,
        certificado: true
      }
    })

    if (!psm) {
      return NextResponse.json(
        { error: 'PSM not found' },
        { status: 404 }
      )
    }

    // Check availability for each date
    const availabilityMap: Record<string, any> = {}

    for (const dateParam of dates) {
      if (isPastDate(dateParam)) {
        availabilityMap[dateParam] = {
          availableSlots: [],
          hasAvailability: false
        }
        continue
      }

      const targetDate = new Date(dateParam)
      const startOfDay = new Date(targetDate)
      startOfDay.setHours(0, 0, 0, 0)
      
      const endOfDay = new Date(targetDate)
      endOfDay.setHours(23, 59, 59, 999)

      const existingSessions = await prisma.sesion.findMany({
        where: {
          psmId,
          fechaSesion: {
            gte: startOfDay,
            lte: endOfDay
          },
          estado: {
            notIn: ['cancelada']
          }
        },
        select: {
          fechaSesion: true
        }
      })

      const slots = generateTimeSlots(targetDate, existingSessions)
      availabilityMap[dateParam] = {
        availableSlots: slots,
        hasAvailability: slots.length > 0,
        slotsCount: slots.length
      }
    }

    return NextResponse.json({
      psmId,
      psmName: `${psm.nombre} ${psm.apellido}`,
      availability: availabilityMap,
      psmStatus: {
        activo: psm.activo,
        disponible: psm.disponible,
        certificado: psm.certificado
      }
    })
  } catch (error) {
    console.error('Bulk availability check error:', error)
    return NextResponse.json(
      { error: 'Failed to check availability' },
      { status: 500 }
    )
  }
}
