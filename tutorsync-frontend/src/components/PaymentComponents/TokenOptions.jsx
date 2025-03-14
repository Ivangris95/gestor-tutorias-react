import React from "react";

const TokenOptions = ({ options, selectedOption, onOptionSelect }) => {
    return (
        <div className="row justify-content-center mb-4">
            {options.map((option) => (
                <div className="col-md-4 col-sm-6 mb-3" key={option.tokens}>
                    <div
                        className={`card h-100 ${
                            selectedOption.tokens === option.tokens
                                ? "border-primary"
                                : ""
                        }`}
                        style={{ cursor: "pointer" }}
                        onClick={() => onOptionSelect(option)}
                    >
                        <div className="card-body text-center">
                            <h3 className="card-title display-4">
                                {option.tokens}
                            </h3>
                            <p className="card-text">
                                Token{option.tokens > 1 ? "s" : ""}
                            </p>
                            <p className="card-text text-danger fw-bold">
                                ${option.price.toFixed(2)}
                            </p>
                        </div>
                        {selectedOption.tokens === option.tokens && (
                            <div className="card-footer text-center bg-primary text-white">
                                Seleccionado
                            </div>
                        )}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default TokenOptions;
