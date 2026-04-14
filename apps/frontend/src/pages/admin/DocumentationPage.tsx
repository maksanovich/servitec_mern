import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import {
  Home,
  BookOpen,
  LayoutDashboard,
  Wrench,
  History,
  Stethoscope,
  UserCircle,
  Tag,
  Layers,
  Package,
  Boxes,
  DollarSign,
  Building2,
  Mail,
  Users,
  Shield,
  User,
  Globe,
  FileText,
  Sparkles,
  Bell,
  Search,
  QrCode,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';
import { PageHeader, Card, CardHeader, CardContent } from '../../components/ui';

const tocItems: Array<{ id: string; title: string; hint: string }> = [
  { id: 'panel', title: 'Panel y permisos', hint: 'KPIs y acceso' },
  { id: 'ordenes', title: 'Órdenes y flujo', hint: 'Taller y auditoría' },
  { id: 'catalogo', title: 'Clientes y catálogo', hint: 'Datos maestros' },
  { id: 'servicios', title: 'Servicios e ingresos', hint: 'Precios y caja' },
  { id: 'sistema', title: 'Empresa y correo', hint: 'Marca y avisos' },
  { id: 'publico', title: 'Sitio del cliente', hint: 'Sin login admin' },
];

function DocLink({ to, children }: { to: string; children: ReactNode }) {
  return (
    <Link
      to={to}
      className="inline-flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400 font-medium hover:underline underline-offset-2"
    >
      {children}
    </Link>
  );
}

function ExternalDocLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a
      href={href}
      className="inline-flex items-center gap-0.5 text-emerald-600 dark:text-emerald-400 font-medium hover:underline underline-offset-2"
    >
      {children}
    </a>
  );
}

function FeatureBlock({
  icon: Icon,
  title,
  children,
}: {
  icon: LucideIcon;
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="rounded-xl border border-slate-200/90 dark:border-slate-600/80 bg-white/80 dark:bg-slate-800/40 shadow-sm hover:shadow-md hover:border-emerald-500/25 dark:hover:border-emerald-500/30 transition-shadow duration-200 p-5 flex flex-col gap-3">
      <div className="flex items-start gap-3">
        <div
          className="shrink-0 rounded-xl bg-gradient-to-br from-emerald-500/15 to-teal-600/10 dark:from-emerald-400/20 dark:to-teal-500/10 p-2.5 text-emerald-700 dark:text-emerald-300 ring-1 ring-emerald-500/10"
          aria-hidden
        >
          <Icon className="w-5 h-5" strokeWidth={2} />
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <h3 className="text-sm font-semibold text-slate-900 dark:text-white leading-snug">{title}</h3>
          <div className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed space-y-2">{children}</div>
        </div>
      </div>
    </div>
  );
}

function SectionTitle({ id, title, subtitle }: { id: string; title: string; subtitle: string }) {
  return (
    <div id={id} className="scroll-mt-24 pt-2 first:pt-0 col-span-full">
      <div className="flex flex-wrap items-end justify-between gap-2 border-b border-slate-200/80 dark:border-slate-600/80 pb-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-slate-900 dark:text-white">{title}</h2>
          <p className="text-sm text-slate-500 dark:text-slate-400 mt-0.5">{subtitle}</p>
        </div>
      </div>
    </div>
  );
}

