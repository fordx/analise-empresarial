import "server-only";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { mkdirSync } from "node:fs";
import { DuckDBInstance, type DuckDBConnection } from "@duckdb/node-api";

/** Diretório gravável: na Vercel só /tmp é gravável. */
export const DIRETORIO_TEMP = join(tmpdir(), "analise-empresarial");

/**
 * Abre um DuckDB em memória, executa `fn` e fecha tudo ao final.
 * Uma instância por operação: nada de estado compartilhado entre requisições/empresas.
 */
export async function comDuckDB<T>(fn: (con: DuckDBConnection) => Promise<T>): Promise<T> {
  mkdirSync(DIRETORIO_TEMP, { recursive: true });

  const instancia = await DuckDBInstance.create(":memory:", {
    // Home, extensões e spill em /tmp (o home padrão é somente leitura na Vercel).
    home_directory: DIRETORIO_TEMP,
    extension_directory: join(DIRETORIO_TEMP, "extensoes"),
    temp_directory: join(DIRETORIO_TEMP, "spill"),
    memory_limit: process.env.DUCKDB_MEMORY_LIMIT ?? "1GB",
    threads: process.env.DUCKDB_THREADS ?? "2",
  });
  const con = await instancia.connect();
  try {
    return await fn(con);
  } finally {
    con.closeSync();
    instancia.closeSync();
  }
}

/** Executa uma query e devolve as linhas como objetos JSON-serializáveis. */
export async function consultar<T = Record<string, unknown>>(
  con: DuckDBConnection,
  sql: string,
  parametros?: Record<string, string | number | boolean | null>,
): Promise<T[]> {
  const leitor = await con.runAndReadAll(sql, parametros);
  return leitor.getRowObjectsJson() as T[];
}

/** Escapa um caminho de arquivo para uso literal em SQL (read_parquet, COPY ... TO). */
export function literal(caminho: string): string {
  return `'${caminho.replaceAll("\\", "/").replaceAll("'", "''")}'`;
}
