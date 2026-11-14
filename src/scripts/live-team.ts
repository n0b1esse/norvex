// src/scripts/live-team.ts — оверлей страницы «Команда»:
// подтягивает свежие данные из /api.php, чтобы правки из админки появлялись сразу.
import { mountLiveContent } from "../lib/live-content";

mountLiveContent(document.documentElement.dataset.lang || "ru");
