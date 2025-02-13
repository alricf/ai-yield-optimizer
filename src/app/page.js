"use client"

import { useState } from "react";
import { ApolloProvider, ApolloClient, InMemoryCache } from "@apollo/client";
import NetworkSelector from "../components/NetworkSelector";
import YieldTolerance from "../components/YieldTolerance";
import RebalancingHistory from "../components/RebalancingHistory";
import AIRebalanceToggle from "../components/AIRebalanceToggle";

const client = new ApolloClient({
  uri: "/api/subgraph",
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
  const [autoRebalance, setAutoRebalance] = useState(false);

console.log("Networks & AMMs:", selection);
console.log("Rebalancing Threshold:", tolerance);
console.log("AI Auto-Rebalancing Enabled:", autoRebalance);


  return (
    <ApolloProvider client={client}>
      <main className="min-h-screen bg-gray-900 text-white flex flex-col items-center justify-center p-6">
        <h1 className="text-3xl font-semibold mb-6">AI Yield Optimizer</h1>

        <div className="w-full max-w-lg bg-gray-800 p-6 rounded-lg shadow-lg">
          <NetworkSelector onSelectionChange={setSelection} />
          <YieldTolerance onToleranceChange={setTolerance} />
          <AIRebalanceToggle onToggle={setAutoRebalance} />
          <RebalancingHistory />
        </div>
      </main>
    </ApolloProvider>
  );
}

