"use client";

import { useState } from "react";
import { ApolloProvider, ApolloClient, InMemoryCache } from "@apollo/client";
import NetworkSelector from "../components/NetworkSelector";
import YieldTolerance from "../components/YieldTolerance";
import RebalancingHistory from "../components/RebalancingHistory";

const client = new ApolloClient({
  uri: "/api/subgraph", // ✅ Fixed: Correct API path
  cache: new InMemoryCache(),
  defaultOptions: {
    query: {
      fetchPolicy: "no-cache",
    },
  },
});

export default function Home() {
  const [selection, setSelection] = useState({ networks: [], amms: [] });
  const [tolerance, setTolerance] = useState(5);

  return (
    <ApolloProvider client={client}>
      <main className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-6">
        <h1 className="text-3xl font-semibold mb-6">AI Yield Optimizer</h1>

        <div className="w-full max-w-lg bg-gray-800 p-6 rounded-lg shadow-lg">
          <NetworkSelector onSelectionChange={setSelection} />
          <YieldTolerance onToleranceChange={setTolerance} />
          <RebalancingHistory />
        </div>
      </main>
    </ApolloProvider>
  );
}
