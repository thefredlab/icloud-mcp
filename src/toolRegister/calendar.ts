import { z } from "zod";

import {
    listEvents,
    createEvent,
    updateEvent,
    deleteEvent,
    listCalendars
} from "../iCloud/calendar";

import {
    buildSimpleEvent,
    generateUID
} from "../iCloud/iCalBuilder";

import { mcpContextStorage } from "../managers/context";

import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { BuildEventOptions } from "../@types/calendar";

export function registerCalendarTools(server: McpServer) {
    // List calendars
    server.registerTool("list_icloud-calendars", {
            description: "Returns a list of all iCloud calendars.",
            inputSchema: z.object({}),
            outputSchema: z.object({
                calendars: z.array(
                    z.object({
                        url: z.string(),
                        displayName: z.string(),
                        calendarColor: z.string(),
                        timezone: z.string(),
                        description: z.string().optional()
                    })
                )
            })
        },
        async () => {
            const context = mcpContextStorage.getStore(),
                pokeUserId = context?.pokeUserId;

            if (!pokeUserId) {
                return {
                    content: [{ type: "text" as const, text: "Missing X-Poke-User-Id header." }]
                };
            }

            const calendars = await listCalendars(pokeUserId),
                structuredContent = { calendars };

            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify(structuredContent)
                    }
                ],
                structuredContent
            };
        }
    );

    // List calendar events
    server.registerTool("icloud-calendar_list_events", {
            description: "Returns a list of all iCloud calendar events within a specified time range.",
            inputSchema: z.object({
                from: z.string().describe("Start time as ISO-String (incl. timezone)"),
                to: z.string().describe("End time as ISO-String (incl. timezone)"),
                useCalendars: z
                    .union([z.literal("all"), z.array(z.string())])
                    .describe(
                        "List of calendar URLs to query, or 'all' to use all calendars."
                    )
            }),
            outputSchema: z.object({
                events: z.array(
                    z.object({
                        eventUrl: z.string(),
                        calendarUrl: z.string(),
                        etag: z.string(),
                        iCal: z.string()
                    })
                )
            })
        },
        async ({from, to, useCalendars}: { from: string; to: string; useCalendars: "all" | string[]; }) => {
            const context = mcpContextStorage.getStore(),
                pokeUserId = context?.pokeUserId;

            if (!pokeUserId) {
                return {
                    content: [{ type: "text" as const, text: "Missing X-Poke-User-Id header." }]
                };
            }

            const events = await listEvents(from, to, useCalendars, pokeUserId),
                flatEvents = events.flatMap(({ calendar, events }) =>
                    events.map((ev) => ({
                        eventUrl: ev.url,
                        calendarUrl: calendar.url,
                        etag: ev.etag,
                        iCal: ev.iCal
                    }))
                ),
                structuredContent = { events: flatEvents };

            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify(structuredContent)
                    }
                ],
                structuredContent
            };
        }
    );

    // Create calendar event
    server.registerTool("icloud-calendar_create_event", {
            description: "Creates a new iCloud calendar event. Returns the created event's UID and filename.",
            inputSchema: z.object({
                url: z.string().describe("Calendar iCloud-CalDAV-URL"),
                summary: z.string().describe("Event title"),
                description: z.string().optional(),
                location: z.string().optional(),
                start: z.string().describe("Start (ISO-String)"),
                end: z.string().describe("End (ISO-String)")
            }),
            outputSchema: z.object({
                success: z.literal(true),
                uid: z.string(),
                filename: z.string()
            })
        },
        async ({ url, summary, description, location, start, end }) => {
            const context = mcpContextStorage.getStore(),
                pokeUserId = context?.pokeUserId;

            if (!pokeUserId) {
                return {
                    content: [{ type: "text" as const, text: "Missing X-Poke-User-Id header." }]
                };
            }

            const opts: BuildEventOptions = {
                summary,
                description,
                location,
                start: new Date(start),
                end: new Date(end)
            };

            const uid = generateUID(),
                filename = `${uid}.ics`,
                iCal = buildSimpleEvent({ ...opts, uid });

            await createEvent(url, iCal, filename, pokeUserId);

            const structuredContent = { success: true as const, uid, filename };

            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify(structuredContent)
                    }
                ],
                structuredContent
            };
        }
    );

    // Update calendar event
    server.registerTool("icloud-calendar_update_event", {
            description: "Updates an existing iCloud calendar event by its CalDAV URL.",
            inputSchema: z.object({
                url: z.string().describe("Event iCloud-CalDAV-URL"),
                summary: z.string().optional().describe("Event title"),
                description: z.string().optional(),
                location: z.string().optional(),
                start: z.string().optional().describe("New start (ISO-String)"),
                end: z.string().optional().describe("New end (ISO-String)"),
                etag: z.string().optional().describe("Optional ETag from listEvents")
            }),
            outputSchema: z.object({
                success: z.literal(true)
            })
        },
        async ({ url, summary, description, location, start, end, etag }) => {
            const context = mcpContextStorage.getStore(),
                pokeUserId = context?.pokeUserId;

            if (!pokeUserId) {
                return {
                    content: [{ type: "text" as const, text: "Missing X-Poke-User-Id header." }]
                };
            }

            const opts: BuildEventOptions = {
                summary: summary ?? "No title",
                description,
                location,
                start: start ? new Date(start) : new Date(),
                end: end ? new Date(end) : new Date(Date.now() + 60 * 60 * 1000)
            };

            const iCal = buildSimpleEvent(opts);

            await updateEvent(url, iCal, pokeUserId, etag);

            const structuredContent = { success: true as const };

            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify(structuredContent)
                    }
                ],
                structuredContent
            };
        }
    );

    // Delete calendar event
    server.registerTool("icloud-calendar_delete_event", {
            description: "Deletes an existing iCloud calendar event by its CalDAV URL.",
            inputSchema: z.object({
                url: z.string().describe("Event iCloud-CalDAV-URL")
            }),
            outputSchema: z.object({
                success: z.literal(true)
            })
        },
        async ({ url }: { url: string }) => {
            const context = mcpContextStorage.getStore(),
                pokeUserId = context?.pokeUserId;

            if (!pokeUserId) {
                return {
                    content: [{ type: "text" as const, text: "Missing X-Poke-User-Id header." }]
                };
            }

            await deleteEvent(url, pokeUserId);

            const structuredContent = { success: true as const };

            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify(structuredContent)
                    }
                ],
                structuredContent
            };
        }
    );
}