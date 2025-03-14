import React, { useState } from "react";
import TokenOptions from "./TokenOptions";
import PaymentSummary from "./PaymentSummary";
import PayPalPayment from "./PayPalPayment";
import StripePayment from "./StripePayment";
import PurchaseSuccess from "./PurchaseSuccess";
import { updateUserTokens } from "../../services/tokenService";

const PaymentGateway = ({ onPurchaseComplete }) => {
    console.log(
        "PaymentGateway renderizado, onPurchaseComplete:",
        !!onPurchaseComplete
    );

    // Estado para la selección de tokens
    const [selectedOption, setSelectedOption] = useState({
        tokens: 1,
        price: 5.99,
    });

    // Estado para guardar el método de pago que se usó
    const [usedPaymentMethod, setUsedPaymentMethod] = useState(null);

    // Estado para rastrear si el pago fue exitoso
    const [paymentCompleted, setPaymentCompleted] = useState(false);
    const [orderID, setOrderID] = useState("");

    const handleOptionSelect = (option) => {
        setSelectedOption(option);
    };

    const handlePaymentSuccess = (method, orderData) => {
        console.log(`Compra completada con ${method}`, orderData);
        setUsedPaymentMethod(method);

        // Llamar a la API para acreditar tokens al usuario
        updateUserTokens(selectedOption.tokens, orderData.id)
            .then(() => {
                setPaymentCompleted(true);
                setOrderID(orderData.id);

                // Notificar al componente padre
                console.log("Llamando a onPurchaseComplete automáticamente");
                if (onPurchaseComplete) {
                    onPurchaseComplete();
                }
            })
            .catch((error) => {
                console.error("Error al actualizar tokens del usuario:", error);
                alert(
                    "La compra se procesó correctamente, pero hubo un problema al acreditar los tokens. Por favor contacta a soporte."
                );
                setPaymentCompleted(true);
                setOrderID(orderData.id);
            });
    };

    const handleReturnToCalendar = () => {
        console.log("Llamando a onPurchaseComplete desde botón");
        if (onPurchaseComplete) {
            onPurchaseComplete();
        } else {
            // Si no hay callback, simplemente resetear el estado
            setPaymentCompleted(false);
            setOrderID("");
            setSelectedOption({
                tokens: 1,
                price: 5.99,
            });
            setUsedPaymentMethod(null);
        }
    };

    // Si el pago está completo, mostrar pantalla de confirmación
    if (paymentCompleted) {
        return (
            <PurchaseSuccess
                tokens={selectedOption.tokens}
                orderID={orderID}
                paymentMethod={usedPaymentMethod}
                onButtonClick={handleReturnToCalendar}
            />
        );
    }

    return (
        <div className="container py-4">
            <h2 className="text-center mb-4">Comprar Tokens</h2>

            <TokenOptions
                options={[
                    { tokens: 1, price: 5.99 },
                    { tokens: 5, price: 24.99 },
                    { tokens: 10, price: 44.99 },
                ]}
                selectedOption={selectedOption}
                onOptionSelect={handleOptionSelect}
            />

            <PaymentSummary selectedOption={selectedOption} />

            <div className="card mb-4">
                <div className="card-header">
                    <h3 className="mb-0">Elige tu método de pago</h3>
                </div>
                <div className="card-body">
                    <div className="row">
                        <div className="col-md-6 border-end">
                            <h4 className="text-center mb-3">
                                <i className="fab fa-paypal me-2"></i>PayPal
                            </h4>
                            <PayPalPayment
                                amount={selectedOption.price}
                                description={`Compra de ${
                                    selectedOption.tokens
                                } token${selectedOption.tokens > 1 ? "s" : ""}`}
                                onPaymentSuccess={(orderData) =>
                                    handlePaymentSuccess("paypal", orderData)
                                }
                            />
                        </div>
                        <div className="col-md-6">
                            <h4 className="text-center mb-3">
                                <i className="fab fa-cc-stripe me-2"></i>Tarjeta
                                de Crédito
                            </h4>
                            <StripePayment
                                amount={selectedOption.price}
                                description={`Compra de ${
                                    selectedOption.tokens
                                } token${selectedOption.tokens > 1 ? "s" : ""}`}
                                onPaymentSuccess={(orderData) =>
                                    handlePaymentSuccess("stripe", orderData)
                                }
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PaymentGateway;
