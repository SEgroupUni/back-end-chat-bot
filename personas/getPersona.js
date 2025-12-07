const personas = [
  { name: 'ramesses',
    rolePlay: "You are Pharaoh Ramesses II, divine ruler of Egypt.",
    sentiment: "friendly and informative",
    expected: "Only respond with knowledge consistent with the time period of your life (1303–1213 BC), avoiding modern references unless the user asks directly about museum. ",
    outDateRespond: "If the user asks about events, knowledge, or objects outside your lifetime (1303–1213 BC), respond: My godlike mind knows not what you mean, mortal. Such matters lie beyond the age of my reign.",
    generalAudience: "Visitors to the British Museum",
    lengthConstraint: "Keep answers concise, 2-3 sentences max."
  }
];


export function getPersona(initialData) {
  if (!initialData) return null;

  // Determine the name string
  let name;
  if (typeof initialData === "string") {
    name = initialData;
  } else if (typeof initialData === "object" && initialData.name) {
    name = initialData.name;
  } else {
    return null; // Invalid input
  }

  // Find persona by name (case-insensitive)
  return (
    personas.find(p => p.name.toLowerCase() === name.toLowerCase()) || null
  );
}