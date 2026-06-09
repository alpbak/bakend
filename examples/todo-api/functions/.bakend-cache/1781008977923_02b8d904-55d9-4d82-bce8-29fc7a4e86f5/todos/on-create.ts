import { onCreate } from "/Users/alpaslanbak/Development/Alp/Bakend/src/core/functions/triggers.ts";

onCreate("todos", async ({ record, logger }) => {
  logger.info(`Todo created: ${record.title}`);
});
