import { BotonLink } from '@/components/ui/button';
import { Container } from '@/components/ui/container';

export default function NoEncontrado() {
  return (
    <section className="py-24 lg:py-32">
      <Container>
        <div className="mx-auto max-w-lg text-center">
          <p className="eyebrow mb-4 text-navy-600">Error 404</p>
          <h1 className="text-4xl font-bold tracking-tight text-balance text-navy-900">
            No encontramos esta página
          </h1>
          <p className="mt-5 text-base/7 text-slate-600">
            Puede que el enlace esté antiguo o que la dirección tenga un error.
          </p>
          <div className="mt-9 flex flex-wrap justify-center gap-3">
            <BotonLink href="/">Volver al inicio</BotonLink>
            <BotonLink href="/beneficios" variante="secundario">
              Ver convenios
            </BotonLink>
          </div>
        </div>
      </Container>
    </section>
  );
}
