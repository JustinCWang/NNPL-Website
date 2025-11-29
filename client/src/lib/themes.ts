export interface Theme {
  name: string;
  color: string;
  textColor: string;
  iconSrc: string;
  lightColor: string;
  darkColor: string;
  accentColor: string;
}

export const themes: Theme[] = [
  {
    name: 'colorless',
    color: '#c2c2c2ff',
    lightColor: '#D9D9CC',
    darkColor: '#333333',
    accentColor: '#a8a8a8ff',
    textColor: '#3b3b3bff',
    iconSrc: 'https://riqqtffbmifrtuwtvqil.supabase.co/storage/v1/object/public/content/type_symbols/colorless.png',
  },
  {
    name: 'grass',
    color: '#2c5c24ff',
    lightColor: '#a5e78aff',
    darkColor: '#10210a',
    accentColor: '#5e9749e3',
    textColor: '#a7a7a7ff',
    iconSrc: 'https://riqqtffbmifrtuwtvqil.supabase.co/storage/v1/object/public/content/type_symbols/grass.png',
  },
  {
    name: 'fire',
    color: '#991a00',
    lightColor: '#FF6644',
    darkColor: '#661100',
    accentColor: '#AA2200',
    textColor: '#fff2e0',
    iconSrc: 'https://riqqtffbmifrtuwtvqil.supabase.co/storage/v1/object/public/content/type_symbols/fire.png',
  },
  {
    name: 'water',
    color: '#1a3366',
    lightColor: '#66B5FF',
    darkColor: '#112244',
    accentColor: '#1155BB',
    textColor: '#e0f7ff',
    iconSrc: 'https://riqqtffbmifrtuwtvqil.supabase.co/storage/v1/object/public/content/type_symbols/water.png',
  },
  {
    name: 'lightning',
    color: '#b89c1a',
    lightColor: '#FFD966',
    darkColor: '#7a6a13',
    accentColor: '#B8860B',
    textColor: '#fffbe0',
    iconSrc: 'https://riqqtffbmifrtuwtvqil.supabase.co/storage/v1/object/public/content/type_symbols/lightning.png',
  },
  {
    name: 'psychic',
    color: '#991a66',
    lightColor: '#FF77AA',
    darkColor: '#661144',
    accentColor: '#BB1155',
    textColor: '#ffe0f7',
    iconSrc: 'https://riqqtffbmifrtuwtvqil.supabase.co/storage/v1/object/public/content/type_symbols/psychic.png',
  },
  {
    name: 'fighting',
    color: '#7a2e1a',
    lightColor: '#CC7766',
    darkColor: '#4d1a0d',
    accentColor: '#773322',
    textColor: '#ffe5e0',
    iconSrc: 'https://riqqtffbmifrtuwtvqil.supabase.co/storage/v1/object/public/content/type_symbols/fighting.png',
  },
  {
    name: 'dark',
    color: '#292d33ff',
    lightColor: '#997766',
    darkColor: '#1a140d',
    accentColor: '#331100',
    textColor: '#e0e0e0',
    iconSrc: 'https://riqqtffbmifrtuwtvqil.supabase.co/storage/v1/object/public/content/type_symbols/dark.png',
  },
  {
    name: 'steel',
    color: '#555566',
    lightColor: '#CCCCDD',
    darkColor: '#222233',
    accentColor: '#666677',
    textColor: '#f0f0f0',
    iconSrc: 'https://riqqtffbmifrtuwtvqil.supabase.co/storage/v1/object/public/content/type_symbols/steel.png',
  },
  {
    name: 'dragon',
    color: '#332266',
    lightColor: '#9988FF',
    darkColor: '#1a1133',
    accentColor: '#3322AA',
    textColor: '#eae0ff',
    iconSrc: 'https://riqqtffbmifrtuwtvqil.supabase.co/storage/v1/object/public/content/type_symbols/dragon.png',
  }
];