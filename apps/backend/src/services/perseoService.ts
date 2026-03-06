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
