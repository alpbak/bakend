export const schedule = "*/1 * * * *";

export default async ({ logger }) => {
  logger.info("Heartbeat job ran");
};
