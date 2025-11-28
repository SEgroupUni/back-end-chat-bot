import stringSimilarity from "string-similarity";
import { levenshteinSimilarity } from "./levenshteinSimilarity.js";

export function compositeMatchScore(userInput, pattern, tolerance = 0.8) {

    const userTokens = userInput.toLowerCase().split(/\s+/);
    const patternTokens = pattern.toLowerCase().split(/\s+/);

    const sortWordScore = tokenSimilarity(userTokens, patternTokens);
    const lengthScore = simpleLengthSimilarity(userTokens, patternTokens);
    const indexMatchScore = wordIndexScore(userTokens, patternTokens);
    const totalWordScore = totalWordMatchScore(userTokens, patternTokens);

 let finalScore;

if (indexMatchScore <= 0.2) {
    finalScore =
        0.3 * sortWordScore +
        0.20 * lengthScore +
        0.5 * totalWordScore;

    console.log(`\n[DEBUG — NORMAL MODE] ${userInput}: score ${finalScore}`);
} else {
    finalScore =
        0.22 * sortWordScore +
        0.10 * lengthScore +
        0.28 * indexMatchScore +
        0.4 * totalWordScore;

    console.log(`\n[DEBUG — NORMAL MODE] ${userInput}: score ${finalScore}`
);
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

        if (bestMatch >= 0.7) {
            totalScore += bestMatch;
        }
    }

    return uniquePatternTokens.length > 0
        ? totalScore / uniquePatternTokens.length
        : 0;
}


