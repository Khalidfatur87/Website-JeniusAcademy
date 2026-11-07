import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

export default createMiddleware(routing);

export const config = {
  // Semua path kecuali api, _next, dan file statis (yang punya titik).
  matcher: "/((?!api|_next|_vercel|.*\..*).*)",
};
