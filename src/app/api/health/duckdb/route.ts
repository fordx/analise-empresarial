import { NextResponse, type NextRequest } from "next/server";
import { readFile, writeFile, rm } from "node:fs/promises";
import { join } from "node:path";
import { comDuckDB, consultar, literal, DIRETORIO_TEMP } from "@/lib/duckdb";
import { createAdminClient } from "@/lib/supabase/admin";
import { env } from "@/lib/env";

/**
 * Rota de validação da etapa 2: prova que o DuckDB roda neste ambiente (local ou Vercel)
 * e que conseguimos ler do Supabase Storage.
 *
 * GET /api/health/duckdb            -> DuckDB + Parquet em /tmp
 * GET /api/health/duckdb?storage=1  -> + upload/download no Supabase Storage
 * GET /api/health/duckdb?httpfs=1   -> + leitura direta via httpfs (URL assinada)
 * Header obrigatório: x-health-token = HEALTH_CHECK_TOKEN
 */
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const BUCKET = "dados-empresas";
const inicioModulo = Date.now();
let execucoes = 0;

type Etapa = { etapa: string; ok: boolean; ms: number; detalhe?: unknown; erro?: string };

async function medir(etapas: Etapa[], etapa: string, fn: () => Promise<unknown>) {
  const t0 = performance.now();
  try {
    const detalhe = await fn();
    etapas.push({ etapa, ok: true, ms: Math.round(performance.now() - t0), detalhe });
    return true;
  } catch (e) {
    const erro = e instanceof Error ? e.message : String(e);
    etapas.push({ etapa, ok: false, ms: Math.round(performance.now() - t0), erro });
    return false;
  }
}

export async function GET(request: NextRequest) {
  const token = env("HEALTH_CHECK_TOKEN");
  if (!token || request.headers.get("x-health-token") !== token) {
    return NextResponse.json({ erro: "não encontrado" }, { status: 404 });
  }

  const testarStorage = request.nextUrl.searchParams.has("storage");
  const testarHttpfs = request.nextUrl.searchParams.has("httpfs");
  const coldStart = execucoes++ === 0;
  const etapas: Etapa[] = [];
  const arquivoLocal = join(DIRETORIO_TEMP, `health-${Date.now()}.parquet`);
  const caminhoStorage = `_healthcheck/health-${Date.now()}.parquet`;

  await comDuckDB(async (con) => {
    await medir(etapas, "query_basica", () =>
      consultar(con, "SELECT version() AS versao, sum(i)::BIGINT AS soma FROM range(1000000) t(i)"),
    );

    // 200 mil lançamentos sintéticos -> Parquet -> agregação, como o motor fará.
    await medir(etapas, "gravar_parquet_tmp", async () => {
      await con.run(`
        COPY (
          SELECT
            i AS id,
            DATE '2025-01-01' + (i % 365)::INTEGER AS data,
            '3.1.' || (i % 40) AS conta,
            round(((i * 7919) % 100000) / 100.0, 2)::DECIMAL(18,2) AS valor
          FROM range(200000) t(i)
        ) TO ${literal(arquivoLocal)} (FORMAT parquet)
      `);
    });

    await medir(etapas, "ler_parquet_tmp", () =>
      consultar(
        con,
        `SELECT count(*)::INTEGER AS linhas, sum(valor)::DOUBLE AS total, count(DISTINCT conta)::INTEGER AS contas
         FROM read_parquet(${literal(arquivoLocal)})`,
      ),
    );

    if (testarStorage || testarHttpfs) {
      const supabase = createAdminClient();

      const subiu = await medir(etapas, "storage_upload", async () => {
        const { data: bucket } = await supabase.storage.getBucket(BUCKET);
        if (!bucket) {
          const { error } = await supabase.storage.createBucket(BUCKET, { public: false });
          if (error) throw error;
        }
        const { error } = await supabase.storage
          .from(BUCKET)
          .upload(caminhoStorage, await readFile(arquivoLocal), {
            contentType: "application/vnd.apache.parquet",
          });
        if (error) throw error;
        return { bucket: BUCKET, caminho: caminhoStorage };
      });

      if (subiu && testarStorage) {
        const baixado = join(DIRETORIO_TEMP, `baixado-${Date.now()}.parquet`);
        await medir(etapas, "storage_download_para_tmp_e_ler", async () => {
          const { data, error } = await supabase.storage.from(BUCKET).download(caminhoStorage);
          if (error) throw error;
          await writeFile(baixado, Buffer.from(await data.arrayBuffer()));
          return consultar(
            con,
            `SELECT count(*)::INTEGER AS linhas, sum(valor)::DOUBLE AS total FROM read_parquet(${literal(baixado)})`,
          );
        });
        await rm(baixado, { force: true });
      }

      if (subiu && testarHttpfs) {
        await medir(etapas, "httpfs_install_load", async () => {
          await con.run("INSTALL httpfs; LOAD httpfs;");
        });
        await medir(etapas, "httpfs_ler_url_assinada", async () => {
          const { data, error } = await supabase.storage
            .from(BUCKET)
            .createSignedUrl(caminhoStorage, 60);
          if (error) throw error;
          return consultar(
            con,
            `SELECT count(*)::INTEGER AS linhas, sum(valor)::DOUBLE AS total FROM read_parquet(${literal(data.signedUrl)})`,
          );
        });
      }

      if (subiu) await supabase.storage.from(BUCKET).remove([caminhoStorage]);
    }
  });

  await rm(arquivoLocal, { force: true });

  const memoria = process.memoryUsage();
  return NextResponse.json({
    ok: etapas.every((e) => e.ok),
    ambiente: {
      node: process.version,
      plataforma: `${process.platform}-${process.arch}`,
      vercel: Boolean(process.env.VERCEL),
      regiao: process.env.VERCEL_REGION ?? null,
      cold_start: coldStart,
      ms_desde_carga_do_modulo: Date.now() - inicioModulo,
      memoria_rss_mb: Math.round(memoria.rss / 1024 / 1024),
      memoria_heap_mb: Math.round(memoria.heapUsed / 1024 / 1024),
    },
    etapas,
  });
}
