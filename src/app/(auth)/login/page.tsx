import { FormularioLogin } from "./formulario-login";

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { proximo } = await searchParams;

  return (
    <main className="flex flex-1 items-center justify-center p-4">
      <FormularioLogin proximo={typeof proximo === "string" ? proximo : undefined} />
    </main>
  );
}
