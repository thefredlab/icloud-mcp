import { DEV_MODE } from "../config";

export default function devLog(...params: any[]) {
    if (!DEV_MODE) return;

    console.log("[DEV_MODE]", ...params);
}