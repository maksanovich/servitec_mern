type GetClientParams = {
    clienteid?: string;
    clientescodigo?: string;
    identificacion?: string;
    contenido?: string;
};

export async function getClients(params: GetClientParams = {}) {
    const body: Record<string, string> = {
        api_key: process.env.PERSEO_API ?? "",
    };

    if (params.clienteid != null && params.clienteid !== "") body.clienteid = params.clienteid;
    if (params.clientescodigo != null && params.clientescodigo !== "") body.clientescodigo = params.clientescodigo;
    if (params.identificacion != null && params.identificacion !== "") body.identificacion = params.identificacion;
    if (params.contenido != null && params.contenido !== "") body.contenido = params.contenido;

    const clientRes = await fetch(`${process.env.PERSEO_DATA_C3_APP}clientes_consulta`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });

    if (clientRes.status === 200) {
        const tempData = (await clientRes.json()) as { clientes?: unknown };
        return tempData.clientes ?? [];
    }
    return [];
}

export type PerseoProductRow = Record<string, unknown> & {
    productosid?: number;
    productocodigo?: string;
};

function normalizeTarifasValue(v: unknown): unknown[] {
    if (Array.isArray(v)) return v;
    if (v != null && typeof v === 'object') {
        const rec = v as Record<string, unknown>;
        const preferred = ['unidadinterna', 'unidadventa', 'unidadcompra', 'tarifas', 'items', 'list'];
        for (const k of preferred) {
            const maybe = rec[k];
            if (Array.isArray(maybe)) return maybe;
        }
        for (const maybe of Object.values(rec)) {
            if (Array.isArray(maybe)) return maybe;
        }
    }
    return [];
}

/** Keep backend payload format stable even if Perseo changes nested fields. */
function normalizePerseoProductRow(row: PerseoProductRow): PerseoProductRow {
    return {
        ...row,
        tarifas: normalizeTarifasValue((row as Record<string, unknown>).tarifas),
    };
}

/**
 * Perseo `productos_consulta` — full catalog when productocodigo is empty.
 * Uses PERSEO_DATA_C3_APP + productos_consulta (same base as clientes_consulta).
 */
