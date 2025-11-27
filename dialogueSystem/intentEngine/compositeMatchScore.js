import stringSimilarity from "string-similarity";
import { levenshteinSimilarity } from "./levenshteinSimilarity.js";

export function compositeMatchScore(userInput, pattern, tolerance = 0.75) {

    const userTokens = userInput.toLowerCase().split(/\s+/);
    const patternTokens = pattern.toLowerCase().split(/\s+/);

    const sortWordScore = tokenSimilarity(userTokens, patternTokens);
    const lengthScore = simpleLengthSimilarity(userTokens, patternTokens);
    const indexMatchScore = wordIndexScore(userTokens, patternTokens);
    const totalWordScore = totalWordMatchScore(userTokens, patternTokens);

    let finalScore;

    // --- Adaptive weighting logic,  low length score can create false negative so skip if too low
    if (indexMatchScore <= 0.2) {
        finalScore =
            0.35 * sortWordScore +
            0.20 * lengthScore +
            0.45 * totalWordScore;
    } else {
        finalScore =
            0.25 * sortWordScore +
            0.10 * lengthScore +
            0.30 * indexMatchScore +
            0.35 * totalWordScore;
    }

    return finalScore >= tolerance ? finalScore : 0;
}

// --- Component scoring functions ---

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
        const similarity = levenshteinSimilarity(userTokens[i], patternTokens[i]);
        if (similarity > 0.5) score += similarity;
    }

    return score / length;
}

function totalWordMatchScore(userTokens, patternTokens) {
    const uniqueUserTokens = [...new Set(userTokens)];
    const uniquePatternTokens = [...new Set(patternTokens)];

    let totalScore = 0;

    for (const patternToken of uniquePatternTokens) {
        let bestMatch = 0;

        for (const userToken of uniqueUserTokens) {
            const similarity = levenshteinSimilarity(userToken, patternToken);
            if (similarity > bestMatch) {
                bestMatch = similarity;
            }
        }

        if (bestMatch >= 0.3) {
            totalScore += bestMatch;
        }
    }

    return uniquePatternTokens.length > 0
        ? totalScore / uniquePatternTokens.length
        : 0;
}
