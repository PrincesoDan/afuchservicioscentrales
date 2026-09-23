/**
 * CLI de administración. Usa los mismos servicios que /admin y deja registro
 * en auditoría con actor SISTEMA (el usuario del sistema operativo).
 *
 *   pnpm cli ayuda
 */
import 'dotenv/config';
import { formatearRut, normalizarRut, esRutValido } from '@afuch/contracts';
import { randomBytes } from 'node:crypto';
import { readFile, writeFile } from 'node:fs/promises';
import { userInfo } from 'node:os';
import { parseArgs } from 'node:util';
import type { Actor } from '../src/server/actor';
import {
  anularCuenta,
  ausentesDelUltimoPeriodo,
  buscarSocioPorRut,
  cambiarHabilitacion,
  deshabilitarAusentes,
  eliminarSocio,
  exportarSocio,
} from '../src/server/administracion';
import { crearAdministrador, desactivarAdministrador } from '../src/server/administradores';
import { crearPlanillaFicticia } from '../src/server/fixtures/planilla-ficticia';
import { importarPlanilla } from '../src/server/importacion';
import { leerPlanilla } from '../src/server/planilla';
import { listarDocumentos, publicarDocumento } from '../src/server/rendicion';
import { prepararClaves, rotarClaves } from '../src/server/rotacion-claves';

const AYUDA = `
Uso: pnpm cli <comando> [opciones]

  planilla:importar <archivo.xlsx> [--confirmar]   Sin --confirmar solo valida (vista previa).
  planilla:ficticia <salida.xlsx>                  Genera una planilla de prueba con datos inventados.
  rendicion:publicar <archivo.pdf> --titulo T --categoria C --fecha AAAA-MM-DD
  rendicion:listar
  socio:estado <rut>
  socio:desactivar <rut>
  socio:activar <rut>
  socio:anular-cuenta <rut>                        Borra la cuenta de acceso (no los descuentos).
  socio:exportar <rut>                             Derecho de acceso: imprime en JSON todo lo guardado del socio.
  socio:eliminar <rut> --confirmar                 Derecho de supresión: borra socio, cuenta y descuentos.
  socios:ausentes [--desactivar]                   Lista (o deshabilita) a quienes no están en el último mes.
  admin:crear <email>                              Crea o reinicia un admin; imprime contraseña y secreto TOTP una vez.
  admin:desactivar <email>
  claves:rotar [--confirmar]                       Recifra con CLAVE_CIFRADO_NUEVA y/o CLAVE_HMAC_NUEVA.
                                                   Detener la app antes (runbook §10). Sin --confirmar solo valida.
`;

const actor: Actor = { tipo: 'SISTEMA', id: userInfo().username };

function rutDe(valor: string | undefined): string {
  if (!valor || !esRutValido(valor)) throw new Error('RUT inválido.');
  return normalizarRut(valor);
}

async function socioDe(valor: string | undefined) {
  const socio = await buscarSocioPorRut(rutDe(valor));
  if (!socio) throw new Error('No hay un socio con ese RUT.');
  return socio;
}

