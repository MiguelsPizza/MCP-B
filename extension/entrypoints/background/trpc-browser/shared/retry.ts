type AllowPromise<T> = T | Promise<T>;

export const wait = (ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms));

export async function retry<T>(
  fn: () => AllowPromise<T>,
  maxTimes: number,
  wait: (retry: number) => Promise<void>
): Promise<T> {
  let error;
  for (let i = 0; i < maxTimes; i++) {
    try {
      return await fn();
    } catch (e) {
      error = e;
      await wait(1 + i);
    }
  }
  throw error;
}
