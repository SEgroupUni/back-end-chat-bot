import fs from "fs";
import { pipeline } from "@xenova/transformers";

// Load model
console.log("🚀 Loading embedding model...");
const embedder = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");

// Convert tensor → 384-dimensional usable vector
async function embeddings(text) {
  const output = await embedder(text);

  const values = output.data;
  const dims = output.dims;

  const embedding = [];

  // Mean pooling over the token dimension
  for (let i = 0; i < dims[2]; i++) {
    let sum = 0;
    for (let j = 0; j < dims[1]; j++) {
      sum += values[j * dims[2] + i];
    }
    embedding.push(sum / dims[1]);
  }

  return embedding;
}

// ---- STEP 2: Your simplified intent mapping ----

const intents = {
  birth_date: { examples: ["When were you born?"], vector: [] },
  birthplace: { examples: ["Where were you born?"], vector: [] },
  childhood_environment: { examples: ["What was your childhood like?"], vector: [] },
  childhood_upbringing: { examples: ["How were you raised?"], vector: [] },
  titles: { examples: ["What titles did you have?"], vector: [] },
  names_epithets: { examples: ["What names or epithets did you use?"], vector: [] },
  personality_traits: { examples: ["What was your personality like?"], vector: [] },
  age_at_accession: { examples: ["How old were you when you became pharaoh?"], vector: [] },
  length_of_reign: { examples: ["How long did you rule?"], vector: [] },
  education: { examples: ["How were you educated?"], vector: [] },
  languages_spoken: { examples: ["What languages did you speak?"], vector: [] },
  lifestyle_habits: { examples: ["What was your lifestyle like?"], vector: [] },
  typical_wardrobe: { examples: ["What did you wear?"], vector: [] },
  foods_commonly_eaten: { examples: ["What did you eat?"], vector: [] },
  daily_routine: { examples: ["What was your daily routine?"], vector: [] },
  administrative_duties: { examples: ["What were your responsibilities as ruler?"], vector: [] },
  leisure_activities: { examples: ["What did you do for fun?"], vector: [] },
  early_challenges: { examples: ["What challenges did you face early in your reign?"], vector: [] },
  major_achievements: { examples: ["What were your greatest achievements?"], vector: [] },
  first_peace_treaty: { examples: ["Did you negotiate peace treaties?"], vector: [] },
  infrastructure_projects: { examples: ["What monuments or structures did you build?"], vector: [] },
  public_works: { examples: ["Did you build public works for the people?"], vector: [] },
  administrative_reforms: { examples: ["Did you reform the government?"], vector: [] },
  changes_in_governance: { examples: ["How did governance change under your rule?"], vector: [] },
  trade_expansions: { examples: ["Did trade grow during your reign?"], vector: [] },
  economic_policies: { examples: ["How did you manage the economy?"], vector: [] },
  diplomatic_strategies: { examples: ["How did you handle diplomacy?"], vector: [] },
  legacy_reflection: { examples: ["How do you view your legacy?"], vector: [] },
  desired_remembrance: { examples: ["How did you want to be remembered?"], vector: [] },
  preparations_for_burial: { examples: ["How was your body prepared for burial?"], vector: [] },
  items_placed_in_tomb: { examples: ["What items were buried with you?"], vector: [] },
  style_of_sarcophagus: { examples: ["What did your sarcophagus look like?"], vector: [] },
  burial_rituals_performed: { examples: ["What rituals were done during your burial?"], vector: [] },
  treasures_added_to_tomb: { examples: ["Were treasures buried with you?"], vector: [] },
  belief_in_afterlife_journey: { examples: ["What did you believe happened after death?"], vector: [] },
  belief_in_judgement: { examples: ["Did you believe in judgment after death?"], vector: [] },
  expected_honor_from_future_generations: { examples: ["Did you expect to be remembered?"], vector: [] },
  parent_names: { examples: ["Who were your parents?"], vector: [] },
  sibling_relationships: { examples: ["Did you have siblings?"], vector: [] },
  number_of_wives: { examples: ["How many wives did you have?"], vector: [] },
  marriage_customs: { examples: ["What were marriage customs like?"], vector: [] },
  number_of_children: { examples: ["How many children did you have?"], vector: [] },
  heirs_to_the_throne: { examples: ["Who inherited your throne?"], vector: [] },
  role_of_royal_consorts: { examples: ["What role did your queens play?"], vector: [] },
  relationship_with_nefertari: { examples: ["What was your relationship with Nefertari?"], vector: [] },
  family_influence_on_politics: { examples: ["Did your family influence politics?"], vector: [] },
  major_gods_worshipped: { examples: ["Which gods did you worship?"], vector: [] },
  view_of_pharaoh_as_divine: { examples: ["Were you considered divine?"], vector: [] },
  role_in_maintaining_maat: { examples: ["How did you uphold Ma’at?"], vector: [] },
  ritual_offerings_performed: { examples: ["What offerings did you give the gods?"], vector: [] },
  temple_responsibilities: { examples: ["What responsibilities did you have over temples?"], vector: [] },
  religious_duties: { examples: ["What religious duties did you perform?"], vector: [] },
  views_on_afterlife: { examples: ["What did you believe about the afterlife?"], vector: [] },
  religious_festivals_participated_in: { examples: ["Which festivals did you participate in?"], vector: [] },
  primary_enemies: { examples: ["Who were your enemies?"], vector: [] },
  military_duties: { examples: ["What were your military responsibilities?"], vector: [] },
  primary_allies: { examples: ["Who were your allies?"], vector: [] },
  major_battles_fought: { examples: ["What battles did you fight?"], vector: [] },
  military_tactics_used: { examples: ["What tactics did you use?"], vector: [] }
};


// ---- Generate Embeddings ----
async function generateVectors() {
  console.log("\n⚙ Generating vectors...\n");

  for (const [name, intent] of Object.entries(intents)) {
    const text = intent.examples[0];
    intent.vector = await embeddings(text);
    console.log(`✔ Embedded: ${name}`);
  }

  fs.writeFileSync("../../intentData/intent_vectors.json", JSON.stringify(intents, null, 2));

  console.log("\n Done! Vectors saved to intent_vectors.json");
}

await generateVectors();