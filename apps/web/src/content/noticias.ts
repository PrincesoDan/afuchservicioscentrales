import { noticiaSchema, type Noticia } from '@afuch/contracts';
import { z } from 'zod';

const noticias: Noticia[] = [
  {
    slug: 'trabajadores-ballet-nacional-chileno-logran-acuerdos-autoridades-uchile',
    titulo:
      'Trabajadores del Ballet Nacional Chileno logran importantes acuerdos con autoridades de la Universidad de Chile',
    bajada:
      'Tras un proceso de movilización y diálogo, representantes de las y los trabajadores del Ballet Nacional Chileno (BANCH), junto a sus organizaciones sindicales, alcanzaron un acuerdo con las autoridades universitarias que establece compromisos para avanzar en la estabilidad laboral, la participación del elenco y el funcionamiento de la institución.',
    fecha: '2026-11-18',
    categoria: 'comunicado',
    portada: {
      src: '/noticias/banch-firma-acuerdo.webp',
      alt: 'Representantes de las y los trabajadores y de las organizaciones sindicales posan junto al acta de acuerdos firmada.',
    },
    cuerpo: [
      'El martes 17 de noviembre se firmó un acta de acuerdos entre la Dirección del Centro de Extensión Artística y Cultural (CEAC), la Vicerrectoría de Asuntos Económicos y Gestión Institucional (VAEGI), representantes de las y los bailarines, FENAFUCH, AFUCH y su filial CEAC.',
      'Este importante avance se produce en el contexto de las movilizaciones del elenco y las conversaciones sostenidas con las autoridades tras el término de la vinculación laboral de la directora artística del Ballet.',
      '**Entre los principales acuerdos alcanzados destacan:**',
      {
        lista: [
          'Establecer un cronograma de trabajo para noviembre y diciembre de 2026, que comenzará a abordarse en reuniones desde el 25 de noviembre.',
          'Diseñar una metodología participativa que incorpore al elenco en el proceso de elección de la dirección artística.',
          'Promover mecanismos de participación de las y los bailarines en el funcionamiento del BANCH.',
          'Revisar el instructivo de trabajo del Ballet.',
          'Deponer el paro en el marco de los compromisos establecidos.',
        ],
      },
      'El acta también reafirma el compromiso de las partes con la continuidad de las actividades y la estabilidad laboral del elenco, así como con el derecho de sus integrantes a ser evaluados con imparcialidad, conforme a la normativa vigente y sin considerar factores ajenos a sus funciones.',
      '**Desde las organizaciones sindicales valoramos este acuerdo como un avance fruto de la organización, la movilización y la participación activa de las y los trabajadores.**',
      'Este paso abre una nueva etapa de trabajo, en la que será fundamental dar seguimiento al cumplimiento de los compromisos asumidos y continuar fortaleciendo la participación de las y los trabajadores en las decisiones que afectan su futuro laboral y el desarrollo del Ballet Nacional Chileno.',
    ],
    galeria: [
      {
        src: '/noticias/banch-elenco-lienzo.webp',
        alt: 'Integrantes del elenco del BANCH frente al CEAC con un lienzo de AFUCH, FENAFUCH y AFUCH CEAC: «CEAC en paro. ¡Basta de negligencia y abuso en el CEAC UChile! Solidaridad con los bailarines del Ballet Nacional Chileno».',
      },
      {
        src: '/noticias/banch-protesta-cartel.webp',
        alt: 'Una bailarina y un bailarín del BANCH sostienen un cartel de protesta durante la movilización.',
      },
    ],
  },
  {
    slug: 'rectora-mizala-primera-reunion-directiva-fenafuch',
    titulo: 'Rectora Mizala sostuvo su primera reunión con la directiva de Fenafuch',
    bajada:
      'En la cita se abordaron temas fundamentales para las y los funcionarios de la U. de Chile, como son el proceso de encasillamiento y el trabajo impulsado en materia de acceso a viviendas.',
    fecha: '2026-07-28',
    categoria: 'institucional',
    portada: {
      src: '/noticias/rectora-mizala-fenafuch.webp',
      alt: 'La rectora Alejandra Mizala reunida con la directiva de Fenafuch en el despacho de la Rectoría de la Universidad de Chile.',
    },
    cuerpo: [
      'El miércoles 22 de julio, la rectora de la Universidad de Chile, **Alejandra Mizala**, recibió en su despacho a la directiva de la **Federación Nacional de Asociaciones de Funcionarios y Funcionarias de la Universidad de Chile (Fenafuch)**, presidida por **Myriam Barahona**, funcionaria de la Facultad de Filosofía y Humanidades.',
      'En la reunión también participaron la prorrectora **Dorotea López**; el vicerrector de Asuntos Económicos y Gestión Institucional, **Sergio Olavarrieta**; la directora de Gestión y Desarrollo de Personas, **Fabiola Divin**; y el jefe de gabinete de la Rectoría, **Carlos Rilling**. Por parte de Fenafuch, también asistieron **Jorge Véliz**, vicepresidente; **Silvia Bascuñán**, secretaria; **Rodrigo Méndez** y **Giovani Cáceres**.',
      '"Hoy sostuvimos una reunión muy productiva con Fenafuch, en la que **reafirmamos nuestro compromiso de seguir trabajando de manera colaborativa en temas relevantes para las funcionarias y funcionarios de nuestra Universidad**", relató la Rectora Mizala tras el primer encuentro.',
      'En él, explicó, se conversó "sobre el proceso de encasillamiento, una labor que se ha venido desarrollando junto a la Vicerrectoría de Asuntos Económicos y Gestión Institucional, y acordamos continuar avanzando de manera conjunta para su adecuado desarrollo. Asimismo, revisamos el trabajo que se ha impulsado en materia de acceso a viviendas para funcionarias y funcionarios de la Universidad, una iniciativa que seguiremos fortaleciendo".',
      'El pasado 18 de junio, la Universidad presentó el reporte de avances del grupo de trabajo sobre una propuesta de procedimiento de encasillamiento sistematizado del personal de colaboración y formalizó la carta de intención de venta por parte de la U. de Chile para disponer de un terreno destinado a la construcción de viviendas para las y los funcionarios del Campus Antumapu.',
      '"Se trata de un trabajo que comenzó durante la rectoría anterior y continuará en esta gestión, con la convicción de que el diálogo, la colaboración y la búsqueda de acuerdos son la mejor forma de avanzar en beneficio de nuestra comunidad universitaria", añadió la rectora.',
      'Por su parte, Myriam Barahona destacó que, en la reunión, la rectoría **"se comprometió efectivamente a seguir con este proyecto para que trabajadores y trabajadoras de la U. de Chile, socios de Fenafuch, tengan acceso a la vivienda en terrenos de la Universidad"** y agradeció que se diera continuidad al proceso de encasillamiento.',
      '"Ha sido una reunión muy cordial, muy afirmativa en los puntos que nosotros hemos señalado, y es por eso que vamos a seguir trabajando en conjunto para lograr mayores y mejores beneficios, y también un buen pasar y un buen vivir para los trabajadores y trabajadoras de la Universidad de Chile", cerró.',
    ],
    autor: 'Comunicaciones Rectoría',
    creditoFoto: 'Alejandra Fuenzalida',
    fuente: {
      nombre: 'Universidad de Chile',
      url: 'https://uchile.cl/noticias/242858/rectora-mizala-sostuvo-su-primera-reunion-con-la-directiva-de-fenafuch',
    },
  },
];

/** Falla en build si alguna noticia se desvía del contrato compartido. */
export const NOTICIAS: readonly Noticia[] = z.array(noticiaSchema).parse(noticias);
