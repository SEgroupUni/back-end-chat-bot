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
  birth_date: {
    examples: [
      "When were you born?",
      "What year were you born?",
      "Birth year?"
    ],
    vector: []
  },
  birthplace: {
    examples: [
      "Where were you born?",
      "Where did you come into the world?",
      "Your birthplace?"
    ],
    vector: []
  },
  childhood_environment: {
    examples: [
      "What was your childhood environment like?",
      "How was life when you were young?",
      "Where did you grow up?"
    ],
    vector: []
  },
  childhood_upbringing: {
    examples: [
      "How were you raised?",
      "What was your upbringing like?",
      "Were you trained for leadership as a child?"
    ],
    vector: []
  },
  titles: {
    examples: [
      "What titles did you have?",
      "What were your royal titles?",
      "What did they call you officially?"
    ],
    vector: []
  },
  names_epithets: {
    examples: [
      "What names or epithets did you use?",
      "What were your other names?",
      "What was your throne name?"
    ],
    vector: []
  },
  personality_traits: {
    examples: [
      "What was your personality like?",
      "How would you describe yourself?",
      "What kind of ruler were you?"
    ],
    vector: []
  },
  age_at_accession: {
    examples: [
      "How old were you when you became pharaoh?",
      "At what age did you take the throne?",
      "How old were you when you started ruling?"
    ],
    vector: []
  },
  length_of_reign: {
    examples: [
      "How long did you rule?",
      "What was the length of your reign?",
      "How many years were you Pharaoh?"
    ],
    vector: []
  },
  education: {
    examples: [
      "How were you educated?",
      "What did you study as a child?",
      "What training did you receive growing up?"
    ],
    vector: []
  },
  languages_spoken: {
    examples: [
      "What languages did you speak?",
      "What language did you use?",
      "Did you know hieroglyphs?"
    ],
    vector: []
  },
  lifestyle_habits: {
    examples: [
      "What was your lifestyle like?",
      "How did you live day to day?",
      "What were your daily habits?"
    ],
    vector: []
  },
  typical_wardrobe: {
    examples: [
      "What did you wear?",
      "What was your clothing like?",
      "How did you dress?"
    ],
    vector: []
  },
  foods_commonly_eaten: {
    examples: [
      "What did you eat?",
      "What was your diet like?",
      "What food did you usually eat?"
    ],
    vector: []
  },
  daily_routine: {
    examples: [
      "What was your daily routine?",
      "How did you spend your day?",
      "What did you do each day?"
    ],
    vector: []
  },
  administrative_duties: {
    examples: [
      "What were your responsibilities as ruler?",
      "What duties did you handle?",
      "How did you govern Egypt?"
    ],
    vector: []
  },
  leisure_activities: {
    examples: [
      "What did you do for fun?",
      "How did you relax?",
      "What were your hobbies?"
    ],
    vector: []
  },
  early_challenges: {
    examples: [
      "What challenges did you face early in your reign?",
      "Did anyone oppose you at the start?",
      "Was ruling difficult at first?"
    ],
    vector: []
  },
  major_achievements: {
    examples: [
      "What were your greatest achievements?",
      "What are you remembered for?",
      "What successes defined your rule?"
    ],
    vector: []
  },
  first_peace_treaty: {
    examples: [
      "Did you negotiate peace treaties?",
      "Did you make peace with the Hittites?",
      "What peace agreements did you form?"
    ],
    vector: []
  },
  infrastructure_projects: {
    examples: [
      "What monuments or structures did you build?",
      "What temples did you construct?",
      "What buildings were created under your rule?"
    ],
    vector: []
  },
  public_works: {
    examples: [
      "Did you build public works for the people?",
      "What improvements did you make for citizens?",
      "Did you construct canals or roads?"
    ],
    vector: []
  },
  administrative_reforms: {
    examples: [
      "Did you reform the government?",
      "How did you reorganize officials?",
      "Did you change administrative roles?"
    ],
    vector: []
  },
  changes_in_governance: {
    examples: [
      "How did governance change under your rule?",
      "Did you alter ruling systems?",
      "Were government roles different during your reign?"
    ],
    vector: []
  },
  trade_expansions: {
    examples: [
      "Did trade grow during your reign?",
      "Who did Egypt trade with?",
      "What goods were traded?"
    ],
    vector: []
  },
  economic_policies: {
    examples: [
      "How did you manage the economy?",
      "What were your tax or resource policies?",
      "Was the economy strong under your rule?"
    ],
    vector: []
  },
  diplomatic_strategies: {
    examples: [
      "How did you handle diplomacy?",
      "Did you form alliances?",
      "How did you manage foreign relations?"
    ],
    vector: []
  },
  legacy_reflection: {
    examples: [
      "How do you view your legacy?",
      "How do you judge your reign?",
      "What do you think of your achievements?"
    ],
    vector: []
  },
  desired_remembrance: {
    examples: [
      "How did you want to be remembered?",
      "What legacy did you hope for?",
      "What reputation did you want to leave?"
    ],
    vector: []
  },
  preparations_for_burial: {
    examples: [
      "How was your body prepared for burial?",
      "What did priests do to prepare you?",
      "What burial preparations were performed?"
    ],
    vector: []
  },
  items_placed_in_tomb: {
    examples: [
      "What items were buried with you?",
      "What objects were placed in your tomb?",
      "What did you take into the afterlife?"
    ],
    vector: []
  },
  style_of_sarcophagus: {
    examples: [
      "What did your sarcophagus look like?",
      "Can you describe your coffin?",
      "Was your sarcophagus decorated?"
    ],
    vector: []
  },
  burial_rituals_performed: {
    examples: [
      "What rituals were done during your burial?",
      "Was the Opening of the Mouth performed?",
      "What ceremonies took place?"
    ],
    vector: []
  },
  treasures_added_to_tomb: {
    examples: [
      "Were treasures buried with you?",
      "What valuable objects were in your tomb?",
      "Was your tomb filled with gold?"
    ],
    vector: []
  },
  belief_in_afterlife_journey: {
    examples: [
      "What did you believe happened after death?",
      "Did you believe the soul traveled?",
      "What was the afterlife journey like?"
    ],
    vector: []
  },
  belief_in_judgement: {
    examples: [
      "Did you believe in judgment after death?",
      "Was your heart weighed against Ma’at?",
      "Did you expect divine judgment?"
    ],
    vector: []
  },
  expected_honor_from_future_generations: {
    examples: [
      "Did you expect to be remembered?",
      "How did you want future Egyptians to see you?",
      "Did you believe people would honor you?"
    ],
    vector: []
  },
  parent_names: {
    examples: [
      "Who were your parents?",
      "Who was your mother and father?",
      "Who raised you?"
    ],
    vector: []
  },
  sibling_relationships: {
    examples: [
      "Did you have siblings?",
      "Who were your brothers or sisters?",
      "Did you grow up with siblings?"
    ],
    vector: []
  },
  number_of_wives: {
    examples: [
      "How many wives did you have?",
      "Did you have more than one queen?",
      "Were you married to several women?"
    ],
    vector: []
  },
  marriage_customs: {
    examples: [
      "What were marriage customs like?",
      "How did royal marriages work?",
      "What ceremonies took place?"
    ],
    vector: []
  },
  number_of_children: {
    examples: [
      "How many children did you have?",
      "Did you have many sons and daughters?",
      "Was your family large?"
    ],
    vector: []
  },
  heirs_to_the_throne: {
    examples: [
      "Who inherited your throne?",
      "Which son was your heir?",
      "Who became Pharaoh after you?"
    ],
    vector: []
  },
  role_of_royal_consorts: {
    examples: [
      "What role did your queens play?",
      "Did royal consorts have duties?",
      "Did your wives influence rule?"
    ],
    vector: []
  },
  relationship_with_nefertari: {
    examples: [
      "What was your relationship with Nefertari?",
      "Why is Nefertari famous?",
      "Was Nefertari special to you?"
    ],
    vector: []
  },
  family_influence_on_politics: {
    examples: [
      "Did your family influence politics?",
      "Did relatives help you rule?",
      "Were your children or wives powerful?"
    ],
    vector: []
  },
  major_gods_worshipped: {
    examples: [
      "Which gods did you worship?",
      "Who were the main gods you prayed to?",
      "Which deities mattered most?"
    ],
    vector: []
  },
  view_of_pharaoh_as_divine: {
    examples: [
      "Were you considered divine?",
      "Did people think you were a god?",
      "Did Egyptians worship you?"
    ],
    vector: []
  },
  role_in_maintaining_maat: {
    examples: [
      "How did you uphold Ma’at?",
      "Were you responsible for justice and balance?",
      "What was your role in maintaining order?"
    ],
    vector: []
  },
  ritual_offerings_performed: {
    examples: [
      "What offerings did you give the gods?",
      "What rituals did you perform daily?",
      "What did you offer to the gods?"
    ],
    vector: []
  },
  temple_responsibilities: {
    examples: [
      "What responsibilities did you have over temples?",
      "Did you oversee temple construction?",
      "What duties did you have toward temples?"
    ],
    vector: []
  },
  religious_duties: {
    examples: [
      "What religious duties did you perform?",
      "Were you involved in ceremonies?",
      "Did you act as high priest?"
    ],
    vector: []
  },
  views_on_afterlife: {
    examples: [
      "What did you believe about the afterlife?",
      "What did you expect after dying?",
      "Did you believe the soul continued?"
    ],
    vector: []
  },
  religious_festivals_participated_in: {
    examples: [
      "Which festivals did you participate in?",
      "What religious celebrations did you join?",
      "What major festivals mattered to you?"
    ],
    vector: []
  },
  primary_enemies: {
    examples: [
      "Who were your enemies?",
      "Which nations challenged Egypt?",
      "Who did you fight against?"
    ],
    vector: []
  },
  military_duties: {
    examples: [
      "What were your military responsibilities?",
      "How did you lead the army?",
      "Were you personally involved in campaigns?"
    ],
    vector: []
  },
  primary_allies: {
    examples: [
      "Who were your allies?",
      "Which lands supported Egypt?",
      "Who stood with you in diplomacy?"
    ],
    vector: []
  },
  major_battles_fought: {
    examples: [
      "What battles did you fight?",
      "Which military campaigns were significant?",
      "What major clashes are you known for?"
    ],
    vector: []
  },
  military_tactics_used: {
    examples: [
      "What tactics did you use?",
      "How did you win battles?",
      "What strategies guided your warfare?"
    ],
    vector: []
  }
};



// ---- Generate Embeddings ----
async function generateVectors() {
  console.log("\n⚙ Generating vectors...\n");

  for (const [name, intent] of Object.entries(intents)) {
      const allExampleVectors = [];

      for (const example of intent.examples) {
          const vector = await embeddings(example);
          allExampleVectors.push(vector);
      }

      const meanVector = allExampleVectors[0].map((_, i) =>
          allExampleVectors.reduce((sum, vec) => sum + vec[i], 0) / allExampleVectors.length
      );

      intent.vector = meanVector;

      console.log(`✔ Embedded (averaged): ${name}`);
  }

  fs.writeFileSync("./intentData/intent_vectors.json", JSON.stringify(intents, null, 2));

  console.log("\n Done! Vectors saved to intent_vectors.json\n");
} // <--- THIS MUST BE HERE

await generateVectors(); // <--- After the function
