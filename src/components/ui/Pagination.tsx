"use client";

import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import FormControl from "@mui/material/FormControl";
import Select, { SelectChangeEvent } from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Typography from "@mui/material/Typography";

interface PaginationProps {
  page: number;
  totalPages: number;
  pageSize: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

/**
 * Pagination controls with Previous/Next buttons, page info, and page size selector.
 * All interactive elements have minimum 44x44px touch targets.
 */
export function Pagination({
  page,
  totalPages,
  pageSize,
  onPageChange,
  onPageSizeChange,
}: PaginationProps) {
  const handlePageSizeChange = (event: SelectChangeEvent<number>) => {
    onPageSizeChange(Number(event.target.value));
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: { xs: "column", sm: "row" },
        alignItems: { xs: "stretch", sm: "center" },
        justifyContent: "space-between",
        gap: 2,
        mt: 3,
      }}
    >
      {/* Page size selector */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Typography variant="body2" color="text.secondary">
          Rows per page:
        </Typography>
        <FormControl size="small">
          <Select
            value={pageSize}
            onChange={handlePageSizeChange}
            sx={{ minHeight: 44, minWidth: 70 }}
          >
            <MenuItem value={10}>10</MenuItem>
            <MenuItem value={20}>20</MenuItem>
            <MenuItem value={50}>50</MenuItem>
          </Select>
        </FormControl>
      </Box>

      {/* Page navigation */}
      <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
        <Button
          variant="outlined"
          size="small"
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          sx={{ minWidth: 44, minHeight: 44 }}
        >
          Previous
        </Button>
        <Typography
          variant="body2"
          color="text.secondary"
          sx={{ px: 1, whiteSpace: "nowrap" }}
        >
          Page {page} of {totalPages || 1}
        </Typography>
        <Button
          variant="outlined"
          size="small"
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          sx={{ minWidth: 44, minHeight: 44 }}
        >
          Next
        </Button>
      </Box>
    </Box>
  );
}
