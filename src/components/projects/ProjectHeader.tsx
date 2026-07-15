"use client";

import { useState } from "react";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Chip from "@mui/material/Chip";
import Button from "@mui/material/Button";
import Dialog from "@mui/material/Dialog";
import DialogTitle from "@mui/material/DialogTitle";
import DialogContent from "@mui/material/DialogContent";
import DialogContentText from "@mui/material/DialogContentText";
import DialogActions from "@mui/material/DialogActions";
import EditIcon from "@mui/icons-material/Edit";
import DeleteIcon from "@mui/icons-material/Delete";
import type { ProjectStatus } from "@/types";

interface ProjectHeaderProps {
  name: string;
  status: ProjectStatus;
  isEditing: boolean;
  onEditToggle: () => void;
  onDelete: () => void;
  deleteLoading?: boolean;
}

const statusColorMap: Record<ProjectStatus, "default" | "info" | "success"> = {
  Planned: "default",
  Active: "info",
  Completed: "success",
};

/**
 * Project detail header showing name, status badge, and edit/delete actions.
 * Delete action requires confirmation via a dialog.
 */
export function ProjectHeader({
  name,
  status,
  isEditing,
  onEditToggle,
  onDelete,
  deleteLoading,
}: ProjectHeaderProps) {
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);

  const handleDeleteConfirm = () => {
    setDeleteDialogOpen(false);
    onDelete();
  };

  return (
    <>
      <Box
        sx={{
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          alignItems: { xs: "flex-start", sm: "center" },
          justifyContent: "space-between",
          gap: 2,
          mb: 3,
        }}
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 2,
            flexWrap: "wrap",
          }}
        >
          <Typography variant="h5" sx={{ fontWeight: "bold" }}>
            {name}
          </Typography>
          <Chip label={status} color={statusColorMap[status]} size="small" />
        </Box>

        <Box sx={{ display: "flex", gap: 1 }}>
          <Button
            variant={isEditing ? "contained" : "outlined"}
            startIcon={<EditIcon />}
            onClick={onEditToggle}
            sx={{ minWidth: 44, minHeight: 44 }}
          >
            {isEditing ? "Cancel" : "Edit"}
          </Button>
          <Button
            variant="outlined"
            color="error"
            startIcon={<DeleteIcon />}
            onClick={() => setDeleteDialogOpen(true)}
            disabled={deleteLoading}
            sx={{ minWidth: 44, minHeight: 44 }}
          >
            Delete
          </Button>
        </Box>
      </Box>

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={deleteDialogOpen}
        onClose={() => setDeleteDialogOpen(false)}
        aria-labelledby="delete-project-dialog-title"
      >
        <DialogTitle id="delete-project-dialog-title">
          Delete Project
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete &quot;{name}&quot;? This will also
            delete all tasks associated with this project. This action cannot be
            undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => setDeleteDialogOpen(false)}
            sx={{ minWidth: 44, minHeight: 44 }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleDeleteConfirm}
            color="error"
            variant="contained"
            sx={{ minWidth: 44, minHeight: 44 }}
          >
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
