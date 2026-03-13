/*
  Themes for the application.
  - Displays the theme name, colors, icon, border color, and text color
*/

export interface Theme {
  name: string;
  colors: string[]; // Array of colors for gradients
  iconSrc: string;
  borderColor: string; // Primary border/highlight color
  textColor: string; // Text color that works on the theme
  ui: {
    surface: string;
    surfaceStrong: string;
    input: string;
    text: string;
    mutedText: string;
    button: string;
    buttonHover: string;
    buttonText: string;
  };
}

export const themes: Theme[] = [
  {
    name: 'colorless',
    colors: ['#ffffff', '#d7dfe9', '#969fa8'],
    iconSrc: 'https://riqqtffbmifrtuwtvqil.supabase.co/storage/v1/object/public/content/type_symbols/colorless.png',
    borderColor: '#969fa8',
    textColor: '#3b3b3b',
    ui: {
      surface: '#f3f6f8',
      surfaceStrong: '#ffffff',
      input: '#ffffff',
      text: '#1f2937',
      mutedText: '#667085',
      button: '#6f7d8b',
      buttonHover: '#576270',
      buttonText: '#ffffff',
    },
  },
  {
    name: 'grass',
    colors: ['#94c109', '#61a410', '#00a047', '#017b39'],
    iconSrc: 'https://riqqtffbmifrtuwtvqil.supabase.co/storage/v1/object/public/content/type_symbols/grass.png',
    borderColor: '#61a410',
    textColor: '#017b39',
    ui: {
      surface: '#eef6df',
      surfaceStrong: '#f8fbef',
      input: '#ffffff',
      text: '#1e3a1a',
      mutedText: '#56714a',
      button: '#4c891b',
      buttonHover: '#396b14',
      buttonText: '#ffffff',
    },
  },
  {
    name: 'fire',
    colors: ['#ffc3b3', '#ff6b57', '#d61f1f', '#6e0008'],
    iconSrc: 'https://riqqtffbmifrtuwtvqil.supabase.co/storage/v1/object/public/content/type_symbols/fire.png',
    borderColor: '#f32532',
    textColor: '#cd010a',
    ui: {
      surface: '#fff0ea',
      surfaceStrong: '#fff8f4',
      input: '#ffffff',
      text: '#5a1f1a',
      mutedText: '#8f5750',
      button: '#d63f31',
      buttonHover: '#b8291e',
      buttonText: '#ffffff',
    },
  },
  {
    name: 'water',
    colors: ['#a4badc', '#72a1cb', '#018bd2', '#0065b9'],
    iconSrc: 'https://riqqtffbmifrtuwtvqil.supabase.co/storage/v1/object/public/content/type_symbols/water.png',
    borderColor: '#72a1cb',
    textColor: '#0065b9',
    ui: {
      surface: '#edf5fe',
      surfaceStrong: '#f7fbff',
      input: '#ffffff',
      text: '#18344f',
      mutedText: '#58708a',
      button: '#2e7fc3',
      buttonHover: '#205f96',
      buttonText: '#ffffff',
    },
  },
  {
    name: 'lightning',
    colors: ['#f5da84', '#eed35b', '#f2b301', '#f2a101'],
    iconSrc: 'https://riqqtffbmifrtuwtvqil.supabase.co/storage/v1/object/public/content/type_symbols/lightning.png',
    borderColor: '#eed35b',
    textColor: '#f2a101',
    ui: {
      surface: '#fff9d7',
      surfaceStrong: '#fffdf0',
      input: '#ffffff',
      text: '#5c4600',
      mutedText: '#8c7632',
      button: '#b78300',
      buttonHover: '#8f6500',
      buttonText: '#fff7db',
    },
  },
  {
    name: 'psychic',
    colors: ['#f1d1eb', '#c89bcf', '#762285', '#5e1b7d'],
    iconSrc: 'https://riqqtffbmifrtuwtvqil.supabase.co/storage/v1/object/public/content/type_symbols/psychic.png',
    borderColor: '#c89bcf',
    textColor: '#5e1b7d',
    ui: {
      surface: '#f7eef9',
      surfaceStrong: '#fdf7fd',
      input: '#ffffff',
      text: '#43244b',
      mutedText: '#76557f',
      button: '#8644a1',
      buttonHover: '#6a2f84',
      buttonText: '#ffffff',
    },
  },
  {
    name: 'fighting',
    colors: ['#f6ca63', '#df9b33', '#b66a1f', '#6d3c0e'],
    iconSrc: 'https://riqqtffbmifrtuwtvqil.supabase.co/storage/v1/object/public/content/type_symbols/fighting.png',
    borderColor: '#b66a1f',
    textColor: '#6d3c0e',
    ui: {
      surface: '#fff3d8',
      surfaceStrong: '#fff9ec',
      input: '#ffffff',
      text: '#5b3716',
      mutedText: '#896444',
      button: '#ab651e',
      buttonHover: '#864e13',
      buttonText: '#ffffff',
    },
  },
  {
    name: 'dark',
    colors: ['#5a6774', '#36424f', '#1f2832', '#141a21'],
    iconSrc: 'https://riqqtffbmifrtuwtvqil.supabase.co/storage/v1/object/public/content/type_symbols/dark.png',
    borderColor: '#8fa2b6',
    textColor: '#d8e2ec',
    ui: {
      surface: '#1a222b',
      surfaceStrong: '#242d37',
      input: '#2a3440',
      text: '#f3f7fb',
      mutedText: '#c1ccd7',
      button: '#64798c',
      buttonHover: '#7b91a5',
      buttonText: '#f8fbff',
    },
  }
];

// Default theme (colorless)
export const defaultTheme = themes[0];
