import levenshtein from "fast-levenshtein";

// Convert Levenshtein distance to similarity score 0-1
export function levenshteinSimilarity(str1, str2) {
    str1 = str1.toLowerCase();
    str2 = str2.toLowerCase();
    
    const distance = levenshtein.get(str1, str2);
    const maxLength = Math.max(str1.length, str2.length);

    return maxLength === 0 ? 1 : 1 - distance / maxLength;
}