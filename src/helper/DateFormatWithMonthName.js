export function DateWithMonthName(dateString) {
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sept",
    "Oct",
    "Nov",
    "Dec",
  ];

  const date = new Date(dateString);
  const day = date.getUTCDate();
  const monthName = months[date.getUTCMonth()];
  const year = date.getUTCFullYear();

  return `${day} ${monthName} ${year}`;
}
