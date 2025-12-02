export function calculateNumberOfDays(date1, date2) {
    const oneDay = 24 * 60 * 60 * 1000; // Number of milliseconds in a day
    const firstDate = new Date(date1);
    const secondDate = new Date(date2);
    const diffInDays = Math.round(Math.abs((firstDate - secondDate) / oneDay));
    return diffInDays;
}