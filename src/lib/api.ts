const API_URL = import.meta.env.VITE_API_URL || '';

export const api = {
  analyseReport: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch(`${API_URL}/api/analyse-report`, {
      method: 'POST',
      body: formData,
    });
    if (!res.ok) throw new Error('Failed to analyse report');
    return res.json() as Promise<{ hb_value: number; status: string }>;
  },

  getDietPlan: async (status: string) => {
    const res = await fetch(`${API_URL}/api/diet/${status}`);
    if (!res.ok) throw new Error('Failed to fetch diet plan');
    return res.json();
  },

  getTodos: async (status: string) => {
    const res = await fetch(`${API_URL}/api/todos/${status}`);
    if (!res.ok) throw new Error('Failed to fetch todos');
    return res.json();
  },
};
