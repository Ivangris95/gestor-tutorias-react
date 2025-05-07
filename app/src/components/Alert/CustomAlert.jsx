import React from "react";
import {
    Alert,
    Snackbar,
    Dialog,
    DialogActions,
    DialogContent,
    DialogContentText,
    DialogTitle,
    Button,
} from "@mui/material";

// Hook personalizado para manejar las alertas
export const useCustomAlert = () => {
    const [alertState, setAlertState] = React.useState({
        open: false,
        message: "",
        severity: "info",
        duration: 5000,
        position: { vertical: "bottom", horizontal: "center" },
        customStyles: {},
    });

    // Diálogo de confirmación
    const [dialogState, setDialogState] = React.useState({
        open: false,
        title: "",
        message: "",
        confirmButtonText: "Confirm",
        cancelButtonText: "Cancel",
        confirmButtonColor: "error",
        onConfirm: () => {},
        loading: false,
    });

    // Mostrar alerta
    const showAlert = (options) => {
        setAlertState({
            ...alertState,
            open: true,
            ...options,
        });
    };

    // Cerrar alerta
    const closeAlert = () => {
        setAlertState({
            ...alertState,
            open: false,
        });
    };

    // Mostrar diálogo de confirmación
    const showConfirmDialog = (options) => {
        setDialogState({
            ...dialogState,
            open: true,
            ...options,
        });
    };

    // Cerrar diálogo
    const closeConfirmDialog = () => {
        setDialogState({
            ...dialogState,
            open: false,
        });
    };

    // Función para manejar la confirmación
    const handleConfirm = async () => {
        setDialogState({
            ...dialogState,
            loading: true,
        });

        try {
            // Ejecutar la función onConfirm si existe
            if (dialogState.onConfirm) {
                await dialogState.onConfirm();
            }
        } finally {
            setDialogState({
                ...dialogState,
                open: false,
                loading: false,
            });
        }
    };

    // Componente de Alerta
    const AlertComponent = () => (
        <Snackbar
            open={alertState.open}
            autoHideDuration={alertState.duration}
            onClose={closeAlert}
            anchorOrigin={alertState.position}
        >
            <Alert
                onClose={closeAlert}
                severity={alertState.severity}
                variant="filled"
                sx={{ width: "100%", ...alertState.customStyles }}
            >
                {alertState.message}
            </Alert>
        </Snackbar>
    );

    // Componente de Diálogo de Confirmación
    const ConfirmDialogComponent = () => (
        <Dialog
            open={dialogState.open}
            onClose={closeConfirmDialog}
            aria-labelledby="alert-dialog-title"
            aria-describedby="alert-dialog-description"
        >
            <DialogTitle id="alert-dialog-title">
                {dialogState.title}
            </DialogTitle>
            <DialogContent>
                <DialogContentText id="alert-dialog-description">
                    {dialogState.message}
                </DialogContentText>
            </DialogContent>
            <DialogActions>
                <Button
                    onClick={closeConfirmDialog}
                    color="primary"
                    disabled={dialogState.loading}
                >
                    {dialogState.cancelButtonText}
                </Button>
                <Button
                    onClick={handleConfirm}
                    color={dialogState.confirmButtonColor}
                    autoFocus
                    disabled={dialogState.loading}
                >
                    {dialogState.confirmButtonText}
                </Button>
            </DialogActions>
        </Dialog>
    );

    return {
        // Funciones
        showAlert,
        closeAlert,
        showConfirmDialog,
        closeConfirmDialog,
        // Componentes
        AlertComponent,
        ConfirmDialogComponent,
    };
};

// Componente que se puede usar en cualquier lugar de la aplicación
const CustomAlert = ({ children }) => {
    const { AlertComponent, ConfirmDialogComponent } = useCustomAlert();

    return (
        <>
            {children}
            <AlertComponent />
            <ConfirmDialogComponent />
        </>
    );
};

export default CustomAlert;
