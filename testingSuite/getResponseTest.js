import getResponse from '../dialogueSystem/intentEngine/getResponse.js';

import {
    testDatasetExact,
    testDatasetFuzzy,
    testDatasetBoundary,
    testDatasetErroneous
} from '../intentData/intentTestData.js';

const testLoop = [
    ['Exact dataset', testDatasetExact],
    ['Fuzzy dataset', testDatasetFuzzy],
    ['Boundary dataset', testDatasetBoundary],
    ['Erroneous dataset', testDatasetErroneous]
];

const resultsSummary = [];

function normalize(val) {
    return val ?? null;
}

async function runSampleTests(testType, dataSet) {
    console.log(`\n==============================`);
    console.log(`🧪 Testing: ${testType}`);
    console.log(`==============================\n`);

    let passed = 0;
    let failed = 0;

    let nullFailures = 0;      // model gave null but shouldn’t have
    let wrongIntentFailures = 0; // model gave an incorrect non-null intent

    for (const test of dataSet) {
        const result = await getResponse({ userInput: test.text });

        const expected = normalize(test.expectedIntent);
        const actual = normalize(result?.intent);

        const success = expected === actual;

        if (success) {
            passed++;
            console.log(`   ✔ PASS: "${test.text}" → ${expected}`);
        } else {
            failed++;

            if (actual === null && expected !== null) {
                nullFailures++;
                console.log(`   ❌ FAIL (NULL): "${test.text}" → got null expected "${expected}"`);
            } else {
                wrongIntentFailures++;
                console.log(`   ❌ FAIL (WRONG INTENT): "${test.text}" → got "${actual}" expected "${expected}"`);
            }
        }
    }

    const score = ((passed / dataSet.length) * 100).toFixed(2);

    console.log(`\n📊 RESULT for "${testType}":`);
    console.log(`   ✔ Passed: ${passed}`);
    console.log(`   ❌ Failed: ${failed}`);
    console.log(`      ↳ 🕳 Null responses when intent expected: ${nullFailures}`);
    console.log(`      ↳ 🎯 Wrong predicted intent: ${wrongIntentFailures}`);
    console.log(`   📈 Pass rate: ${score}%`);
    console.log(`---------------------------------\n`);

    resultsSummary.push({
        name: testType,
        passed,
        failed,
        nullFailures,
        wrongIntentFailures,
        total: dataSet.length,
        rate: score
    });
}

(async () => {
    for (const [label, dataset] of testLoop) {
        await runSampleTests(label, dataset);
    }

    console.log(`\n=======================================`);
    console.log(`📊 FINAL SUMMARY — Overall Performance`);
    console.log(`=======================================\n`);

    resultsSummary.forEach(r => {
        console.log(
            `${r.name.padEnd(25)} → ${r.rate}% (${r.passed}/${r.total} passed)` +
            ` | null fails: ${r.nullFailures} | wrong intent: ${r.wrongIntentFailures}`
        );
    });

    console.log(`\n🎉 Testing Completed\n`);
})();

