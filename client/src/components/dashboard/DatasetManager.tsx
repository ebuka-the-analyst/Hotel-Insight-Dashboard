import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Button } from "@/components/ui/button";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ChevronDown, Check, Trash2, Database, Calendar, FileSpreadsheet, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { deleteDataset } from "@/lib/api-client";
import type { Dataset } from "@shared/schema";
import { format } from "date-fns";

interface DatasetManagerProps {
  datasets: Dataset[];
  selectedDatasetId: string | undefined;
  onSelectDataset: (id: string | undefined) => void;
  isLoading?: boolean;
}

export function DatasetManager({ datasets, selectedDatasetId, onSelectDataset, isLoading }: DatasetManagerProps) {
  const [open, setOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [datasetToDelete, setDatasetToDelete] = useState<Dataset | null>(null);
  
  const queryClient = useQueryClient();
  
  const deleteMutation = useMutation({
    mutationFn: deleteDataset,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["datasets"] });
      queryClient.invalidateQueries({ queryKey: ["kpis"] });
      queryClient.invalidateQueries({ queryKey: ["trends"] });
      queryClient.invalidateQueries({ queryKey: ["comprehensive-analytics"] });
      if (selectedDatasetId === datasetToDelete?.id) {
        onSelectDataset(undefined);
      }
      setDatasetToDelete(null);
      setDeleteDialogOpen(false);
    },
  });

  const handleDeleteClick = (e: React.MouseEvent, dataset: Dataset) => {
    e.stopPropagation();
    setDatasetToDelete(dataset);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (datasetToDelete) {
      deleteMutation.mutate(datasetToDelete.id);
    }
  };

  const selectedDataset = datasets.find(d => d.id === selectedDatasetId);
  
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-[220px] justify-between bg-background"
            data-testid="select-dataset-manager"
          >
            <span className="truncate">
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Loading...
                </span>
              ) : selectedDataset ? (
                selectedDataset.name
              ) : (
                "All Datasets"
              )}
            </span>
            <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[380px] p-0" align="start">
          <div className="p-2 border-b">
            <p className="text-sm font-medium text-muted-foreground px-2">Select Dataset</p>
          </div>
          <div className="max-h-[350px] overflow-y-auto">
            <div
              className={cn(
                "flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-accent transition-colors",
                !selectedDatasetId && "bg-accent"
              )}
              onClick={() => { onSelectDataset(undefined); setOpen(false); }}
              data-testid="option-all-datasets"
            >
              <Database className="h-5 w-5 text-primary" />
              <div className="flex-1">
                <p className="font-medium">All Datasets</p>
                <p className="text-xs text-muted-foreground">
                  Combined view of {datasets.length} dataset{datasets.length !== 1 ? 's' : ''}
                </p>
              </div>
              {!selectedDatasetId && <Check className="h-4 w-4 text-primary" />}
            </div>
            
            {datasets.map((dataset) => (
              <div
                key={dataset.id}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 cursor-pointer hover:bg-accent transition-colors group",
                  selectedDatasetId === dataset.id && "bg-accent"
                )}
                onClick={() => { onSelectDataset(dataset.id); setOpen(false); }}
                data-testid={`option-dataset-${dataset.id}`}
              >
                <FileSpreadsheet className="h-5 w-5 text-muted-foreground" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{dataset.name}</p>
                  <div className="flex items-center gap-3 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Calendar className="h-3 w-3" />
                      {dataset.uploadedAt ? format(new Date(dataset.uploadedAt), "MMM d, yyyy") : "N/A"}
                    </span>
                    <span>{dataset.rowCount.toLocaleString()} rows</span>
                    <span>{formatFileSize(dataset.fileSize)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {selectedDatasetId === dataset.id && <Check className="h-4 w-4 text-primary" />}
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive hover:bg-destructive/10"
                    onClick={(e) => handleDeleteClick(e, dataset)}
                    data-testid={`button-delete-dataset-${dataset.id}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
          {datasets.length === 0 && (
            <div className="p-6 text-center text-muted-foreground">
              <FileSpreadsheet className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">No datasets uploaded yet</p>
            </div>
          )}
        </PopoverContent>
      </Popover>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Dataset</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{datasetToDelete?.name}"? This will permanently remove {datasetToDelete?.rowCount.toLocaleString()} booking records and all associated analytics. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleteMutation.isPending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              disabled={deleteMutation.isPending}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleteMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete Dataset"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
