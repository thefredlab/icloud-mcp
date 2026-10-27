import { getDavClientForUser } from "./iCloudClient";
import debugLog from "../util/debugLog";
import devLog from "../util/devLog";

import type { DAVCalendar, DAVCalendarObject, DAVObject } from "tsdav";
import type { SimpleEvent, PublicCalendar, EventsByCalendar } from "../@types/calendar";
import type { User } from "../@types/database";

async function fetchAllCalendars({pokeUserId, user}: { pokeUserId: string, user?: User }, provClient?: Awaited<ReturnType<typeof getDavClientForUser>>): Promise<DAVCalendar[]> {
    const client = provClient ?? await getDavClientForUser({pokeUserId, user}, "caldav"),
        calendars = await client.fetchCalendars();

    if (!calendars || calendars.length === 0)
        throw new Error("No calendars found on iCloud");

    return calendars;
}

async function findCalendarByUrl(url: string, {pokeUserId, user}: { pokeUserId: string, user?: User }, client?: Awaited<ReturnType<typeof getDavClientForUser>>): Promise<DAVCalendar | undefined> {
    return (await fetchAllCalendars({pokeUserId, user}, client)).find((c) => c.url === url);
}

export async function listCalendars({pokeUserId, user}: { pokeUserId: string, user?: User }, client?: Awaited<ReturnType<typeof getDavClientForUser>>): Promise<PublicCalendar[]> {
    const calendars = await fetchAllCalendars({pokeUserId, user}, client);

    devLog("calendar.listCalendars", "calendars", calendars);

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

export async function listEvents(fromISO: string, toISO: string, useCalendars: "all" | string[], {pokeUserId, user}: { pokeUserId: string, user?: User }): Promise<EventsByCalendar[]> {
    const client = await getDavClientForUser({pokeUserId, user}, "caldav"),
        calendars = await listCalendars({pokeUserId, user}, client);

    const calendarURLs = useCalendars === "all" ? calendars.map(c => c.url) : useCalendars,
        result: EventsByCalendar[] = [];

    devLog("calendar.listEvents", "calendarURLs", calendarURLs);

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

export async function createEvents(calendarUrl: string, {pokeUserId, user}: { pokeUserId: string, user?: User }, events: { iCalData: string, uid: string, filename: string }[]): Promise<{ success: boolean, uid: string, filename: string }[]> {
    const client = await getDavClientForUser({pokeUserId, user}, "caldav"),
        calendar = await findCalendarByUrl(calendarUrl, {pokeUserId, user}, client);

    if (!calendar) throw new Error(`Calendar with URL "${calendarUrl}" not found`);

    const structuredContent: { success: boolean, uid: string, filename: string }[] = [];

    for (const event of events) {
        devLog("calendar.createEvent", "calendar, iCalData", calendar, event.iCalData);

        await client.createCalendarObject({
            calendar,
            iCalString: event.iCalData,
            filename: event.filename,
        }).then((res) => {
            const success = res.status === 201 || res.status === 204;

            structuredContent.push({ success, uid: event.uid, filename: event.filename });
            debugLog(`Created event with UID "${event.uid}". Status ${res.status} ${res.statusText}`);

            if (!res || !res.url || !success) {
                debugLog("Failed to create event with UID:", event.uid);
                debugLog("iCalData:", event.iCalData);
                debugLog("Response:", res);

                throw new Error(`Failed to create event with UID "${event.uid}". Status ${res.status} ${res.statusText}`);
            }
        }).catch((err) => {
            debugLog("Error creating event:", err);
            structuredContent.push({ success: false, uid: event.uid, filename: event.filename });
        });
    }

    return structuredContent;
}

export async function updateEvents(url: string, {pokeUserId, user}: { pokeUserId: string, user?: User }, events: { iCalData: string, etag?: string }[]): Promise<{ success: boolean, etag?: string, iCalData: string }[]> {
    const client = await getDavClientForUser({pokeUserId, user}, "caldav"),
        structuredContent: { success: boolean, etag?: string, iCalData: string }[] = [];

    for (const event of events) {
        await client.updateCalendarObject({
            calendarObject: {
                url,
                data: event.iCalData,
                etag: event.etag,
            },
        }).then((res) => {
            const success = res.status === 200 || res.status === 204;

            structuredContent.push({ success, etag: event.etag, iCalData: event.iCalData });

            if (!res || !res.url || !success) throw new Error(`Failed to update event with URL "${url}"`);
        }).catch((err) => {
            console.error("Error updating event:", err);
            structuredContent.push({ success: false, etag: event.etag, iCalData: event.iCalData });
        });
    }

    return structuredContent;
}

export async function deleteEvents(url: string[], {pokeUserId, user}: { pokeUserId: string, user?: User }): Promise<{ success: boolean; url: string }[]> {
    const client = await getDavClientForUser({pokeUserId, user}, "caldav"),
        structuredContent: { success: boolean, url: string }[] = [];

    for (const singleURL of url) {
        const calendarObject: DAVCalendarObject = {
            url: singleURL,
        };

        await client.deleteCalendarObject({
            calendarObject,
        }).then((res) => {
            const success = res.status === 200 || res.status === 204;

            structuredContent.push({ success, url: singleURL });

            if (!res || !res.url || !success) throw new Error(`Failed to delete event with URL "${singleURL}"`);
        }).catch((err) => {
            console.error("Error deleting event:", err);
            structuredContent.push({ success: false, url: singleURL });
        });
    }

    return structuredContent;
}