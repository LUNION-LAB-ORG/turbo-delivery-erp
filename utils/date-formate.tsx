import dayjs from "dayjs";

export function formatDate(
  dateString: string | Date,
  format: string = "DD MMMM YYYY",
) {
  return dayjs(dateString).format(format);
}

export const allMonthMap: { [key: string]: number } = {
  "janv.": 0, "févr.": 1, "mars": 2, "avr.": 3,
  "mai": 4, "juin": 5, "juil": 6, "août": 7,
  "sept.": 8, "oct.": 9, "nov.": 10, "déc.": 11,
};
