"use client";

import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";

export default function RegisterPage() {
  const { register, handleSubmit } = useForm();
  const router = useRouter();
  const { setAuth } = useAuth();

  const onSubmit = async (data: any) => {
    // Make yourself admin for the first account
    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...data, role: "admin" }),
    });
    const json = await res.json();
    if (!res.ok) return alert(json?.error || "Failed");
    setAuth(json.token, json.user);
    router.push("/dashboard");
  };

  return (
    <div className="max-w-sm mx-auto">
      <h1 className="text-2xl font-semibold mb-4">Create Admin</h1>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        <input className="w-full px-3 py-2 bg-zinc-900 rounded border border-zinc-800" placeholder="Name" {...register("name")} />
        <input className="w-full px-3 py-2 bg-zinc-900 rounded border border-zinc-800" placeholder="Email" {...register("email")} />
        <input className="w-full px-3 py-2 bg-zinc-900 rounded border border-zinc-800" placeholder="Password" type="password" {...register("password")} />
        <button className="w-full py-2 bg-white text-black rounded">Create</button>
      </form>
    </div>
  );
}
