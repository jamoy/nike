import {z} from "zod";

export const ProjectSchema = z.object({
    id: z.uuidv7(),
    name: z.string().min(1).max(100),
    description: z.string().max(500).optional(),
    createdAt: z.string(),
    updatedAt: z.string(),
});
