import { z } from "zod";
import { SKILL_CATEGORIES } from "@/lib/taxonomy";

export const skillSchema = z.object({
  name: z.string().min(1, "Name is required").max(120),
  category: z.enum(SKILL_CATEGORIES),
  description: z.string().max(600).optional().or(z.literal("")),
});
export type SkillInput = z.infer<typeof skillSchema>;

export const trainerSkillSchema = z.object({
  skillId: z.string().min(1, "Pick a skill"),
  proficiency: z.coerce.number().int().min(1).max(5),
  yearsExperience: z.coerce.number().min(0).max(50).default(0),
  isVerified: z.coerce.boolean().default(false),
});
export type TrainerSkillInput = z.infer<typeof trainerSkillSchema>;

export const traineeSkillSchema = z.object({
  skillId: z.string().min(1, "Pick a skill"),
  proficiency: z.coerce.number().int().min(1).max(5),
});
export type TraineeSkillInput = z.infer<typeof traineeSkillSchema>;

export const batchRequirementSchema = z.object({
  skillId: z.string().min(1, "Pick a skill"),
  minProficiency: z.coerce.number().int().min(1).max(5),
  weight: z.coerce.number().min(0.1).max(5),
  isMandatory: z.coerce.boolean().default(true),
});
export type BatchRequirementInput = z.infer<typeof batchRequirementSchema>;
