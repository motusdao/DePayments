// Mock data service for development when database is unavailable
export const mockUsers = [
  {
    id: 'user-1',
    nombre: 'Ana',
    apellido: 'García',
    email: 'ana@example.com',
    fechaNacimiento: '1990-05-15',
    telefono: '+52 555 123 4567',
    lugarResidencia: 'Mexico City',
    problematicaPrincipal: 'Dealing with anxiety and stress',
    tipoAtencion: 'Ansiedad',
    preferenciaAsignacion: 'automatica',
    estatusProceso: 'registrado',
    sesionesCompletadas: 0,
    createdDate: new Date().toISOString(),
    updatedDate: new Date().toISOString(),
    owner: 'ana@example.com',
    wallet: null,
    currentPsm: null,
    currentPsmId: null
  }
];

export const mockPSMs = [
  {
    id: 'psm-1',
    nombre: 'Dr. Carlos',
    apellido: 'Rodriguez',
    email: 'carlos@example.com',
    fechaNacimiento: '1985-03-20',
    telefono: '+52 555 987 6543',
    lugarResidencia: 'Guadalajara',
    cedulaProfesional: '12345678',
    especialidades: ['Ansiedad', 'Depresión', 'Terapia Cognitivo-Conductual'],
    formacionAcademica: 'PhD in Clinical Psychology, Universidad Nacional',
    experienciaAnios: 10,
    biografia: 'Experienced therapist specializing in cognitive behavioral therapy',
    certificado: true,
    activo: true,
    disponible: true,
    participaSupervision: true,
    participaCursos: false,
    participaInvestigacion: true,
    participaComunidad: true,
    reputacionPuntos: 150,
    totalSesiones: 45,
    totalIngresos: 1500,
    createdDate: new Date().toISOString(),
    updatedDate: new Date().toISOString(),
    owner: 'carlos@example.com'
  }
];

export const isDevelopmentMode = () => {
  return process.env.NODE_ENV === 'development' && process.env.USE_MOCK_DATA === 'true';
};
