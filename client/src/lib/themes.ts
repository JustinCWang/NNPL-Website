export interface Theme {
  name: string;
  colors: string[]; // Array of colors for gradients
  iconSrc: string;
  borderColor: string; // Primary border/highlight color
  textColor: string; // Text color that works on the theme
}

export const themes: Theme[] = [
  {
    name: 'colorless',
    colors: ['#ffffff', '#d7dfe9', '#969fa8'],
    iconSrc: 'https://riqqtffbmifrtuwtvqil.supabase.co/storage/v1/object/public/content/type_symbols/colorless.png',
    borderColor: '#969fa8',
    textColor: '#3b3b3b',
  },
  {
    name: 'grass',
    colors: ['#94c109', '#61a410', '#00a047', '#017b39'],
    iconSrc: 'https://riqqtffbmifrtuwtvqil.supabase.co/storage/v1/object/public/content/type_symbols/grass.png',
    borderColor: '#61a410',
    textColor: '#017b39',
  },
  {
    name: 'fire',
    colors: ['#f78f6d', '#f32532', '#cd010a', '#f7311b'],
    iconSrc: 'https://riqqtffbmifrtuwtvqil.supabase.co/storage/v1/object/public/content/type_symbols/fire.png',
    borderColor: '#f32532',
    textColor: '#cd010a',
  },
  {
    name: 'water',
    colors: ['#a4badc', '#72a1cb', '#018bd2', '#0065b9'],
    iconSrc: 'https://riqqtffbmifrtuwtvqil.supabase.co/storage/v1/object/public/content/type_symbols/water.png',
    borderColor: '#72a1cb',
    textColor: '#0065b9',
  },
  {
    name: 'lightning',
    colors: ['#f5da84', '#eed35b', '#f2b301', '#f2a101'],
    iconSrc: 'https://riqqtffbmifrtuwtvqil.supabase.co/storage/v1/object/public/content/type_symbols/lightning.png',
    borderColor: '#eed35b',
    textColor: '#f2a101',
  },
  {
    name: 'psychic',
    colors: ['#f1d1eb', '#c89bcf', '#762285', '#5e1b7d'],
    iconSrc: 'https://riqqtffbmifrtuwtvqil.supabase.co/storage/v1/object/public/content/type_symbols/psychic.png',
    borderColor: '#c89bcf',
    textColor: '#5e1b7d',
  },
  {
    name: 'fighting',
    colors: ['#ac4f29', '#bb4318', '#8e170d', '#531310'],
    iconSrc: 'https://riqqtffbmifrtuwtvqil.supabase.co/storage/v1/object/public/content/type_symbols/fighting.png',
    borderColor: '#bb4318',
    textColor: '#531310',
  },
  {
    name: 'dark',
    colors: ['#625859', '#809ca7', '#364f62', '#332e30'],
    iconSrc: 'https://riqqtffbmifrtuwtvqil.supabase.co/storage/v1/object/public/content/type_symbols/dark.png',
    borderColor: '#809ca7',
    textColor: '#332e30',
  },
  {
    name: 'steel',
    colors: ['#a3a8a2', '#505958', '#665e58', '#443f35'],
    iconSrc: 'https://riqqtffbmifrtuwtvqil.supabase.co/storage/v1/object/public/content/type_symbols/steel.png',
    borderColor: '#505958',
    textColor: '#443f35',
  },
  {
    name: 'dragon',
    colors: ['#e6d445', '#d3a733', '#9b6d31', '#724e2c'],
    iconSrc: 'https://riqqtffbmifrtuwtvqil.supabase.co/storage/v1/object/public/content/type_symbols/dragon.png',
    borderColor: '#d3a733',
    textColor: '#724e2c',
  },
];

// Default theme (colorless)
export const defaultTheme = themes[0];

