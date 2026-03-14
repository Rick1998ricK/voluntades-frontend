import api from "@/lib/axios";

export const usersApi = {
  getAll: () => api.get("/users"),

  getById: (id: number) => api.get(`/users/${id}`),

  create: (data: any) => api.post("/users", data),

  update: (id: number, data: any) =>
    api.patch(`/users/${id}`, data),

  deactivate: (id: number) =>
    api.patch(`/users/${id}/deactivate`),

  activate: (id: number) =>
    api.patch(`/users/${id}/activate`),

  remove: (id: number) =>
    api.delete(`/users/${id}`),
};