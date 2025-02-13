"use client";
import { useQuery } from "@apollo/client";
import { GET_REBALANCING_HISTORY } from "../lib/subgraph"; // Ensure this file exists!

export default function RebalancingHistory() {
  const { loading, error, data } = useQuery(GET_REBALANCING_HISTORY);

  if (loading) return <p className="text-white">Loading...</p>;
  if (error) return <p className="text-red-500">Error loading history</p>;

  return (
    <div className="p-4 bg-gray-900 rounded-xl text-white mt-4">
      <h2 className="text-lg font-bold mb-2">Rebalancing History</h2>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-700">
            <th className="text-left p-2">Old Pool</th>
            <th className="text-left p-2">New Pool</th>
            <th className="text-right p-2">Amount</th>
            <th className="text-right p-2">Yield Before</th>
            <th className="text-right p-2">Yield After</th>
            <th className="text-right p-2">Time</th>
          </tr>
        </thead>
        <tbody>
          {data.rebalancingEvents.map((event) => (
            <tr key={event.id} className="border-b border-gray-800">
              <td className="p-2">{event.oldPool}</td>
              <td className="p-2">{event.newPool}</td>
              <td className="p-2 text-right">{event.amount} WBTC</td>
              <td className="p-2 text-right">{event.yieldBefore}%</td>
              <td className="p-2 text-right">{event.yieldAfter}%</td>
              <td className="p-2 text-right">{new Date(event.timestamp * 1000).toLocaleString()}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
