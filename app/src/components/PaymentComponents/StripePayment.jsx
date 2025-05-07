import React, { useState, useEffect, useRef } from "react";

const StripePayment = ({ amount, description, onPaymentSuccess }) => {
    const [isStripeLoaded, setIsStripeLoaded] = useState(false);
    const [isProcessing, setIsProcessing] = useState(false);
    const [cardElement, setCardElement] = useState(null);
    const [error, setError] = useState(null);

    // Usar un ref para mantener la misma instancia de Stripe
    const stripeRef = useRef(null);
    const elementsRef = useRef(null);

    // Cargar el script de Stripe cuando el componente se monta
    useEffect(() => {
        if (window.Stripe) {
            setIsStripeLoaded(true);
            return;
        }

        const script = document.createElement("script");
        script.src = "https://js.stripe.com/v3/";
        script.async = true;
        script.onload = () => {
            console.log("Stripe SDK cargado correctamente");
            setIsStripeLoaded(true);
        };

        document.body.appendChild(script);

        return () => {
            // Limpiar si el componente se desmonta
            if (cardElement) {
                cardElement.destroy();
            }
        };
    }, []);

    // Inicializar elementos de Stripe cuando el SDK está cargado
    useEffect(() => {
        if (!isStripeLoaded) return;

        try {
            // Obtener la clave pública de Stripe
            const stripePublicKey =
                import.meta.env.VITE_STRIPE_PUBLIC_KEY ||
                "pk_test_TuClaveDeStripeAquí";

            // Inicializar Stripe una sola vez y guardar la referencia
            if (!stripeRef.current) {
                stripeRef.current = window.Stripe(stripePublicKey);
            }

            // Crear elementos de Stripe una sola vez
            if (!elementsRef.current) {
                elementsRef.current = stripeRef.current.elements();
            }

            // Crear elemento de tarjeta
            const cardElement = elementsRef.current.create("card", {
                style: {
                    base: {
                        color: "#32325d",
                        fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
                        fontSmoothing: "antialiased",
                        fontSize: "16px",
                        "::placeholder": {
                            color: "#aab7c4",
                        },
                    },
                    invalid: {
                        color: "#fa755a",
                        iconColor: "#fa755a",
                    },
                },
            });

            // Montar el elemento de tarjeta en el DOM
            const cardContainer = document.getElementById("card-element");
            if (cardContainer) {
                cardElement.mount("#card-element");
                setCardElement(cardElement);

                // Escuchar cambios en la validación
                cardElement.on("change", (event) => {
                    setError(event.error ? event.error.message : "");
                });
            }
        } catch (error) {
            console.error("Error al inicializar Stripe:", error);
            setError(
                "Error al inicializar el formulario de pago. Por favor recarga la página."
            );
        }
    }, [isStripeLoaded]);

    // Función para procesar el pago
    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!isStripeLoaded || !cardElement || !stripeRef.current) {
            setError(
                "El formulario de pago no está listo. Por favor espera unos segundos."
            );
            return;
        }

        setIsProcessing(true);
        setError(null);

        try {
            // IMPORTANTE: Usar la misma instancia de Stripe que se usó para crear el elemento
            // Crear token de tarjeta usando la referencia guardada
            const { token, error } = await stripeRef.current.createToken(
                cardElement
            );

            if (error) {
                setError(error.message);
                setIsProcessing(false);
                return;
            }

            // Enviar token al servidor para procesar el pago
            const response = await fetch(
                `${
                    import.meta.env.VITE_API_URL || "http://localhost:5000"
                }/api/stripe/charge`,
                {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        amount: Math.round(amount * 100), // Stripe requiere centavos
                        currency: "usd",
                        description,
                        token: token.id,
                    }),
                }
            );

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(
                    errorData.message || "Error al procesar el pago"
                );
            }

            const data = await response.json();

            // Notificar al componente padre que el pago fue exitoso
            onPaymentSuccess({
                id: data.id || token.id, // Usar el ID de la transacción o el token como fallback
                source: "stripe",
                amount: amount,
                ...data,
            });
        } catch (error) {
            console.error("Error al procesar el pago:", error);
            setError(
                error.message ||
                    "Error al procesar el pago. Por favor intenta de nuevo."
            );
        } finally {
            setIsProcessing(false);
        }
    };

    return (
        <div className="d-flex flex-column align-items-center justify-content-center py-3">
            <p className="text-center mb-4">
                Pay with your credit or debit card
            </p>

            {!isStripeLoaded ? (
                <div className="d-flex justify-content-center mb-4">
                    <div className="spinner-border text-primary" role="status">
                        <span className="visually-hidden">Loading...</span>
                    </div>
                </div>
            ) : (
                <form onSubmit={handleSubmit} className="w-100">
                    <div className="mb-3">
                        <div
                            id="card-element"
                            className="form-control p-3"
                            style={{ height: "40px" }}
                        >
                            {/* Aquí se montará el elemento de tarjeta de Stripe */}
                        </div>
                        {error && (
                            <div className="text-danger mt-2 small">
                                {error}
                            </div>
                        )}
                    </div>
                    <button
                        type="submit"
                        className="btn btn-primary w-100"
                        disabled={isProcessing}
                    >
                        {isProcessing ? (
                            <>
                                <span
                                    className="spinner-border spinner-border-sm me-2"
                                    role="status"
                                    aria-hidden="true"
                                ></span>
                                Processing...
                            </>
                        ) : (
                            `Pagar $${amount.toFixed(2)}`
                        )}
                    </button>
                </form>
            )}
        </div>
    );
};

export default StripePayment;
