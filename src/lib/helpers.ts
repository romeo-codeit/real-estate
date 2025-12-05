export const formatAmount = (amount: number, currency?: string): string => {
  const formatter = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency || 'USD',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return formatter.format(amount);
};

export const truncateText = (text: string, limit: number) => {
  return text.length > limit ? text.slice(0, limit) + '...' : text;
};

export async function callService<T>(
  serviceFn: () => Promise<T>
): Promise<{ data: T | null; error: unknown | null }> {
  try {
    const data = await serviceFn();
    return { data, error: null };
  } catch (error) {
    return { data: null, error };
  }
}
