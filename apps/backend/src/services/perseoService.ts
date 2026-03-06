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

export async function editClient(clientes: PerseoClientEditPayload): Promise<EditClientResult> {
    const body = {
        api_key: process.env.PERSEO_API ?? "",
        registros: [{ clientes }],
    };
    console.log(JSON.stringify(body), '======perseo edit client======');
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
