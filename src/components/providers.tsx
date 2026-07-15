"use client";

import { useState, useCallback } from "react";
import { SessionProvider } from "next-auth/react";
import {
  QueryClient,
  QueryClientProvider,
  QueryCache,
  MutationCache,
} from "@tanstack/react-query";
import { ThemeProvider, createTheme } from "@mui/material/styles";
import CssBaseline from "@mui/material/CssBaseline";
import Snackbar from "@mui/material/Snackbar";
import Alert from "@mui/material/Alert";

const theme = createTheme({
  palette: {
    mode: "light",
  },
});

export function Providers({ children }: { children: React.ReactNode }) {
  const [toastOpen, setToastOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");

  const showErrorToast = useCallback((message: string) => {
    setToastMessage(message);
    setToastOpen(true);
  }, []);

  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            retry: 1,
            staleTime: 30_000,
          },
          mutations: {
            onError: (error: Error) => {
              showErrorToast(error.message);
            },
          },
        },
        queryCache: new QueryCache({
          onError: (error: Error) => {
            showErrorToast(error.message);
          },
        }),
        mutationCache: new MutationCache({
          onError: (error: Error) => {
            showErrorToast(error.message);
          },
        }),
      }),
  );

  const handleToastClose = (
    _event?: React.SyntheticEvent | Event,
    reason?: string,
  ) => {
    if (reason === "clickaway") return;
    setToastOpen(false);
  };

  return (
    <SessionProvider>
      <QueryClientProvider client={queryClient}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          {children}
          <Snackbar
            open={toastOpen}
            autoHideDuration={5000}
            onClose={handleToastClose}
            anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
          >
            <Alert
              onClose={handleToastClose}
              severity="error"
              variant="filled"
              sx={{ width: "100%" }}
            >
              {toastMessage}
            </Alert>
          </Snackbar>
        </ThemeProvider>
      </QueryClientProvider>
    </SessionProvider>
  );
}
