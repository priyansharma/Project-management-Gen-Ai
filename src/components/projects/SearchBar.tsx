"use client";

import TextField from "@mui/material/TextField";
import FormControl from "@mui/material/FormControl";
import InputLabel from "@mui/material/InputLabel";
import Select, { SelectChangeEvent } from "@mui/material/Select";
import MenuItem from "@mui/material/MenuItem";
import Box from "@mui/material/Box";
import InputAdornment from "@mui/material/InputAdornment";
import SearchIcon from "@mui/icons-material/Search";
import type { ProjectStatus } from "@/types";

interface SearchBarProps {
  search: string;
  onSearchChange: (value: string) => void;
  status: ProjectStatus | "";
  onStatusChange: (value: ProjectStatus | "") => void;
}

/**
 * Search input + status filter dropdown for the project list page.
 * Uses Material UI TextField and Select with horizontal flex layout.
 */
export function SearchBar({
  search,
  onSearchChange,
  status,
  onStatusChange,
}: SearchBarProps) {
  const handleStatusChange = (event: SelectChangeEvent<string>) => {
    onStatusChange(event.target.value as ProjectStatus | "");
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: { xs: "column", sm: "row" },
        gap: 2,
        mb: 3,
      }}
    >
      <TextField
        placeholder="Search projects..."
        value={search}
        onChange={(e) => onSearchChange(e.target.value)}
        size="small"
        sx={{ flex: 1, minWidth: 200 }}
        slotProps={{
          input: {
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
            sx: { minHeight: 44 },
          },
        }}
        aria-label="Search projects"
      />
      <FormControl size="small" sx={{ minWidth: 150 }}>
        <InputLabel id="status-filter-label">Status</InputLabel>
        <Select
          labelId="status-filter-label"
          value={status}
          label="Status"
          onChange={handleStatusChange}
          sx={{ minHeight: 44 }}
        >
          <MenuItem value="">All</MenuItem>
          <MenuItem value="Planned">Planned</MenuItem>
          <MenuItem value="Active">Active</MenuItem>
          <MenuItem value="Completed">Completed</MenuItem>
        </Select>
      </FormControl>
    </Box>
  );
}
