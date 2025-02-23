import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';
export function cn(...inputs) {
    return twMerge(clsx(inputs));
}
export async function openBrowserDownload(url, fileName) {
    const blob = await fetch(url).then(res => res.blob());
    const anchor = document.createElement("a");
    anchor.href = URL.createObjectURL(blob);
    anchor.download = fileName;
    anchor.click();
    document?.removeChild(anchor);
}
//# sourceMappingURL=utils.js.map