// Evaluation/Rating Management API
import { NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const usuarioId = searchParams.get('usuarioId')
  const psmId = searchParams.get('psmId')
  const sesionId = searchParams.get('sesionId')
  const minRating = searchParams.get('minRating')
  
  try {
    const whereClause: any = {}
    
    if (usuarioId) whereClause.usuarioId = usuarioId
    if (psmId) whereClause.psmId = psmId
    if (sesionId) whereClause.sesionId = sesionId
    if (minRating) whereClause.calificacionPsm = { gte: parseInt(minRating) }
    
    const evaluaciones = await prisma.evaluacion.findMany({
      where: whereClause,
      orderBy: { createdDate: 'desc' },
      include: {
        sesion: {
          select: {
            id: true,
            fechaSesion: true,
            tipoSesion: true,
            duracionMinutos: true
          }
        },
        psm: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            especialidades: true,
            foto: true
          }
        },
        usuario: {
          select: {
            id: true,
            nombre: true,
            apellido: true
          }
        }
      }
    })
    
    return NextResponse.json(evaluaciones)
  } catch (error) {
    console.error('Evaluations fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch evaluations' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const {
      sesionId,
      usuarioId,
      psmId,
      calificacionServicio,
      calificacionPsm,
      recomendaria,
      comentario
    } = await request.json()

    // Validate required fields
    if (!sesionId || !usuarioId || !psmId || 
        calificacionServicio === undefined || calificacionPsm === undefined || 
        recomendaria === undefined) {
      return NextResponse.json(
        { error: 'Missing required fields: sesionId, usuarioId, psmId, calificacionServicio, calificacionPsm, recomendaria' },
        { status: 400 }
      )
    }

    // Validate rating scale (1-5)
    if (calificacionServicio < 1 || calificacionServicio > 5 || 
        calificacionPsm < 1 || calificacionPsm > 5) {
      return NextResponse.json(
        { error: 'Ratings must be between 1 and 5' },
        { status: 400 }
      )
    }

    // Check if session exists and is completed
    const sesion = await prisma.sesion.findUnique({
      where: { id: sesionId },
      select: { 
        id: true, 
        estado: true, 
        evaluacion: true 
      }
    })

    if (!sesion) {
      return NextResponse.json(
        { error: 'Session not found' },
        { status: 404 }
      )
    }

    if (sesion.estado !== 'completada') {
      return NextResponse.json(
        { error: 'Can only evaluate completed sessions' },
        { status: 400 }
      )
    }

    // Check if session already has an evaluation
    if (sesion.evaluacion) {
      return NextResponse.json(
        { error: 'This session has already been evaluated' },
        { status: 409 }
      )
    }

    // Create evaluation
    const nuevaEvaluacion = await prisma.evaluacion.create({
      data: {
        sesionId,
        usuarioId,
        psmId,
        calificacionServicio: parseInt(calificacionServicio),
        calificacionPsm: parseInt(calificacionPsm),
        recomendaria: Boolean(recomendaria),
        comentario: comentario || null
      },
      include: {
        psm: {
          select: {
            nombre: true,
            apellido: true
          }
        },
        sesion: {
          select: {
            fechaSesion: true,
            tipoSesion: true
          }
        }
      }
    })

    // Update PSM reputation points
    // Formula: Each rating point = 2 reputation points (2-10 points per rating)
    const reputationBonus = parseInt(calificacionPsm) * 2
    await prisma.pSM.update({
      where: { id: psmId },
      data: {
        reputacionPuntos: { increment: reputationBonus }
      }
    })

    // Create reward points for user (bonus for leaving feedback)
    await prisma.recompensa.create({
      data: {
        receptorId: usuarioId,
        tipoReceptor: 'usuario',
        tipoRecompensa: 'evaluacion',
        puntos: 3, // Bonus points for leaving evaluation
        descripcion: `Evaluation submitted for session with ${nuevaEvaluacion.psm.nombre} ${nuevaEvaluacion.psm.apellido}`,
        relacionadoId: sesionId
      }
    })

    return NextResponse.json({
      ...nuevaEvaluacion,
      reputationBonus,
      message: 'Thank you for your feedback! Your evaluation helps us improve our services.'
    })
  } catch (error: any) {
    console.error('Evaluation creation error:', error)
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'This session has already been evaluated' },
        { status: 409 }
      )
    }
    
    return NextResponse.json(
      { error: 'Failed to create evaluation: ' + (error.message || 'Unknown error') },
      { status: 500 }
    )
  }
}

// GET average rating for a PSM
export async function PUT(request: Request) {
  try {
    const { psmId } = await request.json()

    if (!psmId) {
      return NextResponse.json(
        { error: 'PSM ID is required' },
        { status: 400 }
      )
    }

    const evaluaciones = await prisma.evaluacion.findMany({
      where: { psmId },
      select: {
        calificacionPsm: true,
        calificacionServicio: true,
        recomendaria: true
      }
    })

    if (evaluaciones.length === 0) {
      return NextResponse.json({
        psmId,
        averageRating: 0,
        averageServiceRating: 0,
        totalReviews: 0,
        recommendationRate: 0
      })
    }

    const totalPsmRating = evaluaciones.reduce((sum, e) => sum + e.calificacionPsm, 0)
    const totalServiceRating = evaluaciones.reduce((sum, e) => sum + e.calificacionServicio, 0)
    const totalRecommendations = evaluaciones.filter(e => e.recomendaria).length

    return NextResponse.json({
      psmId,
      averageRating: (totalPsmRating / evaluaciones.length).toFixed(1),
      averageServiceRating: (totalServiceRating / evaluaciones.length).toFixed(1),
      totalReviews: evaluaciones.length,
      recommendationRate: Math.round((totalRecommendations / evaluaciones.length) * 100)
    })
  } catch (error) {
    console.error('Rating calculation error:', error)
    return NextResponse.json(
      { error: 'Failed to calculate ratings' },
      { status: 500 }
    )
  }
}
