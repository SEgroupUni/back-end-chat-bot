import stringSimilarity from "string-similarity";
import { levenshteinSimilarity } from "./levenshteinSimilarity.js";

/**
 * compositeMatchScore()
 * ------------------------------------------------------------
 * Multi-factor fuzzy matching algorithm used to compare a user
 * message against an intent pattern when exact matching fails.
 *
 * Four independent similarity metrics are computed:
 *
 *   1. tokenSimilarity       – word-set similarity (order ignored)
 *   2. simpleLengthSimilarity – compares token count ratios
 *   3. wordIndexScore        – position-aware Levenshtein comparison
 *   4. totalWordMatchScore   – best Levenshtein match for each pattern word
 *
 * A weighted blend of these scores is applied.
 * If word order is very inconsistent (indexMatchScore ≤ 0.1),
 * weights shift to favor semantic content rather than structure.
 *
 * The function returns 0 if the composite score is below tolerance.
 */


export function compositeMatchScore(userInput, pattern, tolerance = 0.8) {

    // Normalize and tokenise input
    const userTokens = userInput.toLowerCase().split(/\s+/);
    const patternTokens = pattern.toLowerCase().split(/\s+/);

    // Compute sub-scores
    const sortWordScore = tokenSimilarity(userTokens, patternTokens);
    const lengthScore = simpleLengthSimilarity(userTokens, patternTokens);
    const indexMatchScore = wordIndexScore(userTokens, patternTokens);
    const totalWordScore = totalWordMatchScore(userTokens, patternTokens);
    
    let finalScore;

    // Adjust weighting depending on sequence similarity
    if (indexMatchScore <= 0.1) {
        // Very different word ordering → rely more on meaning than position
        finalScore =
            0.35 * sortWordScore +
            0.25 * lengthScore +
            0.4 * totalWordScore;

    } else {
        // Normal weighting with word-position relevance
        finalScore =
            0.2 * sortWordScore +
            0.1 * lengthScore +
            0.35 * indexMatchScore +
            0.35 * totalWordScore;
    }

    // Optional debug output if match is strong
    if (finalScore >= tolerance) {
        // console.log scores for tuning
    }

    return finalScore >= tolerance ? finalScore : 0;
}



// ------------------------------------------------------------
// COMPONENT METRIC FUNCTIONS
// ------------------------------------------------------------

/**
 * tokenSimilarity()
 * Compares sorted word lists (bag-of-words).
 * Ignores word order entirely.
 */
function tokenSimilarity(userTokens, patternTokens) {
    const sortedUser = [...userTokens].sort().join(" ");
    const sortedPattern = [...patternTokens].sort().join(" ");
    return stringSimilarity.compareTwoStrings(sortedUser, sortedPattern);
}

/**
 * simpleLengthSimilarity()
 * A ratio of token counts (min/max).  
 * Useful to penalize huge length differences.
 */
function simpleLengthSimilarity(userTokens, patternTokens) {
    return (
        Math.min(userTokens.length, patternTokens.length) /
        Math.max(userTokens.length, patternTokens.length)
    );
}

/**
 * wordIndexScore()
 * Position-aware similarity: compares tokens at equivalent positions  
 * using Levenshtein similarity. Captures structural similarity.
 */
function wordIndexScore(userTokens, patternTokens) {
    const length = Math.min(userTokens.length, patternTokens.length);
    let score = 0;

    for (let i = 0; i < length; i++) {
        const similarity = levenshteinSimilarity(userTokens[i], patternTokens[i]);
        if (similarity > 0.5) score += similarity;
    }

    return score / length;
}

/**
 * totalWordMatchScore()
 * For each pattern word, find the best Levenshtein match among user words.
 * Order is irrelevant—focuses entirely on conceptual overlap.
 */
function totalWordMatchScore(userTokens, patternTokens) {
    const uniqueUserTokens = [...new Set(userTokens)];
    const uniquePatternTokens = [...new Set(patternTokens)];

    let totalScore = 0;

    for (const patternToken of uniquePatternTokens) {
        let bestMatch = 0;

        // Find best-matching user word
        for (const userToken of uniqueUserTokens) {
            const similarity = levenshteinSimilarity(userToken, patternToken);
            if (similarity > bestMatch) {
                bestMatch = similarity;
            }
        }

        // Only count reasonably strong similarities
        if (bestMatch >= 0.5) {
            totalScore += bestMatch;
        }
    }

    return uniquePatternTokens.length > 0
        ? totalScore / uniquePatternTokens.length
        : 0;
}
