import {
  createTheme,
  extendTheme,
  responsiveFontSizes
} from '@mui/material'

let primaryColors: Record<number | string, string> = {};
primaryColors["main"] = 'hsl(298, 80%, 50%)';
for (let i = 0; i <= 100; i++) {
  primaryColors[i * 10] = `hsl(298, 80%, ${100 - i}%)`;
}

let secondaryColors: Record<number | string, string> = {};
secondaryColors["main"] = 'hsl(248, 80%, 30%)';
for (let i = 0; i <= 100; i++) {
  secondaryColors[i * 10] = `hsl(248, 80%, ${100 - i}%)`;
}

let backgroundColors: Record<number | string, string> = {};
backgroundColors["main"] = "hsl(225, 40%, 5%)";
for (let i = 0; i <= 100; i++) {
  backgroundColors[i * 10] = `hsl(225, 40%, ${100 - i}%)`;
}

const theme = createTheme({
  cssVariables: {
    colorSchemeSelector: 'class',
  },
  colorSchemes: {
    light: false,
    dark: true,
  },
  palette: {
    mode: 'dark',
    // primary: {
    //   main: 'hsl(298, 80%, 50%)',
    // },
    primary: primaryColors,
    // secondary: {
    //   main: 'hsl(248, 80%, 19%)',
    // },
    secondary: secondaryColors,
    error: { main: '#ef4444' },
    success: { main: '#10b981' },
    warning: { main: '#f59e0b' },
    info: { main: '#3b82f6' },
    background: backgroundColors,
    //   default: '#0b1020',
    //   paper: '#0f1724',
    // },
    text: {
      primary: '#e6eef8',
      secondary: '#6C6F72',
    },
  },
  shape: { borderRadius: 8 },
  spacing: 8,
  typography: {
    fontFamily: "'Poppins', sans-serif",
    fontSize: 14,
  },
  components: {
    MuiButton: {
      defaultProps: {
        disableElevation: true,
        disableRipple: true,
      },
      styleOverrides: {
        root: ({ theme }) => ({
          fontWeight: 600,
          textTransform: 'none',
          "&:disabled": {
            cursor: 'not-allowed',
          },
        }),
        disabled: ({ theme }) => ({
          cursor: 'not-allowed',
        }),
      },
      variants: [
        {
          props: {
            variant: 'contained',
            color: 'primary'
          },
          style: ({ theme }) => ({
            background: (theme.palette.primary as any)["600"],
            border: '1px solid ' + (theme.palette.primary as any)["800"],
            color: '#fff',
            '&:hover': {
              background: (theme.palette.primary as any)["500"],
            },
            "&:disabled": {
              background: (theme.palette.primary as any)["900"],
              border: '1px solid ' + (theme.palette.primary as any)["800"],
              color: theme.palette.text.secondary,
            },
          }),
        },
        {
          props: {
            variant: 'outlined',
            color: 'secondary'
          },
          style: ({ theme }) => ({
            background: (theme.palette.secondary as any)["900"],
            border: '1px solid ' + (theme.palette.secondary as any)["700"],
            color: '#fff',
            '&:hover': {
              background: (theme.palette.secondary as any)["800"],
              border: '1px solid ' + (theme.palette.secondary as any)["600"],
            },
            "&:disabled": {
              background: (theme.palette.secondary as any)["900"],
              border: '1px solid ' + (theme.palette.secondary as any)["800"],
              color: theme.palette.text.secondary,
            },
          }),
        },
      ],
    },
    MuiMenu: {
      styleOverrides: {
        root: ({ theme }) => ({
        }),
        list: ({ theme }) => ({
          backgroundColor: (theme.palette as any).background["800"],
          border: `1px solid ${(theme.palette as any).background["700"]}`,
          borderRadius: theme.shape.borderRadius,
          // orient menu horizontally
          display: 'flex',
          flexDirection: 'row',
          padding: 0,
          // max 10 columns
          flexWrap: 'wrap',
          maxWidth: '20rem',

          "& .MuiMenuItem-root": {
            border: "5px solid" + (theme.palette as any).background["700"],
          }
        }),
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: ({ theme }) => ({
        }),
      },
    },
    MuiInputBase: {
      styleOverrides: {
        root: ({ theme }) => ({
        }),
        input: ({ theme }) => ({
        }),
      },
    }
  },
})

const responsiveFontTheme = responsiveFontSizes(theme, {
  breakpoints: ['xs', 'sm', 'md', 'lg', 'xl'],
  disableAlign: true,
  factor: 2,
  variants: ['h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'subtitle1', 'subtitle2', 'body1', 'body2', 'caption', 'button', 'overline'],
});

export default responsiveFontTheme;
