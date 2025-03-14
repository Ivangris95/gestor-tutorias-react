import React, { useEffect, useState, useRef } from "react";

const PayPalPayment = ({ amount, description, onPaymentSuccess }) => {
    const paypalButtonsRef = useRef(null);
    const [isSdkLoaded, setIsSdkLoaded] = useState(false);

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
                    alert(
                        "Hubo un problema con tu pago. Por favor intenta de nuevo."
                    );
                },
            })
            .render(buttonContainer)
            .catch((err) => {
                console.error("Error al renderizar botones de PayPal:", err);
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

        // Si no se encuentra la variable de entorno, usa un valor de respaldo
        if (!PAYPAL_CLIENT_ID) {
            console.warn(
                "Variable de entorno VITE_PAYPAL_CLIENT_ID no encontrada. Usando Client ID de respaldo."
            );
            // Este es un ejemplo. Para producción, asegúrate de configurar tu variable de entorno.
            PAYPAL_CLIENT_ID =
                "AcbDwBUL1SvY3xTxoC6poI66JAaZ0LbsaD-C7kKFvPLFmiyH_IZ943GU_4zzBLiLF7_fqeVfIRaFP0hf";
        }

        const script = document.createElement("script");
        script.src = `https://www.paypal.com/sdk/js?client-id=${PAYPAL_CLIENT_ID}&currency=USD`;
        script.async = true;
        script.onload = () => {
            console.log("PayPal SDK cargado correctamente");
            setIsSdkLoaded(true);
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
                Paga de manera rápida y segura con PayPal
            </p>

            {!isSdkLoaded ? (
                <div className="d-flex justify-content-center mb-4">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Cargando...</span>
                    </div>
                </div>
            ) : (
                <div ref={paypalButtonsRef} className="w-100"></div>
            )}
        </div>
    );
};

export default PayPalPayment;