export function DocumentationPage() {
  return (
    <div className="w-full pb-10">
      <div className="w-full max-w-5xl mx-auto space-y-8">
      <PageHeader
        title="Documentación"
        breadcrumb={[{ label: 'Ayuda', icon: Home }, { label: 'Documentación', icon: BookOpen }]}
      />

      {/* Intro band */}
      <div className="relative overflow-hidden rounded-2xl border border-slate-200/90 dark:border-slate-600/70 bg-gradient-to-br from-slate-50 via-white to-emerald-50/40 dark:from-slate-900 dark:via-slate-900/90 dark:to-emerald-950/30 px-5 py-6 md:px-8 md:py-7 shadow-sm">
        <div
          className="pointer-events-none absolute -right-16 -top-20 h-56 w-56 rounded-full bg-emerald-400/10 blur-3xl dark:bg-emerald-500/10"
          aria-hidden
        />
        <div className="relative space-y-4 max-w-3xl mx-auto">
          <p className="text-sm md:text-[15px] text-slate-600 dark:text-slate-300 leading-relaxed">
            Servitec centraliza el ciclo de vida de las reparaciones: ingreso en taller, seguimiento por
            etapas, presupuesto, comunicación al cliente y transparencia en el sitio público. Use esta guía
            para ubicar cada función; los enlaces internos respetan los permisos de su rol.
          </p>
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/90 dark:bg-slate-800/90 px-2.5 py-1 text-xs font-medium text-slate-600 dark:text-slate-300 ring-1 ring-slate-200/80 dark:ring-slate-600">
              <Bell className="w-3.5 h-3.5 text-amber-500 shrink-0" aria-hidden />
              Notificaciones en el panel
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/90 dark:bg-slate-800/90 px-2.5 py-1 text-xs font-medium text-slate-600 dark:text-slate-300 ring-1 ring-slate-200/80 dark:ring-slate-600">
              <Search className="w-3.5 h-3.5 text-slate-400 shrink-0" aria-hidden />
              Búsqueda y accesos rápidos
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/90 dark:bg-slate-800/90 px-2.5 py-1 text-xs font-medium text-slate-600 dark:text-slate-300 ring-1 ring-slate-200/80 dark:ring-slate-600">
              <Sparkles className="w-3.5 h-3.5 text-emerald-500 shrink-0" aria-hidden />
              Tema claro / oscuro
            </span>
          </div>
        </div>
      </div>

      {/* Table of contents — 2 columns */}
      <Card className="overflow-hidden border-slate-200/90 dark:border-slate-600/70">
        <CardHeader title="En esta página" />
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {tocItems.map((item) => (
              <a
                key={item.id}
                href={`#${item.id}`}
                className="group flex items-center justify-between gap-3 rounded-xl border border-transparent bg-slate-50/80 dark:bg-slate-900/40 px-3.5 py-3 text-left transition-colors hover:border-emerald-500/25 hover:bg-emerald-50/60 dark:hover:bg-emerald-950/25"
              >
                <span>
                  <span className="block text-sm font-medium text-slate-900 dark:text-white group-hover:text-emerald-700 dark:group-hover:text-emerald-300">
                    {item.title}
                  </span>
                  <span className="block text-xs text-slate-500 dark:text-slate-400 mt-0.5">{item.hint}</span>
                </span>
                <span className="text-slate-400 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 text-lg" aria-hidden>
                  →
                </span>
              </a>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* —— Panel —— */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SectionTitle
          id="panel"
          title="Panel y permisos"
          subtitle="Resumen operativo y control de acceso al menú"
        />

        <FeatureBlock icon={LayoutDashboard} title="Panel principal">
          <p>
            El <DocLink to="/admin">panel</DocLink> muestra indicadores (ingresos, volumen de órdenes,
            equipos en mantenimiento), la agenda de trabajo y tablas con los clientes de mayor inversión y
            los que más órdenes han generado. Sirve como punto de partida antes de entrar al detalle en{' '}
            <DocLink to="/admin/order">Órdenes</DocLink>.
          </p>
        </FeatureBlock>

        <FeatureBlock icon={Shield} title="Roles y visibilidad">
          <p>
            El menú lateral solo lista módulos autorizados para su usuario. Si no ve una sección (p. ej.{' '}
            <DocLink to="/admin/order/stages">Etapas</DocLink> o <DocLink to="/admin/income">Ingresos</DocLink>
            ), un administrador debe ajustar su rol en <DocLink to="/admin/roles">Roles</DocLink> o crearle
            un usuario adecuado en <DocLink to="/admin/users">Usuarios</DocLink>. Algunas entradas (como
            movimientos de órdenes) están reservadas a perfiles de administración.
          </p>
        </FeatureBlock>

        <FeatureBlock icon={User} title="Perfil y apariencia">
          <p>
            En <DocLink to="/admin/profile">Perfil</DocLink> puede actualizar sus datos y preferencias,
            incluido el tema claro u oscuro del panel. El encabezado incluye accesos rápidos a aplicaciones y
            notificaciones cuando la empresa las utiliza.
          </p>
        </FeatureBlock>
      </div>

      {/* —— Órdenes —— */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SectionTitle
          id="ordenes"
          title="Órdenes de trabajo y flujo"
          subtitle="Listado, edición, etapas y trazabilidad"
        />

        <FeatureBlock icon={Wrench} title="Listado y gestión de órdenes">
          <p>
            <DocLink to="/admin/order">Órdenes</DocLink> concentra el trabajo del taller: filtros, tabla
            expandible por orden, actualización de estado y etapa, líneas de presupuesto (servicios y
            repuestos), fotos del equipo y seguimiento de mensajería cuando aplique. Puede exportar la vista
            a PDF o Excel para informes o archivo.
          </p>
        </FeatureBlock>

        <FeatureBlock icon={FileText} title="Nueva orden e impresión">
          <p>
            <DocLink to="/admin/order/new">Nueva orden</DocLink> guía el alta: cliente, equipo (marca,
            modelo, accesorios), flujo de trabajo (p. ej. reparación estándar o garantía), fotos y líneas de
            servicio. Las órdenes existentes se editan desde el listado; existe también vista de impresión
            para entregar documentación en taller.
          </p>
        </FeatureBlock>

        <FeatureBlock icon={Package} title="Etapas configurables (superadmin)">
          <p>
            En <DocLink to="/admin/order/stages">Etapas</DocLink> se define el pipeline: orden, nombre y
            descripción de cada etapa y su relación con el flujo de reparación o garantía. Esas etapas
            alimentan la línea de tiempo que ve el cliente en seguimiento y las plantillas de correo por
            etapa.
          </p>
        </FeatureBlock>

        <FeatureBlock icon={History} title="Movimientos y auditoría">
          <p>
            <DocLink to="/admin/order/movements">Movimientos de órdenes</DocLink> registra los cambios entre
            etapas y deja constancia para auditoría interna. Complementa el detalle que se ve en cada orden
            del listado principal.
          </p>
        </FeatureBlock>
      </div>

      {/* —— Catálogo —— */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SectionTitle
          id="catalogo"
          title="Clientes y catálogo de taller"
          subtitle="Datos maestros que aceleran el ingreso de equipos"
        />

        <FeatureBlock icon={UserCircle} title="Clientes">
          <p>
            <DocLink to="/admin/clients">Clientes</DocLink> almacena fichas de contacto vinculadas a las
            órdenes. Al crear o editar una orden puede reutilizar clientes existentes para mantener historial
            coherente y evitar duplicados.
          </p>
        </FeatureBlock>

        <FeatureBlock icon={Tag} title="Marcas y modelos">
          <p>
            <DocLink to="/admin/brand">Marcas</DocLink> y <DocLink to="/admin/models">Modelos</DocLink>{' '}
            estructuran el catálogo de equipos: al ingresar una orden se seleccionan de listas normalizadas,
            lo que mejora informes y búsquedas.
          </p>
        </FeatureBlock>

        <FeatureBlock icon={Layers} title="Accesorios y productos">
          <p>
            <DocLink to="/admin/accessories">Accesorios</DocLink> y{' '}
            <DocLink to="/admin/products">Productos</DocLink> catalogan ítems que acompañan al equipo o se
            ofrecen en venta; se integran con servicios y líneas de presupuesto cuando el flujo lo requiere.
          </p>
        </FeatureBlock>
      </div>

      {/* —— Servicios —— */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SectionTitle
          id="servicios"
          title="Servicios, repuestos e ingresos"
          subtitle="Precios, inventario y resultado económico"
        />

        <FeatureBlock icon={Package} title="Servicios">
          <p>
            <DocLink to="/admin/services">Servicios</DocLink> define trabajos de taller con precios y, donde
            corresponde, vínculos a repuestos del catálogo. Facilita cargar presupuestos en órdenes con
            montos consistentes.
          </p>
        </FeatureBlock>

        <FeatureBlock icon={Boxes} title="Repuestos">
          <p>
            <DocLink to="/admin/spare">Repuestos</DocLink> gestiona piezas e integración con listas de
            repuestos/servidor cuando está habilitado. El acceso al menú puede depender del rol (servicios +
            repuestos).
          </p>
        </FeatureBlock>

        <FeatureBlock icon={DollarSign} title="Ingresos">
          <p>
            <DocLink to="/admin/income">Ingresos</DocLink> ofrece una vista financiera alineada con las
            órdenes y cobros, para seguimiento de la actividad económica del taller.
          </p>
        </FeatureBlock>

        <FeatureBlock icon={Stethoscope} title="Reglas de pre-diagnóstico">
          <p>
            <DocLink to="/admin/pre-diagnosis">Pre-diagnóstico</DocLink> configura el cuestionario público
            (síntomas, ramas y recomendaciones) que el cliente completa antes de acudir al taller. Las
            reglas son independientes del flujo de órdenes pero orientan expectativas y captación.
          </p>
        </FeatureBlock>
      </div>

      {/* —— Sistema —— */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SectionTitle
          id="sistema"
          title="Empresa, correo y acceso"
          subtitle="Marca, notificaciones por etapa y cuentas del panel"
        />

        <FeatureBlock icon={Building2} title="Datos de empresa">
          <p>
            <DocLink to="/admin/company">Empresa</DocLink> concentra nombre, datos de contacto y elementos
            de marca que pueden mostrarse al cliente en correos y en el sitio público.
          </p>
        </FeatureBlock>

        <FeatureBlock icon={Mail} title="Correo por etapa">
          <p>
            En <DocLink to="/admin/mail">Correo</DocLink> se editan plantillas de asunto y cuerpo por etapa
            y por tipo de flujo (p. ej. estándar o garantía). Use marcadores como{' '}
            <code className="text-xs rounded bg-slate-100 dark:bg-slate-800 px-1 py-0.5 font-mono">
              {'{customer_name}'}
            </code>
            ,{' '}
            <code className="text-xs rounded bg-slate-100 dark:bg-slate-800 px-1 py-0.5 font-mono">
              {'{order_number}'}
            </code>{' '}
            o{' '}
            <code className="text-xs rounded bg-slate-100 dark:bg-slate-800 px-1 py-0.5 font-mono">
              {'{tracking_code}'}
            </code>{' '}
            para personalizar avisos automáticos cuando una orden avanza de etapa.
          </p>
        </FeatureBlock>

        <FeatureBlock icon={Users} title="Usuarios y roles">
          <p>
            <DocLink to="/admin/users">Usuarios</DocLink> crea cuentas del panel;{' '}
            <DocLink to="/admin/roles">Roles</DocLink> asigna qué rutas y menús puede usar cada perfil. Así
            se separa, por ejemplo, personal de taller de quien solo administra catálogo o finanzas.
          </p>
        </FeatureBlock>
      </div>

      {/* —— Público —— */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <SectionTitle
          id="publico"
          title="Sitio público (cliente final)"
          subtitle="Sin cuenta de administrador"
        />

        <FeatureBlock icon={Globe} title="Inicio y blog">
          <p>
            <ExternalDocLink href="/">Inicio</ExternalDocLink> presenta el taller, productos destacados y
            accesos rápidos. <ExternalDocLink href="/blog">Blog</ExternalDocLink> publica artículos si el
            contenido está cargado en el sistema.
          </p>
        </FeatureBlock>

        <FeatureBlock icon={QrCode} title="Seguimiento de orden">
          <p>
            En <ExternalDocLink href="/track">Seguir orden</ExternalDocLink> el cliente introduce su código
            y ve el estado actual, una línea de tiempo de etapas (según configuración), fotos autorizadas,
            notas visibles y, cuando corresponde, descarga de informe técnico. Ciertas etapas especiales
            pueden ocultar el progreso en vivo para proteger información sensible.
          </p>
        </FeatureBlock>

        <FeatureBlock icon={Stethoscope} title="Pre-diagnóstico en línea">
          <p>
            <ExternalDocLink href="/diagnosis">Pre-diagnóstico</ExternalDocLink> ejecuta el cuestionario
            definido en administración: ayuda al usuario a describir el problema antes de visitar el taller y
            puede sugerir el siguiente paso según las reglas configuradas.
          </p>
        </FeatureBlock>
      </div>

      <p className="text-xs text-slate-500 dark:text-slate-500 text-center pt-2 border-t border-slate-200/80 dark:border-slate-600/60">
        Documentación orientativa. Las pantallas pueden variar ligeramente según versión y permisos.
      </p>
      </div>
    </div>
  );
}
