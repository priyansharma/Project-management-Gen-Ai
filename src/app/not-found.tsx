import Link from "next/link";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Button from "@mui/material/Button";

export default function NotFound() {
  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        minHeight: "100vh",
        textAlign: "center",
        px: 2,
      }}
    >
      <Typography
        variant="h1"
        component="h1"
        sx={{
          fontSize: { xs: "6rem", sm: "8rem" },
          fontWeight: 700,
          color: "text.secondary",
        }}
      >
        404
      </Typography>
      <Typography
        variant="h5"
        component="p"
        sx={{ mb: 3, color: "text.primary" }}
      >
        The page you were looking for was not found.
      </Typography>
      <Button
        component={Link}
        href="/dashboard"
        variant="contained"
        size="large"
        sx={{ minWidth: 200 }}
      >
        Back to Dashboard
      </Button>
    </Box>
  );
}
