"use client"
import { useState } from "react";
import NetworkSelector from "../components/NetworkSelector";

export default function Home() {
  const [selection, setSelection] = useState({ networks: [], amms: [] });

  return (
    <main className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-4">
      <h1 className="text-4xl font-bold mb-4">AI Yield Optimizer</h1>
      <NetworkSelector onSelectionChange={setSelection} />
      <div className="mt-4 text-center">
        <h2 className="text-lg font-bold">Selected Networks</h2>
        <p>{selection.networks.length ? selection.networks.join(", ") : "None"}</p>
        <h2 className="text-lg font-bold mt-2">Selected AMMs</h2>
        <p>{selection.amms.length ? selection.amms.join(", ") : "None"}</p>
      </div>
    </main>
  );
}
