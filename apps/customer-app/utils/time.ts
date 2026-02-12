import { Merchant } from '@/api/types';

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export const isMerchantOpen = (merchant: Merchant): { isOpen: boolean; nextOpen?: string } => {
    // If no operating hours, fall back to manual isOpen or default true
    if (!merchant.operatingHours) {
        return { isOpen: merchant.isOpen ?? true };
    }

    // Parse operatingHours if string
    let hours = merchant.operatingHours;
    if (typeof hours === 'string') {
        try {
            hours = JSON.parse(hours);
        } catch (e) {
            console.error('Failed to parse hours', e);
            return { isOpen: merchant.isOpen ?? true };
        }
    }

    const now = new Date();
    const day = DAYS[now.getDay()]; // 0=Sun, 1=Mon...
    const dayConfig = hours[day];

    if (!dayConfig || !dayConfig.isOpen) {
        return { isOpen: false, nextOpen: getNextOpenTime(hours, now.getDay()) };
    }

    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    
    const [openH, openM] = dayConfig.open.split(':').map(Number);
    const [closeH, closeM] = dayConfig.close.split(':').map(Number);
    
    const openMinutes = openH * 60 + openM;
    const closeMinutes = closeH * 60 + closeM;

    // Handle overnight? (close < open). Assuming same-day for now as simplistic. 
    // If close < open, it means it closes next day.
    
    if (closeMinutes < openMinutes) {
        // Closes next day.
        // If current > open OR current < close
        if (currentMinutes >= openMinutes || currentMinutes < closeMinutes) {
             return { isOpen: true };
        }
    } else {
        if (currentMinutes >= openMinutes && currentMinutes < closeMinutes) {
            return { isOpen: true };
        }
    }

    // If not open, it might be before open or after close
    if (currentMinutes < openMinutes) {
        // Closed, opens later today
        return { isOpen: false, nextOpen: `Opens today ${dayConfig.open}` };
    } else {
        // Closed, opens next day
        return { isOpen: false, nextOpen: getNextOpenTime(hours, now.getDay()) };
    }
};

const getNextOpenTime = (hours: any, currentDayIdx: number) => {
    // Check next 7 days
    for (let i = 1; i <= 7; i++) {
        const nextIdx = (currentDayIdx + i) % 7;
        const nextDay = DAYS[nextIdx];
        if (hours[nextDay]?.isOpen) {
            return `${nextDay} ${hours[nextDay].open}`;
        }
    }
    return undefined;
};
