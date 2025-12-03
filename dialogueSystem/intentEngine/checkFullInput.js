import stringSimilarity from "string-similarity";

// ****** Check if whole sentence is similar ******
function checkFullInput(pattern, messageEnvelope, tolerance = 0.73) {
    const match = stringSimilarity.compareTwoStrings(
        messageEnvelope.userInput.toLowerCase(),
        pattern.toLowerCase()
    );

    return match >= tolerance ? match : 0;
}

export default checkFullInput;
