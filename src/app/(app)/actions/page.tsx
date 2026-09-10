import { auth } from "@/auth";
import { getFinanceActions, getFinancialGoals } from "@/db/queries";
import { ActionsClient } from "@/components/actions/ActionsClient";

export default async function ActionsPage() {
  const session = await auth();
  const userId = session!.user.id;
  const [actions, goals] = await Promise.all([getFinanceActions(userId), getFinancialGoals(userId)]);

  return <ActionsClient actions={actions} goals={goals} />;
}
