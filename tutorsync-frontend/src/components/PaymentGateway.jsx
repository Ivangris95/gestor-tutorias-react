import React, { useState } from "react";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { loadStripe } from "@stripe/stripe-js";
import {
    Elements,
    CardElement,
    useStripe,
    useElements,
} from "@stripe/react-stripe-js";

// Carga la clave pública de Stripe desde variables de entorno
const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

// Componente de formulario de Stripe personalizado
function CheckoutForm({ orderDetails }) {
    const stripe = useStripe();
    const elements = useElements();
    const [error, setError] = useState(null);
    const [processing, setProcessing] = useState(false);
    const [succeeded, setSucceeded] = useState(false);
    const [cardComplete, setCardComplete] = useState(false);
    const [cardholderName, setCardholderName] = useState("");
    const [email, setEmail] = useState("");

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!stripe || !elements || !cardComplete || !cardholderName) {
            return;
        }

        setProcessing(true);

        try {
            // Aquí normalmente harías una llamada a tu backend
            // En un entorno real, el backend crearía un PaymentIntent y te devolvería el client_secret
            // Ejemplo simplificado para demostración:
            const { error, paymentMethod } = await stripe.createPaymentMethod({
                type: "card",
                card: elements.getElement(CardElement),
                billing_details: {
                    name: cardholderName,
                    email: email,
                },
            });

            if (error) {
                setError(`Error de pago: ${error.message}`);
                setProcessing(false);
            } else {
                setError(null);
                setSucceeded(true);
                setProcessing(false);

                // En un entorno real, aquí confirmarías el pago con el backend
                alert(
                    `¡Pago con Stripe exitoso! ID de método de pago: ${paymentMethod.id}`
                );
                console.log("Detalles del método de pago:", paymentMethod);
            }
        } catch (err) {
            console.error("Error durante el proceso de pago:", err);
            setError(
                "Hubo un error al procesar tu pago. Por favor, intenta de nuevo."
            );
            setProcessing(false);
        }
    };

    const cardElementOptions = {
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
        hidePostalCode: true,
    };

    return (
        <form onSubmit={handleSubmit} className="stripe-form">
            {/* Información del titular de la tarjeta */}
            <div className="mb-3">
                <label htmlFor="cardholder-name" className="form-label">
                    Nombre del titular
                </label>
                <input
                    id="cardholder-name"
                    type="text"
                    className="form-control"
                    value={cardholderName}
                    onChange={(e) => setCardholderName(e.target.value)}
                    placeholder="Como aparece en la tarjeta"
                    required
                />
            </div>

            <div className="mb-3">
                <label htmlFor="email" className="form-label">
                    Correo electrónico
                </label>
                <input
                    id="email"
                    type="email"
                    className="form-control"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Para el recibo de pago"
                    required
                />
            </div>

            {/* Elemento de tarjeta de Stripe */}
            <div className="mb-4">
                <label className="form-label">Información de la tarjeta</label>
                <div className="card-element-container p-3 border rounded">
                    <CardElement
                        options={cardElementOptions}
                        onChange={(e) => setCardComplete(e.complete)}
                    />
                </div>
                <small className="text-muted">
                    Procesamos pagos de forma segura con Stripe. Nunca
                    almacenamos tus datos de tarjeta.
                </small>
            </div>

            {/* Mostrar errores */}
            {error && <div className="alert alert-danger mb-3">{error}</div>}

            {/* Información de pago */}
            <div className="card mb-4 bg-light">
                <div className="card-body">
                    <h6 className="mb-3">Resumen del cobro</h6>
                    <div className="d-flex justify-content-between">
                        <span>Total a pagar:</span>
                        <span className="fw-bold">
                            ${orderDetails.total.toFixed(2)}
                        </span>
                    </div>
                </div>
            </div>

            {/* Botón de pago */}
            <div className="d-grid gap-2">
                <button
                    className="btn btn-primary btn-lg"
                    type="submit"
                    disabled={
                        !stripe ||
                        processing ||
                        !cardComplete ||
                        !cardholderName
                    }
                >
                    {processing ? (
                        <span>
                            <span
                                className="spinner-border spinner-border-sm me-2"
                                role="status"
                                aria-hidden="true"
                            ></span>
                            Procesando...
                        </span>
                    ) : (
                        `Pagar $${orderDetails.total.toFixed(2)}`
                    )}
                </button>
            </div>

            {/* Datos seguros */}
            <div className="text-center mt-3">
                <small className="text-muted d-block">
                    <i className="bi bi-lock-fill me-1"></i>
                    Pago seguro con cifrado SSL
                </small>
                <div className="mt-2">
                    <img
                        src="https://via.placeholder.com/40x25"
                        alt="Visa"
                        className="me-1"
                    />
                    <img
                        src="https://via.placeholder.com/40x25"
                        alt="Mastercard"
                        className="me-1"
                    />
                    <img
                        src="https://via.placeholder.com/40x25"
                        alt="American Express"
                        className="me-1"
                    />
                </div>
            </div>
        </form>
    );
}

