// Session Management API
import { NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const usuarioId = searchParams.get('usuarioId')
  const psmId = searchParams.get('psmId')
  const estado = searchParams.get('estado')
  
  try {
    const whereClause: any = {}
    
    if (usuarioId) whereClause.usuarioId = usuarioId
    if (psmId) whereClause.psmId = psmId
    if (estado) whereClause.estado = estado
    
    const sesiones = await prisma.sesion.findMany({
      where: whereClause,
      orderBy: { fechaSesion: 'desc' },
      include: {
        usuario: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            email: true
          }
        },
        psm: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            especialidades: true
          }
        },
        evaluacion: true
      }
    })
    
    return NextResponse.json(sesiones)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch sessions' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const {
      usuarioId,
      psmId,
      fechaSesion,
      tipoSesion = 'individual',
      duracionMinutos = 50,
      montoCobrado,
      metodoPago
    } = await request.json()

    // Validate required fields
    if (!usuarioId || !psmId || !fechaSesion) {
      return NextResponse.json(
        { error: 'Missing required fields: usuarioId, psmId, fechaSesion' },
        { status: 400 }
      )
    }

    // Calculate platform commission based on payment amount
    let comisionPlataforma = 0
    if (montoCobrado) {
      if (montoCobrado <= 15) {
        comisionPlataforma = 0 // No commission for symbolic payments
      } else if (montoCobrado <= 40) {
        comisionPlataforma = 5 // Fixed $5 for medium payments
      } else {
        comisionPlataforma = 10 // $10 for full payments
      }
    }

    const nuevaSesion = await prisma.sesion.create({
      data: {
        usuarioId,
        psmId,
        fechaSesion: new Date(fechaSesion),
        tipoSesion,
        duracionMinutos: parseInt(duracionMinutos),
        montoCobrado: montoCobrado ? parseFloat(montoCobrado) : null,
        comisionPlataforma,
        metodoPago,
        estado: 'programada'
      },
      include: {
        usuario: {
          select: {
            nombre: true,
            apellido: true,
            email: true
          }
        },
        psm: {
          select: {
            nombre: true,
            apellido: true,
            especialidades: true
          }
        }
      }
    })

    return NextResponse.json({
      ...nuevaSesion,
      message: 'Session scheduled successfully'
    })
  } catch (error) {
    console.error('Session creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create session' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request) {
  try {
    const { 
      sessionId, 
      estado, 
      notasSesion,
      montoCobrado,
      metodoPago 
    } = await request.json()

    if (!sessionId) {
      return NextResponse.json(
        { error: 'Session ID is required' },
        { status: 400 }
      )
    }

    const updateData: any = { updatedDate: new Date() }
    
    if (estado) updateData.estado = estado
    if (notasSesion) updateData.notasSesion = notasSesion
    if (montoCobrado) {
      updateData.montoCobrado = parseFloat(montoCobrado)
      // Recalculate commission
      if (montoCobrado <= 15) {
        updateData.comisionPlataforma = 0
      } else if (montoCobrado <= 40) {
        updateData.comisionPlataforma = 5
      } else {
        updateData.comisionPlataforma = 10
      }
    }
    if (metodoPago) updateData.metodoPago = metodoPago

    const updatedSession = await prisma.sesion.update({
      where: { id: sessionId },
      data: updateData,
      include: {
        usuario: {
          select: {
            nombre: true,
            apellido: true
          }
        },
        psm: {
          select: {
            nombre: true,
            apellido: true
          }
        }
      }
    })

    // If session is completed, update counters and create rewards
    if (estado === 'completada') {
      // Update PSM session counter and total earnings
      await prisma.pSM.update({
        where: { id: updatedSession.psmId },
        data: {
          totalSesiones: { increment: 1 },
          totalIngresos: { 
            increment: montoCobrado ? (parseFloat(montoCobrado) - (updateData.comisionPlataforma || 0)) : 0 
          }
        }
      })

      // Update User session counter
      await prisma.usuario.update({
        where: { id: updatedSession.usuarioId },
        data: {
          sesionesCompletadas: { increment: 1 }
        }
      })

      // Create rewards for PSM
      await prisma.recompensa.create({
        data: {
          receptorId: updatedSession.psmId,
          tipoReceptor: 'psm',
          tipoRecompensa: 'sesion',
          puntos: 10, // Base points for completing a session
          descripcion: `Session completed with ${updatedSession.usuario.nombre} ${updatedSession.usuario.apellido}`,
          relacionadoId: sessionId
        }
      })

      // Create rewards for User
      await prisma.recompensa.create({
        data: {
          receptorId: updatedSession.usuarioId,
          tipoReceptor: 'usuario',
          tipoRecompensa: 'sesion',
          puntos: 5, // Points for attending session
          descripcion: `Session attended with ${updatedSession.psm.nombre} ${updatedSession.psm.apellido}`,
          relacionadoId: sessionId
        }
      })
    }

    return NextResponse.json({
      ...updatedSession,
      message: `Session ${estado === 'completada' ? 'completed' : 'updated'} successfully`
    })
  } catch (error) {
    console.error('Session update error:', error)
    return NextResponse.json(
      { error: 'Failed to update session' },
      { status: 500 }
    )
  }
}
