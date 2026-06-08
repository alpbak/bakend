import { onCreate } from "bakend/functions";

onCreate("posts", async ({ record, logger }) => {
  logger.info(`Post created: ${record.title}`);
});
