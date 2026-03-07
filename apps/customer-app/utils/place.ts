import { Merchant } from '@/api/types';

export type OrderPlace = 'SURIGAO_CITY' | 'CLAVER' | 'BAD_AS';

export const PLACE_OPTIONS: Array<{
  id: OrderPlace;
  label: string;
  aliases: string[];
}> = [
  {
    id: 'SURIGAO_CITY',
    label: 'Surigao City',
    aliases: ['surigao city', 'surigao'],
  },
  {
    id: 'CLAVER',
    label: 'Claver',
    aliases: ['claver'],
  },
  {
    id: 'BAD_AS',
    label: 'Bad-as',
    aliases: ['bad-as', 'bad as', 'badas'],
  },
];

const normalize = (value: string) => value.toLowerCase().replace(/[^a-z0-9]/g, '');

export const getOrderPlaceLabel = (place: OrderPlace | null): string => {
  if (!place) return 'Not selected';
  const option = PLACE_OPTIONS.find((item) => item.id === place);
  return option?.label ?? 'Not selected';
};

export const merchantMatchesOrderPlace = (
  merchant: Pick<Merchant, 'city' | 'address'> | null | undefined,
  place: OrderPlace | null,
): boolean => {
  if (!place) return true;
  if (!merchant) return false;

  const option = PLACE_OPTIONS.find((item) => item.id === place);
  if (!option) return true;

  const haystack = normalize(`${merchant.city ?? ''} ${merchant.address ?? ''}`);
  if (!haystack) return false;

  return option.aliases.some((alias) => haystack.includes(normalize(alias)));
};
