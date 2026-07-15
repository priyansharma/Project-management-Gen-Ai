"use client";

import ToggleButtonGroup from "@mui/material/ToggleButtonGroup";
import ToggleButton from "@mui/material/ToggleButton";
import ViewListIcon from "@mui/icons-material/ViewList";
import GridViewIcon from "@mui/icons-material/GridView";

export type ViewMode = "table" | "grid";

interface ViewToggleProps {
  view: ViewMode;
  onViewChange: (view: ViewMode) => void;
}

/**
 * Toggle between table and grid view for the project list.
 * Uses Material UI ToggleButtonGroup with icon buttons.
 */
export function ViewToggle({ view, onViewChange }: ViewToggleProps) {
  const handleChange = (
    _event: React.MouseEvent<HTMLElement>,
    newView: ViewMode | null,
  ) => {
    if (newView !== null) {
      onViewChange(newView);
    }
  };

  return (
    <ToggleButtonGroup
      value={view}
      exclusive
      onChange={handleChange}
      aria-label="View mode"
      size="small"
    >
      <ToggleButton
        value="table"
        aria-label="Table view"
        sx={{ minWidth: 44, minHeight: 44 }}
      >
        <ViewListIcon />
      </ToggleButton>
      <ToggleButton
        value="grid"
        aria-label="Grid view"
        sx={{ minWidth: 44, minHeight: 44 }}
      >
        <GridViewIcon />
      </ToggleButton>
    </ToggleButtonGroup>
  );
}
