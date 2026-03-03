import { MenuItem, Order, OrderItem } from '@/api/types';

export const getMerchantMenuItemBasePrice = (menuItem: Partial<MenuItem> | null | undefined): number => {
  const originalPrice = menuItem?.originalPrice;
  if (typeof originalPrice === 'number' && !Number.isNaN(originalPrice)) {
    return originalPrice;
  }
  return Number(menuItem?.price ?? 0);
};

const getMenuPriceRatio = (menuItem: Partial<MenuItem> | null | undefined): number => {
  const currentPrice = Number(menuItem?.price ?? 0);
  const originalPrice = menuItem?.originalPrice;
  if (
    typeof originalPrice === 'number' &&
    !Number.isNaN(originalPrice) &&
    originalPrice > 0 &&
    currentPrice > 0
  ) {
    return currentPrice / originalPrice;
  }
  return 1;
};

export const getMerchantVariantChoicePrice = (
  menuItem: Partial<MenuItem> | null | undefined,
  choicePrice: number | string | null | undefined,
): number => {
  const numericChoicePrice = Number(choicePrice ?? 0);
  if (Number.isNaN(numericChoicePrice)) return 0;

  const ratio = getMenuPriceRatio(menuItem);
  if (ratio === 1) return numericChoicePrice;

  const originalChoicePrice = numericChoicePrice / ratio;
  return Math.round(originalChoicePrice * 100) / 100;
};

export const mapOptionsToMerchantOriginalPrices = (
  options: any[] | null | undefined,
  menuItem: Partial<MenuItem> | null | undefined,
): any[] => {
  if (!Array.isArray(options)) return [];

  return options.map((group: any) => {
    const sourceChoices = Array.isArray(group?.options)
      ? group.options
      : Array.isArray(group?.items)
        ? group.items
        : [];

    const mappedChoices = sourceChoices.map((choice: any) => ({
      ...choice,
      price: getMerchantVariantChoicePrice(menuItem, choice?.price),
    }));

    return {
      ...group,
      ...(group?.options !== undefined ? { options: mappedChoices } : {}),
      ...(group?.items !== undefined ? { items: mappedChoices } : {}),
    };
  });
};

export const getMerchantOrderItemUnitPrice = (item: Partial<OrderItem> & { menuItem?: Partial<MenuItem> | null }): number => {
  const orderedUnitPrice = Number(item?.price ?? 0);
  const currentMenuPrice = Number(item?.menuItem?.price ?? orderedUnitPrice);
  const originalPrice = item?.menuItem?.originalPrice;

  if (typeof originalPrice === 'number' && !Number.isNaN(originalPrice)) {
    const adminMarkup = currentMenuPrice - originalPrice;
    const merchantUnitPrice = orderedUnitPrice - adminMarkup;
    return merchantUnitPrice > 0 ? merchantUnitPrice : 0;
  }

  return orderedUnitPrice;
};

export const getMerchantOrderSubtotal = (order: Partial<Order> | null | undefined): number => {
  const items = Array.isArray(order?.items) ? order.items : [];
  if (items.length === 0) return Number(order?.subtotal ?? 0);

  return items.reduce((sum, item) => {
    const qty = Number(item?.quantity ?? 1);
    return sum + getMerchantOrderItemUnitPrice(item as any) * qty;
  }, 0);
};
