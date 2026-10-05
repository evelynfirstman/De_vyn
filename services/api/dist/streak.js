"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dayBefore = dayBefore;
exports.weekdayName = weekdayName;
exports.nextStreak = nextStreak;
exports.displayStreak = displayStreak;
function dayBefore(isoDate) {
    const d = new Date(`${isoDate}T12:00:00Z`);
    d.setUTCDate(d.getUTCDate() - 1);
    return d.toISOString().slice(0, 10);
}
/** Monday-first weekday names — matches recovery plan item days. */
function weekdayName(isoDate) {
    const names = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const sundayFirst = new Date(`${isoDate}T12:00:00Z`).getUTCDay();
    return names[(sundayFirst + 6) % 7];
}
function nextStreak(prev, today) {
    if (prev === null)
        return { count: 1, lastDate: today };
    if (prev.lastDate === today)
        return prev;
    if (prev.lastDate === dayBefore(today)) {
        return { count: prev.count + 1, lastDate: today };
    }
    return { count: 1, lastDate: today };
}
/**
 * Display count for a given date: the chain only counts if the last
 * check-in was today or yesterday — otherwise it already lapsed.
 */
function displayStreak(state, today) {
    if (state === null)
        return 0;
    if (state.lastDate === today || state.lastDate === dayBefore(today)) {
        return state.count;
    }
    return 0;
}
//# sourceMappingURL=streak.js.map