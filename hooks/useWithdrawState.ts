import { useState } from "react";

export function useWithdrawState() {
  const [withdrawModalVisible, setWithdrawModalVisible] = useState(false);
  const [withdrawing, setWithdrawing] = useState(false);
  const [withdrawn, setWithdrawn] = useState(false);

  return {
    withdrawModalVisible, setWithdrawModalVisible,
    withdrawing, setWithdrawing,
    withdrawn, setWithdrawn,
  };
}
