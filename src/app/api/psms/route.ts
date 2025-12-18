// PSM Management API with Complete Registration Flow
import { NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { mockPSMs, isDevelopmentMode } from '@/app/lib/mockData'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const status = searchParams.get('status') // 'active', 'available', 'certified'
  const especialidad = searchParams.get('especialidad')
  
  try {
    const whereClause: any = {}
    
    if (status === 'active') whereClause.activo = true
    if (status === 'available') whereClause.disponible = true
    if (status === 'certified') whereClause.certificado = true
    if (especialidad) whereClause.especialidades = { has: especialidad }
    
    const psms = await prisma.pSM.findMany({ 
      where: whereClause,
      orderBy: { createdDate: 'desc' },
      include: {
        certificaciones: true,
        _count: {
          select: {
            sesiones: true,
            usuarios: true,
            evaluaciones: true
          }
        }
      }
    })
    return NextResponse.json(psms)
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch PSMs' },
      { status: 500 }
    )
  }
}

export async function POST(req: Request) {
  let nombre, apellido, email, fechaNacimiento, telefono, lugarResidencia, owner;
  let cedulaProfesional, especialidades, formacionAcademica, experienciaAnios, biografia;
  let participaSupervision, participaCursos, participaInvestigacion, participaComunidad;
  
  try {
    const requestData = await req.json();
    // Basic Info
    nombre = requestData.nombre;
    apellido = requestData.apellido;
    email = requestData.email;
    fechaNacimiento = requestData.fechaNacimiento;
    telefono = requestData.telefono;
    lugarResidencia = requestData.lugarResidencia;
    owner = requestData.owner;
    
    // Professional Info
    cedulaProfesional = requestData.cedulaProfesional;
    especialidades = requestData.especialidades || [];
    formacionAcademica = requestData.formacionAcademica;
    experienciaAnios = requestData.experienciaAnios;
    biografia = requestData.biografia;
    
    // Platform Preferences
    participaSupervision = requestData.participaSupervision || false;
    participaCursos = requestData.participaCursos || false;
    participaInvestigacion = requestData.participaInvestigacion || false;
    participaComunidad = requestData.participaComunidad || false;

    // Validate required fields
    if (!cedulaProfesional || !formacionAcademica || experienciaAnios === undefined) {
      return NextResponse.json(
        { error: 'Missing required professional information' },
        { status: 400 }
      )
    }

    const newPsm = await prisma.pSM.create({
      data: {
        // Basic Info
        nombre,
        apellido,
        email,
        fechaNacimiento: new Date(fechaNacimiento),
        telefono,
        lugarResidencia,
        owner,
        
        // Professional Info
        cedulaProfesional,
        especialidades,
        formacionAcademica,
        experienciaAnios: parseInt(experienciaAnios),
        biografia,
        
        // Platform Preferences
        participaSupervision,
        participaCursos,
        participaInvestigacion,
        participaComunidad,
        
        // Auto-generated
        horarioEnvio: new Date(),
        createdDate: new Date(),
        updatedDate: new Date(),
      },
    })
    
    // Create initial certification record
    await prisma.certificacion.create({
      data: {
        psmId: newPsm.id,
        tipoCertificacion: 'inicial',
        documentoUrl: '', // Will be updated when documents are uploaded
        estado: 'pendiente'
      }
    })
    
    return NextResponse.json({
      ...newPsm,
      message: 'PSM registered successfully. Please complete certification process.'
    })
  } catch (error: any) {
    console.error('PSM creation error:', error)
    
    // Handle specific database connection errors
    if (error.message.includes('Tenant or user not found')) {
      // If in development mode with mock data enabled, return success
      if (isDevelopmentMode()) {
        console.log('Using mock data in development mode for PSM');
        const mockPsm = {
          id: 'mock-psm-' + Date.now(),
          nombre,
          apellido,
          email,
          fechaNacimiento: new Date(fechaNacimiento),
          telefono,
          lugarResidencia,
          owner,
          cedulaProfesional,
          especialidades,
          formacionAcademica,
          experienciaAnios: parseInt(experienciaAnios),
          biografia,
          participaSupervision,
          participaCursos,
          participaInvestigacion,
          participaComunidad,
          certificado: false,
          activo: false,
          disponible: true,
          reputacionPuntos: 0,
          totalSesiones: 0,
          totalIngresos: 0,
          horarioEnvio: new Date(),
          createdDate: new Date(),
          updatedDate: new Date(),
        };
        return NextResponse.json({
          ...mockPsm,
          message: 'PSM registered successfully (MOCK MODE - Database not connected). Please complete certification process.'
        });
      }
      
      return NextResponse.json(
        { error: 'Database connection error. Please check your database configuration.' },
        { status: 503 }
      );
    }
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'A PSM with this email already exists.' },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to create PSM: ' + (error.message || 'Unknown error') },
      { status: 500 }
    )
  }
}
