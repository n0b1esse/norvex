// src/scripts/live-content.ts — точка входа live-оверлея.
// Подключается один раз в Layout.astro, поэтому работает на всех страницах.
// Язык берётся из <html data-lang> (проставляется в Layout.astro).
import { mountLiveContent } from "../lib/live-content";

mountLiveContent(document.documentElement.dataset.lang || "ru");
