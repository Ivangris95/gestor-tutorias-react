import React from "react";

const PurchaseSuccess = ({ tokens, orderID, onButtonClick }) => {
    return (
        <div className="container py-4">
            <div className="alert alert-success text-center p-5">
                <h2 className="mb-4">Successful Purchase!</h2>
                <p className="lead">
                    You have purchased {tokens} token{tokens > 1 ? "s" : ""}.
                </p>
                <p className="mb-4">Order ID: {orderID}</p>
                <p>The tokens have been added to your account.</p>
                <button
                    className="btn btn-primary mt-3"
                    onClick={() => {
                        console.log("Botón pulsado directamente");
                        onButtonClick();
                    }}
                >
                    Return to calendar
                </button>
            </div>
        </div>
    );
};

export default PurchaseSuccess;
