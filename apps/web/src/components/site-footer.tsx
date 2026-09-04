import Image from 'next/image';
import Link from 'next/link';
import { SEDE } from '@/content/sede';
import { Container } from './ui/container';

const ENLACES = [
  { href: '/quienes-somos', etiqueta: 'Quiénes somos' },
  { href: '/beneficios', etiqueta: 'Convenios y beneficios' },
  { href: '/noticias', etiqueta: 'Noticias' },
  { href: '/contacto', etiqueta: 'Contacto' },
  { href: '/socios', etiqueta: 'Acceso socios' },
  { href: '/privacidad', etiqueta: 'Política de privacidad' },
] as const;

export function SiteFooter() {
  return (
    <footer className="bg-navy-900 text-navy-100">
      <Container className="py-14">
        <div className="grid gap-12 md:grid-cols-[1.2fr_1fr_1fr]">
          <div>
            <Image
              src="/logos/banner-blanco.webp"
              alt="AFUCH Servicios Centrales"
              width={998}
              height={128}
              className="h-10 w-auto"
            />
            <p className="mt-5 max-w-sm text-sm/6 text-navy-200">{SEDE.nombreLargo}</p>
          </div>

          <nav aria-label="Enlaces del sitio">
            <h2 className="eyebrow mb-4 text-gold-500">El sitio</h2>
            <ul className="space-y-2.5 text-sm">
              {ENLACES.map(({ href, etiqueta }) => (
                <li key={href}>
                  <Link href={href} className="text-navy-100 transition-colors hover:text-white">
                    {etiqueta}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h2 className="eyebrow mb-4 text-gold-500">Contacto</h2>
            <address className="space-y-2.5 text-sm/6 not-italic">
              <p>{SEDE.direccion}</p>
              <p>
                <a href={`tel:${SEDE.telefono.replace(/\s/g, '')}`} className="hover:text-white">
                  {SEDE.telefono}
                </a>
              </p>
              <p>
                <a href={`mailto:${SEDE.email}`} className="hover:text-white">
                  {SEDE.email}
                </a>
              </p>
            </address>
            <div className="mt-5 space-y-1 text-sm text-navy-200">
              {SEDE.horarios.map(({ dias, horario }) => (
                <p key={dias}>
                  <span className="text-navy-100">{dias}:</span> {horario}
                </p>
              ))}
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-white/10 pt-8 text-xs text-navy-200 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} {SEDE.nombre}. Todos los derechos reservados.
          </p>
          <p>
            Tratamos tus datos conforme a la Ley 21.719.{' '}
            <Link href="/privacidad" className="underline underline-offset-2 hover:text-white">
              Conoce cómo
            </Link>
            .
          </p>
        </div>
      </Container>
    </footer>
  );
}
