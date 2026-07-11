const INQUIRIES_KEY = "fitness-league-gym-inquiries";

export function saveGymInquiry(inquiry) {
  if (typeof localStorage === "undefined") return null;

  const entry = {
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString(),
    ...inquiry,
  };

  try {
    const current = JSON.parse(localStorage.getItem(INQUIRIES_KEY) || "[]");
    const next = [entry, ...(Array.isArray(current) ? current : [])].slice(0, 30);
    localStorage.setItem(INQUIRIES_KEY, JSON.stringify(next));
  } catch {
    localStorage.setItem(INQUIRIES_KEY, JSON.stringify([entry]));
  }

  return entry;
}

export function readGymInquiries() {
  if (typeof localStorage === "undefined") return [];

  try {
    const parsed = JSON.parse(localStorage.getItem(INQUIRIES_KEY) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
