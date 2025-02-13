import { gql } from "@apollo/client";

export const GET_REBALANCING_HISTORY = gql`
  query GetRebalancingHistory {
    rebalancingEvents(orderBy: timestamp, orderDirection: desc, first: 10) {
      id
      oldPool
      newPool
      amount
      yieldBefore
      yieldAfter
      timestamp
    }
  }
`;