async function main(): Promise<void> {
  const { positionals, values } = parseArgs({
    allowPositionals: true,
    options: {
      confirmar: { type: 'boolean', default: false },
      desactivar: { type: 'boolean', default: false },
      titulo: { type: 'string' },
      categoria: { type: 'string' },
      fecha: { type: 'string' },
    },
  });
  const [comando, argumento] = positionals;

  switch (comando) {
    case 'planilla:importar': {
      if (!argumento) throw new Error('Indica el archivo .xlsx.');
      const resultado = await leerPlanilla(await readFile(argumento));
      const periodo = resultado.periodo
        ? `${resultado.periodo.mes}/${resultado.periodo.anio}`
        : '—';
      console.log(
        `Periodo: ${periodo} · Socios: ${resultado.socios.length} · Filas: ${resultado.resumen.filasLeidas} · Total: ${resultado.resumen.total}`,
      );
      for (const [concepto, monto] of Object.entries(resultado.resumen.totalPorConcepto))
        console.log(`  ${concepto}: ${monto}`);
      for (const advertencia of resultado.advertencias) console.log(`ADVERTENCIA ${advertencia}`);
      for (const error of resultado.errores) console.log(`ERROR ${error}`);
      if (resultado.errores.length > 0) {
        process.exitCode = 1;
        return;
      }
      if (!values.confirmar) {
        console.log('\nVista previa. Repite con --confirmar para importar.');
        return;
      }
      const resumen = await importarPlanilla(resultado, actor);
      console.log(
        `Importado: ${resumen.socios} socios (${resumen.sociosNuevos} nuevos), ${resumen.lineas} líneas.${resumen.reemplazoPeriodoExistente ? ' Reemplazó el periodo existente.' : ''}`,
      );
      return;
    }
    case 'planilla:ficticia': {
      if (!argumento) throw new Error('Indica el archivo de salida .xlsx.');
      await writeFile(argumento, await crearPlanillaFicticia());
      console.log(`Planilla ficticia escrita en ${argumento} (agosto 2026, 3 socios inventados).`);
      return;
    }
    case 'rendicion:publicar': {
      if (!argumento || !values.titulo || !values.categoria || !values.fecha)
        throw new Error('Faltan opciones. Ver: pnpm cli ayuda');
      const documento = await publicarDocumento(
        { titulo: values.titulo, categoria: values.categoria, fecha: values.fecha },
        await readFile(argumento),
        actor,
      );
      console.log(`Publicado ${documento.id}: ${documento.titulo}`);
      return;
    }
    case 'rendicion:listar': {
      for (const d of await listarDocumentos())
        console.log(`${d.id}  ${d.fecha.toISOString().slice(0, 10)}  ${d.categoria}  ${d.titulo}`);
      return;
    }
    case 'socio:estado': {
      const s = await socioDe(argumento);
      console.log(`${s.nombre} (${s.rut}) · ${s.facultad ?? '—'}`);
      console.log(
        `Habilitado: ${s.habilitado ? 'sí' : 'no'} · En último mes: ${s.enUltimoPeriodo ? 'sí' : 'no'} · Cuenta: ${s.cuenta}${s.correo ? ` (${s.correo})` : ''}`,
      );
      return;
    }
    case 'socio:desactivar':
    case 'socio:activar': {
      const s = await socioDe(argumento);
      await cambiarHabilitacion(s.id, comando === 'socio:activar', actor);
      console.log(`${s.nombre}: ${comando === 'socio:activar' ? 'habilitado' : 'deshabilitado'}.`);
      return;
    }
    case 'socio:anular-cuenta': {
      const s = await socioDe(argumento);
      console.log(
        (await anularCuenta(s.id, actor))
          ? `Cuenta de ${s.nombre} anulada.`
          : `${s.nombre} no tenía cuenta.`,
      );
      return;
    }
    case 'socio:exportar': {
      const s = await socioDe(argumento);
      console.log(JSON.stringify(await exportarSocio(s.id, actor), null, 2));
      return;
    }
    case 'socio:eliminar': {
      const s = await socioDe(argumento);
      if (!values.confirmar)
        throw new Error(`Esto borra a ${s.nombre} y todos sus datos. Repite con --confirmar.`);
      await eliminarSocio(s.id, actor);
      console.log(`${s.nombre} eliminado.`);
      return;
    }
    case 'socios:ausentes': {
      const ausentes = await ausentesDelUltimoPeriodo();
      for (const s of ausentes) console.log(`${formatearRut(s.rut)}  ${s.nombre}`);
      console.log(`${ausentes.length} habilitados no aparecen en el último periodo.`);
      if (values.desactivar) console.log(`Deshabilitados: ${await deshabilitarAusentes(actor)}`);
      return;
    }
    case 'admin:crear': {
      if (!argumento) throw new Error('Indica el correo.');
      const contrasena = randomBytes(18).toString('base64url');
      const { secreto, uri } = await crearAdministrador(argumento, contrasena, actor.id);
      console.log('Guarda estos datos ahora; no se vuelven a mostrar.\n');
      console.log(`Correo:        ${argumento.toLowerCase()}`);
      console.log(`Contraseña:    ${contrasena}`);
      console.log(`Secreto TOTP:  ${secreto}`);
      console.log(`URI TOTP:      ${uri}`);
      return;
    }
    case 'admin:desactivar': {
      if (!argumento) throw new Error('Indica el correo.');
      console.log(
        (await desactivarAdministrador(argumento, actor.id)) ? 'Desactivado.' : 'No existe.',
      );
      return;
    }
    case 'claves:rotar': {
      const claves = prepararClaves({
        cifradoActual: process.env.CLAVE_CIFRADO,
        hmacActual: process.env.CLAVE_HMAC,
        cifradoNueva: process.env.CLAVE_CIFRADO_NUEVA,
        hmacNueva: process.env.CLAVE_HMAC_NUEVA,
      });
      const r = await rotarClaves(claves, { aplicar: values.confirmar, actorId: actor.id });
      const cuales = [r.rotaCifrado && 'CLAVE_CIFRADO', r.rotaHmac && 'CLAVE_HMAC']
        .filter(Boolean)
        .join(' y ');
      console.log(
        `Se rota: ${cuales}. Registros: ${r.socios} socios, ${r.cuentas} cuentas, ${r.administradores} admins.`,
      );
      if (!r.aplicado) {
        console.log(
          '\nTodo se descifra bien con las claves actuales. Repite con --confirmar para aplicar.',
        );
        return;
      }
      console.log('\nRotación aplicada y verificada. Ahora, antes de volver a levantar la app:');
      if (r.rotaCifrado)
        console.log('  - Reemplaza CLAVE_CIFRADO por el valor de CLAVE_CIFRADO_NUEVA en el .env.');
      if (r.rotaHmac)
        console.log('  - Reemplaza CLAVE_HMAC por el valor de CLAVE_HMAC_NUEVA en el .env.');
      console.log('  - Borra CLAVE_CIFRADO_NUEVA / CLAVE_HMAC_NUEVA del .env.');
      console.log('  - Guarda las claves ANTERIORES hasta que venzan los respaldos que las usan.');
      return;
    }
    default:
      console.log(AYUDA);
  }
}

main()
  .catch((error: unknown) => {
    console.error(error instanceof Error ? `Error: ${error.message}` : error);
    process.exitCode = 1;
  })
  .finally(() => process.exit());
