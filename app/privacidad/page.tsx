import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Politica de Privacidad",
  description: "Politica de privacidad y proteccion de datos personales de CAPIRA.",
  alternates: {
    canonical: "/privacidad",
  },
};

const updatedAt = "24 de febrero de 2026";

export default function PrivacidadPage() {
  return (
    <main>
      <section className="border-b border-zinc-200 bg-zinc-50 py-8 sm:py-12">
        <div className="mx-auto max-w-4xl px-4 sm:px-8">
          <p className="text-sm font-medium text-zinc-700">Legal</p>
          <h1 className="mt-3 text-3xl font-bold tracking-tight text-zinc-900 sm:text-5xl">
            Politica de Privacidad
          </h1>
          <p className="mt-4 text-sm text-zinc-600">Ultima actualizacion: {updatedAt}</p>
        </div>
      </section>

      <section className="py-8 sm:py-12">
        <div className="mx-auto max-w-4xl space-y-8 px-4 text-sm leading-7 text-zinc-700 sm:px-8 sm:text-base">
          <section>
            <h2 className="text-xl font-semibold text-zinc-900">1. Alcance</h2>
            <p className="mt-2">
              Esta politica explica como CAPIRA recopila, usa y protege datos personales cuando
              utilizas este sitio web, incluyendo formularios y canales de contacto.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-zinc-900">2. Datos que recopilamos</h2>
            <ul className="mt-2 list-disc space-y-1 pl-6">
              <li>Datos de contacto: nombre, email, telefono, empresa y mensaje.</li>
              <li>Datos de uso del sitio: paginas visitadas, interacciones y eventos.</li>
              <li>Datos tecnicos: direccion IP, navegador, sistema operativo y dispositivo.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-zinc-900">3. Finalidades</h2>
            <ul className="mt-2 list-disc space-y-1 pl-6">
              <li>Responder consultas comerciales y tecnicas.</li>
              <li>Evaluar necesidades de proyectos y enviar propuestas.</li>
              <li>Mejorar contenido, experiencia y rendimiento del sitio.</li>
              <li>Cumplir obligaciones legales y de seguridad.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-zinc-900">4. Base legal</h2>
            <p className="mt-2">
              Tratamos datos sobre la base de tu consentimiento, la ejecucion de medidas
              precontractuales, el cumplimiento de obligaciones legales y/o el interes legitimo de
              CAPIRA, segun corresponda.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-zinc-900">5. Conservacion</h2>
            <p className="mt-2">
              Conservamos los datos durante el tiempo necesario para cumplir las finalidades
              descritas, atender requerimientos legales y resolver posibles reclamaciones.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-zinc-900">6. Comparticion de datos</h2>
            <p className="mt-2">
              No vendemos datos personales. Podemos compartirlos con proveedores que prestan
              servicios para CAPIRA (hosting, analitica, soporte), bajo acuerdos de
              confidencialidad y seguridad.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-zinc-900">7. Transferencias internacionales</h2>
            <p className="mt-2">
              Si hay transferencias internacionales de datos, CAPIRA aplicara salvaguardas
              adecuadas conforme a la normativa aplicable.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-zinc-900">8. Tus derechos</h2>
            <p className="mt-2">Puedes solicitar acceso, rectificacion, actualizacion o supresion de tus datos.</p>
            <p className="mt-2">
              Tambien puedes oponerte o limitar ciertos tratamientos, y retirar tu consentimiento
              cuando sea aplicable.
            </p>
            <p className="mt-2">
              Para ejercer derechos, contactanos desde{" "}
              <Link className="font-medium text-zinc-900 underline" href="/contacto">
                contacto
              </Link>
              .
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-zinc-900">9. Cookies y tecnologias similares</h2>
            <p className="mt-2">
              Podemos utilizar cookies o tecnologias similares para funcionamiento tecnico, medicion
              y mejora del sitio. Puedes configurar tu navegador para bloquearlas o eliminarlas.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-zinc-900">10. Seguridad</h2>
            <p className="mt-2">
              CAPIRA aplica medidas tecnicas y organizativas razonables para proteger la
              confidencialidad, integridad y disponibilidad de los datos.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-zinc-900">11. Menores de edad</h2>
            <p className="mt-2">
              Este sitio no esta dirigido a menores de edad. Si detectamos datos de menores sin
              autorizacion valida, los eliminaremos.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold text-zinc-900">12. Cambios en esta politica</h2>
            <p className="mt-2">
              Podemos actualizar esta Politica de Privacidad. Publicaremos la version vigente en
              esta pagina con su fecha de actualizacion.
            </p>
          </section>
        </div>
      </section>
    </main>
  );
}
