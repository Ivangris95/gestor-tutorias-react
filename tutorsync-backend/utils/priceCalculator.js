/**
 * Calcula el precio basado en la cantidad de tokens
 */
const calculatePrice = (tokenCount) => {
    const prices = {
        1: 5.99,
        5: 24.99,
        10: 44.99,
    };

    return prices[tokenCount] || tokenCount * 5.99;
};

module.exports = {
    calculatePrice,
};
