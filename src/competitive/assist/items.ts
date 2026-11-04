import type { Locale } from '../../i18n/LocaleProvider';
import { MEGA_STONES } from '../core/trainingRules';

export interface ItemOption {
  id: string;
  label: string;
  labelEn: string;
}

const common: [string, string][] = [
  ['Leftovers','Restos'], ['Life Orb','Vidasfera'], ['Choice Specs','Gafas Elegid'],
  ['Choice Band','Cinta Elegida'], ['Choice Scarf','Pañuelo Elegido'],
  ['Focus Sash','Banda Focus'], ['Focus Band','Cinta Focus'],
  ['Assault Vest','Chaleco Asalto'], ['Rocky Helmet','Casco Dentado'],
  ['Heavy-Duty Boots','Botas Gruesas'], ['Air Balloon','Globo Helio'],
  ['Black Glasses','Gafas de Sol'], ['Sitrus Berry','Baya Zidra'],
  ['Lum Berry','Baya Ziuela'], ['Oran Berry','Baya Aranja'],
  ['Covert Cloak','Capa Furtiva'], ['Clear Amulet','Amuleto Puro'],
  ['Booster Energy','Energía Potenciadora'], ['Toxic Orb','Toxisfera'],
  ['Flame Orb','Llamasfera'], ['Expert Belt','Cinta Experto'],
  ['Eviolite','Mineral Evol'], ['Light Clay','Refleluz'],
  ['White Herb','Hierba Blanca'], ['Mental Herb','Hierba Mental'],
  ['Power Herb','Hierba Única'], ['Weakness Policy','Seguro Debilidad'],
  ['Throat Spray','Spray Bucal'], ['Safety Goggles','Gafas Protectoras'],
  ['Loaded Dice','Dado Trucado'], ['Mirror Herb','Hierba Copia'],
  ['Punching Glove','Guante de Boxeo'], ['Ability Shield','Escudo Habilidad'],
  ['Terrain Extender','Cubresuelo'], ['Heat Rock','Roca Calor'],
  ['Damp Rock','Roca Lluvia'], ['Smooth Rock','Roca Suave'],
  ['Icy Rock','Roca Helada'], ['Red Card','Tarjeta Roja'],
  ['Eject Button','Botón Escape'], ['Eject Pack','Mochila Escape'],
  ['Room Service','Servicio Raro'], ['Black Sludge','Lodo Negro'],
  ['Mystic Water','Agua Mística'], ['Charcoal','Carbón'],
  ['Miracle Seed','Semilla Milagro'], ['Magnet','Imán'],
  ['Never-Melt Ice','Antiderretir'], ['Dragon Fang','Colmillo Dragón'],
  ['Metal Coat','Revestimiento Metálico'], ['Spell Tag','Hechizo'],
  ['Scope Lens','Periscopio'], ['Quick Claw','Garra Rápida']
];

export const ITEM_CATALOG: ItemOption[] = [
  ...common.map(([id,label]) => ({ id, label, labelEn: id })),
  ...Object.values(MEGA_STONES).map(mega => ({
    id: mega.stone,
    label: mega.stone,
    labelEn: mega.stone
  }))
];

function norm(value: string) {
  return value.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

export function searchItems(query: string, _locale: Locale, limit = 9): ItemOption[] {
  const needle = norm(query);
  const result = needle ? ITEM_CATALOG.filter(item =>
    norm(item.id).includes(needle) || norm(item.label).includes(needle)
  ) : ITEM_CATALOG.filter(item => !Object.values(MEGA_STONES).some(mega => mega.stone === item.id));
  return result.sort((a,b) =>
    (norm(a.label).startsWith(needle) ? -1 : 0) -
    (norm(b.label).startsWith(needle) ? -1 : 0) || a.label.localeCompare(b.label)
  ).slice(0,limit);
}

export function itemDisplay(id: string, locale: Locale): string {
  const item = ITEM_CATALOG.find(entry => entry.id.toLowerCase() === id.toLowerCase());
  return locale === 'es-419' || locale === 'es-ES' ? item?.label ?? id : id;
}

export function isKnownItem(id: string): boolean {
  return ITEM_CATALOG.some(item => item.id.toLowerCase() === id.toLowerCase());
}
