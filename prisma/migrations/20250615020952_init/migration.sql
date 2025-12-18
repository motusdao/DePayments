-- CreateTable
CREATE TABLE "PSM" (
    "ID" TEXT NOT NULL,
    "Horario de envío" TIMESTAMP(3) NOT NULL,
    "Nombre" TEXT NOT NULL,
    "Apellido" TEXT NOT NULL,
    "Email" TEXT NOT NULL,
    "Fecha de nacimiento" TIMESTAMP(3) NOT NULL,
    "Teléfono" TEXT NOT NULL,
    "Lugar de residencia" TEXT NOT NULL,
    "Created Date" TIMESTAMP(3) NOT NULL,
    "Updated Date" TIMESTAMP(3) NOT NULL,
    "Owner" TEXT NOT NULL,

    CONSTRAINT "PSM_pkey" PRIMARY KEY ("ID")
);

-- CreateTable
CREATE TABLE "Usuario" (
    "ID" TEXT NOT NULL,
    "Horario de envío" TIMESTAMP(3) NOT NULL,
    "Nombre" TEXT NOT NULL,
    "Apellido" TEXT NOT NULL,
    "Email" TEXT NOT NULL,
    "Fecha de nacimiento" TIMESTAMP(3) NOT NULL,
    "Teléfono" TEXT NOT NULL,
    "Lugar de residencia" TEXT NOT NULL,
    "Created Date" TIMESTAMP(3) NOT NULL,
    "Updated Date" TIMESTAMP(3) NOT NULL,
    "Owner" TEXT NOT NULL,
    "currentPsmId" TEXT,

    CONSTRAINT "Usuario_pkey" PRIMARY KEY ("ID")
);

-- AddForeignKey
ALTER TABLE "Usuario" ADD CONSTRAINT "Usuario_currentPsmId_fkey" FOREIGN KEY ("currentPsmId") REFERENCES "PSM"("ID") ON DELETE SET NULL ON UPDATE CASCADE;
