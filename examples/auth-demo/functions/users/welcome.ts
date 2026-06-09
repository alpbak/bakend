import { onRegister } from "bakend/functions";

onRegister("users", async ({ record, logger }) => {
  logger.info(`Welcome, ${record.email as string}!`);
});
