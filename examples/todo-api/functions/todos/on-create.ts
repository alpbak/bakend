import { onCreate } from "bakend/functions";

onCreate("todos", async ({ record, logger }) => {
  logger.info(`Todo created: ${record.title}`);
});
