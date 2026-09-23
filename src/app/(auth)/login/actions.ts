"use server";

import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";

const credenciaisSchema = z.object({
  email: z.email("Informe um e-mail válido."),
  senha: z.string().min(8, "A senha precisa ter pelo menos 8 caracteres."),
  proximo: z.string().optional(),
});

export type EstadoLogin = { erro?: string; mensagem?: string };

function destinoSeguro(proximo?: string) {
  // Evita open redirect: só aceita caminhos internos.
  return proximo && proximo.startsWith("/") && !proximo.startsWith("//")
    ? proximo
    : "/empresas";
}

export async function entrar(
  _estado: EstadoLogin,
  formData: FormData,
): Promise<EstadoLogin> {
  const dados = credenciaisSchema.safeParse(Object.fromEntries(formData));
  if (!dados.success) return { erro: dados.error.issues[0].message };

  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({
    email: dados.data.email,
    password: dados.data.senha,
  });
  if (error) return { erro: "E-mail ou senha incorretos." };

  redirect(destinoSeguro(dados.data.proximo));
}

export async function cadastrar(
  _estado: EstadoLogin,
  formData: FormData,
): Promise<EstadoLogin> {
  const dados = credenciaisSchema.safeParse(Object.fromEntries(formData));
  if (!dados.success) return { erro: dados.error.issues[0].message };

  const origem = (await headers()).get("origin");
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signUp({
    email: dados.data.email,
    password: dados.data.senha,
    options: { emailRedirectTo: `${origem}/auth/confirmar` },
  });
  if (error) return { erro: error.message };

  // Com confirmação de e-mail desativada, o Supabase já devolve a sessão.
  if (data.session) redirect("/empresas");
  return { mensagem: "Enviamos um link de confirmação para o seu e-mail." };
}

export async function sair() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/login");
}
