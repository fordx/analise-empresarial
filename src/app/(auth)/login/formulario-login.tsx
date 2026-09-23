"use client";

import { useActionState, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cadastrar, entrar, type EstadoLogin } from "./actions";

export function FormularioLogin({ proximo }: { proximo?: string }) {
  const [modo, setModo] = useState<"entrar" | "cadastrar">("entrar");
  const [estado, acao, pendente] = useActionState<EstadoLogin, FormData>(
    modo === "entrar" ? entrar : cadastrar,
    {},
  );

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>{modo === "entrar" ? "Entrar" : "Criar conta"}</CardTitle>
        <CardDescription>Análise Empresarial com IA</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={acao} className="flex flex-col gap-4">
          <input type="hidden" name="proximo" value={proximo ?? ""} />
          <div className="flex flex-col gap-2">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" name="email" type="email" required autoComplete="email" />
          </div>
          <div className="flex flex-col gap-2">
            <Label htmlFor="senha">Senha</Label>
            <Input
              id="senha"
              name="senha"
              type="password"
              required
              minLength={8}
              autoComplete={modo === "entrar" ? "current-password" : "new-password"}
            />
          </div>

          {estado.erro && <p className="text-sm text-destructive">{estado.erro}</p>}
          {estado.mensagem && <p className="text-sm text-muted-foreground">{estado.mensagem}</p>}

          <Button type="submit" disabled={pendente}>
            {pendente ? "Aguarde..." : modo === "entrar" ? "Entrar" : "Criar conta"}
          </Button>
          <Button
            type="button"
            variant="link"
            onClick={() => setModo(modo === "entrar" ? "cadastrar" : "entrar")}
          >
            {modo === "entrar" ? "Não tem conta? Cadastre-se" : "Já tem conta? Entrar"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
