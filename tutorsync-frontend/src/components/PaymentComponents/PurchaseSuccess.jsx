import React from "react";

const PurchaseSuccess = ({ tokens, orderID, onButtonClick }) => {
    return (
        <div className="container py-4">
            <div className="alert alert-success text-center p-5">
                <h2 className="mb-4">¡Compra Exitosa!</h2>
                <p className="lead">
                    Has adquirido {tokens} token{tokens > 1 ? "s" : ""}.
                </p>
                <p className="mb-4">ID de Orden: {orderID}</p>
                <p>Los tokens se han añadido a tu cuenta.</p>
                <button
                    className="btn btn-primary mt-3"
                    onClick={onButtonClick}
                >
                    Volver al calendario
                </button>
            </div>
        </div>
    );
};

export default PurchaseSuccess;
