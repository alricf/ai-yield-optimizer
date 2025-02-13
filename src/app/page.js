"use client"

import { useState } from "react";
import { ApolloProvider, ApolloClient, InMemoryCache } from "@apollo/client";
import NetworkSelector from "../components/NetworkSelector";
import YieldTolerance from "../components/YieldTolerance";
import RebalancingHistory from "../components/RebalancingHistory";

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

  return (
    <ApolloProvider client={client}>
      <main className="min-h-screen bg-background text-foreground flex flex-col items-center justify-center p-4">
        <h1 className="text-4xl font-bold mb-4">AI Yield Optimizer</h1>
        <NetworkSelector onSelectionChange={setSelection} />
        <YieldTolerance onToleranceChange={setTolerance} />
        <RebalancingHistory />
      </main>
    </ApolloProvider>
  );
}

