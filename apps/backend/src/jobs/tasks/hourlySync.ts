const perseoService = await import('../../services/perseoService.js');
const { Client } = await import('../../models/Client.js');

function toISODate(value: string): string {
  if (!value) return '';
  if (value.includes('T')) return value;
  const m = value.match(/^(\d{4})(\d{2})(\d{2})(\d{2})(\d{2})(\d{2})$/);
  if (!m) return value;
  const [, y, mo, d, h, min, s] = m;
  return `${y}-${mo}-${d}T${h}:${min}:${s}.000Z`;
}

export async function runHourlySync(): Promise<void> {
  const start = Date.now();
  console.log('[Cron] Hourly sync started');

  try {
    const clientsResult = await perseoService.getClients();

    console.log('[Cron] Clients result length:', Array.isArray(clientsResult) ? clientsResult.length : 0);
    const clients = Array.isArray(clientsResult) ? clientsResult : [];
    if (clients.length) {
      let saved = 0;
      for (const c of clients) {
        await Client.findOneAndUpdate(
          { clientesid: c.clientesid },
          {
            clientesid: c.clientesid,
            clientescodigo: c.clientescodigo ?? '',
            estado: c.estado ?? true,
            codigocontable: c.codigocontable ?? '',
            clientes_gruposid: c.clientes_gruposid ?? 0,
            provinciasid: c.provinciasid ?? '',
            provincia: c.provincia ?? '',
            ciudadesid: c.ciudadesid ?? '',
            ciudad: c.ciudad ?? '',
            razonsocial: c.razonsocial ?? '',
            parroquiasid: c.parroquiasid ?? '',
            clientes_zonasid: c.clientes_zonasid ?? 0,
            nombrecomercial: c.nombrecomercial ?? '',
            direccion: c.direccion ?? '',
            identificacion: c.identificacion ?? '',
            tipoidentificacion: c.tipoidentificacion ?? '',
            email: c.email ?? '',
            telefono1: c.telefono1 ?? '',
            telefono2: c.telefono2 ?? '',
            telefono3: c.telefono3 ?? '',
            formasdepagoid: c.formasdepagoid ?? 0,
            tarifasid: c.tarifasid ?? 0,
            vendedoresid: c.vendedoresid ?? 0,
            cobradoresid: c.cobradoresid ?? 0,
            creditocupo: c.creditocupo ?? 0,
            creditodias: c.creditodias ?? 0,
            fechamodificacion: toISODate(c.fechamodificacion ?? ''),
            fechacreacion: toISODate(c.fechacreacion ?? ''),
          },
          { upsert: true, new: true }
        );
        saved++;
      }
      console.log('[Cron] Clients synced:', saved);
    } else {
      console.log('[Cron] Clients: none to sync');
    }

    const elapsed = Date.now() - start;
    console.log('[Cron] Hourly sync finished in', elapsed, 'ms');
  } catch (err) {
    console.error('[Cron] Hourly sync error:', err);
  }
}
