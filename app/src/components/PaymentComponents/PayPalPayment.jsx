import React, { useEffect, useState, useRef } from "react";
import { useCustomAlert } from "../Alert/CustomAlert";

const PayPalPayment = ({ amount, description, onPaymentSuccess }) => {
    const paypalButtonsRef = useRef(null);
    const [isSdkLoaded, setIsSdkLoaded] = useState(false);

    // Usar nuestro hook personalizado para alertas
    const { showAlert, AlertComponent, ConfirmDialogComponent } =
        useCustomAlert();

    // Función para renderizar los botones de PayPal
    const renderPayPalButtons = () => {
        if (!window.paypal || !paypalButtonsRef.current) return;

        // Limpiar el contenedor antes de renderizar nuevos botones
        paypalButtonsRef.current.innerHTML = "";

        // Crear un nuevo div interno para el botón
        const buttonContainer = document.createElement("div");
        paypalButtonsRef.current.appendChild(buttonContainer);

        window.paypal
            .Buttons({
                // Estilo para los botones
                style: {
                    layout: "vertical",
                    color: "blue",
                    shape: "rect",
                    label: "pay",
                },

                // Configurar la transacción
                createOrder: (data, actions) => {
                    return actions.order.create({
                        purchase_units: [
                            {
                                amount: {
                                    value: amount.toFixed(2),
                                    currency_code: "USD",
                                },
                                description: description,
                            },
                        ],
                    });
                },

                // Finalizar la transacción
                onApprove: (data, actions) => {
                    // Mostrar mensaje de procesamiento
                    showAlert({
                        message: "Processing your payment, please wait...",
                        severity: "info",
                        duration: 5000,
                    });

                    return actions.order.capture().then(function (orderData) {
                        onPaymentSuccess({
                            id: orderData.id,
                            ...orderData,
                        });
                    });
                },

                // Manejar errores
                onError: (err) => {
                    console.error("Error en el proceso de pago:", err);

                    showAlert({
                        message:
                            "There was an issue with your payment. Please try again.",
                        severity: "error",
                        duration: 5000,
                    });
                },
            })
            .render(buttonContainer)
            .catch((err) => {
                console.error("Error al renderizar botones de PayPal:", err);

                showAlert({
                    message:
                        "The PayPal buttons could not be loaded. Please refresh the page or try again later.",
                    severity: "error",
                });
            });
    };

    // Cargar el script de PayPal cuando el componente se monta
    useEffect(() => {
        // Evitar cargar múltiples veces el SDK
        if (isSdkLoaded || document.querySelector('script[src*="paypal"]')) {
            if (!isSdkLoaded) setIsSdkLoaded(true);
            return;
        }

        // Intenta obtener el Client ID de la variable de entorno
        let PAYPAL_CLIENT_ID;

        try {
            PAYPAL_CLIENT_ID = import.meta.env.VITE_PAYPAL_CLIENT_ID;
        } catch (error) {
            console.warn("Error al acceder a variables de entorno:", error);
        }

        if (!PAYPAL_CLIENT_ID) {
            console.warn(
                "Variable de entorno VITE_PAYPAL_CLIENT_ID no encontrada. Usando Client ID de respaldo."
            );
        }

        const script = document.createElement("script");
        script.src = `https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&currency=USD`;
        script.async = true;
        script.onload = () => {
            console.log("PayPal SDK cargado correctamente");
            setIsSdkLoaded(true);
        };
        script.onerror = () => {
            console.error("Error al cargar PayPal SDK");
            showAlert({
                message:
                    "PayPal could not be loaded. Check your internet connection or try again later.",
                severity: "error",
            });
        };

        document.body.appendChild(script);
    }, []);

    // Renderizar botones de PayPal cuando cambia la opción o cuando se carga el SDK
    useEffect(() => {
        if (isSdkLoaded) {
            // Pequeño retraso para asegurar que el DOM se ha actualizado
            const timer = setTimeout(() => {
                renderPayPalButtons();
            }, 100);

            return () => clearTimeout(timer);
        }
    }, [isSdkLoaded, amount, description]);

    return (
        <div className="d-flex flex-column align-items-center justify-content-center py-3">
            <p className="text-center mb-4">
                Pay quickly and safely with PayPal
            </p>

            {!isSdkLoaded ? (
                <div className="d-flex justify-content-center mb-4">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                </div>
            ) : (
                <div ref={paypalButtonsRef} className="w-100"></div>
            )}

            {/* Componentes de alerta y diálogo */}
            <AlertComponent />
            <ConfirmDialogComponent />
        </div>
    );
};

export default PayPalPayment;
