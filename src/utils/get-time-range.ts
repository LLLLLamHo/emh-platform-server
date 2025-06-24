import dayjs from 'dayjs';

type TimeRange = {
  startTimestamp: number;
  endTimestamp: number;
};

export function getUTCTimeRange(year: number, month?: number, day?: number): TimeRange {
  if (!year) throw new Error('year is required');

  if (year && month && day) {
    // 年月日
    const start = dayjs.utc(`${year}-${month}-${day}`).startOf('day');
    const end = dayjs.utc(`${year}-${month}-${day}`).endOf('day');
    return {
      startTimestamp: start.valueOf(),
      endTimestamp: end.valueOf(),
    };
  } if (year && month) {
    // 年月
    const start = dayjs.utc(`${year}-${month}-01`).startOf('month');
    const end = dayjs.utc(`${year}-${month}-01`).endOf('month');
    return {
      startTimestamp: start.valueOf(),
      endTimestamp: end.valueOf(),
    };
  } if (year) {
    // 只有年
    const start = dayjs.utc(`${year}-01-01`).startOf('year');
    const end = dayjs.utc(`${year}-01-01`).endOf('year');
    return {
      startTimestamp: start.valueOf(),
      endTimestamp: end.valueOf(),
    };
  }
  throw new Error('Invalid parameters');
}
