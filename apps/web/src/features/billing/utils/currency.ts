/**
 * Format currency amount with proper symbol and formatting
 */
export function formatCurrency(
  amount: number,
  currencyCode: string = 'pln'
): string {
  const code = currencyCode.toLowerCase();

  // Currency symbols map
  const currencySymbols: Record<
    string,
    { symbol: string; position: 'before' | 'after' }
  > = {
    pln: { symbol: 'zł', position: 'after' },
    eur: { symbol: '€', position: 'before' },
    usd: { symbol: '$', position: 'before' },
    gbp: { symbol: '£', position: 'before' },
    jpy: { symbol: '¥', position: 'before' },
    chf: { symbol: 'CHF', position: 'after' },
    cad: { symbol: 'C$', position: 'before' },
    aud: { symbol: 'A$', position: 'before' },
  };

  const config = currencySymbols[code] || {
    symbol: code.toUpperCase(),
    position: 'after',
  };
  const formattedAmount = amount.toFixed(2);

  if (config.position === 'before') {
    return `${config.symbol}${formattedAmount}`;
  } else {
    return `${formattedAmount} ${config.symbol}`;
  }
}