export async function getProducts(productocodigo = ''): Promise<PerseoProductRow[]> {
    const body = {
        api_key: process.env.PERSEO_API ?? '',
        productocodigo,
        mostrarubicaciones: true,
    };
    const res = await fetch(`${process.env.PERSEO_DATA_C3_APP}productos_consulta`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
    if (res.status !== 200) {
        const text = await res.text().catch(() => '');
        console.warn('[Perseo] productos_consulta failed', res.status, text.slice(0, 300));
        return [];
    }
    const data: unknown = await res.json();
    if (Array.isArray(data)) {
        return (data as PerseoProductRow[]).map(normalizePerseoProductRow);
    }
    if (data && typeof data === 'object' && 'productos' in data) {
        const list = (data as { productos?: unknown }).productos;
        if (Array.isArray(list)) return (list as PerseoProductRow[]).map(normalizePerseoProductRow);
    }
    return [];
}

/** MIME from decoded image bytes (Perseo returns raw base64 without a data URL). */
function mimeFromImageBuffer(buf: Buffer): string {
    if (buf.length >= 4 && buf[0] === 0x89 && buf[1] === 0x50 && buf[2] === 0x4e && buf[3] === 0x47) {
        return 'image/png';
    }
    if (buf.length >= 3 && buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) {
        return 'image/jpeg';
    }
    if (buf.length >= 6 && buf[0] === 0x47 && buf[1] === 0x49 && buf[2] === 0x46 && buf[3] === 0x38) {
        return 'image/gif';
    }
    if (
        buf.length >= 12 &&
        buf.slice(0, 4).toString('ascii') === 'RIFF' &&
        buf.slice(8, 12).toString('ascii') === 'WEBP'
    ) {
        return 'image/webp';
    }
    return 'image/jpeg';
}

/**
 * Turns Perseo `imagen` values into a string suitable for `<img src>`.
 * Handles full data URLs, URLs, raw base64 (any length), URL-safe base64, and whitespace in the payload.
 */
function normalizePerseoImageSrc(raw: string): string {
    const s = raw.trim();
    if (
        s.startsWith('data:') ||
        s.startsWith('http://') ||
        s.startsWith('https://') ||
        s.startsWith('blob:')
    ) {
        return s;
    }
    // Do not treat JPEG base64 as a path: FFD8FF… encodes to "/9j/…".
    if (s.startsWith('/') && !s.startsWith('/9j/')) return s;

    let payload = s.replace(/\s/g, '');
    const lower = payload.toLowerCase();
    const b64Marker = ';base64,';
    const idx = lower.indexOf(b64Marker);
    if (idx !== -1) {
        payload = payload.slice(idx + b64Marker.length);
    } else if (lower.startsWith('base64,')) {
        payload = payload.slice(7);
    }

    const standardB64 = payload.replace(/-/g, '+').replace(/_/g, '/');
    if (!/^[A-Za-z0-9+/=]+$/.test(standardB64) || standardB64.length < 4) {
        return s;
    }

    let buf: Buffer;
    try {
        buf = Buffer.from(standardB64, 'base64');
    } catch {
        return s;
    }
    if (!buf.length) return s;

    const mime = mimeFromImageBuffer(buf);
    return `data:${mime};base64,${buf.toString('base64')}`;
}

function imagenStringFromApiRow(row: unknown): string | null {
    if (row == null) return null;
    if (typeof row === 'string') {
        const t = row.trim();
        return t || null;
    }
    if (typeof row === 'object' && !Array.isArray(row)) {
        const o = row as Record<string, unknown>;
        for (const k of ['imagen', 'base64', 'data', 'contenido', 'image']) {
            const v = o[k];
            if (typeof v === 'string' && v.trim()) return v.trim();
        }
    }
    return null;
}

/**
 * Perseo `productos_imagenes_consulta` — first image for a product (same as DigitalServer perseo.getProductImage).
 */
export async function getProductImage(productosid: number): Promise<{ ok: true; src: string } | { ok: false }> {
    const res = await fetch(`${process.env.PERSEO_DATA_C3_APP}productos_imagenes_consulta`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            api_key: process.env.PERSEO_API ?? '',
            productosid,
        }),
    });
    if (res.status !== 200) {
        const text = await res.text().catch(() => '');
        console.warn('[Perseo] productos_imagenes_consulta failed', res.status, text.slice(0, 200));
        return { ok: false };
    }
    const tempData = (await res.json()) as { productos_imagenes?: unknown };
    const list = tempData.productos_imagenes;
    if (!Array.isArray(list) || !list.length) return { ok: false };
    const imagen = imagenStringFromApiRow(list[0]);
    if (!imagen) return { ok: false };
    return { ok: true, src: normalizePerseoImageSrc(imagen) };
}

/** Payload for Perseo clientes_editar: full client object with usuariomodificacion and fechamodificacion */
export type PerseoClientEditPayload = {
    clientesid: number;
    clientescodigo: string;
    codigocontable: string;
    clientes_gruposid: number;
    provinciasid: string;
    ciudadesid: string;
    razonsocial: string;
    parroquiasid: string;
    clientes_zonasid: number;
    clientes_rutasid: number;
    nombrecomercial: string;
    direccion: string;
    identificacion: string;
    tipoidentificacion: string;
    email: string;
    telefono1: string;
    telefono2: string;
    telefono3: string;
    vendedoresid: number;
    cobradoresid: number;
    creditocupo: number;
    creditodias: number;
    estado: boolean;
    tarifasid: number;
    forma_pago_empresaid: number;
    ordenvisita: number;
    latitud: string;
    longitud: string;
    usuariomodificacion: string;
    fechamodificacion: string;
};

export type EditClientResult = { ok: true } | { ok: false; error: string };

