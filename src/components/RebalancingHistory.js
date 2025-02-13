export default function RebalancingHistory() {
  const placeholderData = [
    {
      id: "1",
      oldPool: "Uniswap",
      newPool: "SushiSwap",
      amount: "5.2 WBTC",
      yieldBefore: "2.5%",
      yieldAfter: "3.2%",
      timestamp: 1707768468000, // Static Unix timestamp
    },
    {
      id: "2",
      oldPool: "Balancer",
      newPool: "Aave",
      amount: "3.8 WBTC",
      yieldBefore: "1.8%",
      yieldAfter: "2.7%",
      timestamp: 1707768468000, // Static Unix timestamp
    },
  ];

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
            {placeholderData.map((event) => (
              <tr key={event.id} className="border-b border-gray-700">
                <td className="p-2">{event.oldPool}</td>
                <td className="p-2">{event.newPool}</td>
                <td className="p-2 text-right">{event.amount}</td>
                <td className="p-2 text-right">{event.yieldBefore}</td>
                <td className="p-2 text-right">{event.yieldAfter}</td>
                <td className="p-2 text-right">
                  {new Date(event.timestamp).toLocaleString()} {/* Format on client */}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
