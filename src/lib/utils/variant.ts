export const getSmallestVariant = (variants: any[] | undefined, size?: string | null): string => {
  if (!variants || variants.length === 0) {
    return size || "";
  }
  
  // Parse numerical values to sort (e.g. "50ml", "100ml", "10g")
  const sorted = [...variants].sort((a, b) => {
    const strA = typeof a === 'string' ? a : a.size;
    const strB = typeof b === 'string' ? b : b.size;
    const valA = parseFloat(strA) || 0;
    const valB = parseFloat(strB) || 0;
    return valA - valB;
  });
  
  const smallest = sorted[0];
  return (typeof smallest === 'string' ? smallest : smallest?.size) || size || "";
};
