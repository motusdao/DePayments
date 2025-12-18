// app/api/users/route.ts
import { NextResponse } from 'next/server';
import { prisma } from '@/app/lib/prisma';
import { mockUsers, isDevelopmentMode } from '@/app/lib/mockData';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const wallet = searchParams.get('wallet');

  try {
    if (wallet) {
      // Find user by wallet address
      const user = await prisma.usuario.findUnique({
        where: { wallet },
        include: { currentPsm: true },
      });
      return NextResponse.json(user);
    } else {
      // Get all users (if no wallet parameter provided)
      const users = await prisma.usuario.findMany({
        orderBy: { createdDate: 'desc' },
        include: { currentPsm: true },
      });
      return NextResponse.json(users);
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch user data' },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  let nombre, apellido, email, fechaNacimiento, telefono, lugarResidencia, wallet, owner;
  let problematicaPrincipal, tipoAtencion, preferenciaAsignacion, currentPsmId;
  
  try {
    const requestData = await request.json();
    
    // Basic Info
    nombre = requestData.nombre;
    apellido = requestData.apellido;
    email = requestData.email;
    fechaNacimiento = requestData.fechaNacimiento;
    telefono = requestData.telefono;
    lugarResidencia = requestData.lugarResidencia;
    wallet = requestData.wallet;
    owner = requestData.owner;
    
    // Therapeutic Profile
    problematicaPrincipal = requestData.problematicaPrincipal;
    tipoAtencion = requestData.tipoAtencion;
    preferenciaAsignacion = requestData.preferenciaAsignacion || 'automatica';
    
    // Assignment
    currentPsmId = requestData.currentPsmId;

    // Upsert operation - create or update user
    const userData = {
      nombre,
      apellido,
      email,
      fechaNacimiento: new Date(fechaNacimiento),
      telefono: telefono || '',
      lugarResidencia: lugarResidencia || '',
      owner: owner || wallet,
      wallet,
      
      // Therapeutic Profile
      problematicaPrincipal,
      tipoAtencion,
      preferenciaAsignacion,
      
      // Assignment
      currentPsmId,
      
      horarioEnvio: new Date(),
      updatedDate: new Date(),
    };

    const user = await prisma.usuario.upsert({
      where: wallet ? { wallet } : { email },
      update: userData,
      create: {
        ...userData,
        createdDate: new Date(),
      },
      include: {
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
    });

    return NextResponse.json({
      ...user,
      message: user.currentPsmId 
        ? 'User profile updated with PSM assignment' 
        : 'User registered successfully. PSM will be assigned based on your preferences.'
    });
  } catch (error: any) {
    console.error('User creation/update error:', error)
    
    // Handle specific database connection errors
    if (error.message.includes('Tenant or user not found')) {
      // If in development mode with mock data enabled, return success
      if (isDevelopmentMode()) {
        console.log('Using mock data in development mode');
        const mockUser = {
          id: 'mock-user-' + Date.now(),
          nombre,
          apellido,
          email,
          fechaNacimiento: new Date(fechaNacimiento),
          telefono: telefono || '',
          lugarResidencia: lugarResidencia || '',
          owner: owner || wallet,
          wallet,
          problematicaPrincipal,
          tipoAtencion,
          preferenciaAsignacion,
          currentPsmId,
          horarioEnvio: new Date(),
          updatedDate: new Date(),
          createdDate: new Date(),
          currentPsm: null
        };
        return NextResponse.json({
          ...mockUser,
          message: 'User registered successfully (MOCK MODE - Database not connected)'
        });
      }
      
      return NextResponse.json(
        { error: 'Database connection error. Please check your database configuration.' },
        { status: 503 }
      );
    }
    
    if (error.code === 'P2002') {
      return NextResponse.json(
        { error: 'A user with this email or wallet already exists.' },
        { status: 409 }
      );
    }
    
    return NextResponse.json(
      { error: 'Failed to save user data: ' + (error.message || 'Unknown error') },
      { status: 500 }
    );
  }
}
