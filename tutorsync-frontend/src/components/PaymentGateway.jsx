import React from "react";
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

// Componente del botón de pago de Stripe
function StripePaymentButton({ orderDetails }) {
    const stripe = useStripe();
    const elements = useElements();
    const [error, setError] = React.useState(null);
    const [processing, setProcessing] = React.useState(false);

    const handleSubmit = async (event) => {
        event.preventDefault();

        if (!stripe || !elements) {
            return;
        }

        setProcessing(true);

        try {
            const { error, paymentMethod } = await stripe.createPaymentMethod({
                type: "card",
                card: elements.getElement(CardElement),
            });

            if (error) {
                setError(`Error de pago: ${error.message}`);
                setProcessing(false);
            } else {
                setError(null);
                setProcessing(false);

                // Aquí confirmarías el pago con el backend
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
            {/* Elemento de tarjeta de Stripe */}
            <div className="mb-4">
                <div className="card-element-container p-3 border rounded">
                    <CardElement options={cardElementOptions} />
                </div>
                <small className="text-muted">
                    Procesamos pagos de forma segura con Stripe.
                </small>
            </div>

            {/* Mostrar errores */}
            {error && <div className="alert alert-danger mb-3">{error}</div>}

            {/* Botón de pago */}
            <div className="d-grid gap-2">
                <button
                    className="btn btn-primary btn-lg"
                    type="submit"
                    disabled={!stripe || processing}
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
        </form>
    );
}

function PaymentGateway() {
    // Valores del pedido
    const orderDetails = {
        total: 108.99,
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
                            {/* Resumen del pago */}
                            <div className="d-flex justify-content-between mb-4">
                                <span>Total a pagar:</span>
                                <span className="fw-bold fs-5">
                                    ${orderDetails.total.toFixed(2)}
                                </span>
                            </div>

                            {/* PayPal Buttons */}
                            <div className="mb-4">
                                <h5 className="mb-3">Pagar con PayPal:</h5>
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

                            <div className="text-center my-3">
                                <span className="text-muted">- o -</span>
                            </div>

                            {/* Stripe Payment */}
                            <div className="mb-4">
                                <h5 className="mb-3">Pagar con tarjeta:</h5>
                                <Elements stripe={stripePromise}>
                                    <StripePaymentButton
                                        orderDetails={orderDetails}
                                    />
                                </Elements>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default PaymentGateway;
