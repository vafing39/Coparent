import dayjs from 'dayjs';
import 'dayjs/locale/fr';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import isoWeek from 'dayjs/plugin/isoWeek';
import utc from 'dayjs/plugin/utc';

// Day.js configuré une fois pour toute l'app : UTC, formats de saisie, semaines ISO (lundi = 1)
// et textes en français. Importer `dayjs` depuis ce fichier. Pas de plugin timezone : il ne
// marche pas sous Hermes ; l'heure de Paris s'obtient avec `inParis` (src/lib/dates.ts).
dayjs.extend(utc);
dayjs.extend(customParseFormat);
dayjs.extend(isoWeek);
dayjs.locale('fr');

export default dayjs;
