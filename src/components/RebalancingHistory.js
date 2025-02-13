import { useQuery } from "@apollo/client";
import { GET_REBALANCING_HISTORY } from "../lib/subgraph";

export default function RebalancingHistory() {
  const { loading, error, data } = useQuery(GET_REBALANCING_HISTORY);

  if (loading) return <p className="text-gray-400">Loading...</p>;
  if (error) return <p className="text-red-500">Error loading history</p>;

  return (
    <div className="mt-6">
      <h2 className="text-lg font-semibold mb-2">Rebalancing History</h2>
      <div className="overflow-x-auto">
        <table className="w-full text-sm bg-gray-800 rounded-lg overflow-hidden">
          <thead className="bg-gray-700 text-gray-300">
            <tr>
              <th className="p-2 text-left">Old Pool</th>
              <th className="p-2 text-left">New Pool</th>
              <th className="p-2 text-right">Amount</th>
              <th className="p-2 text-right">Yield Before</th>
              <th className="p-2 text-right">Yield After</th>
              <th className="p-2 text-right">Time</th>
            </tr>
          </thead>
          <tbody>
            {data.rebalancingEvents.map((event) => (
              <tr key={event.id} className="border-b border-gray-700">
                <td className="p-2">{event.oldPool}</td>
                <td className="p-2">{event.newPool}</td>
                <td className="p-2 text-right">{event.amount} WBTC</td>
                <td className="p-2 text-right">{event.yieldBefore}%</td>
                <td className="p-2 text-right">{event.yieldAfter}%</td>
                <td className="p-2 text-right">
                  {new Date(event.timestamp * 1000).toLocaleString()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