export type PerseoClientCreatePayload = {
    clientesid: number;
    clientescodigo: string;
    codigocontable: string;
    clientes_gruposid: number;
    provinciasid: string;
    ciudadesid: string;
    razonsocial: string;
    parroquiasid: string;
    clientes_zonasid: number;
    clientes_rutasid: number;
    nombrecomercial: string;
    direccion: string;
    identificacion: string;
    tipoidentificacion: string;
    email: string;
    telefono1: string;
    telefono2: string;
    telefono3: string;
    vendedoresid: number;
    cobradoresid: number;
    creditocupo: number;
    creditodias: number;
    estado: boolean;
    tarifasid: number;
    forma_pago_empresaid: number;
    ordenvisita: number;
    latitud: string;
    longitud: string;
    usuariocreacion: string;
    fechacreacion: string;
    fechamodificacion: string;
};

export type CreateClientResult =
    | { ok: true; clientesid_nuevo: number; clientes_codigo: string; uuid: string }
    | { ok: false; error: string };

export async function createClient(clientes: PerseoClientCreatePayload): Promise<CreateClientResult> {
    const body = {
        api_key: process.env.PERSEO_API ?? "",
        registros: [{ clientes }],
    };
    const res = await fetch(`${process.env.PERSEO_DATA_C3_APP}clientes_crear`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });
    if (!res.ok) {
        const text = await res.text();
        let errorMessage = `Perseo clientes_crear failed (${res.status})`;
        if (text) {
            try {
                const data = JSON.parse(text) as { message?: string; error?: string };
                const msg = data.message ?? data.error;
                if (typeof msg === "string" && msg) errorMessage = msg;
            } catch {
                errorMessage = text.slice(0, 200);
            }
        }
        return { ok: false, error: errorMessage };
    }
    const data = (await res.json()) as { clientes?: Array<{ clientesid_nuevo?: number; clientes_codigo?: string; uuid?: string }> };
    const first = data.clientes?.[0];
    if (!first || first.clientesid_nuevo == null) {
        return { ok: false, error: "Perseo did not return client id" };
    }
    return {
        ok: true,
        clientesid_nuevo: first.clientesid_nuevo,
        clientes_codigo: first.clientes_codigo ?? "",
        uuid: first.uuid ?? "",
    };
}

export async function editClient(clientes: PerseoClientEditPayload): Promise<EditClientResult> {
    const body = {
        api_key: process.env.PERSEO_API ?? "",
        registros: [{ clientes }],
    };
    const res = await fetch(`${process.env.PERSEO_DATA_C3_APP}clientes_editar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });
    if (res.ok) return { ok: true };
    const text = await res.text();
    let errorMessage = `Perseo clientes_editar failed (${res.status})`;
    if (text) {
        try {
            const data = JSON.parse(text) as { message?: string; error?: string };
            const msg = data.message ?? data.error;
            if (typeof msg === 'string' && msg) errorMessage = msg;
        } catch {
            errorMessage = text.slice(0, 200);
        }
    }
    return { ok: false, error: errorMessage };
}

export type PerseoClientDeletePayload = {
    clientesid: number;
    empresaid?: number;
    usuarioid?: number;
};

export type DeleteClientResult = { ok: true } | { ok: false; error: string };

export async function deleteClient(payload: PerseoClientDeletePayload): Promise<DeleteClientResult> {
    const body: Record<string, unknown> = {
        api_key: process.env.PERSEO_API ?? "",
        clientesid: payload.clientesid,
    };
    if (payload.empresaid != null) body.empresaid = payload.empresaid;
    if (payload.usuarioid != null) body.usuarioid = payload.usuarioid;

    const res = await fetch(`${process.env.PERSEO_DATA_C3_APP}clientes_eliminar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
    });
    if (res.ok) return { ok: true };
    const text = await res.text();
    let errorMessage = `Perseo clientes_eliminar failed (${res.status})`;
    if (text) {
        try {
            const data = JSON.parse(text) as { message?: string; error?: string };
            const msg = data.message ?? data.error;
            if (typeof msg === "string" && msg) errorMessage = msg;
        } catch {
            errorMessage = text.slice(0, 200);
        }
    }
    return { ok: false, error: errorMessage };
}
