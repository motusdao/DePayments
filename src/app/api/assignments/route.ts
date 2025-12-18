// PSM Assignment API - Smart Matching Algorithm
import { NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const usuarioId = searchParams.get('usuarioId')
  
  try {
    if (!usuarioId) {
      return NextResponse.json(
        { error: 'Usuario ID is required' },
        { status: 400 }
      )
    }

    // Get user profile and preferences
    const usuario = await prisma.usuario.findUnique({
      where: { id: usuarioId },
      select: {
        id: true,
        nombre: true,
        apellido: true,
        tipoAtencion: true,
        problematicaPrincipal: true,
        preferenciaAsignacion: true,
        currentPsmId: true,
        currentPsm: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            especialidades: true,
            biografia: true,
            foto: true
          }
        }
      }
    })

    if (!usuario) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // If user prefers automatic assignment, find best matches
    let recommendedPsms: any[] = []
    
    if (usuario.preferenciaAsignacion === 'automatica') {
      // Build matching criteria
      const matchingCriteria: any = {
        activo: true,
        disponible: true,
        certificado: true
      }

      // Match by specializations if user specified attention type
      if (usuario.tipoAtencion) {
        matchingCriteria.especialidades = {
          has: usuario.tipoAtencion
        }
      }

      recommendedPsms = await prisma.pSM.findMany({
        where: matchingCriteria,
        select: {
          id: true,
          nombre: true,
          apellido: true,
          especialidades: true,
          biografia: true,
          foto: true,
          reputacionPuntos: true,
          totalSesiones: true,
          experienciaAnios: true,
          _count: {
            select: {
              usuarios: true,
              evaluaciones: true
            }
          }
        },
        orderBy: [
          { reputacionPuntos: 'desc' },
          { totalSesiones: 'desc' },
          { experienciaAnios: 'desc' }
        ],
        take: 5
      })
    } else {
      // User prefers to explore - get all available PSMs
      recommendedPsms = await prisma.pSM.findMany({
        where: {
          activo: true,
          disponible: true,
          certificado: true
        },
        select: {
          id: true,
          nombre: true,
          apellido: true,
          especialidades: true,
          biografia: true,
          foto: true,
          reputacionPuntos: true,
          totalSesiones: true,
          experienciaAnios: true,
          _count: {
            select: {
              usuarios: true,
              evaluaciones: true
            }
          }
        },
        orderBy: [
          { reputacionPuntos: 'desc' },
          { totalSesiones: 'desc' }
        ],
        take: 10
      })
    }

    return NextResponse.json({
      usuario: {
        id: usuario.id,
        nombre: usuario.nombre,
        apellido: usuario.apellido,
        preferenciaAsignacion: usuario.preferenciaAsignacion,
        currentPsm: usuario.currentPsm
      },
      recommendedPsms,
      message: usuario.preferenciaAsignacion === 'automatica' 
        ? 'Showing PSMs matched to your therapeutic needs'
        : 'Explore available PSMs and choose who feels right for you'
    })
  } catch (error) {
    console.error('Assignment fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch PSM recommendations' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const {
      usuarioId,
      psmId,
      assignmentType = 'manual' // 'automatic' or 'manual'
    } = await request.json()

    // Validate required fields
    if (!usuarioId || !psmId) {
      return NextResponse.json(
        { error: 'Missing required fields: usuarioId, psmId' },
        { status: 400 }
      )
    }

    // Verify PSM is available
    const psm = await prisma.pSM.findUnique({
      where: { id: psmId },
      select: {
        id: true,
        nombre: true,
        apellido: true,
        especialidades: true,
        activo: true,
        disponible: true,
        certificado: true,
        _count: {
          select: {
            usuarios: true
          }
        }
      }
    })

    if (!psm) {
      return NextResponse.json(
        { error: 'PSM not found' },
        { status: 404 }
      )
    }

    if (!psm.activo || !psm.disponible || !psm.certificado) {
      return NextResponse.json(
        { error: 'PSM is not available for new patients' },
        { status: 400 }
      )
    }

    // Use transaction to ensure all operations succeed or fail together
    const result = await prisma.$transaction(async (tx) => {
      // Update user assignment
      const updatedUsuario = await tx.usuario.update({
        where: { id: usuarioId },
        data: {
          currentPsmId: psmId,
          estatusProceso: 'encuadre', // Move to framing stage
          updatedDate: new Date()
        },
        include: {
          currentPsm: {
            select: {
              id: true,
              nombre: true,
              apellido: true,
              especialidades: true,
              biografia: true,
              foto: true,
              email: true,
              telefono: true
            }
          }
        }
      })

      // Create initial framing session
      const framingSession = await tx.sesion.create({
        data: {
          usuarioId,
          psmId,
          fechaSesion: new Date(Date.now() + 24 * 60 * 60 * 1000), // Next day
          tipoSesion: 'encuadre',
          duracionMinutos: 50,
          estado: 'programada'
        }
      })

      // Create assignment reward for PSM
      await tx.recompensa.create({
        data: {
          receptorId: psmId,
          tipoReceptor: 'psm',
          tipoRecompensa: 'asignacion',
          puntos: 5,
          descripcion: `New patient assigned: ${updatedUsuario.nombre} ${updatedUsuario.apellido}`,
          relacionadoId: usuarioId
        }
      })

      return { updatedUsuario, framingSession }
    })

    return NextResponse.json({
      success: true,
      assignment: {
        usuario: {
          id: result.updatedUsuario.id,
          nombre: result.updatedUsuario.nombre,
          apellido: result.updatedUsuario.apellido,
          estatusProceso: result.updatedUsuario.estatusProceso
        },
        psm: result.updatedUsuario.currentPsm,
        framingSession: {
          id: result.framingSession.id,
          fechaSesion: result.framingSession.fechaSesion,
          tipoSesion: result.framingSession.tipoSesion,
          duracionMinutos: result.framingSession.duracionMinutos
        }
      },
      message: `Successfully assigned to ${psm.nombre} ${psm.apellido}. Framing session scheduled.`
    })
  } catch (error) {
    console.error('Assignment creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create assignment' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request) {
  try {
    const {
      usuarioId,
      action // 'change_psm', 'pause_process', 'resume_process'
    } = await request.json()

    if (!usuarioId || !action) {
      return NextResponse.json(
        { error: 'Missing required fields: usuarioId, action' },
        { status: 400 }
      )
    }

    const updateData: any = { updatedDate: new Date() }

    switch (action) {
      case 'change_psm':
        updateData.currentPsmId = null
        updateData.estatusProceso = 'registrado'
        break
      case 'pause_process':
        updateData.estatusProceso = 'pausado'
        break
      case 'resume_process':
        updateData.estatusProceso = 'activo'
        break
      default:
        return NextResponse.json(
          { error: 'Invalid action' },
          { status: 400 }
        )
    }

    const updatedUsuario = await prisma.usuario.update({
      where: { id: usuarioId },
      data: updateData,
      include: {
        currentPsm: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            especialidades: true
          }
        }
      }
    })

    return NextResponse.json({
      usuario: updatedUsuario,
      message: `Process ${action.replace('_', ' ')} completed successfully`
    })
  } catch (error) {
    console.error('Assignment update error:', error)
    return NextResponse.json(
      { error: 'Failed to update assignment' },
      { status: 500 }
    )
  }
}
