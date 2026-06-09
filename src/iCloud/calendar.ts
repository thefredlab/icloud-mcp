import { getDavClientForUser } from "./iCloudClient";

import type { DAVCalendar, DAVCalendarObject, DAVObject } from "tsdav";
import type { SimpleEvent, PublicCalendar, EventsByCalendar } from "../@types/calendar";

async function fetchAllCalendars(pokeUserId: string, provClient?: Awaited<ReturnType<typeof getDavClientForUser>>): Promise<DAVCalendar[]> {
    const client = provClient ?? await getDavClientForUser(pokeUserId, "caldav"),
        calendars = await client.fetchCalendars();

    if (!calendars || calendars.length === 0)
        throw new Error("Could not find any calendars on iCloud");

    return calendars;
}

async function findCalendarByUrl(url: string, pokeUserId: string, client?: Awaited<ReturnType<typeof getDavClientForUser>>): Promise<DAVCalendar | undefined> {
    return (await fetchAllCalendars(pokeUserId, client)).find((c) => c.url === url);
}

export async function listCalendars(pokeUserId: string, client?: Awaited<ReturnType<typeof getDavClientForUser>>): Promise<PublicCalendar[]> {
    const calendars = await fetchAllCalendars(pokeUserId, client);

    return calendars.map((calendar) => {
        const {
            url,
            displayName,
            calendarColor,
            timezone,
            description,
        } = calendar;

        return {
            url,
            displayName,
            calendarColor,
            timezone,
            description,
        };
    });
}

export async function listEvents(fromISO: string, toISO: string, useCalendars: "all" | string[], pokeUserId: string): Promise<EventsByCalendar[]> {
    const client = await getDavClientForUser(pokeUserId, "caldav"),
        calendars = await listCalendars(pokeUserId, client);

    const calendarURLs = useCalendars === "all" ? calendars.map(c => c.url) : useCalendars,
        result: EventsByCalendar[] = [];

    await Promise.all(
        calendarURLs.map(async (calendarUrl) => {
            const calendar = calendars.find((c) => c.url === calendarUrl);

            if (!calendar) return;

            const events: DAVObject[] = await client.fetchCalendarObjects({
                    calendar,
                    timeRange: {
                        start: fromISO,
                        end: toISO,
                    },
                }),
                simpleEvents: SimpleEvent[] = events.map((event) => ({
                    url: event.url!,
                    etag: event.etag,
                    iCal: event.data!,
                }));

            result.push({
                calendar,
                events: simpleEvents,
            });
        })
    );

    return result;
}

export async function createEvent(calendarUrl: string, iCalData: string, filename: string, pokeUserId: string): Promise<void> {
    const client = await getDavClientForUser(pokeUserId, "caldav"),
        calendar = await findCalendarByUrl(calendarUrl, pokeUserId, client);

    if (!calendar) throw new Error(`Calendar with URL "${calendarUrl}" not found`);

    await client.createCalendarObject({
        calendar,
        iCalString: iCalData,
        filename,
    });
}

export async function updateEvent(url: string, iCalData: string, pokeUserId: string, etag?: string): Promise<void> {
    const client = await getDavClientForUser(pokeUserId, "caldav"),
        calendarObject: DAVCalendarObject = {
            url,
            data: iCalData,
            ...(etag ? {etag} : {}),
        };

    await client.updateCalendarObject({
        calendarObject,
    });
}

export async function deleteEvent(url: string, pokeUserId: string): Promise<void> {
    const client = await getDavClientForUser(pokeUserId, "caldav"),
        calendarObject: DAVCalendarObject = {
            url,
        };

    await client.deleteCalendarObject({
        calendarObject,
    });
}