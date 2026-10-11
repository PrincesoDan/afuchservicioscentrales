-- Decisión D4′: el correo lo precarga AFUCH en el socio y deja de escribirlo
-- quien se registra. Las cuentas creadas con el flujo anterior (RUT + correo
-- propio) no tienen un correo validado por AFUCH, así que se eliminan; al
-- momento de esta migración no hay cuentas reales en producción.
DELETE FROM "Cuenta";

-- AlterTable
ALTER TABLE "Cuenta" DROP COLUMN "correoCifrado";

-- AlterTable
ALTER TABLE "Socio" ADD COLUMN     "correoCifrado" TEXT,
ADD COLUMN     "correoHash" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Socio_correoHash_key" ON "Socio"("correoHash");
