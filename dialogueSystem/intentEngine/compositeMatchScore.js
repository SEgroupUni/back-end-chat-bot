import stringSimilarity from "string-similarity";
import levenshtein from "fast-levenshtein";

export function compositeMatchScore(userInput, pattern) {
    // Split to token arrays
    const userTokens = userInput.toLowerCase().split(/\s+/);
    const patternTokens = pattern.toLowerCase().split(/\s+/);

    return (
        tokenSimilarity(userTokens, patternTokens) * 0.4 +
        simpleLengthSimilarity(userTokens, patternTokens) * 0.3 +
        wordIndexScore(userTokens, patternTokens) * 0.3
    );
}

function tokenSimilarity(userTokens, patternTokens) {
    const sortedUser = [...userTokens].sort().join(" ");
    const sortedPattern = [...patternTokens].sort().join(" ");
    return stringSimilarity.compareTwoStrings(sortedUser, sortedPattern);
}

function simpleLengthSimilarity(userTokens, patternTokens) {
    return (
        Math.min(userTokens.length, patternTokens.length) /
        Math.max(userTokens.length, patternTokens.length)
    );
}

function wordIndexScore(userTokens, patternTokens) {
    const length = Math.min(userTokens.length, patternTokens.length);
    let score = 0;

    for (let i = 0; i < length; i++) {
        const similarity =
            1 -
            levenshtein.get(patternTokens[i], userTokens[i]) /
                Math.max(patternTokens[i].length, userTokens[i].length);

        if (similarity > 0.5) score += similarity;
    }

    return score / length;
}
