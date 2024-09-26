"use client";

import { Box, createTheme } from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";
import { light } from "@mui/material/styles/createPalette";

let theme = createTheme({
    palette: {
        primary: {
            light: "#414344",
            main: "#292b2d",
            dark: "#161818",
            contrastText: "#ededed",
        },
        secondary: {
            light: "#f4eee1",
            main: "#e4dac2",
            dark: "#baaf9d",
            contrastText: "#0a0a0a",
        },
    },
});

export default function ThemeProviderWrapper({ children }: Readonly<{ children: React.ReactNode }>) {
    return (
        <ThemeProvider theme={theme}>
            <Box sx={{
                display: 'flex',
                flexDirection: 'column',
                Height: '100vh',
            }}>
            {children}
            </Box>
        </ThemeProvider>
    );
}