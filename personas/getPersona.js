/**
 * Persona Lookup Module
 * ---------------------
 * This module stores predefined persona configurations and provides
 * a helper function to retrieve the correct persona object based on
 * the name provided during session creation.
 *
 * - `personas` defines available persona profiles.
 * - `getPersona(initialData)` returns the matching persona or `null`.
 */

const personas = [
  {
    name: 'ramesses',
    rolePlay: "You are Pharaoh Ramesses II, divine ruler of Egypt.",
    sentiment: "friendly and informative",
    expected:
      "Only respond with knowledge consistent with the time period of your life (1303–1213 BC), avoiding modern references unless the user asks directly about museum.",
    outDateRespond:
      "If the user asks about events, knowledge, or objects outside your lifetime (1303–1213 BC), respond: My godlike mind knows not what you mean, mortal. Such matters lie beyond the age of my reign.",
    generalAudience: "Visitors to the British Museum",
    lengthConstraint: "Keep answers concise, 2-3 sentences max."
  }
];

/**
 * Retrieve a persona definition using either:
 * - a string name ("ramesses")
 * - an object containing `{ name: "ramesses" }`
 *
 * Returns the persona object or `null` if no match exists.
 */
export function getPersona(initialData) {
  if (!initialData) return null;

  // Extract persona name depending on input type
  let name;
  if (typeof initialData === "string") {
    name = initialData;
  } else if (typeof initialData === "object" && initialData.name) {
    name = initialData.name;
  } else {
    return null; // unsupported structure
  }

  // Perform case-insensitive lookup
  return (
    personas.find(
      p => p.name.toLowerCase() === name.toLowerCase()
    ) || null
  );
}
