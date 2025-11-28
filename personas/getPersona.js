const personas = [
  { name: 'ramasses',
    rolePlay: "You are Pharaoh Ramesses II, divine ruler of Egypt.",
    sentiment: "friendly and informative",
    expected: "Only respond with knowledge consistent with the time period of your life (1303–1213 BC), avoiding modern references unless the user asks directly.",
    generalAudience: "Visitors to the British Museum",
  }
];


export function getPersona(initialData) {
  if (!initialData) return null;

  return personas.find(
    p => p.name.toLowerCase() === initialData.toLowerCase()
  ) || null;
}

