-- CreateEnum
CREATE TYPE "TipoToken" AS ENUM ('VERIFICACION', 'RECUPERACION');

-- CreateEnum
CREATE TYPE "ConceptoDescuento" AS ENUM ('CUOTA_SOCIAL', 'FONDO_SOLIDARIO', 'ACCIONES_COOPEUCH', 'PRESTAMO_COOPEUCH', 'LIBRETA_AHORRO', 'SEGURO_ONCOLOGICO_FALP', 'OPTICA_GO_OPTIC', 'REINTEGRO_BONO_INVIERNO', 'GAS_ABASTIBLE', 'PRESTAMO_AFUCH');

-- CreateEnum
CREATE TYPE "ActorTipo" AS ENUM ('SOCIO', 'ADMIN', 'SISTEMA', 'ANONIMO');

-- CreateTable
CREATE TABLE "Socio" (
    "id" TEXT NOT NULL,
    "rutHash" TEXT NOT NULL,
    "rutCifrado" TEXT NOT NULL,
    "nombreCifrado" TEXT NOT NULL,
    "facultad" TEXT,
    "habilitado" BOOLEAN NOT NULL DEFAULT true,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "actualizadoEn" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Socio_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Cuenta" (
    "id" TEXT NOT NULL,
    "socioId" TEXT NOT NULL,
    "correoCifrado" TEXT NOT NULL,
    "passwordHash" TEXT,
    "verificadaEn" TIMESTAMP(3),
    "intentosFallidos" INTEGER NOT NULL DEFAULT 0,
    "bloqueadaHasta" TIMESTAMP(3),
    "creadaEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Cuenta_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Token" (
    "id" TEXT NOT NULL,
    "cuentaId" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "tipo" "TipoToken" NOT NULL,
    "expiraEn" TIMESTAMP(3) NOT NULL,
    "usadoEn" TIMESTAMP(3),
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Token_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Periodo" (
    "id" TEXT NOT NULL,
    "anio" INTEGER NOT NULL,
    "mes" INTEGER NOT NULL,
    "importadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "importadoPor" TEXT NOT NULL,

    CONSTRAINT "Periodo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LineaDescuento" (
    "id" TEXT NOT NULL,
    "periodoId" TEXT NOT NULL,
    "socioId" TEXT NOT NULL,
    "concepto" "ConceptoDescuento" NOT NULL,
    "monto" INTEGER NOT NULL,
    "detalleCuotas" JSONB,

    CONSTRAINT "LineaDescuento_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentoRendicion" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "categoria" TEXT NOT NULL,
    "fecha" DATE NOT NULL,
    "archivo" TEXT NOT NULL,
    "tamano" INTEGER NOT NULL,
    "publicadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "publicadoPor" TEXT NOT NULL,

    CONSTRAINT "DocumentoRendicion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Administrador" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "totpSecretCifrado" TEXT NOT NULL,
    "activo" BOOLEAN NOT NULL DEFAULT true,
    "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Administrador_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RegistroAuditoria" (
    "id" TEXT NOT NULL,
    "actorTipo" "ActorTipo" NOT NULL,
    "actorId" TEXT,
    "accion" TEXT NOT NULL,
    "entidad" TEXT,
    "entidadId" TEXT,
    "ip" TEXT,
    "detalle" JSONB,
    "fecha" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RegistroAuditoria_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RateLimiterFlexible" (
    "key" TEXT NOT NULL,
    "points" INTEGER NOT NULL,
    "expire" TIMESTAMP(3),

    CONSTRAINT "RateLimiterFlexible_pkey" PRIMARY KEY ("key")
);

-- CreateIndex
CREATE UNIQUE INDEX "Socio_rutHash_key" ON "Socio"("rutHash");

-- CreateIndex
CREATE UNIQUE INDEX "Cuenta_socioId_key" ON "Cuenta"("socioId");

-- CreateIndex
CREATE UNIQUE INDEX "Token_tokenHash_key" ON "Token"("tokenHash");

-- CreateIndex
CREATE INDEX "Token_cuentaId_tipo_idx" ON "Token"("cuentaId", "tipo");

-- CreateIndex
CREATE UNIQUE INDEX "Periodo_anio_mes_key" ON "Periodo"("anio", "mes");

-- CreateIndex
CREATE INDEX "LineaDescuento_socioId_periodoId_idx" ON "LineaDescuento"("socioId", "periodoId");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentoRendicion_archivo_key" ON "DocumentoRendicion"("archivo");

-- CreateIndex
CREATE UNIQUE INDEX "Administrador_email_key" ON "Administrador"("email");

-- CreateIndex
CREATE INDEX "RegistroAuditoria_fecha_idx" ON "RegistroAuditoria"("fecha");

-- CreateIndex
CREATE INDEX "RegistroAuditoria_entidad_entidadId_idx" ON "RegistroAuditoria"("entidad", "entidadId");

-- AddForeignKey
ALTER TABLE "Cuenta" ADD CONSTRAINT "Cuenta_socioId_fkey" FOREIGN KEY ("socioId") REFERENCES "Socio"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Token" ADD CONSTRAINT "Token_cuentaId_fkey" FOREIGN KEY ("cuentaId") REFERENCES "Cuenta"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LineaDescuento" ADD CONSTRAINT "LineaDescuento_periodoId_fkey" FOREIGN KEY ("periodoId") REFERENCES "Periodo"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LineaDescuento" ADD CONSTRAINT "LineaDescuento_socioId_fkey" FOREIGN KEY ("socioId") REFERENCES "Socio"("id") ON DELETE CASCADE ON UPDATE CASCADE;
