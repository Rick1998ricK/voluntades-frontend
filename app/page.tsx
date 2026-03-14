"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import api from "../src/lib/axios";

export default function Home() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();

  useEffect(() => {
    api.get("/")
      .then((res) => console.log(res.data))
      .catch((err) => console.error("API ERROR:", err.message));
  }, []);

  useEffect(() => {
    if (isAuthenticated) {
      router.push("/admin");
    } else {
      router.push("/login");
    }
  }, [isAuthenticated]);

  return (
    <div
      className="flex items-center justify-center min-h-screen"
      style={{ background: "#070d14" }}
    >
      {/* Orbs de fondo */}
      <div style={{
        position: "fixed", top: "-120px", left: "-120px",
        width: "450px", height: "450px", borderRadius: "50%",
        background: "radial-gradient(circle, rgba(46,111,168,0.14), transparent 70%)",
        pointerEvents: "none",
      }} />
      <div style={{
        position: "fixed", bottom: "-100px", right: "-100px",
        width: "380px", height: "380px", borderRadius: "50%",
        background: "radial-gradient(circle, rgba(232,114,42,0.11), transparent 70%)",
        pointerEvents: "none",
      }} />

      {/* Spinner */}
      <div className="text-center space-y-4 relative z-10">
        <div
          className="w-12 h-12 rounded-full mx-auto animate-spin"
          style={{
            border: "3px solid rgba(46,111,168,0.2)",
            borderTopColor: "#2E6FA8",
          }}
        />
        <p style={{ color: "rgba(255,255,255,0.30)", fontSize: 13 }}>
          Redirigiendo...
        </p>
      </div>
    </div>
  );
}