function PaymentGateway() {
    const [paymentMethod, setPaymentMethod] = useState("paypal");

    // Valores del pedido
    const orderDetails = {
        subtotal: 99.0,
        tax: 9.99,
        total: 108.99,
    };

    // Manejador para el método de pago
    const handlePaymentMethodChange = (e) => {
        setPaymentMethod(e.target.value);
    };

    return (
        <div className="container my-5">
            <div className="row justify-content-center">
                <div className="col-md-6">
                    <div className="card">
                        <div className="card-header bg-white">
                            <h3 className="mb-0">Detalles de Pago</h3>
                        </div>
                        <div className="card-body">
                            {/* Selección de método de pago */}
                            <div className="mb-4">
                                <h5>Selecciona un método de pago:</h5>
                                <div className="payment-methods mt-3">
                                    <div className="row">
                                        <div className="col-6">
                                            <div
                                                className={`payment-method-card p-3 border rounded text-center ${
                                                    paymentMethod === "paypal"
                                                        ? "border-primary"
                                                        : ""
                                                }`}
                                                onClick={() =>
                                                    setPaymentMethod("paypal")
                                                }
                                                style={{ cursor: "pointer" }}
                                            >
                                                <input
                                                    className="form-check-input visually-hidden"
                                                    type="radio"
                                                    name="paymentMethod"
                                                    id="paypal"
                                                    value="paypal"
                                                    checked={
                                                        paymentMethod ===
                                                        "paypal"
                                                    }
                                                    onChange={
                                                        handlePaymentMethodChange
                                                    }
                                                />
                                                <label
                                                    className="d-block mb-0"
                                                    htmlFor="paypal"
                                                >
                                                    <div className="payment-logo mb-2">
                                                        <img
                                                            src="https://via.placeholder.com/80x30"
                                                            alt="PayPal"
                                                        />
                                                    </div>
                                                    <span>PayPal</span>
                                                </label>
                                            </div>
                                        </div>
                                        <div className="col-6">
                                            <div
                                                className={`payment-method-card p-3 border rounded text-center ${
                                                    paymentMethod === "stripe"
                                                        ? "border-primary"
                                                        : ""
                                                }`}
                                                onClick={() =>
                                                    setPaymentMethod("stripe")
                                                }
                                                style={{ cursor: "pointer" }}
                                            >
                                                <input
                                                    className="form-check-input visually-hidden"
                                                    type="radio"
                                                    name="paymentMethod"
                                                    id="stripe"
                                                    value="stripe"
                                                    checked={
                                                        paymentMethod ===
                                                        "stripe"
                                                    }
                                                    onChange={
                                                        handlePaymentMethodChange
                                                    }
                                                />
                                                <label
                                                    className="d-block mb-0"
                                                    htmlFor="stripe"
                                                >
                                                    <div className="payment-logo mb-2">
                                                        <img
                                                            src="https://via.placeholder.com/80x30"
                                                            alt="Tarjeta de crédito"
                                                        />
                                                    </div>
                                                    <span>
                                                        Tarjeta de crédito
                                                    </span>
                                                </label>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <hr className="my-4" />

                            {/* Resumen de la compra (versión compacta) */}
                            <div className="d-flex justify-content-between mb-4">
                                <span>Total:</span>
                                <span className="fw-bold fs-5">
                                    ${orderDetails.total.toFixed(2)}
                                </span>
                            </div>

                            {/* Opción de pago con PayPal */}
                            {paymentMethod === "paypal" && (
                                <div
                                    id="paypal-button-container"
                                    className="my-3"
                                >
                                    <PayPalScriptProvider
                                        options={{
                                            "client-id": import.meta.env
                                                .VITE_PAYPAL_CLIENT_ID,
                                            currency: "USD",
                                            components: "buttons",
                                        }}
                                    >
                                        <PayPalButtons
                                            createOrder={(data, actions) => {
                                                return actions.order.create({
                                                    purchase_units: [
                                                        {
                                                            amount: {
                                                                value: orderDetails.total.toString(),
                                                            },
                                                        },
                                                    ],
                                                });
                                            }}
                                            onApprove={(data, actions) => {
                                                return actions.order
                                                    .capture()
                                                    .then((details) => {
                                                        const name =
                                                            details.payer.name
                                                                .given_name;
                                                        alert(
                                                            `¡Transacción completada por ${name}!`
                                                        );
                                                        console.log(
                                                            "Detalles de la transacción:",
                                                            details
                                                        );
                                                        // Aquí puedes redirigir o actualizar el estado de la aplicación
                                                    });
                                            }}
                                            onError={(err) => {
                                                console.error(
                                                    "Error en la transacción de PayPal:",
                                                    err
                                                );
                                                alert(
                                                    "Ocurrió un error al procesar el pago. Por favor, inténtalo de nuevo."
                                                );
                                            }}
                                        />
                                    </PayPalScriptProvider>
                                </div>
                            )}

                            {/* Opción de pago con Stripe */}
                            {/* {paymentMethod === "stripe" && (
                                <div id="stripe-container" className="my-3">
                                    <Elements stripe={stripePromise}>
                                        <CheckoutForm
                                            orderDetails={orderDetails}
                                        />
                                    </Elements>
                                </div>
                            )} */}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default PaymentGateway;
