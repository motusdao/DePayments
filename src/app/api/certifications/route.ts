// Certification Management API
import { NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const psmId = searchParams.get('psmId')
  const estado = searchParams.get('estado')
  
  try {
    const whereClause: any = {}
    
    if (psmId) whereClause.psmId = psmId
    if (estado) whereClause.estado = estado
    
    const certificaciones = await prisma.certificacion.findMany({
      where: whereClause,
      orderBy: { createdDate: 'desc' },
      include: {
        psm: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            email: true,
            cedulaProfesional: true,
            especialidades: true
          }
        }
      }
    })
    
    return NextResponse.json(certificaciones)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch certifications' },
      { status: 500 }
    )
  }
}

export async function POST(request: Request) {
  try {
    const {
      psmId,
      tipoCertificacion,
      documentoUrl,
      montoActivacion = 65
    } = await request.json()

    // Validate required fields
    if (!psmId || !tipoCertificacion || !documentoUrl) {
      return NextResponse.json(
        { error: 'Missing required fields: psmId, tipoCertificacion, documentoUrl' },
        { status: 400 }
      )
    }

    const nuevaCertificacion = await prisma.certificacion.create({
      data: {
        psmId,
        tipoCertificacion,
        documentoUrl,
        montoActivacion: parseFloat(montoActivacion),
        estado: 'pendiente'
      },
      include: {
        psm: {
          select: {
            nombre: true,
            apellido: true,
            email: true
          }
        }
      }
    })

    return NextResponse.json({
      ...nuevaCertificacion,
      message: 'Certification documents uploaded successfully. Review process initiated.'
    })
  } catch (error) {
    console.error('Certification creation error:', error)
    return NextResponse.json(
      { error: 'Failed to create certification' },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request) {
  try {
    const {
      certificationId,
      estado,
      pagado,
      fechaPago,
      fechaVencimiento,
      reviewNotes
    } = await request.json()

    if (!certificationId) {
      return NextResponse.json(
        { error: 'Certification ID is required' },
        { status: 400 }
      )
    }

    const updateData: any = { updatedDate: new Date() }
    
    if (estado) updateData.estado = estado
    if (pagado !== undefined) updateData.pagado = pagado
    if (fechaPago) updateData.fechaPago = new Date(fechaPago)
    if (fechaVencimiento) updateData.fechaVencimiento = new Date(fechaVencimiento)

    const updatedCertification = await prisma.certificacion.update({
      where: { id: certificationId },
      data: updateData,
      include: {
        psm: {
          select: {
            id: true,
            nombre: true,
            apellido: true,
            email: true
          }
        }
      }
    })

    // If certification is approved and paid, activate the PSM
    if (estado === 'aprobada' && pagado) {
      await prisma.pSM.update({
        where: { id: updatedCertification.psmId },
        data: {
          certificado: true,
          fechaCertificacion: new Date(),
          estatusPago: 'pagado',
          activo: true,
          disponible: true
        }
      })

      // Create welcome reward for newly certified PSM
      await prisma.recompensa.create({
        data: {
          receptorId: updatedCertification.psmId,
          tipoReceptor: 'psm',
          tipoRecompensa: 'certificacion',
          puntos: 50, // Welcome bonus points
          descripcion: 'Welcome to MotusDAO! Certification completed successfully.',
          relacionadoId: certificationId
        }
      })
    }

    return NextResponse.json({
      ...updatedCertification,
      message: estado === 'aprobada' && pagado 
        ? 'PSM certified and activated successfully!'
        : 'Certification updated successfully'
    })
  } catch (error) {
    console.error('Certification update error:', error)
    return NextResponse.json(
      { error: 'Failed to update certification' },
      { status: 500 }
    )
  }
}

// Payment processing endpoint
export async function PUT(request: Request) {
  try {
    const {
      certificationId,
      paymentMethod,
      paymentReference,
      amount
    } = await request.json()

    if (!certificationId || !paymentMethod || !amount) {
      return NextResponse.json(
        { error: 'Missing required payment fields' },
        { status: 400 }
      )
    }

    // Update certification with payment info
    const updatedCertification = await prisma.certificacion.update({
      where: { id: certificationId },
      data: {
        pagado: true,
        fechaPago: new Date(),
        updatedDate: new Date()
      },
      include: {
        psm: true
      }
    })

    // If certification is also approved, activate the PSM
    if (updatedCertification.estado === 'aprobada') {
      await prisma.pSM.update({
        where: { id: updatedCertification.psmId },
        data: {
          certificado: true,
          fechaCertificacion: new Date(),
          estatusPago: 'pagado',
          activo: true,
          disponible: true
        }
      })
    }

    return NextResponse.json({
      ...updatedCertification,
      message: 'Payment processed successfully. ' + 
        (updatedCertification.estado === 'aprobada' 
          ? 'PSM is now active and can receive patients!'
          : 'Pending document review for activation.')
    })
  } catch (error) {
    console.error('Payment processing error:', error)
    return NextResponse.json(
      { error: 'Failed to process payment' },
      { status: 500 }
    )
  }
}
