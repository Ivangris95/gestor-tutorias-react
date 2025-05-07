import React from "react";

const PaymentSummary = ({ selectedOption }) => {
    return (
        <div className="card mb-4">
            <div className="card-header">
                <h3 className="mb-0">Purchase Summary</h3>
            </div>
            <div className="card-body">
                <div className="row mb-2">
                    <div className="col-6">Quantity:</div>
                    <div className="col-6 text-end">
                        {selectedOption.tokens} token
                        {selectedOption.tokens > 1 ? "s" : ""}
                    </div>
                </div>
                <div className="row">
                    <div className="col-6">Price:</div>
                    <div className="col-6 text-end fw-bold">
                        ${selectedOption.price.toFixed(2)} USD
                    </div>
                </div>
            </div>
        </div>
    );
};

export default PaymentSummary;
