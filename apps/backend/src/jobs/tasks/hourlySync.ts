const perseoService = await import('../../services/perseoService.js');
const { Client } = await import('../../models/Client.js');
const { SpareServer } = await import('../../models/SpareServer.js');
const { ServiceSparePart } = await import('../../models/ServiceSparePart.js');
const {
  descriptionFromPayload,
  descriptionIndicatesServicio,
  precioFromPayload,
  stockFromPayload,
} = await import('../../services/perseoProductFields.js');

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

    const products = await perseoService.getProducts('');
    console.log('[Cron] Perseo products fetched:', Array.isArray(products) ? products.length : 0);
    if (products.length) {
      let spareSaved = 0;
      let servicePartSynced = 0;
      for (const p of products) {
        const productosid = typeof p.productosid === 'number' ? p.productosid : Number(p.productosid);
        if (productosid == null || Number.isNaN(productosid)) {
          console.warn('[Cron] SpareServer: skip row without productosid');
          continue;
        }
        const productocodigo = typeof p.productocodigo === 'string' ? p.productocodigo : String(p.productocodigo ?? '');
        const payload = p as Record<string, unknown>;
        const description = descriptionFromPayload(payload);
        const isServicio = Boolean(description && descriptionIndicatesServicio(description));

        if (!isServicio) {
          await SpareServer.findOneAndUpdate(
            { productosid },
            {
              productosid,
              productocodigo,
              payload,
            },
            { upsert: true, new: true }
          );
          spareSaved++;
        } else {
          await SpareServer.deleteOne({ productosid });
        }

        if (isServicio) {
          const name = productocodigo.trim() || `Perseo ${productosid}`;
          const price = precioFromPayload(payload) ?? 0;
          const amount = stockFromPayload(payload) ?? 0;
          await ServiceSparePart.findOneAndUpdate(
            { type: 'service', name },
            {
              type: 'service',
              name,
              price,
              amount,
              details: description,
              state: 'active',
            },
            { upsert: true, new: true }
          );
          servicePartSynced++;
        }
      }

      const spareDocs = await SpareServer.find({}).lean();
      let removedServicioSpares = 0;
      for (const doc of spareDocs) {
        const payload = (doc.payload ?? {}) as Record<string, unknown>;
        const desc = descriptionFromPayload(payload);
        if (desc && descriptionIndicatesServicio(desc)) {
          await SpareServer.deleteOne({ _id: doc._id });
          removedServicioSpares++;
        }
      }
      if (removedServicioSpares) {
        console.log('[Cron] SpareServer removed rows with SERVICIO in description:', removedServicioSpares);
      }

      console.log('[Cron] SpareServer (Perseo products) synced:', spareSaved);
      if (servicePartSynced) {
        console.log('[Cron] ServiceSparePart (SERVICIO in description) synced:', servicePartSynced);
      }
    } else {
      console.log('[Cron] SpareServer: none to sync');
    }

    const elapsed = Date.now() - start;
    console.log('[Cron] Hourly sync finished in', elapsed, 'ms');
  } catch (err) {
    console.error('[Cron] Hourly sync error:', err);
  }
}
